import { useEffect, useMemo } from 'react'
import { useStore } from '../store'
import type { FolderNode } from '../types'
import SolarSystem, { countDescendants } from './SolarSystem'
import * as THREE from 'three'

interface SystemData {
  folder: FolderNode
  position: [number, number, number]
  depth: number
  totalChildren: number
  parentPath: string | null
}

// Layout all folders in a galaxy formation
function layoutAllSystems(root: FolderNode): SystemData[] {
  const systems: SystemData[] = []

  // Much larger spacing for the expanded galaxy
  const BASE_SPACING = 3000
  const DEPTH_SPACING = 2000

  function collectFolders(
    node: FolderNode,
    depth: number,
    parentAngle: number,
    parentRadius: number,
    _parentPath: string | null
  ) {
    const childFolders = node.children.filter((c): c is FolderNode => c.type === 'folder')
    const numSiblings = childFolders.length

    childFolders.forEach((child, index) => {
      // Spiral arm positioning with more spread
      const armAngle = parentAngle + (index / Math.max(numSiblings, 1)) * Math.PI * 2
      const spiralOffset = depth * 0.4

      const radius = parentRadius + BASE_SPACING + depth * DEPTH_SPACING
      const angle = armAngle + spiralOffset

      // Much more dramatic vertical spread - full 3D distribution
      // Use a combination of factors to create varied heights
      const baseVertical = 3000 + depth * 1500
      const indexVariation = Math.sin(index * 2.7 + depth * 1.3) + Math.cos(index * 1.9)
      const depthVariation = Math.cos(depth * 0.8 + index * 0.5)
      const y = indexVariation * baseVertical * 0.5 + depthVariation * baseVertical * 0.3

      const x = Math.cos(angle) * radius + (Math.sin(index * 2.1) * 0.3 - 0.15) * 800
      const z = Math.sin(angle) * radius + (Math.cos(index * 1.7) * 0.3 - 0.15) * 800

      const totalChildren = countDescendants(child)

      systems.push({
        folder: child,
        position: [x, y, z],
        depth,
        totalChildren,
        parentPath: node.path,
      })

      // Recursively add nested folders
      collectFolders(child, depth + 1, angle, radius, child.path)
    })
  }

  // Start from root's children (depth 0 = top-level folders like src, public, etc.)
  collectFolders(root, 0, 0, 0, root.path)

  return systems
}

// Leyline connection between parent and child folders
function Leyline({ start, end, parentDepth }: {
  start: [number, number, number]
  end: [number, number, number]
  parentDepth: number
}) {
  const points = useMemo(() => {
    const startVec = new THREE.Vector3(...start)
    const endVec = new THREE.Vector3(...end)

    // Create a slight curve for the leyline
    const mid = new THREE.Vector3().lerpVectors(startVec, endVec, 0.5)
    mid.y += (endVec.distanceTo(startVec) * 0.05) // Slight arc

    const curve = new THREE.QuadraticBezierCurve3(startVec, mid, endVec)
    return curve.getPoints(50)
  }, [start, end])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    return geo
  }, [points])

  // Color based on parent depth - bluer for higher level connections
  const color = useMemo(() => {
    if (parentDepth === 0) return new THREE.Color('#6699ff') // Blue for top-level
    if (parentDepth === 1) return new THREE.Color('#8899dd') // Blue-gray
    return new THREE.Color('#667788') // Gray for deeper
  }, [parentDepth])

  const line = useMemo(() => {
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.15,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return new THREE.Line(geometry, material)
  }, [geometry, color])

  return <primitive object={line} />
}

export default function Galaxy() {
  const { rootNode, loadRepo } = useStore()

  // Load repo on mount
  useEffect(() => {
    loadRepo()
  }, [loadRepo])

  // Calculate all solar system positions
  const systems = useMemo(() => {
    if (!rootNode) return []
    return layoutAllSystems(rootNode)
  }, [rootNode])

  // Create position lookup for leylines
  const positionMap = useMemo(() => {
    const map = new Map<string, [number, number, number]>()
    // Root is at center
    map.set('/', [0, 0, 0])
    for (const sys of systems) {
      map.set(sys.folder.path, sys.position)
    }
    return map
  }, [systems])

  // Generate leyline connections
  const leylines = useMemo(() => {
    const lines: Array<{
      start: [number, number, number]
      end: [number, number, number]
      parentDepth: number
    }> = []

    for (const sys of systems) {
      if (sys.parentPath) {
        const parentPos = positionMap.get(sys.parentPath)
        if (parentPos) {
          lines.push({
            start: parentPos,
            end: sys.position,
            parentDepth: sys.depth,
          })
        }
      }
    }

    return lines
  }, [systems, positionMap])

  if (!rootNode) {
    return null
  }

  return (
    <group>
      {/* Leyline connections between folders */}
      {leylines.map((line, i) => (
        <Leyline key={`leyline-${i}`} {...line} />
      ))}

      {/* Render each folder as a solar system with its file planets */}
      {systems.map(({ folder, position, depth, totalChildren }) => (
        <SolarSystem
          key={folder.path}
          folder={folder}
          position={position}
          depth={depth}
          totalChildren={totalChildren}
        />
      ))}
    </group>
  )
}
