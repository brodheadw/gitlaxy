import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Sphere } from '@react-three/drei'
import * as THREE from 'three'
import type { FolderNode, FileNode } from '../types'
import { getColorForExtension } from '../types'
import { useStore } from '../store'
import ProceduralPlanet from './ProceduralPlanet'

interface SolarSystemProps {
  folder: FolderNode
  position: [number, number, number]
  depth: number // How deep in the folder hierarchy (0 = top level)
  totalChildren: number // Total descendants for sizing
}

// Get star color and properties based on depth and size
function getStarProperties(depth: number, childCount: number, totalDescendants: number) {
  // Top-level folders with many children = Blue Supergiants
  // Mid-level folders = Main sequence (yellow/orange)
  // Deep/small folders = Red dwarfs

  if (depth === 0 && totalDescendants > 10) {
    // Blue Supergiant - large top-level folders
    return {
      color: new THREE.Color('#8bb4ff'),
      coronaColor: new THREE.Color('#aaccff'),
      size: 120 + Math.min(totalDescendants * 2, 100),
      intensity: 4,
    }
  } else if (depth === 0) {
    // Blue-white main sequence - smaller top-level
    return {
      color: new THREE.Color('#b4c7ff'),
      coronaColor: new THREE.Color('#ccdeff'),
      size: 80 + Math.min(childCount * 5, 60),
      intensity: 3,
    }
  } else if (depth === 1 && childCount > 5) {
    // Yellow giant - large nested folders
    return {
      color: new THREE.Color('#fff4e0'),
      coronaColor: new THREE.Color('#ffeecc'),
      size: 60 + Math.min(childCount * 4, 50),
      intensity: 2.5,
    }
  } else if (depth === 1) {
    // Yellow main sequence
    return {
      color: new THREE.Color('#ffee88'),
      coronaColor: new THREE.Color('#ffdd66'),
      size: 45 + Math.min(childCount * 3, 35),
      intensity: 2,
    }
  } else if (depth === 2) {
    // Orange dwarf
    return {
      color: new THREE.Color('#ffaa55'),
      coronaColor: new THREE.Color('#ff9944'),
      size: 35 + Math.min(childCount * 2, 25),
      intensity: 1.5,
    }
  } else {
    // Red dwarf - deep nested folders
    return {
      color: new THREE.Color('#ff6644'),
      coronaColor: new THREE.Color('#ff5533'),
      size: 25 + Math.min(childCount * 1.5, 15),
      intensity: 1,
    }
  }
}

// Sun (folder) component - no click to enter, just displays
function Sun({ folder, depth, totalChildren }: {
  folder: FolderNode
  depth: number
  totalChildren: number
}) {
  const sunRef = useRef<THREE.Group>(null)
  const coronaRef = useRef<THREE.Mesh>(null)
  const [isHovered, setIsHovered] = useState(false)
  const { selectNode, hoverNode } = useStore()

  const starProps = useMemo(
    () => getStarProperties(depth, folder.children.length, totalChildren),
    [depth, folder.children.length, totalChildren]
  )

  useFrame((state) => {
    if (!sunRef.current) return
    const time = state.clock.elapsedTime

    // Slow rotation
    sunRef.current.rotation.y += 0.0005

    // Animate corona
    if (coronaRef.current) {
      coronaRef.current.scale.setScalar(1 + Math.sin(time * 0.5) * 0.05)
    }
  })

  return (
    <group ref={sunRef}>
      {/* Interaction mesh */}
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          selectNode(folder)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setIsHovered(true)
          hoverNode(folder)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setIsHovered(false)
          hoverNode(null)
          document.body.style.cursor = 'default'
        }}
      >
        <sphereGeometry args={[starProps.size * 1.3, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Core sun sphere */}
      <Sphere args={[starProps.size, 64, 64]}>
        <meshBasicMaterial color={starProps.color} />
      </Sphere>

      {/* Inner corona glow */}
      <Sphere args={[starProps.size * 1.1, 32, 32]}>
        <meshBasicMaterial
          color={starProps.coronaColor}
          transparent
          opacity={0.4}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </Sphere>

      {/* Outer corona */}
      <Sphere ref={coronaRef} args={[starProps.size * 1.3, 32, 32]}>
        <meshBasicMaterial
          color={starProps.coronaColor}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </Sphere>

      {/* Distant glow */}
      <Sphere args={[starProps.size * 2, 32, 32]}>
        <meshBasicMaterial
          color={starProps.color}
          transparent
          opacity={0.05}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </Sphere>

      {/* Sun light */}
      <pointLight
        color={starProps.color}
        intensity={starProps.intensity}
        distance={starProps.size * 25}
        decay={2}
      />

      {/* Label */}
      <Html
        position={[0, starProps.size * 1.5, 0]}
        center
        distanceFactor={200}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            background: isHovered ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.5)',
            color: `#${starProps.color.getHexString()}`,
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '13px',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            border: `1px solid #${starProps.color.getHexString()}44`,
            textShadow: `0 0 10px #${starProps.color.getHexString()}`,
          }}
        >
          {folder.name}/
        </div>
      </Html>
    </group>
  )
}

// Planet (file) component - orbits around the sun
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

  // Planet size based on file size
  const baseSize = 15 + Math.log10(Math.max(file.size, 100)) * 8

  useFrame((state) => {
    if (!planetRef.current) return
    const time = state.clock.elapsedTime

    // Orbit around sun
    const angle = startAngle + time * orbitSpeed
    planetRef.current.position.x = Math.cos(angle) * orbitRadius
    planetRef.current.position.z = Math.sin(angle) * orbitRadius
    planetRef.current.position.y = Math.sin(angle * 0.5) * orbitRadius * 0.05
  })

  return (
    <group ref={planetRef}>
      {/* Interaction mesh */}
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

      {/* Procedural planet */}
      <ProceduralPlanet
        size={baseSize}
        color={color}
        extension={file.extension}
        rotationSpeed={0.005}
      />

      {/* Selection indicator */}
      {(isSelected || hovered) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[baseSize * 2, baseSize * 2.3, 64]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Label - only show on hover */}
      {hovered && (
        <Html
          position={[0, baseSize * 1.5 + 5, 0]}
          center
          distanceFactor={120}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.85)',
              color: `#${color.getHexString()}`,
              padding: '3px 8px',
              borderRadius: '3px',
              fontSize: '11px',
              fontFamily: 'monospace',
              whiteSpace: 'nowrap',
              border: `1px solid #${color.getHexString()}44`,
            }}
          >
            {file.name}
          </div>
        </Html>
      )}
    </group>
  )
}

// Orbit ring visualization
function OrbitRing({ radius, color }: { radius: number; color: THREE.Color }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.5, radius + 0.5, 128]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.08}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// Count total descendants
function countDescendants(folder: FolderNode): number {
  let count = folder.children.length
  for (const child of folder.children) {
    if (child.type === 'folder') {
      count += countDescendants(child)
    }
  }
  return count
}

export default function SolarSystem({ folder, position, depth, totalChildren }: SolarSystemProps) {
  const starProps = useMemo(
    () => getStarProperties(depth, folder.children.length, totalChildren),
    [depth, folder.children.length, totalChildren]
  )

  // Calculate orbit parameters for file children only
  const orbits = useMemo(() => {
    const files = folder.children.filter((c): c is FileNode => c.type === 'file')
    const sunSize = starProps.size

    return files.map((file, index) => {
      const orbitRadius = sunSize * 2.5 + (index + 1) * 100
      const orbitSpeed = 0.02 / (index + 1)
      const startAngle = (index / Math.max(files.length, 1)) * Math.PI * 2 + (index * 0.3)

      return { file, orbitRadius, orbitSpeed, startAngle }
    })
  }, [folder.children, starProps.size])

  return (
    <group position={position}>
      {/* The sun (folder) */}
      <Sun folder={folder} depth={depth} totalChildren={totalChildren} />

      {/* Orbit rings */}
      {orbits.map(({ orbitRadius }, i) => (
        <OrbitRing key={`orbit-${i}`} radius={orbitRadius} color={starProps.color} />
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
    </group>
  )
}

export { countDescendants }
