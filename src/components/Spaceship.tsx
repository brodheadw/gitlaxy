import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'

// A sleek NMS-inspired spaceship that follows the camera in fly mode
export default function Spaceship() {
  const shipRef = useRef<THREE.Group>(null)
  const exhaustRef = useRef<THREE.Mesh>(null)
  const leftExhaustRef = useRef<THREE.Mesh>(null)
  const rightExhaustRef = useRef<THREE.Mesh>(null)
  const { cameraMode, keysPressed } = useStore()
  const { camera } = useThree()

  // Check if any movement keys are pressed
  const isMoving = keysPressed.size > 0

  useFrame((state) => {
    if (!shipRef.current || cameraMode !== 'fly') return

    const time = state.clock.elapsedTime

    // Position ship slightly in front and below camera
    const offset = new THREE.Vector3(0, -2.5, -12)
    offset.applyQuaternion(camera.quaternion)
    shipRef.current.position.copy(camera.position).add(offset)

    // Match camera rotation
    shipRef.current.quaternion.copy(camera.quaternion)

    // Animate exhausts when moving
    const baseFlicker = Math.sin(time * 40) * 0.15 + Math.sin(time * 67) * 0.1

    if (exhaustRef.current) {
      const mat = exhaustRef.current.material as THREE.MeshBasicMaterial
      if (isMoving) {
        exhaustRef.current.scale.z = 1.5 + baseFlicker
        mat.opacity = 0.7 + baseFlicker * 0.3
      } else {
        exhaustRef.current.scale.z = 0.6
        mat.opacity = 0.25
      }
    }

    if (leftExhaustRef.current) {
      const mat = leftExhaustRef.current.material as THREE.MeshBasicMaterial
      if (isMoving) {
        leftExhaustRef.current.scale.z = 1.2 + baseFlicker * 0.8
        mat.opacity = 0.6 + baseFlicker * 0.3
      } else {
        leftExhaustRef.current.scale.z = 0.4
        mat.opacity = 0.2
      }
    }

    if (rightExhaustRef.current) {
      const mat = rightExhaustRef.current.material as THREE.MeshBasicMaterial
      if (isMoving) {
        rightExhaustRef.current.scale.z = 1.2 + baseFlicker * 0.8
        mat.opacity = 0.6 + baseFlicker * 0.3
      } else {
        rightExhaustRef.current.scale.z = 0.4
        mat.opacity = 0.2
      }
    }
  })

  if (cameraMode !== 'fly') return null

  return (
    <group ref={shipRef} scale={[0.7, 0.7, 0.7]}>
      {/* Main fuselage - sleek elongated shape */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.8, 5, 8, 16]} />
        <meshStandardMaterial
          color="#4a4a6a"
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>

      {/* Nose cone - pointed */}
      <mesh position={[0, 0.3, -3.5]} rotation={[Math.PI * 0.55, 0, 0]}>
        <coneGeometry args={[0.9, 2.5, 8]} />
        <meshStandardMaterial
          color="#5a5a7a"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Cockpit glass - sleek curved */}
      <mesh position={[0, 0.7, -1.5]} rotation={[-0.3, 0, 0]}>
        <sphereGeometry args={[0.7, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial
          color="#00ffcc"
          metalness={0.95}
          roughness={0.05}
          emissive="#00ffcc"
          emissiveIntensity={0.4}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Cockpit frame */}
      <mesh position={[0, 0.65, -1.5]} rotation={[-0.3, 0, 0]}>
        <torusGeometry args={[0.72, 0.08, 8, 24, Math.PI]} />
        <meshStandardMaterial
          color="#3a3a5a"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Left wing - swept back delta style */}
      <group position={[-1.5, -0.1, 1]} rotation={[0, 0.3, -0.15]}>
        <mesh>
          <boxGeometry args={[3, 0.12, 2.5]} />
          <meshStandardMaterial
            color="#3a3a5a"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        {/* Wing tip */}
        <mesh position={[-1.8, 0, 0.5]}>
          <boxGeometry args={[0.8, 0.1, 1.5]} />
          <meshStandardMaterial
            color="#2a2a4a"
            metalness={0.85}
            roughness={0.15}
          />
        </mesh>
        {/* Wing accent stripe */}
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[2.8, 0.03, 0.2]} />
          <meshStandardMaterial
            color="#00ffcc"
            emissive="#00ffcc"
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>

      {/* Right wing - swept back delta style */}
      <group position={[1.5, -0.1, 1]} rotation={[0, -0.3, 0.15]}>
        <mesh>
          <boxGeometry args={[3, 0.12, 2.5]} />
          <meshStandardMaterial
            color="#3a3a5a"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        {/* Wing tip */}
        <mesh position={[1.8, 0, 0.5]}>
          <boxGeometry args={[0.8, 0.1, 1.5]} />
          <meshStandardMaterial
            color="#2a2a4a"
            metalness={0.85}
            roughness={0.15}
          />
        </mesh>
        {/* Wing accent stripe */}
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[2.8, 0.03, 0.2]} />
          <meshStandardMaterial
            color="#00ffcc"
            emissive="#00ffcc"
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>

      {/* Engine pods - left */}
      <group position={[-1.8, -0.3, 2]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.35, 1.8, 6, 12]} />
          <meshStandardMaterial
            color="#4a4a6a"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        {/* Engine intake */}
        <mesh position={[0, 0, -1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.3, 0.3, 12]} />
          <meshStandardMaterial
            color="#2a2a4a"
            metalness={0.95}
            roughness={0.05}
          />
        </mesh>
        {/* Engine nozzle */}
        <mesh position={[0, 0, 1.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.35, 0.4, 12]} />
          <meshStandardMaterial
            color="#1a1a2a"
            metalness={0.95}
            roughness={0.05}
          />
        </mesh>
      </group>

      {/* Engine pods - right */}
      <group position={[1.8, -0.3, 2]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.35, 1.8, 6, 12]} />
          <meshStandardMaterial
            color="#4a4a6a"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        {/* Engine intake */}
        <mesh position={[0, 0, -1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.3, 0.3, 12]} />
          <meshStandardMaterial
            color="#2a2a4a"
            metalness={0.95}
            roughness={0.05}
          />
        </mesh>
        {/* Engine nozzle */}
        <mesh position={[0, 0, 1.3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.28, 0.35, 0.4, 12]} />
          <meshStandardMaterial
            color="#1a1a2a"
            metalness={0.95}
            roughness={0.05}
          />
        </mesh>
      </group>

      {/* Main engine exhaust */}
      <mesh ref={exhaustRef} position={[0, 0, 3.5]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.5, 2.5, 12]} />
        <meshBasicMaterial
          color="#ff6b6b"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Left engine exhaust */}
      <mesh ref={leftExhaustRef} position={[-1.8, -0.3, 3.8]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.25, 1.8, 10]} />
        <meshBasicMaterial
          color="#00ffcc"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Right engine exhaust */}
      <mesh ref={rightExhaustRef} position={[1.8, -0.3, 3.8]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.25, 1.8, 10]} />
        <meshBasicMaterial
          color="#00ffcc"
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Navigation lights */}
      <pointLight position={[-3.5, 0, 0.5]} color="#ff0033" intensity={0.4} distance={6} />
      <pointLight position={[3.5, 0, 0.5]} color="#00ff33" intensity={0.4} distance={6} />
      <pointLight position={[0, 0.8, -3.5]} color="#ffffff" intensity={0.3} distance={5} />

      {/* Engine glow */}
      <pointLight
        position={[0, 0, 4]}
        color="#ff6b6b"
        intensity={isMoving ? 1.5 : 0.3}
        distance={8}
      />
      <pointLight
        position={[-1.8, -0.3, 4]}
        color="#00ffcc"
        intensity={isMoving ? 1 : 0.2}
        distance={6}
      />
      <pointLight
        position={[1.8, -0.3, 4]}
        color="#00ffcc"
        intensity={isMoving ? 1 : 0.2}
        distance={6}
      />

      {/* Ambient ship light */}
      <pointLight position={[0, 0, 0]} color="#aaaaff" intensity={0.15} distance={12} />
    </group>
  )
}
