import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useKeyboardControls } from '../hooks/useKeyboardControls'
import { useStore } from '../store'

interface ShipControlsProps {
  speed?: number
  damping?: number
}

export default function ShipControls({
  speed = 2,
  damping = 0.95,
}: ShipControlsProps) {
  const { camera } = useThree()
  const { cameraMode } = useStore()
  const keyMap = useKeyboardControls()

  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())

  // Store initial camera setup
  useEffect(() => {
    if (cameraMode === 'fly') {
      // Reset velocity when switching to fly mode
      velocity.current.set(0, 0, 0)
    }
  }, [cameraMode])

  useFrame((_, delta) => {
    if (cameraMode !== 'fly') return

    // Calculate movement direction based on camera orientation
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
    const up = new THREE.Vector3(0, 1, 0)

    // Reset direction
    direction.current.set(0, 0, 0)

    // Apply movement based on keys
    if (keyMap.forward) direction.current.add(forward)
    if (keyMap.backward) direction.current.sub(forward)
    if (keyMap.right) direction.current.add(right)
    if (keyMap.left) direction.current.sub(right)
    if (keyMap.up) direction.current.add(up)
    if (keyMap.down) direction.current.sub(up)

    // Normalize and scale by speed
    if (direction.current.length() > 0) {
      direction.current.normalize()

      // Apply boost/brake modifiers
      let currentSpeed = speed
      if (keyMap.boost) currentSpeed *= 5
      if (keyMap.brake) currentSpeed *= 0.2

      // Add to velocity
      velocity.current.add(direction.current.multiplyScalar(currentSpeed * delta * 60))
    }

    // Apply damping
    velocity.current.multiplyScalar(damping)

    // Update camera position
    camera.position.add(velocity.current)
  })

  return null
}

// Mouse-based camera rotation when pointer is locked
export function useMouseLook() {
  const { camera, gl } = useThree()
  const { cameraMode, setCameraMode } = useStore()

  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const PI_2 = Math.PI / 2

  useEffect(() => {
    if (cameraMode !== 'fly') return

    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== gl.domElement) return

      const movementX = event.movementX || 0
      const movementY = event.movementY || 0

      euler.current.setFromQuaternion(camera.quaternion)

      euler.current.y -= movementX * 0.002
      euler.current.x -= movementY * 0.002

      // Clamp vertical rotation
      euler.current.x = Math.max(-PI_2, Math.min(PI_2, euler.current.x))

      camera.quaternion.setFromEuler(euler.current)
    }

    const onClick = () => {
      if (cameraMode === 'fly' && document.pointerLockElement !== gl.domElement) {
        gl.domElement.requestPointerLock()
      }
    }

    // ESC key to exit fly mode and return to orbit
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        if (document.pointerLockElement === gl.domElement) {
          document.exitPointerLock()
        }
        // Switch back to orbit mode
        setCameraMode('orbit')
      }
    }

    // Handle pointer lock change
    const onPointerLockChange = () => {
      if (document.pointerLockElement !== gl.domElement) {
        // Pointer lock was exited (by ESC or other means)
        document.body.style.cursor = 'default'
      }
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerlockchange', onPointerLockChange)
    gl.domElement.addEventListener('click', onClick)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
      gl.domElement.removeEventListener('click', onClick)
      if (document.pointerLockElement === gl.domElement) {
        document.exitPointerLock()
      }
      document.body.style.cursor = 'default'
    }
  }, [camera, gl.domElement, cameraMode, setCameraMode])
}

// Combined ship controller component
export function FlyCamera(props: ShipControlsProps) {
  useMouseLook()
  return <ShipControls {...props} />
}
