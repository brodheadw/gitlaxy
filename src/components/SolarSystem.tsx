import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Sphere } from '@react-three/drei'
import * as THREE from 'three'
import type { FolderNode, FileNode } from '../types'
import { getColorForFolder, getColorForExtension } from '../types'
import { useStore } from '../store'
import ProceduralPlanet from './ProceduralPlanet'

interface SolarSystemProps {
  folder: FolderNode
  position: [number, number, number]
  isCurrentSystem?: boolean
}

// Sun (folder) component
function Sun({ folder, onClick, isHovered, setIsHovered }: {
  folder: FolderNode
  onClick: () => void
  isHovered: boolean
  setIsHovered: (h: boolean) => void
}) {
  const sunRef = useRef<THREE.Group>(null)
  const coronaRef = useRef<THREE.Mesh>(null)
  const color = new THREE.Color(getColorForFolder(folder.name))

  // Sun size based on number of children - made bigger
  const isRoot = folder.path === '/'
  const baseSize = isRoot ? 150 : 80 + Math.min(folder.children.length * 5, 70)

  useFrame((state) => {
    if (!sunRef.current) return
    const time = state.clock.elapsedTime

    // Slow rotation
    sunRef.current.rotation.y += 0.001

    // Animate corona
    if (coronaRef.current) {
      coronaRef.current.scale.setScalar(1 + Math.sin(time * 0.5) * 0.05)
    }
  })

  return (
    <group
      ref={sunRef}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setIsHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setIsHovered(false)
        document.body.style.cursor = 'default'
      }}
    >
      {/* Core sun sphere */}
      <Sphere args={[baseSize, 64, 64]}>
        <meshBasicMaterial color={color} />
      </Sphere>

      {/* Inner corona glow */}
      <Sphere args={[baseSize * 1.1, 32, 32]}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Outer corona */}
      <Sphere ref={coronaRef} args={[baseSize * 1.3, 32, 32]}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Distant glow */}
      <Sphere args={[baseSize * 2, 32, 32]}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Sun light */}
      <pointLight color={color} intensity={3} distance={baseSize * 30} decay={2} />

      {/* Label */}
      <Html
        position={[0, baseSize + 20, 0]}
        center
        distanceFactor={200}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            background: isHovered ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.6)',
            color: `#${color.getHexString()}`,
            padding: isHovered ? '12px 20px' : '8px 14px',
            borderRadius: '8px',
            fontSize: isHovered ? '16px' : '14px',
            fontFamily: 'monospace',
            fontWeight: 'bold',
            border: `2px solid #${color.getHexString()}`,
            boxShadow: `0 0 20px #${color.getHexString()}60`,
            textShadow: `0 0 10px #${color.getHexString()}`,
            whiteSpace: 'nowrap',
          }}
        >
          ☀️ {folder.name}
          {isHovered && (
            <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '4px', fontWeight: 'normal' }}>
              {folder.children.length} items • Click to enter
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}

// Planet (file) component - orbits around the sun with procedural surface
function Planet({ file, orbitRadius, orbitSpeed, startAngle }: {
  file: FileNode
  orbitRadius: number
  orbitSpeed: number
  startAngle: number
}) {
  const planetRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const { selectNode, hoverNode, selectedNode } = useStore()

  const color = useMemo(() => new THREE.Color(getColorForExtension(file.extension)), [file.extension])
  const isSelected = selectedNode?.id === file.id

  // Planet size based on file size - make them much larger
  const baseSize = 25 + Math.log10(Math.max(file.size, 100)) * 10

  useFrame((state) => {
    if (!planetRef.current) return
    const time = state.clock.elapsedTime

    // Orbit around sun
    const angle = startAngle + time * orbitSpeed
    planetRef.current.position.x = Math.cos(angle) * orbitRadius
    planetRef.current.position.z = Math.sin(angle) * orbitRadius
    planetRef.current.position.y = Math.sin(angle * 0.5) * orbitRadius * 0.08 // Slight orbital tilt
  })

  return (
    <group ref={planetRef}>
      {/* Interaction mesh (invisible, larger for easier clicking) */}
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          selectNode(file)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          hoverNode(file)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          hoverNode(null)
          document.body.style.cursor = 'default'
        }}
      >
        <sphereGeometry args={[baseSize * 1.2, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Beautiful procedural planet with shaders */}
      <ProceduralPlanet
        size={baseSize}
        color={color}
        extension={file.extension}
        rotationSpeed={0.005}
      />

      {/* Selection indicator - glowing ring */}
      {(isSelected || hovered) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[baseSize * 2.5, baseSize * 2.8, 64]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Label */}
      <Html
        position={[0, baseSize * 1.5 + 10, 0]}
        center
        distanceFactor={150}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            background: hovered ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.5)',
            color: `#${color.getHexString()}`,
            padding: hovered ? '8px 14px' : '4px 10px',
            borderRadius: '6px',
            fontSize: hovered ? '13px' : '11px',
            fontFamily: 'monospace',
            border: `1px solid #${color.getHexString()}80`,
            textShadow: `0 0 8px #${color.getHexString()}`,
            whiteSpace: 'nowrap',
          }}
        >
          {file.name}
          {hovered && (
            <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '2px' }}>
              {(file.size / 1000).toFixed(1)} KB
            </div>
          )}
        </div>
      </Html>
    </group>
  )
}

// Orbit ring visualization
function OrbitRing({ radius, color }: { radius: number; color: string }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 1, radius + 1, 128]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export default function SolarSystem({ folder, position, isCurrentSystem = false }: SolarSystemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { enterSystem, viewLevel } = useStore()

  const color = getColorForFolder(folder.name)

  // Calculate orbit parameters for children
  const orbits = useMemo(() => {
    const files = folder.children.filter((c): c is FileNode => c.type === 'file')
    const sunSize = folder.path === '/' ? 150 : 80 + Math.min(folder.children.length * 5, 70)

    return files.map((file, index) => {
      // Much more spread out orbits for that vast space feeling
      const orbitRadius = sunSize * 3 + (index + 1) * 180 // More spacing between orbits
      const orbitSpeed = 0.03 / (index + 1) // Slower, more majestic orbits
      const startAngle = (index / files.length) * Math.PI * 2 + (index * 0.5) // Distribute with some variance

      return { file, orbitRadius, orbitSpeed, startAngle }
    })
  }, [folder])

  const handleSunClick = () => {
    if (viewLevel === 'galaxy') {
      // Travel to this solar system
      enterSystem(folder)
    }
  }

  return (
    <group position={position}>
      {/* The Sun (folder) */}
      <Sun
        folder={folder}
        onClick={handleSunClick}
        isHovered={isHovered}
        setIsHovered={setIsHovered}
      />

      {/* Only show planets when viewing this system or when it's current */}
      {(isCurrentSystem || viewLevel === 'system') && (
        <>
          {/* Orbit rings */}
          {orbits.map(({ orbitRadius }, i) => (
            <OrbitRing key={`orbit-${i}`} radius={orbitRadius} color={color} />
          ))}

          {/* Planets (files) */}
          {orbits.map(({ file, orbitRadius, orbitSpeed, startAngle }) => (
            <Planet
              key={file.id}
              file={file}
              orbitRadius={orbitRadius}
              orbitSpeed={orbitSpeed}
              startAngle={startAngle}
            />
          ))}
        </>
      )}
    </group>
  )
}
