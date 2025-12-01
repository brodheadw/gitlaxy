import { useRef, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore, type ShipType } from '../store'
import { DEFAULT_CONTROLS, MOUSE_SENSITIVITY_BASE, type ControlSettings } from '../config/controls'
import { PERFORMANCE } from '../config/performance'
import { useFrameThrottle } from '../hooks/useFrameThrottle'

// NMS-style flight configuration factory (5x scale for immersive universe)
const createFlightConfig = (controls: ControlSettings = DEFAULT_CONTROLS, shipType: ShipType = 'falcon') => {
  const maxSpeed = PERFORMANCE.ship.maxSpeed[shipType]
  return {
    // Speed settings (units per second) - 5x for larger universe
    minSpeed: -1500,
    normalSpeed: 1000,
    maxSpeed: maxSpeed * 5,
    boostSpeed: maxSpeed * 5,

  // Acceleration/deceleration - uses control preset values
  acceleration: controls.acceleration,
  deceleration: controls.deceleration,
  brakeForce: controls.brakeForce,

  // Turn rates (radians per second at base speed) - uses control preset values
  basePitchRate: controls.turnRate,
  baseYawRate: controls.turnRate * 0.8,
  rollRate: controls.rollRate,

  // Strafe speeds - 6-axis control
  strafeSpeed: maxSpeed * 0.6, // 60% of max forward speed
  strafeAcceleration: controls.acceleration * 0.8,
  strafeDeceleration: controls.deceleration * 1.2, // Faster stop

  // Auto-banking - uses control preset values
  autoBankStrength: controls.autoBankStrength,
  autoBankSpeed: 3,

  // Speed affects agility
  agilityAtMinSpeed: 1.0,
  agilityAtMaxSpeed: 0.3,
  agilityAtBoost: 0.15,

  // Mouse sensitivity - user controls
  mouseSensitivity: MOUSE_SENSITIVITY_BASE * PERFORMANCE.ship.controls.mouseSensitivity * controls.mouseSensitivity,
  invertY: controls.invertY,
  invertX: controls.invertX,
  }
}

interface ShipControlsProps {
  controlSettings?: ControlSettings
}

// Key bindings for flight controls
const FLIGHT_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'KeyZ', 'KeyC',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'ShiftLeft', 'ShiftRight', 'Space'
])

export default function ShipControls({ controlSettings }: ShipControlsProps) {
  const { camera, gl } = useThree()
  const {
    cameraMode,
    setCameraMode,
    keysPressed,
    setKeyPressed,
    updateFlightState,
    showSettings,
    selectedShip,
    landingState,
    nearestPlanet,
    initiateLanding,
  } = useStore()

  // Create flight config from control settings and ship type - recalculate when settings change
  const cfg = useMemo(() => createFlightConfig(controlSettings, selectedShip), [controlSettings, selectedShip])

  // Get physics curves (use defaults if not provided)
  const physics = useMemo(() => controlSettings?.physicsCurves || DEFAULT_CONTROLS.physicsCurves, [controlSettings])

  // Use refs for landing state to avoid effect re-runs releasing pointer lock
  const landingStateRef = useRef(landingState)
  const nearestPlanetRef = useRef(nearestPlanet)

  // Keep refs updated
  useEffect(() => {
    landingStateRef.current = landingState
  }, [landingState])

  useEffect(() => {
    nearestPlanetRef.current = nearestPlanet
  }, [nearestPlanet])

  // Flight state
  const currentSpeed = useRef(cfg.minSpeed)
  const isBoosting = useRef(false)
  const wasBoostingLastFrame = useRef(false)
  const boostEndTime = useRef(0)

  // Thrust buildup state
  const thrustBuildupProgress = useRef(0)
  const boostWindupProgress = useRef(0)

  // Rotation state for smooth interpolation
  const currentYawVelocity = useRef(0)
  const currentPitchVelocity = useRef(0)
  const currentRollVelocity = useRef(0)
  const autoBankAngle = useRef(0)

  // Strafe velocity state (6-axis control)
  const strafeVelocityX = useRef(0) // Left/Right strafe
  const strafeVelocityY = useRef(0) // Up/Down strafe

  // Target rotation velocities for inertia
  const targetYawVelocity = useRef(0)
  const targetPitchVelocity = useRef(0)

  // Previous yaw for counter-banking
  const previousYawVelocity = useRef(0)

  // Mouse input accumulator
  const mouseInput = useRef({ x: 0, y: 0 })
  const throttle = useFrameThrottle(PERFORMANCE.ship.controls.updateFrequency)

  // Quaternion helpers
  const yawQuat = useRef(new THREE.Quaternion())
  const pitchQuat = useRef(new THREE.Quaternion())
  const rollQuat = useRef(new THREE.Quaternion())

  // Reset state when entering fly mode
  useEffect(() => {
    if (cameraMode === 'fly') {
      currentSpeed.current = 0  // Start stationary
      isBoosting.current = false
      wasBoostingLastFrame.current = false
      boostEndTime.current = 0
      thrustBuildupProgress.current = 0
      boostWindupProgress.current = 0
      currentYawVelocity.current = 0
      currentPitchVelocity.current = 0
      currentRollVelocity.current = 0
      targetYawVelocity.current = 0
      targetPitchVelocity.current = 0
      previousYawVelocity.current = 0
      autoBankAngle.current = 0
      strafeVelocityX.current = 0
      strafeVelocityY.current = 0
      mouseInput.current = { x: 0, y: 0 }
    }
  }, [cameraMode])

  // Mouse and keyboard handlers
  useEffect(() => {
    if (cameraMode !== 'fly') return

    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== gl.domElement) return

      // Accumulate mouse movement (will be consumed in useFrame)
      mouseInput.current.x += event.movementX || 0
      mouseInput.current.y += event.movementY || 0
    }

    const onClick = () => {
      if (cameraMode === 'fly' && document.pointerLockElement !== gl.domElement) {
        gl.domElement.requestPointerLock()
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        if (document.pointerLockElement === gl.domElement) {
          document.exitPointerLock()
        }
        // Don't automatically switch to orbit mode - stay in fly mode
        // User can manually switch camera mode via HUD if needed
        return
      }

      // E key - initiate landing when approaching a planet (otherwise used for strafing down)
      if (event.code === 'KeyE' && landingStateRef.current === 'approaching' && nearestPlanetRef.current) {
        event.preventDefault()
        // Exit pointer lock before landing
        if (document.pointerLockElement === gl.domElement) {
          document.exitPointerLock()
        }
        initiateLanding(nearestPlanetRef.current.node)
        return
      }

      // Register flight control keys
      if (FLIGHT_KEYS.has(event.code)) {
        event.preventDefault()
        setKeyPressed(event.code, true)
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (FLIGHT_KEYS.has(event.code)) {
        setKeyPressed(event.code, false)
      }
    }

    const onPointerLockChange = () => {
      if (document.pointerLockElement !== gl.domElement) {
        document.body.style.cursor = 'default'
      }
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)
    document.addEventListener('pointerlockchange', onPointerLockChange)
    gl.domElement.addEventListener('click', onClick)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
      gl.domElement.removeEventListener('click', onClick)
      if (document.pointerLockElement === gl.domElement) {
        document.exitPointerLock()
      }
      document.body.style.cursor = 'default'
    }
  }, [camera, gl.domElement, cameraMode, setCameraMode, setKeyPressed, showSettings])

  useFrame((_, delta) => {
    if (cameraMode !== 'fly') return
    if (!throttle.shouldUpdate()) return

    // Clamp delta to prevent huge jumps
    const dt = Math.min(delta, 0.1)

    // --- INPUT PROCESSING ---

    // Check key states
    const isThrusting = keysPressed.has('KeyW') || keysPressed.has('ArrowUp')
    const isBraking = keysPressed.has('KeyS') || keysPressed.has('ArrowDown')
    const isRollingLeft = keysPressed.has('KeyA') || keysPressed.has('ArrowLeft')
    const isRollingRight = keysPressed.has('KeyD') || keysPressed.has('ArrowRight')
    const wantsBoost = keysPressed.has('ShiftLeft') || keysPressed.has('ShiftRight')

    // Speed brake: Shift + S = rapid deceleration
    const isSpeedBraking = wantsBoost && isBraking

    // 6-axis strafe controls
    const isStrafingUp = keysPressed.has('KeyQ')
    const isStrafingDown = keysPressed.has('KeyE')
    const isStrafingLeft = keysPressed.has('KeyZ')
    const isStrafingRight = keysPressed.has('KeyC')

    // Update boost state
    isBoosting.current = wantsBoost && isThrusting

    // Track boost momentum for decay
    if (isBoosting.current && !wasBoostingLastFrame.current) {
      boostEndTime.current = 0
    } else if (!isBoosting.current && wasBoostingLastFrame.current) {
      boostEndTime.current = Date.now() / 1000
    }
    wasBoostingLastFrame.current = isBoosting.current

    // --- SPEED MANAGEMENT WITH PHYSICS CURVES ---

    // Calculate thrust buildup (gradual acceleration ramp)
    if (isThrusting) {
      thrustBuildupProgress.current = Math.min(1, thrustBuildupProgress.current + dt / physics.thrustBuildupTime)
    } else {
      thrustBuildupProgress.current = Math.max(0, thrustBuildupProgress.current - dt / (physics.thrustBuildupTime * 0.5))
    }

    // Calculate boost windup (delay before full boost)
    if (isBoosting.current) {
      boostWindupProgress.current = Math.min(1, boostWindupProgress.current + dt / physics.boostWindupTime)
    } else {
      boostWindupProgress.current = 0
    }

    // Apply easing curve to thrust buildup (starts slow, accelerates)
    const thrustCurve = thrustBuildupProgress.current * thrustBuildupProgress.current

    // Apply acceleration with curves
    if (isBoosting.current) {
      // Boosting - accelerate toward boost speed with windup
      const boostMultiplier = 3 * boostWindupProgress.current
      const speedDiff = cfg.boostSpeed - currentSpeed.current
      if (speedDiff > 0) {
        currentSpeed.current += Math.min(cfg.acceleration * boostMultiplier * thrustCurve * dt, speedDiff)
      }
    } else if (isThrusting) {
      // W key - accelerate toward max speed with buildup curve
      if (currentSpeed.current < cfg.maxSpeed) {
        const speedDiff = cfg.maxSpeed - currentSpeed.current
        currentSpeed.current += Math.min(cfg.acceleration * thrustCurve * dt, speedDiff)
      }
    } else if (isSpeedBraking) {
      // Shift + S - SPEED BRAKE: rapid deceleration to zero (3x brake force)
      const speedBrakeForce = cfg.brakeForce * 3
      if (currentSpeed.current > 0) {
        currentSpeed.current = Math.max(0, currentSpeed.current - speedBrakeForce * dt)
      } else if (currentSpeed.current < 0) {
        currentSpeed.current = Math.min(0, currentSpeed.current + speedBrakeForce * dt)
      }
    } else if (isBraking) {
      // S key - normal deceleration (can go into reverse)
      currentSpeed.current -= cfg.brakeForce * dt
    } else {
      // DRIFT PHYSICS - ship retains momentum but gradually slows
      const timeSinceBoostEnd = boostEndTime.current > 0 ? (Date.now() / 1000 - boostEndTime.current) : 999

      // Exponential decay after boost ends
      if (timeSinceBoostEnd < physics.boostMomentumDecay) {
        const decayProgress = timeSinceBoostEnd / physics.boostMomentumDecay
        const decayMultiplier = Math.pow(1 - decayProgress, physics.decelerationCurve)
        const targetSpeed = cfg.maxSpeed * physics.driftRetention
        currentSpeed.current = THREE.MathUtils.lerp(currentSpeed.current, targetSpeed, dt * 0.5 * (1 - decayMultiplier))
      }

      // Apply friction (gradual slowdown)
      if (currentSpeed.current > 0) {
        currentSpeed.current -= currentSpeed.current * physics.frictionCoefficient * dt
      } else if (currentSpeed.current < 0) {
        currentSpeed.current -= currentSpeed.current * physics.frictionCoefficient * dt
      }
    }

    // Snap to zero when close (prevents endless drift)
    if (Math.abs(currentSpeed.current) < 5 && !isThrusting && !isBraking) {
      currentSpeed.current = 0
    }

    // Clamp to speed limits
    currentSpeed.current = THREE.MathUtils.clamp(currentSpeed.current, cfg.minSpeed, cfg.boostSpeed)

    // --- AGILITY CALCULATION ---

    // Calculate agility multiplier based on absolute speed (full agility when slow, reduced when fast)
    let agilityMultiplier: number
    if (isBoosting.current) {
      agilityMultiplier = cfg.agilityAtBoost
    } else {
      // Use absolute speed for agility - same handling for forward and reverse
      const absSpeed = Math.abs(currentSpeed.current)
      const speedNormalized = absSpeed / cfg.maxSpeed
      agilityMultiplier = THREE.MathUtils.lerp(
        cfg.agilityAtMinSpeed,
        cfg.agilityAtMaxSpeed,
        Math.min(speedNormalized, 1)
      )
    }

    // --- ROTATION FROM MOUSE - LINEAR (NO ACCELERATION) ---

    // Consume accumulated mouse input with inversion support
    const mouseX = mouseInput.current.x * cfg.mouseSensitivity * (cfg.invertX ? -1 : 1)
    const mouseY = mouseInput.current.y * cfg.mouseSensitivity * (cfg.invertY ? -1 : 1)
    mouseInput.current.x = 0
    mouseInput.current.y = 0

    // Apply mouse input directly to rotation velocities (linear, no inertia)
    const hasMouseInput = Math.abs(mouseX) > 0.001 || Math.abs(mouseY) > 0.001
    if (hasMouseInput) {
      currentYawVelocity.current = mouseX * cfg.baseYawRate * agilityMultiplier
      currentPitchVelocity.current = mouseY * cfg.basePitchRate * agilityMultiplier
    } else {
      // Instantly stop rotation when no mouse input
      currentYawVelocity.current = 0
      currentPitchVelocity.current = 0
    }

    // --- MANUAL ROLL (A/D keys) ---

    let targetRollVelocity = 0
    if (isRollingLeft) targetRollVelocity = -cfg.rollRate   // A = roll left (counter-clockwise)
    if (isRollingRight) targetRollVelocity = cfg.rollRate   // D = roll right (clockwise)

    // Smooth roll
    currentRollVelocity.current += (targetRollVelocity - currentRollVelocity.current) * Math.min(6 * dt, 1)

    // --- NATURAL BANKING BEHAVIOR ---

    // Calculate speed-dependent bank multiplier (faster = sharper banks)
    const speedNormalized = Math.abs(currentSpeed.current) / cfg.maxSpeed
    const speedBankMultiplier = 1 + (speedNormalized * physics.bankSpeedMultiplier)

    // Lead-in banking (anticipatory - banks slightly before full turn)
    const leadInBank = targetYawVelocity.current * physics.bankLeadIn * speedBankMultiplier

    // Counter-banking (opposite bank when stopping a turn)
    const yawChange = currentYawVelocity.current - previousYawVelocity.current
    const counterBank = -yawChange * physics.counterBankStrength * 50

    // Main auto-bank based on current yaw velocity
    const mainBank = -currentYawVelocity.current * cfg.autoBankStrength * 20 * speedBankMultiplier

    // Combine all banking factors
    const targetBankAngle = mainBank + leadInBank + counterBank

    // Smooth bank recovery with configurable time
    const bankRecoveryRate = 1 / physics.bankRecoveryTime
    autoBankAngle.current += (targetBankAngle - autoBankAngle.current) * Math.min(bankRecoveryRate * dt, 1)

    // Store previous yaw for next frame's counter-banking calculation
    previousYawVelocity.current = currentYawVelocity.current

    // --- APPLY ROTATIONS ---

    // Get camera's local axes
    const localRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
    const localUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion)
    const localForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)

    // Apply yaw (around local up - NMS style, turning is relative to ship orientation)
    yawQuat.current.setFromAxisAngle(localUp, -currentYawVelocity.current * dt)
    camera.quaternion.premultiply(yawQuat.current)

    // Apply pitch (around local right axis)
    pitchQuat.current.setFromAxisAngle(localRight, -currentPitchVelocity.current * dt)
    camera.quaternion.premultiply(pitchQuat.current)

    // Apply manual roll (around local forward axis)
    if (Math.abs(currentRollVelocity.current) > 0.001) {
      rollQuat.current.setFromAxisAngle(localForward, currentRollVelocity.current * dt)
      camera.quaternion.premultiply(rollQuat.current)
    }

    // Normalize to prevent drift
    camera.quaternion.normalize()

    // --- STRAFE MOVEMENT (6-AXIS CONTROL) ---

    // Calculate target strafe velocities
    let targetStrafeX = 0
    let targetStrafeY = 0

    if (isStrafingLeft) targetStrafeX = -cfg.strafeSpeed
    if (isStrafingRight) targetStrafeX = cfg.strafeSpeed
    if (isStrafingUp) targetStrafeY = cfg.strafeSpeed
    if (isStrafingDown) targetStrafeY = -cfg.strafeSpeed

    // Smooth strafe acceleration/deceleration
    const strafeAccelRate = cfg.strafeAcceleration * dt
    const strafeDecelRate = cfg.strafeDeceleration * dt

    if (Math.abs(targetStrafeX) > 0) {
      // Accelerating to target strafe speed
      const diff = targetStrafeX - strafeVelocityX.current
      strafeVelocityX.current += Math.sign(diff) * Math.min(Math.abs(diff), strafeAccelRate)
    } else {
      // Decelerating to zero
      if (Math.abs(strafeVelocityX.current) < strafeDecelRate) {
        strafeVelocityX.current = 0
      } else {
        strafeVelocityX.current -= Math.sign(strafeVelocityX.current) * strafeDecelRate
      }
    }

    if (Math.abs(targetStrafeY) > 0) {
      // Accelerating to target strafe speed
      const diff = targetStrafeY - strafeVelocityY.current
      strafeVelocityY.current += Math.sign(diff) * Math.min(Math.abs(diff), strafeAccelRate)
    } else {
      // Decelerating to zero
      if (Math.abs(strafeVelocityY.current) < strafeDecelRate) {
        strafeVelocityY.current = 0
      } else {
        strafeVelocityY.current -= Math.sign(strafeVelocityY.current) * strafeDecelRate
      }
    }

    // --- MOVEMENT ---

    // Forward/backward movement
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
    camera.position.addScaledVector(forward, currentSpeed.current * dt)

    // Lateral strafe (left/right)
    if (Math.abs(strafeVelocityX.current) > 0.01) {
      camera.position.addScaledVector(localRight, strafeVelocityX.current * dt)
    }

    // Vertical strafe (up/down)
    if (Math.abs(strafeVelocityY.current) > 0.01) {
      camera.position.addScaledVector(localUp, strafeVelocityY.current * dt)
    }

    // --- UPDATE SHARED FLIGHT STATE ---
    updateFlightState({
      speed: currentSpeed.current,
      isBoosting: isBoosting.current,
      yawVelocity: currentYawVelocity.current,
      pitchVelocity: currentPitchVelocity.current,
      rollVelocity: currentRollVelocity.current,
      autoBankAngle: autoBankAngle.current,
    })
  })

  return null
}

// Combined ship controller component
export function FlyCamera(props: ShipControlsProps) {
  return <ShipControls {...props} />
}
