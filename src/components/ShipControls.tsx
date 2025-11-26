import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'

// NMS-style flight configuration
const FLIGHT_CONFIG = {
  // Speed settings (units per second)
  minSpeed: -300,         // Reverse speed limit
  normalSpeed: 200,       // Normal cruise speed (only used when W is held)
  maxSpeed: 3000,         // Maximum speed (same with or without boost)
  boostSpeed: 3000,       // Boost speed (same as max - boost just accelerates faster)

  // Acceleration/deceleration
  acceleration: 150,      // How fast we speed up
  deceleration: 100,      // How fast we slow down (when not thrusting)
  brakeForce: 300,        // How fast S key slows us down

  // Turn rates (radians per second at base speed)
  basePitchRate: 1.5,     // Pitch sensitivity
  baseYawRate: 1.2,       // Yaw sensitivity
  rollRate: 2.5,          // Manual roll speed (A/D keys)

  // Auto-banking
  autoBankStrength: 0.4,  // How much the ship banks into turns
  autoBankSpeed: 3,       // How fast the bank adjusts

  // Speed affects agility
  agilityAtMinSpeed: 1.0, // Turn rate multiplier at min speed
  agilityAtMaxSpeed: 0.3, // Turn rate multiplier at max/boost speed
  agilityAtBoost: 0.15,   // Turn rate multiplier during boost

  // Mouse sensitivity
  mouseSensitivity: 0.004,
}

interface ShipControlsProps {
  config?: Partial<typeof FLIGHT_CONFIG>
}

// Key bindings for flight controls
const FLIGHT_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'ShiftLeft', 'ShiftRight', 'KeyE', 'Space'
])

export default function ShipControls({ config }: ShipControlsProps) {
  const { camera, gl } = useThree()
  const { cameraMode, setCameraMode, keysPressed, setKeyPressed, updateFlightState } = useStore()

  // Merge config
  const cfg = { ...FLIGHT_CONFIG, ...config }

  // Flight state
  const currentSpeed = useRef(cfg.minSpeed)
  const targetSpeed = useRef(cfg.normalSpeed)
  const isBoosting = useRef(false)

  // Rotation state for smooth interpolation
  const currentYawVelocity = useRef(0)
  const currentPitchVelocity = useRef(0)
  const currentRollVelocity = useRef(0)
  const autoBankAngle = useRef(0)

  // Mouse input accumulator
  const mouseInput = useRef({ x: 0, y: 0 })

  // Quaternion helpers
  const tempQuat = useRef(new THREE.Quaternion())
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
        setCameraMode('orbit')
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
  }, [camera, gl.domElement, cameraMode, setCameraMode, setKeyPressed])

  useFrame((_, delta) => {
    if (cameraMode !== 'fly') return

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

    // Consume accumulated mouse input
    const mouseX = mouseInput.current.x * cfg.mouseSensitivity
    const mouseY = mouseInput.current.y * cfg.mouseSensitivity
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

// Hook to expose flight state for HUD/ship visualization
export function useFlightState() {
  const speedRef = useRef(FLIGHT_CONFIG.minSpeed)
  const boostRef = useRef(false)
  const yawRef = useRef(0)
  const bankRef = useRef(0)

  return {
    speed: speedRef.current,
    isBoosting: boostRef.current,
    yawVelocity: yawRef.current,
    bankAngle: bankRef.current,
  }
}

// Combined ship controller component
export function FlyCamera(props: ShipControlsProps) {
  return <ShipControls {...props} />
}
