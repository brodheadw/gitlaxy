import * as THREE from 'three'

/**
 * Object Pool for reducing garbage collection pressure
 * Reuses objects instead of creating new ones every frame
 */

class Vector3Pool {
  private pool: THREE.Vector3[] = []
  private allocated = 0

  constructor(initialSize = 50) {
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(new THREE.Vector3())
    }
  }

  get(): THREE.Vector3 {
    if (this.allocated >= this.pool.length) {
      this.pool.push(new THREE.Vector3())
    }
    return this.pool[this.allocated++]
  }

  reset() {
    this.allocated = 0
  }

  getSize() {
    return { allocated: this.allocated, total: this.pool.length }
  }
}

class QuaternionPool {
  private pool: THREE.Quaternion[] = []
  private allocated = 0

  constructor(initialSize = 20) {
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(new THREE.Quaternion())
    }
  }

  get(): THREE.Quaternion {
    if (this.allocated >= this.pool.length) {
      this.pool.push(new THREE.Quaternion())
    }
    return this.pool[this.allocated++]
  }

  reset() {
    this.allocated = 0
  }

  getSize() {
    return { allocated: this.allocated, total: this.pool.length }
  }
}

class EulerPool {
  private pool: THREE.Euler[] = []
  private allocated = 0

  constructor(initialSize = 20) {
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(new THREE.Euler())
    }
  }

  get(): THREE.Euler {
    if (this.allocated >= this.pool.length) {
      this.pool.push(new THREE.Euler())
    }
    return this.pool[this.allocated++]
  }

  reset() {
    this.allocated = 0
  }

  getSize() {
    return { allocated: this.allocated, total: this.pool.length }
  }
}

class Matrix4Pool {
  private pool: THREE.Matrix4[] = []
  private allocated = 0

  constructor(initialSize = 10) {
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(new THREE.Matrix4())
    }
  }

  get(): THREE.Matrix4 {
    if (this.allocated >= this.pool.length) {
      this.pool.push(new THREE.Matrix4())
    }
    return this.pool[this.allocated++]
  }

  reset() {
    this.allocated = 0
  }

  getSize() {
    return { allocated: this.allocated, total: this.pool.length }
  }
}

// Global singleton pools
export const vector3Pool = new Vector3Pool(100)
export const quaternionPool = new QuaternionPool(30)
export const eulerPool = new EulerPool(30)
export const matrix4Pool = new Matrix4Pool(20)

/**
 * Reset all pools - call this at the end of each frame
 * This marks all pooled objects as available for reuse
 */
export function resetAllPools() {
  vector3Pool.reset()
  quaternionPool.reset()
  eulerPool.reset()
  matrix4Pool.reset()
}

/**
 * Get pool statistics for debugging
 */
export function getPoolStats() {
  return {
    vector3: vector3Pool.getSize(),
    quaternion: quaternionPool.getSize(),
    euler: eulerPool.getSize(),
    matrix4: matrix4Pool.getSize(),
  }
}

/**
 * Convenience functions for common operations
 */

// Distance squared between two Vector3 (avoids expensive sqrt)
export function distanceSquared(a: THREE.Vector3, b: THREE.Vector3): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return dx * dx + dy * dy + dz * dz
}

// Check if distance is less than threshold (uses distSq to avoid sqrt)
export function isWithinDistance(a: THREE.Vector3, b: THREE.Vector3, distance: number): boolean {
  const distSq = distance * distance
  return distanceSquared(a, b) < distSq
}

// Length squared of a vector (avoids expensive sqrt)
export function lengthSquared(v: THREE.Vector3): number {
  return v.x * v.x + v.y * v.y + v.z * v.z
}
