import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere } from '@react-three/drei'
import * as THREE from 'three'
import type { FolderNode, FileNode } from '../types'
import { getColorForExtension } from '../types'
import { useStore } from '../store'
import ProceduralPlanet from './ProceduralPlanet'
import NodeLabel from './NodeLabel'
import { PERFORMANCE } from '../config/performance'
import { useNodeInteraction } from '../hooks/useNodeInteraction'
import { useFrameThrottle } from '../hooks/useFrameThrottle'

interface SolarSystemProps {
  folder: FolderNode
  position: [number, number, number]
  depth: number // How deep in the folder hierarchy (0 = top level)
  totalChildren: number // Total descendants for sizing
}

// Get star color and properties based on depth and size
function getStarProperties(depth: number, childCount: number, totalDescendants: number) {
  const cfg = PERFORMANCE.folders

  if (depth === 0 && totalDescendants > cfg.sizing.depth0Large.minDescendants) {
    return {
      color: new THREE.Color('#8bb4ff'),
      coronaColor: new THREE.Color('#aaccff'),
      size: cfg.sizing.depth0Large.base + Math.min(totalDescendants * cfg.sizing.depth0Large.multiplier, cfg.sizing.depth0Large.max),
      intensity: cfg.intensity.blueSupergiant,
    }
  } else if (depth === 0) {
    return {
      color: new THREE.Color('#b4c7ff'),
      coronaColor: new THREE.Color('#ccdeff'),
      size: cfg.sizing.depth0Small.base + Math.min(childCount * cfg.sizing.depth0Small.multiplier, cfg.sizing.depth0Small.max),
      intensity: cfg.intensity.blueWhite,
    }
  } else if (depth === 1 && childCount > cfg.sizing.depth1Large.minChildren) {
    return {
      color: new THREE.Color('#fff4e0'),
      coronaColor: new THREE.Color('#ffeecc'),
      size: cfg.sizing.depth1Large.base + Math.min(childCount * cfg.sizing.depth1Large.multiplier, cfg.sizing.depth1Large.max),
      intensity: cfg.intensity.yellowGiant,
    }
  } else if (depth === 1) {
    return {
      color: new THREE.Color('#ffee88'),
      coronaColor: new THREE.Color('#ffdd66'),
      size: cfg.sizing.depth1Small.base + Math.min(childCount * cfg.sizing.depth1Small.multiplier, cfg.sizing.depth1Small.max),
      intensity: cfg.intensity.yellowMain,
    }
  } else if (depth === 2) {
    return {
      color: new THREE.Color('#ffaa55'),
      coronaColor: new THREE.Color('#ff9944'),
      size: cfg.sizing.depth2.base + Math.min(childCount * cfg.sizing.depth2.multiplier, cfg.sizing.depth2.max),
      intensity: cfg.intensity.orangeDwarf,
    }
  } else {
    return {
      color: new THREE.Color('#ff6644'),
      coronaColor: new THREE.Color('#ff5533'),
      size: cfg.sizing.depthDeep.base + Math.min(childCount * cfg.sizing.depthDeep.multiplier, cfg.sizing.depthDeep.max),
      intensity: cfg.intensity.redDwarf,
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
  const { isHovered, handlers } = useNodeInteraction(folder)

  const starProps = useMemo(
    () => getStarProperties(depth, folder.children.length, totalChildren),
    [depth, folder.children.length, totalChildren]
  )

  useFrame((state) => {
    if (!sunRef.current) return
    if (!PERFORMANCE.toggles.folderAnimation) return
    const time = state.clock.elapsedTime
    const cfg = PERFORMANCE.folders

    // Slow rotation
    sunRef.current.rotation.y += cfg.animation.rotateSpeed

    // Animate corona
    if (coronaRef.current) {
      coronaRef.current.scale.setScalar(1 + Math.sin(time * cfg.animation.coronaPulse) * cfg.animation.coronaAmount)
    }
  })

  return (
    <group ref={sunRef}>
      {/* Interaction mesh */}
      <mesh
        onClick={handlers.onClick}
        onPointerOver={handlers.onPointerOver}
        onPointerOut={handlers.onPointerOut}
      >
        <sphereGeometry args={[starProps.size * PERFORMANCE.folders.scale.interaction, PERFORMANCE.folders.geometry.interactionDetail, PERFORMANCE.folders.geometry.interactionDetail]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Core sun sphere */}
      <Sphere args={[starProps.size, PERFORMANCE.folders.geometry.coreDetail, PERFORMANCE.folders.geometry.coreDetail]}>
        <meshBasicMaterial color={starProps.color} />
      </Sphere>

      {/* Inner corona glow */}
      <Sphere args={[starProps.size * PERFORMANCE.folders.scale.coronaInner, PERFORMANCE.folders.geometry.coronaInner, PERFORMANCE.folders.geometry.coronaInner]}>
        <meshBasicMaterial
          color={starProps.coronaColor}
          transparent
          opacity={PERFORMANCE.folders.visual.coronaInnerOpacity}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </Sphere>

      {/* Outer corona */}
      <Sphere ref={coronaRef} args={[starProps.size * PERFORMANCE.folders.scale.coronaOuter, PERFORMANCE.folders.geometry.coronaOuter, PERFORMANCE.folders.geometry.coronaOuter]}>
        <meshBasicMaterial
          color={starProps.coronaColor}
          transparent
          opacity={PERFORMANCE.folders.visual.coronaOuterOpacity}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </Sphere>

      {/* Distant glow */}
      <Sphere args={[starProps.size * PERFORMANCE.folders.scale.glow, PERFORMANCE.folders.geometry.glowDetail, PERFORMANCE.folders.geometry.glowDetail]}>
        <meshBasicMaterial
          color={starProps.color}
          transparent
          opacity={PERFORMANCE.folders.visual.glowOpacity}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </Sphere>

      {/* Sun light */}
      <pointLight
        color={starProps.color}
        intensity={starProps.intensity}
        distance={starProps.size * PERFORMANCE.lighting.folderDistance}
        decay={PERFORMANCE.lighting.folderDecay}
      />

      {/* Label */}
      <NodeLabel
        position={[0, starProps.size * PERFORMANCE.folders.scale.labelOffset, 0]}
        distanceFactor={PERFORMANCE.folders.ui.labelDistance}
        color={starProps.color}
        label={`${folder.name}/`}
        isHovered={isHovered}
        variant="sun"
      />
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
  const throttle = useFrameThrottle(PERFORMANCE.updates.orbitInterval)
  const { isHovered, handlers } = useNodeInteraction(file)
  const { selectedNode } = useStore()

  const color = useMemo(() => new THREE.Color(getColorForExtension(file.extension)), [file.extension])
  const isSelected = selectedNode?.id === file.id

  // Planet size based on file size
  const cfg = PERFORMANCE.files
  const baseSize = cfg.sizing.baseSize + Math.log10(Math.max(file.size, cfg.sizing.minFileSize)) * cfg.sizing.sizeMultiplier

  useFrame((state) => {
    if (!planetRef.current) return
    if (!throttle.shouldUpdate()) return
    const time = PERFORMANCE.toggles.orbitAnimation ? state.clock.elapsedTime : 0

    // Orbit around sun (freeze when orbit animation toggle is off)
    const angle = startAngle + (PERFORMANCE.toggles.orbitAnimation ? time * orbitSpeed * PERFORMANCE.files.animation.orbitUpdate : 0)
    planetRef.current.position.x = Math.cos(angle) * orbitRadius
    planetRef.current.position.z = Math.sin(angle) * orbitRadius
    planetRef.current.position.y = PERFORMANCE.toggles.orbitAnimation
      ? Math.sin(angle * cfg.animation.wobbleSpeed) * orbitRadius * cfg.animation.wobbleFactor
      : 0
  })

  return (
    <group ref={planetRef}>
      {/* Interaction mesh */}
      <mesh
        onClick={handlers.onClick}
        onPointerOver={handlers.onPointerOver}
        onPointerOut={handlers.onPointerOut}
      >
        <sphereGeometry args={[baseSize * cfg.visual.interactionScale, cfg.geometry.interactionDetail, cfg.geometry.interactionDetail]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Procedural planet */}
      <ProceduralPlanet
        size={baseSize}
        color={color}
        extension={file.extension}
        rotationSpeed={cfg.animation.rotationSpeed}
      />

      {/* Selection indicator */}
      {(isSelected || isHovered) && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[baseSize * cfg.selectionRing.innerScale, baseSize * cfg.selectionRing.outerScale, cfg.geometry.selectionRingDetail]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={cfg.selectionRing.opacity}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Label - only show on hover */}
      {isHovered && (
        <NodeLabel
          position={[0, baseSize * cfg.visual.labelOffset + cfg.visual.labelExtraOffset, 0]}
          distanceFactor={cfg.ui.labelDistance}
          color={color}
          label={file.name}
          isHovered={isHovered}
          variant="planet"
        />
      )}
    </group>
  )
}

// Orbit ring visualization
function OrbitRing({ radius, color }: { radius: number; color: THREE.Color }) {
  const cfg = PERFORMANCE.orbitRings
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - cfg.thickness / 2, radius + cfg.thickness / 2, cfg.detail]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={cfg.opacity}
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
    const cfg = PERFORMANCE.files.orbit

    return files.map((file, index) => {
      const orbitRadius = sunSize * cfg.radiusBase + (index + 1) * cfg.radiusSpacing
      const orbitSpeed = cfg.speedBase / (index + 1)
      const startAngle = (index / Math.max(files.length, 1)) * Math.PI * 2 + (index * cfg.angleSpacing)

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
