import * as THREE from 'three'

/**
 * Octree spatial partitioning for efficient collision detection
 * Reduces O(N²) collision checks to O(N log N) or better
 */

export interface OctreeObject {
  position: THREE.Vector3
  radius: number
  id: string | number
  data?: any
}

class OctreeNode {
  bounds: THREE.Box3
  objects: OctreeObject[] = []
  children: OctreeNode[] | null = null
  maxObjects: number
  maxDepth: number
  depth: number

  constructor(bounds: THREE.Box3, maxObjects = 8, maxDepth = 8, depth = 0) {
    this.bounds = bounds
    this.maxObjects = maxObjects
    this.maxDepth = maxDepth
    this.depth = depth
  }

  // Split node into 8 octants
  split() {
    if (this.children) return

    const { min, max } = this.bounds
    const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5)

    this.children = []

    // Create 8 child nodes
    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        for (let z = 0; z < 2; z++) {
          const childMin = new THREE.Vector3(
            x === 0 ? min.x : center.x,
            y === 0 ? min.y : center.y,
            z === 0 ? min.z : center.z
          )
          const childMax = new THREE.Vector3(
            x === 0 ? center.x : max.x,
            y === 0 ? center.y : max.y,
            z === 0 ? center.z : max.z
          )

          const childBounds = new THREE.Box3(childMin, childMax)
          this.children.push(new OctreeNode(childBounds, this.maxObjects, this.maxDepth, this.depth + 1))
        }
      }
    }

    // Redistribute objects to children
    for (const obj of this.objects) {
      this.insertIntoChildren(obj)
    }
    this.objects = []
  }

  // Insert object into appropriate child nodes
  private insertIntoChildren(obj: OctreeObject) {
    if (!this.children) return false

    for (const child of this.children) {
      if (this.objectIntersectsBounds(obj, child.bounds)) {
        child.insert(obj)
      }
    }
    return true
  }

  // Check if object sphere intersects with bounds
  private objectIntersectsBounds(obj: OctreeObject, bounds: THREE.Box3): boolean {
    // Find closest point in bounds to sphere center
    const closestPoint = new THREE.Vector3(
      Math.max(bounds.min.x, Math.min(obj.position.x, bounds.max.x)),
      Math.max(bounds.min.y, Math.min(obj.position.y, bounds.max.y)),
      Math.max(bounds.min.z, Math.min(obj.position.z, bounds.max.z))
    )

    // Check if closest point is within sphere radius
    const distSq = closestPoint.distanceToSquared(obj.position)
    return distSq <= obj.radius * obj.radius
  }

  // Insert object into octree
  insert(obj: OctreeObject): boolean {
    if (!this.objectIntersectsBounds(obj, this.bounds)) {
      return false
    }

    // If we have children, insert into them
    if (this.children) {
      return this.insertIntoChildren(obj)
    }

    // Add to this node
    this.objects.push(obj)

    // Split if needed
    if (this.objects.length > this.maxObjects && this.depth < this.maxDepth) {
      this.split()
    }

    return true
  }

  // Query objects within radius of point
  queryRadius(point: THREE.Vector3, radius: number, result: OctreeObject[] = []): OctreeObject[] {
    // Check if search sphere intersects this node's bounds
    const searchObj: OctreeObject = { position: point, radius, id: -1 }
    if (!this.objectIntersectsBounds(searchObj, this.bounds)) {
      return result
    }

    // Check objects in this node
    const radiusSq = radius * radius
    for (const obj of this.objects) {
      const distSq = point.distanceToSquared(obj.position)
      if (distSq <= radiusSq + obj.radius * obj.radius) {
        result.push(obj)
      }
    }

    // Recursively check children
    if (this.children) {
      for (const child of this.children) {
        child.queryRadius(point, radius, result)
      }
    }

    return result
  }

  // Query objects within a bounding box
  queryBox(box: THREE.Box3, result: OctreeObject[] = []): OctreeObject[] {
    // Check if box intersects this node's bounds
    if (!this.bounds.intersectsBox(box)) {
      return result
    }

    // Check objects in this node
    for (const obj of this.objects) {
      // Simple sphere-box intersection
      const closestPoint = new THREE.Vector3(
        Math.max(box.min.x, Math.min(obj.position.x, box.max.x)),
        Math.max(box.min.y, Math.min(obj.position.y, box.max.y)),
        Math.max(box.min.z, Math.min(obj.position.z, box.max.z))
      )

      const distSq = closestPoint.distanceToSquared(obj.position)
      if (distSq <= obj.radius * obj.radius) {
        result.push(obj)
      }
    }

    // Recursively check children
    if (this.children) {
      for (const child of this.children) {
        child.queryBox(box, result)
      }
    }

    return result
  }

  // Clear all objects from tree
  clear() {
    this.objects = []
    if (this.children) {
      for (const child of this.children) {
        child.clear()
      }
      this.children = null
    }
  }
}

export class Octree {
  root: OctreeNode
  // Unused temp objects for potential future optimizations
  // private temp = {
  //   vector: new THREE.Vector3(),
  //   box: new THREE.Box3(),
  // }

  constructor(bounds: THREE.Box3, maxObjects = 8, maxDepth = 8) {
    this.root = new OctreeNode(bounds, maxObjects, maxDepth)
  }

  insert(obj: OctreeObject): boolean {
    return this.root.insert(obj)
  }

  insertAll(objects: OctreeObject[]) {
    for (const obj of objects) {
      this.insert(obj)
    }
  }

  queryRadius(point: THREE.Vector3, radius: number): OctreeObject[] {
    return this.root.queryRadius(point, radius, [])
  }

  queryBox(box: THREE.Box3): OctreeObject[] {
    return this.root.queryBox(box, [])
  }

  clear() {
    this.root.clear()
  }

  rebuild(objects: OctreeObject[]) {
    this.clear()
    this.insertAll(objects)
  }

  // Efficient collision detection between all objects
  detectCollisions(): Array<[OctreeObject, OctreeObject]> {
    const collisions: Array<[OctreeObject, OctreeObject]> = []
    const checked = new Set<string>()

    const checkNode = (node: OctreeNode) => {
      // Check collisions within this node
      for (let i = 0; i < node.objects.length; i++) {
        for (let j = i + 1; j < node.objects.length; j++) {
          const a = node.objects[i]
          const b = node.objects[j]

          const pairKey = `${Math.min(a.id as number, b.id as number)},${Math.max(a.id as number, b.id as number)}`
          if (checked.has(pairKey)) continue
          checked.add(pairKey)

          const minDist = a.radius + b.radius
          const distSq = a.position.distanceToSquared(b.position)

          if (distSq <= minDist * minDist) {
            collisions.push([a, b])
          }
        }
      }

      // Recursively check children
      if (node.children) {
        for (const child of node.children) {
          checkNode(child)
        }
      }
    }

    checkNode(this.root)
    return collisions
  }

  // Get statistics about the octree
  getStats(): { totalNodes: number; leafNodes: number; totalObjects: number; maxDepth: number } {
    let totalNodes = 0
    let leafNodes = 0
    let totalObjects = 0
    let maxDepth = 0

    const traverse = (node: OctreeNode) => {
      totalNodes++
      totalObjects += node.objects.length
      maxDepth = Math.max(maxDepth, node.depth)

      if (!node.children) {
        leafNodes++
      } else {
        for (const child of node.children) {
          traverse(child)
        }
      }
    }

    traverse(this.root)
    return { totalNodes, leafNodes, totalObjects, maxDepth }
  }
}

/**
 * Create an octree for the entire scene space
 */
export function createSceneOctree(sceneSize = 100000): Octree {
  const halfSize = sceneSize / 2
  const bounds = new THREE.Box3(
    new THREE.Vector3(-halfSize, -halfSize, -halfSize),
    new THREE.Vector3(halfSize, halfSize, halfSize)
  )
  return new Octree(bounds, 8, 8)
}
