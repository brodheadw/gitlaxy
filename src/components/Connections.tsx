import { useMemo } from 'react'
import * as THREE from 'three'
import type { LayoutNode } from '../types'
import { getConnections } from '../utils/layout'

interface ConnectionsProps {
  layoutNodes: LayoutNode[]
}

export default function Connections({ layoutNodes }: ConnectionsProps) {
  const connections = useMemo(() => getConnections(layoutNodes), [layoutNodes])

  // Create static line geometry for all connections
  const geometry = useMemo(() => {
    const positions: number[] = []

    for (const { from, to } of connections) {
      // Simple straight line from parent to child
      positions.push(from.x, from.y, from.z)
      positions.push(to.x, to.y, to.z)
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geo
  }, [connections])

  if (connections.length === 0) return null

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        color="#4ecdc4"
        transparent
        opacity={0.15}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  )
}
