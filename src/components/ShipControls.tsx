import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'
import { DEFAULT_CONTROLS, MOUSE_SENSITIVITY_BASE, type ControlSettings } from '../config/controls'
import { PERFORMANCE } from '../config/performance'
import { useFrameThrottle } from '../hooks/useFrameThrottle'

// NMS-style flight configuration factory (5x scale for immersive universe)
const createFlightConfig = (controls: ControlSettings = DEFAULT_CONTROLS) => ({
  // Speed settings (units per second) - 5x for larger universe
  minSpeed: -1500,
  normalSpeed: 1000,
  maxSpeed: 15000,
  boostSpeed: 15000,

  // Acceleration/deceleration - uses control preset values
  acceleration: controls.acceleration,
  deceleration: controls.deceleration,
  brakeForce: controls.brakeForce,

  // Turn rates (radians per second at base speed) - uses control preset values
  basePitchRate: controls.turnRate,
  baseYawRate: controls.turnRate * 0.8,
  rollRate: controls.rollRate,

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
})

interface ShipControlsProps {
  controlSettings?: ControlSettings
}

// Key bindings for flight controls
const FLIGHT_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'ShiftLeft', 'ShiftRight', 'KeyE', 'Space'
])

export default function ShipControls({ controlSettings }: ShipControlsProps) {
  const { camera, gl } = useThree()
  const { cameraMode, setCameraMode, keysPressed, setKeyPressed, updateFlightState, showSettings } = useStore()

  // Create flight config from control settings
  const cfg = createFlightConfig(controlSettings)

  // Flight state
  const currentSpeed = useRef(cfg.minSpeed)
  const isBoosting = useRef(false)

  // Rotation state for smooth interpolation
  const currentYawVelocity = useRef(0)
  const currentPitchVelocity = useRef(0)
  const currentRollVelocity = useRef(0)
  const autoBankAngle = useRef(0)

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
      currentYawVelocity.current = 0
      currentPitchVelocity.current = 0
      currentRollVelocity.current = 0
      autoBankAngle.current = 0
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
        // Only exit fly mode if settings menu is not open
        // (let SettingsMenu handle closing itself first)
        if (!showSettings) {
          setCameraMode('orbit')
        }
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
    const wantsBoost = keysPressed.has('ShiftLeft') || keysPressed.has('ShiftRight') || keysPressed.has('KeyE')

    // Update boost state
    isBoosting.current = wantsBoost && isThrusting

    // --- SPEED MANAGEMENT ---

    // Only change speed when keys are pressed - maintain current speed otherwise
    if (isBoosting.current) {
      // Boosting - accelerate toward boost speed
      const speedDiff = cfg.boostSpeed - currentSpeed.current
      if (speedDiff > 0) {
        currentSpeed.current += Math.min(cfg.acceleration * 3 * dt, speedDiff)
      }
    } else if (isThrusting) {
      // W key - accelerate toward max speed (capped at maxSpeed without boost)
      if (currentSpeed.current < cfg.maxSpeed) {
        const speedDiff = cfg.maxSpeed - currentSpeed.current
        currentSpeed.current += Math.min(cfg.acceleration * dt, speedDiff)
      }
    } else if (isBraking) {
      // S key - decelerate (can go into reverse)
      currentSpeed.current -= cfg.brakeForce * dt
    }
    // No keys pressed = maintain current speed (no auto-cruise)

    // Snap to zero when close (makes it easy to stop)
    if (Math.abs(currentSpeed.current) < 15 && !isThrusting && !isBraking) {
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

    // --- ROTATION FROM MOUSE ---

    // Consume accumulated mouse input with inversion support
    const mouseX = mouseInput.current.x * cfg.mouseSensitivity * (cfg.invertX ? -1 : 1)
    const mouseY = mouseInput.current.y * cfg.mouseSensitivity * (cfg.invertY ? -1 : 1)
    mouseInput.current.x = 0
    mouseInput.current.y = 0

    // Apply agility to mouse input
    const effectiveYaw = mouseX * cfg.baseYawRate * agilityMultiplier
    const effectivePitch = mouseY * cfg.basePitchRate * agilityMultiplier

    // Smooth the rotation velocities
    const rotationSmoothing = 8
    currentYawVelocity.current += (effectiveYaw - currentYawVelocity.current) * Math.min(rotationSmoothing * dt, 1)
    currentPitchVelocity.current += (effectivePitch - currentPitchVelocity.current) * Math.min(rotationSmoothing * dt, 1)

    // --- MANUAL ROLL (A/D keys) ---

    let targetRollVelocity = 0
    if (isRollingLeft) targetRollVelocity = -cfg.rollRate   // A = roll left (counter-clockwise)
    if (isRollingRight) targetRollVelocity = cfg.rollRate   // D = roll right (clockwise)

    // Smooth roll
    currentRollVelocity.current += (targetRollVelocity - currentRollVelocity.current) * Math.min(6 * dt, 1)

    // --- AUTO-BANKING ---

    // Auto-bank based on yaw velocity (ship tilts into turns)
    const targetBankAngle = -currentYawVelocity.current * cfg.autoBankStrength * 20
    autoBankAngle.current += (targetBankAngle - autoBankAngle.current) * Math.min(cfg.autoBankSpeed * dt, 1)

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

    // --- MOVEMENT ---

    // Ship always moves forward (NMS style - no strafing)
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
    camera.position.addScaledVector(forward, currentSpeed.current * dt)

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
