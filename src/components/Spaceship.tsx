import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'
import type { ShipType } from '../store'
import { PERFORMANCE } from '../config/performance'

// Ship configuration for exhaust animations
interface ExhaustRefs {
  main: React.RefObject<THREE.Mesh>
  left?: React.RefObject<THREE.Mesh>
  right?: React.RefObject<THREE.Mesh>
}

// Falcon - Sleek fighter with twin engines
function FalconShip({ exhaustRefs, isMoving }: { exhaustRefs: ExhaustRefs; isMoving: boolean }) {
  return (
    <group scale={[0.6, 0.6, 0.6]}>
      {/* Main fuselage - sleek arrow shape */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.2, 0.4, 6]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Nose - pointed */}
      <mesh position={[0, 0, -3.5]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.8, 0.8, 2]} />
        <meshStandardMaterial color="#3a4a5a" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Cockpit */}
      <mesh position={[0, 0.4, -1.5]}>
        <sphereGeometry args={[0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial
          color="#00eeff"
          emissive="#00eeff"
          emissiveIntensity={0.3}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Left wing */}
      <mesh position={[-2, 0, 0.5]} rotation={[0, 0.2, -0.1]}>
        <boxGeometry args={[2.5, 0.08, 2]} />
        <meshStandardMaterial color="#1a2a3a" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Right wing */}
      <mesh position={[2, 0, 0.5]} rotation={[0, -0.2, 0.1]}>
        <boxGeometry args={[2.5, 0.08, 2]} />
        <meshStandardMaterial color="#1a2a3a" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Left engine pod */}
      <group position={[-1.8, -0.1, 2]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.35, 2, 12]} />
          <meshStandardMaterial color="#2a3a4a" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.3, 0.3, 12]} />
          <meshStandardMaterial color="#1a1a2a" metalness={0.95} roughness={0.05} />
        </mesh>
      </group>

      {/* Right engine pod */}
      <group position={[1.8, -0.1, 2]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.35, 2, 12]} />
          <meshStandardMaterial color="#2a3a4a" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.25, 0.3, 0.3, 12]} />
          <meshStandardMaterial color="#1a1a2a" metalness={0.95} roughness={0.05} />
        </mesh>
      </group>

      {/* Wing accent lights */}
      <mesh position={[-2.8, 0.05, 0.5]}>
        <boxGeometry args={[0.6, 0.02, 0.1]} />
        <meshBasicMaterial color="#ff3366" />
      </mesh>
      <mesh position={[2.8, 0.05, 0.5]}>
        <boxGeometry args={[0.6, 0.02, 0.1]} />
        <meshBasicMaterial color="#33ff66" />
      </mesh>

      {/* Main exhaust */}
      <mesh ref={exhaustRefs.main} position={[0, 0, 4]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.4, 2, 12]} />
        <meshBasicMaterial color="#00eeff" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Left exhaust */}
      <mesh ref={exhaustRefs.left} position={[-1.8, -0.1, 3.5]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.22, 1.5, 10]} />
        <meshBasicMaterial color="#00eeff" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Right exhaust */}
      <mesh ref={exhaustRefs.right} position={[1.8, -0.1, 3.5]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.22, 1.5, 10]} />
        <meshBasicMaterial color="#00eeff" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Lights */}
      <pointLight position={[-3, 0, 0.5]} color="#ff3366" intensity={0.5} distance={5} />
      <pointLight position={[3, 0, 0.5]} color="#33ff66" intensity={0.5} distance={5} />
      <pointLight position={[0, 0, 4.5]} color="#00eeff" intensity={isMoving ? 1.5 : 0.3} distance={8} />
    </group>
  )
}

// Viper - Fast interceptor with angular design
function ViperShip({ exhaustRefs, isMoving }: { exhaustRefs: ExhaustRefs; isMoving: boolean }) {
  return (
    <group scale={[0.55, 0.55, 0.55]}>
      {/* Main body - angular wedge */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 0.5, 5]} />
        <meshStandardMaterial color="#4a2a3a" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Nose spike */}
      <mesh position={[0, 0, -3.2]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.4, 2, 4]} />
        <meshStandardMaterial color="#6a3a4a" metalness={0.95} roughness={0.05} />
      </mesh>

      {/* Cockpit - angular */}
      <mesh position={[0, 0.35, -1]}>
        <boxGeometry args={[0.6, 0.3, 1.2]} />
        <meshStandardMaterial
          color="#ff6644"
          emissive="#ff6644"
          emissiveIntensity={0.4}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Left swept wing */}
      <mesh position={[-1.5, 0, 1]} rotation={[0, 0.4, -0.2]}>
        <boxGeometry args={[2, 0.06, 1.5]} />
        <meshStandardMaterial color="#3a1a2a" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Right swept wing */}
      <mesh position={[1.5, 0, 1]} rotation={[0, -0.4, 0.2]}>
        <boxGeometry args={[2, 0.06, 1.5]} />
        <meshStandardMaterial color="#3a1a2a" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Vertical stabilizers */}
      <mesh position={[-0.8, 0.4, 2]} rotation={[0.1, 0, 0.3]}>
        <boxGeometry args={[0.05, 0.8, 1]} />
        <meshStandardMaterial color="#5a2a3a" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0.8, 0.4, 2]} rotation={[0.1, 0, -0.3]}>
        <boxGeometry args={[0.05, 0.8, 1]} />
        <meshStandardMaterial color="#5a2a3a" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Single powerful engine */}
      <mesh position={[0, 0, 2.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.6, 1.5, 8]} />
        <meshStandardMaterial color="#2a1a2a" metalness={0.95} roughness={0.05} />
      </mesh>

      {/* Main exhaust */}
      <mesh ref={exhaustRefs.main} position={[0, 0, 4]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.5, 3, 12]} />
        <meshBasicMaterial color="#ff6644" transparent opacity={0.7} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Wing tip lights */}
      <mesh position={[-2.3, 0, 1.2]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#ff3366" />
      </mesh>
      <mesh position={[2.3, 0, 1.2]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#33ff66" />
      </mesh>

      {/* Lights */}
      <pointLight position={[-2.5, 0, 1]} color="#ff3366" intensity={0.4} distance={4} />
      <pointLight position={[2.5, 0, 1]} color="#33ff66" intensity={0.4} distance={4} />
      <pointLight position={[0, 0, 5]} color="#ff6644" intensity={isMoving ? 2 : 0.4} distance={10} />
    </group>
  )
}

// Hauler - Bulky cargo ship with wide body
function HaulerShip({ exhaustRefs, isMoving }: { exhaustRefs: ExhaustRefs; isMoving: boolean }) {
  return (
    <group scale={[0.5, 0.5, 0.5]}>
      {/* Main cargo body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3, 1.5, 5]} />
        <meshStandardMaterial color="#4a4a3a" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Front section */}
      <mesh position={[0, 0.2, -3]}>
        <boxGeometry args={[2, 1.2, 1.5]} />
        <meshStandardMaterial color="#5a5a4a" metalness={0.75} roughness={0.25} />
      </mesh>

      {/* Cockpit windows */}
      <mesh position={[0, 0.5, -3.6]}>
        <boxGeometry args={[1.5, 0.5, 0.3]} />
        <meshStandardMaterial
          color="#66ff99"
          emissive="#66ff99"
          emissiveIntensity={0.3}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Cargo bay doors (detail lines) */}
      <mesh position={[0, 0.76, 0]}>
        <boxGeometry args={[2.8, 0.02, 4.8]} />
        <meshStandardMaterial color="#3a3a2a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Left engine nacelle */}
      <group position={[-2, -0.3, 1.5]}>
        <mesh>
          <boxGeometry args={[1, 0.8, 3]} />
          <meshStandardMaterial color="#3a3a2a" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 1.7]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.4, 0.5, 8]} />
          <meshStandardMaterial color="#2a2a1a" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Right engine nacelle */}
      <group position={[2, -0.3, 1.5]}>
        <mesh>
          <boxGeometry args={[1, 0.8, 3]} />
          <meshStandardMaterial color="#3a3a2a" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 1.7]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.35, 0.4, 0.5, 8]} />
          <meshStandardMaterial color="#2a2a1a" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Antenna array */}
      <mesh position={[0, 1.1, -2]}>
        <boxGeometry args={[0.1, 0.6, 0.1]} />
        <meshStandardMaterial color="#6a6a5a" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Main exhaust */}
      <mesh ref={exhaustRefs.main} position={[0, 0, 3.5]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.6, 2, 8]} />
        <meshBasicMaterial color="#66ff99" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Left exhaust */}
      <mesh ref={exhaustRefs.left} position={[-2, -0.3, 3.8]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.3, 1.5, 8]} />
        <meshBasicMaterial color="#66ff99" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Right exhaust */}
      <mesh ref={exhaustRefs.right} position={[2, -0.3, 3.8]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.3, 1.5, 8]} />
        <meshBasicMaterial color="#66ff99" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Running lights */}
      <pointLight position={[-1.5, 0.8, -3]} color="#ffff66" intensity={0.3} distance={4} />
      <pointLight position={[1.5, 0.8, -3]} color="#ffff66" intensity={0.3} distance={4} />
      <pointLight position={[0, 0, 4.5]} color="#66ff99" intensity={isMoving ? 1 : 0.2} distance={8} />
    </group>
  )
}

// Explorer - Elegant science vessel with sensor arrays
function ExplorerShip({ exhaustRefs, isMoving }: { exhaustRefs: ExhaustRefs; isMoving: boolean }) {
  return (
    <group scale={[0.55, 0.55, 0.55]}>
      {/* Central disc body */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.5, 1.2, 0.6, 24]} />
        <meshStandardMaterial color="#3a4a5a" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Upper dome */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.8, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial color="#4a5a6a" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Observatory dome */}
      <mesh position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial
          color="#9966ff"
          emissive="#9966ff"
          emissiveIntensity={0.4}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Forward sensor array */}
      <group position={[0, 0, -2]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 1.5, 12]} />
          <meshStandardMaterial color="#2a3a4a" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0, -1]}>
          <sphereGeometry args={[0.25, 12, 12]} />
          <meshStandardMaterial
            color="#66ccff"
            emissive="#66ccff"
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>

      {/* Ring detail */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.4, 0.05, 8, 32]} />
        <meshStandardMaterial
          color="#9966ff"
          emissive="#9966ff"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Left engine arm */}
      <group position={[-1.5, -0.2, 1]}>
        <mesh rotation={[0, 0.3, 0]}>
          <boxGeometry args={[0.3, 0.25, 2]} />
          <meshStandardMaterial color="#2a3a4a" metalness={0.85} roughness={0.15} />
        </mesh>
        <mesh position={[-0.3, 0, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.25, 0.8, 12]} />
          <meshStandardMaterial color="#1a2a3a" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Right engine arm */}
      <group position={[1.5, -0.2, 1]}>
        <mesh rotation={[0, -0.3, 0]}>
          <boxGeometry args={[0.3, 0.25, 2]} />
          <meshStandardMaterial color="#2a3a4a" metalness={0.85} roughness={0.15} />
        </mesh>
        <mesh position={[0.3, 0, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.25, 0.8, 12]} />
          <meshStandardMaterial color="#1a2a3a" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Main exhaust */}
      <mesh ref={exhaustRefs.main} position={[0, -0.2, 2]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.35, 2, 12]} />
        <meshBasicMaterial color="#9966ff" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Left exhaust */}
      <mesh ref={exhaustRefs.left} position={[-1.8, -0.2, 2.8]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.18, 1.2, 10]} />
        <meshBasicMaterial color="#66ccff" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Right exhaust */}
      <mesh ref={exhaustRefs.right} position={[1.8, -0.2, 2.8]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.18, 1.2, 10]} />
        <meshBasicMaterial color="#66ccff" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Sensor dish glow */}
      <pointLight position={[0, 1.2, 0]} color="#9966ff" intensity={0.6} distance={5} />
      <pointLight position={[0, 0, -3]} color="#66ccff" intensity={0.4} distance={4} />
      <pointLight position={[0, -0.2, 3]} color="#9966ff" intensity={isMoving ? 1.2 : 0.3} distance={7} />
    </group>
  )
}

// Ship info for the selector
export const SHIP_INFO: Record<ShipType, { name: string; description: string; icon: string }> = {
  falcon: { name: 'Falcon', description: 'Balanced fighter', icon: '🦅' },
  viper: { name: 'Viper', description: 'Fast interceptor', icon: '🐍' },
  hauler: { name: 'Hauler', description: 'Heavy cargo', icon: '📦' },
  explorer: { name: 'Explorer', description: 'Science vessel', icon: '🔭' },
}

export default function Spaceship() {
  const shipRef = useRef<THREE.Group>(null)
  const shipModelRef = useRef<THREE.Group>(null)
  const exhaustRef = useRef<THREE.Mesh>(null)
  const leftExhaustRef = useRef<THREE.Mesh>(null)
  const rightExhaustRef = useRef<THREE.Mesh>(null)
  const visualRoll = useRef(0)
  const visualPitch = useRef(0)
  const { cameraMode, selectedShip, flightState } = useStore()
  const { camera } = useThree()

  useFrame((state, delta) => {
    if (!shipRef.current || cameraMode !== 'fly') return

    const time = state.clock.elapsedTime
    const dt = Math.min(delta, 0.1)
    const exhaustCfg = PERFORMANCE.ship.exhaust
    const animationEnabled = PERFORMANCE.toggles.exhaustAnimation

    // Position ship in front of and slightly below camera
    const offset = new THREE.Vector3(0, -2, -10)
    offset.applyQuaternion(camera.quaternion)
    shipRef.current.position.copy(camera.position).add(offset)
    shipRef.current.quaternion.copy(camera.quaternion)

    // Extra visual effects on top of camera rotation (ship already follows camera exactly)
    // These are small cosmetic tilts that make the ship feel more alive

    // Auto-bank visual: slight extra tilt into turns (purely cosmetic, camera already handles actual roll)
    const autoBankVisual = flightState.yawVelocity * -0.08

    // Visual pitch based on speed/boost (cosmetic nose tilt)
    const speedFactor = (flightState.speed - 30) / (1800 - 30)
    let targetPitch = -speedFactor * 0.05
    if (flightState.isBoosting) {
      targetPitch = -0.12
    }
    targetPitch += flightState.pitchVelocity * 0.03

    // Smooth only the cosmetic effects (these are small additions, not the main rotation)
    const smoothing = 8
    visualRoll.current += (autoBankVisual - visualRoll.current) * Math.min(smoothing * dt, 1)
    visualPitch.current += (targetPitch - visualPitch.current) * Math.min(smoothing * dt, 1)

    // Apply small cosmetic tilts to the ship model
    if (shipModelRef.current) {
      shipModelRef.current.rotation.z = visualRoll.current
      shipModelRef.current.rotation.x = visualPitch.current
    }

    // Animate exhausts based on speed and boost state
    const baseFlicker = animationEnabled
      ? Math.sin(time * exhaustCfg.primaryFreq) * 0.15 + Math.sin(time * exhaustCfg.interferenceFreq) * 0.1
      : 0
    const thrustIntensity = animationEnabled ? Math.min(flightState.speed / 500, 1) : 0 // 0-1 based on speed
    const boostMultiplier = animationEnabled && flightState.isBoosting ? 2.5 : 1

    if (exhaustRef.current) {
      const mat = exhaustRef.current.material as THREE.MeshBasicMaterial
      const intensity = thrustIntensity * boostMultiplier
      exhaustRef.current.scale.z = 0.5 + intensity * 1.5 + baseFlicker * intensity
      mat.opacity = Math.min(1, exhaustCfg.baseOpacity + intensity * exhaustCfg.opacityVariation + baseFlicker * 0.2)
    }

    if (leftExhaustRef.current) {
      const mat = leftExhaustRef.current.material as THREE.MeshBasicMaterial
      const intensity = thrustIntensity * boostMultiplier * 0.8
      leftExhaustRef.current.scale.z = 0.3 + intensity * 1.2 + baseFlicker * intensity * 0.8
      mat.opacity = Math.min(1, exhaustCfg.baseOpacity * 0.75 + intensity * exhaustCfg.opacityVariation * 0.8 + baseFlicker * 0.15)
    }

    if (rightExhaustRef.current) {
      const mat = rightExhaustRef.current.material as THREE.MeshBasicMaterial
      const intensity = thrustIntensity * boostMultiplier * 0.8
      rightExhaustRef.current.scale.z = 0.3 + intensity * 1.2 + baseFlicker * intensity * 0.8
      mat.opacity = Math.min(1, exhaustCfg.baseOpacity * 0.75 + intensity * exhaustCfg.opacityVariation * 0.8 + baseFlicker * 0.15)
    }
  }, 1)

  if (cameraMode !== 'fly') return null

  const exhaustRefs: ExhaustRefs = {
    main: exhaustRef as React.RefObject<THREE.Mesh>,
    left: leftExhaustRef as React.RefObject<THREE.Mesh>,
    right: rightExhaustRef as React.RefObject<THREE.Mesh>,
  }

  // Derive isMoving from flight state - ship is "moving" when above minimum cruise speed
  const isMoving = flightState.speed > 50

  return (
    <group ref={shipRef}>
      <group ref={shipModelRef}>
        {selectedShip === 'falcon' && <FalconShip exhaustRefs={exhaustRefs} isMoving={isMoving} />}
        {selectedShip === 'viper' && <ViperShip exhaustRefs={exhaustRefs} isMoving={isMoving} />}
        {selectedShip === 'hauler' && <HaulerShip exhaustRefs={exhaustRefs} isMoving={isMoving} />}
        {selectedShip === 'explorer' && <ExplorerShip exhaustRefs={exhaustRefs} isMoving={isMoving} />}
        <pointLight position={[0, 0, 0]} color="#aaaaff" intensity={0.15} distance={12} />
      </group>
    </group>
  )
}
