import { useEffect, useMemo } from 'react'
import { useStore } from '../store'
import type { FolderNode } from '../types'
import SolarSystem from './SolarSystem'
import Connections from './Connections'

// Layout folders (solar systems) in a galaxy formation
function layoutSolarSystems(root: FolderNode): Array<{ folder: FolderNode; position: [number, number, number] }> {
  const systems: Array<{ folder: FolderNode; position: [number, number, number] }> = []

  // Recursive function to collect all folders
  function collectFolders(node: FolderNode, depth: number, parentAngle: number, parentRadius: number) {
    // Calculate position using galaxy spiral arm pattern
    const numSiblings = node.children.filter(c => c.type === 'folder').length
    const childFolders = node.children.filter((c): c is FolderNode => c.type === 'folder')

    // MASSIVE scale - thousands of units between solar systems
    const baseSpacing = 2000 // Base distance between systems
    const depthMultiplier = 1500 // Additional distance per depth level

    childFolders.forEach((child, index) => {
      // Spiral arm positioning
      const armAngle = parentAngle + (index / Math.max(numSiblings, 1)) * Math.PI * 2
      const spiralOffset = depth * 0.3

      const radius = parentRadius + baseSpacing + depth * depthMultiplier
      const angle = armAngle + spiralOffset

      // Add some vertical variation for 3D feel
      const verticalSpread = 500
      const y = (Math.random() - 0.5) * verticalSpread + depth * 200

      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 300
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 300

      systems.push({
        folder: child,
        position: [x, y, z],
      })

      // Recursively add subfolders
      collectFolders(child, depth + 1, angle, radius)
    })
  }

  // Start with root at center
  systems.push({
    folder: root,
    position: [0, 0, 0],
  })

  // Collect all nested folders
  collectFolders(root, 1, 0, 0)

  return systems
}

// Create layout nodes for connections (simplified version)
function createConnectionNodes(systems: Array<{ folder: FolderNode; position: [number, number, number] }>) {
  const nodes: Array<{
    id: string
    x: number
    y: number
    z: number
    parentId?: string
    node: { type: string; path: string }
  }> = []

  // Create a map of folder paths to positions
  const positionMap = new Map<string, [number, number, number]>()
  for (const { folder, position } of systems) {
    positionMap.set(folder.path, position)
  }

  // Create nodes with parent references
  for (const { folder, position } of systems) {
    const parentPath = folder.path.split('/').slice(0, -1).join('/') || '/'

    nodes.push({
      id: folder.path,
      x: position[0],
      y: position[1],
      z: position[2],
      parentId: folder.path !== '/' ? parentPath : undefined,
      node: { type: 'folder', path: folder.path },
    })
  }

  return nodes
}

export default function Galaxy() {
  const { rootNode, layoutNodes, setLayoutNodes, loadRepo, viewLevel, currentSystem } = useStore()

  // Load repo on mount
  useEffect(() => {
    loadRepo()
  }, [loadRepo])

  // Calculate solar system positions
  const solarSystems = useMemo(() => {
    if (!rootNode) return []
    return layoutSolarSystems(rootNode)
  }, [rootNode])

  // Create layout nodes for connections
  useEffect(() => {
    if (solarSystems.length === 0) return
    const nodes = createConnectionNodes(solarSystems)
    setLayoutNodes(nodes as any)
  }, [solarSystems, setLayoutNodes])

  if (!rootNode) {
    return null
  }

  // When viewing a specific system, show only that system's contents in detail
  if (viewLevel === 'system' && currentSystem) {
    const systemData = solarSystems.find(s => s.folder.path === currentSystem.path)
    if (systemData) {
      return (
        <group>
          <SolarSystem
            folder={systemData.folder}
            position={[0, 0, 0]} // Center the current system
            isCurrentSystem={true}
          />
        </group>
      )
    }
  }

  // Galaxy view - show all solar systems
  return (
    <group>
      {/* Connection lines between solar systems */}
      <Connections layoutNodes={layoutNodes} />

      {/* Render each folder as a solar system */}
      {solarSystems.map(({ folder, position }) => (
        <SolarSystem
          key={folder.path}
          folder={folder}
          position={position}
          isCurrentSystem={false}
        />
      ))}
    </group>
  )
}
