// Force-directed 3D layout algorithm for repository visualization
import type { RepoNode, FolderNode, LayoutNode } from '../types'
import { flattenTree, getPathDepth, getParentPath } from './gitParser'

interface ForceLayoutOptions {
  // Force parameters
  repulsionStrength: number
  attractionStrength: number
  centeringForce: number
  damping: number

  // Layout parameters
  initialSpread: number
  layerSpacing: number
  maxIterations: number
}

const DEFAULT_OPTIONS: ForceLayoutOptions = {
  repulsionStrength: 15000,    // Much stronger repulsion
  attractionStrength: 0.015,   // Gentler attraction
  centeringForce: 0.002,       // Weak centering
  damping: 0.8,
  initialSpread: 200,          // MUCH larger spread for celestial distances
  layerSpacing: 100,           // MUCH larger layer spacing
  maxIterations: 250,
}

// Initialize layout nodes from repo tree
export function initializeLayoutNodes(root: FolderNode): LayoutNode[] {
  const allNodes = flattenTree(root)
  const layoutNodes: LayoutNode[] = []

  // Group nodes by parent for initial positioning
  const parentGroups = new Map<string, RepoNode[]>()

  for (const node of allNodes) {
    const parentPath = getParentPath(node.path)
    if (!parentGroups.has(parentPath)) {
      parentGroups.set(parentPath, [])
    }
    parentGroups.get(parentPath)!.push(node)
  }

  // Position nodes in a hierarchical spiral galaxy pattern
  for (const node of allNodes) {
    const depth = getPathDepth(node.path)
    const parentPath = getParentPath(node.path)
    const siblings = parentGroups.get(parentPath) || []
    const siblingIndex = siblings.indexOf(node)
    const siblingCount = siblings.length

    // Galaxy spiral arm positioning
    const armAngle = (siblingIndex / Math.max(siblingCount, 1)) * Math.PI * 2
    const spiralOffset = depth * 0.3 // spiral out as depth increases

    // Base radius increases with depth - celestial distances
    const baseRadius = DEFAULT_OPTIONS.initialSpread * (depth + 0.3)

    // Add spiral arm effect
    const spiralRadius = baseRadius + spiralOffset * 50

    // More spread out spherical positioning
    const phi = armAngle + spiralOffset
    const theta = Math.PI / 2.5 + (depth / 8) * Math.PI / 3

    // Calculate position with larger jitter for natural look
    const jitter = 60
    const x = spiralRadius * Math.sin(theta) * Math.cos(phi) + (Math.random() - 0.5) * jitter
    const y = depth * DEFAULT_OPTIONS.layerSpacing + (Math.random() - 0.5) * jitter * 0.3
    const z = spiralRadius * Math.sin(theta) * Math.sin(phi) + (Math.random() - 0.5) * jitter

    // Root node gets special parentId handling
    const effectiveParentId = node.path === '/' ? undefined : (parentPath === '/' ? '/' : parentPath)

    layoutNodes.push({
      id: node.id,
      x,
      y,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      node,
      parentId: effectiveParentId,
    })
  }

  return layoutNodes
}

// Calculate repulsion force between two nodes
function calculateRepulsion(
  node1: LayoutNode,
  node2: LayoutNode,
  strength: number
): { fx: number; fy: number; fz: number } {
  const dx = node1.x - node2.x
  const dy = node1.y - node2.y
  const dz = node1.z - node2.z

  const distSq = dx * dx + dy * dy + dz * dz
  const dist = Math.sqrt(distSq) || 1

  // Inverse square repulsion with larger minimum distance
  const minDist = 50
  const effectiveDist = Math.max(dist, minDist)
  const force = strength / (effectiveDist * effectiveDist)

  return {
    fx: (dx / dist) * force,
    fy: (dy / dist) * force,
    fz: (dz / dist) * force,
  }
}

// Calculate attraction force to parent with ideal distance
function calculateAttraction(
  child: LayoutNode,
  parent: LayoutNode,
  strength: number,
  idealDistance: number = 150
): { fx: number; fy: number; fz: number } {
  const dx = parent.x - child.x
  const dy = parent.y - child.y
  const dz = parent.z - child.z

  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1

  // Spring force that tries to maintain ideal distance
  const displacement = dist - idealDistance
  const force = displacement * strength

  return {
    fx: (dx / dist) * force,
    fy: (dy / dist) * force,
    fz: (dz / dist) * force,
  }
}

// Run force simulation
export function runForceSimulation(
  nodes: LayoutNode[],
  options: Partial<ForceLayoutOptions> = {}
): LayoutNode[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Clone nodes for simulation
  let currentNodes = nodes.map((n) => ({ ...n }))

  for (let iteration = 0; iteration < opts.maxIterations; iteration++) {
    // Apply forces
    for (let i = 0; i < currentNodes.length; i++) {
      const node = currentNodes[i]
      let fx = 0, fy = 0, fz = 0

      // Repulsion from all other nodes
      for (let j = 0; j < currentNodes.length; j++) {
        if (i !== j) {
          const repulsion = calculateRepulsion(node, currentNodes[j], opts.repulsionStrength)
          fx += repulsion.fx
          fy += repulsion.fy
          fz += repulsion.fz
        }
      }

      // Attraction to parent with ideal distance
      if (node.parentId) {
        const parent = currentNodes.find((n) => n.id === node.parentId)
        if (parent) {
          // Folders want more distance, files can be closer
          const idealDist = node.node.type === 'folder' ? 180 : 120
          const attraction = calculateAttraction(node, parent, opts.attractionStrength, idealDist)
          fx += attraction.fx
          fy += attraction.fy
          fz += attraction.fz
        }
      }

      // Weak centering force on X and Z only
      fx -= node.x * opts.centeringForce
      fz -= node.z * opts.centeringForce

      // Update velocity with damping
      node.vx = (node.vx + fx) * opts.damping
      node.vy = (node.vy + fy) * opts.damping
      node.vz = (node.vz + fz) * opts.damping
    }

    // Update positions
    for (const node of currentNodes) {
      node.x += node.vx
      node.y += node.vy
      node.z += node.vz
    }

    // Check for convergence
    const totalVelocity = currentNodes.reduce(
      (sum, n) => sum + Math.abs(n.vx) + Math.abs(n.vy) + Math.abs(n.vz),
      0
    )
    if (totalVelocity < 1) break
  }

  return currentNodes
}

// Get connections for rendering lines between parents and children
export function getConnections(nodes: LayoutNode[]): Array<{ from: LayoutNode; to: LayoutNode }> {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const connections: Array<{ from: LayoutNode; to: LayoutNode }> = []

  for (const node of nodes) {
    if (node.parentId) {
      const parent = nodeMap.get(node.parentId)
      if (parent) {
        connections.push({ from: parent, to: node })
      }
    }
  }

  return connections
}

// Calculate bounding box of all nodes
export function getBoundingBox(nodes: LayoutNode[]): {
  min: { x: number; y: number; z: number }
  max: { x: number; y: number; z: number }
  center: { x: number; y: number; z: number }
} {
  if (nodes.length === 0) {
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 },
      center: { x: 0, y: 0, z: 0 },
    }
  }

  const min = { x: Infinity, y: Infinity, z: Infinity }
  const max = { x: -Infinity, y: -Infinity, z: -Infinity }

  for (const node of nodes) {
    min.x = Math.min(min.x, node.x)
    min.y = Math.min(min.y, node.y)
    min.z = Math.min(min.z, node.z)
    max.x = Math.max(max.x, node.x)
    max.y = Math.max(max.y, node.y)
    max.z = Math.max(max.z, node.z)
  }

  return {
    min,
    max,
    center: {
      x: (min.x + max.x) / 2,
      y: (min.y + max.y) / 2,
      z: (min.z + max.z) / 2,
    },
  }
}
