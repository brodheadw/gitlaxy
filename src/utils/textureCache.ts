import * as THREE from 'three'

/**
 * Cache entry for storing texture data and metadata
 */
interface TextureCacheEntry {
  texture: THREE.CanvasTexture
  lastAccessed: number
  refCount: number
}

/**
 * Texture cache for procedurally generated planet and cloud textures
 * Prevents redundant texture generation by caching based on seed + type
 */
class TextureCache {
  private planetCache = new Map<string, TextureCacheEntry>()
  private cloudCache = new Map<string, TextureCacheEntry>()
  private ringCache = new Map<string, TextureCacheEntry>()

  // Cache size limits to prevent unbounded memory growth
  private readonly MAX_PLANET_CACHE_SIZE = 100
  private readonly MAX_CLOUD_CACHE_SIZE = 100
  private readonly MAX_RING_CACHE_SIZE = 50

  /**
   * Generate a cache key from planet parameters
   */
  private getPlanetKey(planetType: number, seed: number): string {
    return `${planetType}-${seed}`
  }

  /**
   * Generate a cache key for cloud textures
   */
  private getCloudKey(seed: number): string {
    return `cloud-${seed}`
  }

  /**
   * Generate a cache key for ring textures
   */
  private getRingKey(seed: number): string {
    return `ring-${seed}`
  }

  /**
   * Evict least recently used entry from cache when size limit is reached
   */
  private evictLRU(cache: Map<string, TextureCacheEntry>, maxSize: number): void {
    if (cache.size < maxSize) return

    let oldestKey: string | null = null
    let oldestTime = Infinity

    cache.forEach((entry, key) => {
      if (entry.refCount === 0 && entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    })

    if (oldestKey) {
      const entry = cache.get(oldestKey)
      if (entry) {
        entry.texture.dispose()
        cache.delete(oldestKey)
      }
    }
  }

  /**
   * Get or create a planet texture from cache
   */
  getPlanetTexture(
    planetType: number,
    seed: number,
    createFn: () => THREE.CanvasTexture
  ): THREE.CanvasTexture {
    const key = this.getPlanetKey(planetType, seed)
    let entry = this.planetCache.get(key)

    if (!entry) {
      // Evict LRU if cache is full
      this.evictLRU(this.planetCache, this.MAX_PLANET_CACHE_SIZE)

      // Create new texture
      const texture = createFn()
      entry = {
        texture,
        lastAccessed: Date.now(),
        refCount: 0
      }
      this.planetCache.set(key, entry)
    }

    // Update access time and increment reference count
    entry.lastAccessed = Date.now()
    entry.refCount++

    // Return a reference to the cached texture (not a clone to save memory)
    return entry.texture
  }

  /**
   * Get or create a cloud texture from cache
   */
  getCloudTexture(
    seed: number,
    createFn: () => THREE.CanvasTexture
  ): THREE.CanvasTexture {
    const key = this.getCloudKey(seed)
    let entry = this.cloudCache.get(key)

    if (!entry) {
      // Evict LRU if cache is full
      this.evictLRU(this.cloudCache, this.MAX_CLOUD_CACHE_SIZE)

      // Create new texture
      const texture = createFn()
      entry = {
        texture,
        lastAccessed: Date.now(),
        refCount: 0
      }
      this.cloudCache.set(key, entry)
    }

    // Update access time and increment reference count
    entry.lastAccessed = Date.now()
    entry.refCount++

    return entry.texture
  }

  /**
   * Get or create a ring texture from cache
   */
  getRingTexture(
    seed: number,
    createFn: () => THREE.CanvasTexture
  ): THREE.CanvasTexture {
    const key = this.getRingKey(seed)
    let entry = this.ringCache.get(key)

    if (!entry) {
      // Evict LRU if cache is full
      this.evictLRU(this.ringCache, this.MAX_RING_CACHE_SIZE)

      // Create new texture
      const texture = createFn()
      entry = {
        texture,
        lastAccessed: Date.now(),
        refCount: 0
      }
      this.ringCache.set(key, entry)
    }

    // Update access time and increment reference count
    entry.lastAccessed = Date.now()
    entry.refCount++

    return entry.texture
  }

  /**
   * Release a reference to a planet texture
   * Should be called when a component unmounts
   */
  releasePlanetTexture(planetType: number, seed: number): void {
    const key = this.getPlanetKey(planetType, seed)
    const entry = this.planetCache.get(key)
    if (entry && entry.refCount > 0) {
      entry.refCount--
    }
  }

  /**
   * Release a reference to a cloud texture
   */
  releaseCloudTexture(seed: number): void {
    const key = this.getCloudKey(seed)
    const entry = this.cloudCache.get(key)
    if (entry && entry.refCount > 0) {
      entry.refCount--
    }
  }

  /**
   * Release a reference to a ring texture
   */
  releaseRingTexture(seed: number): void {
    const key = this.getRingKey(seed)
    const entry = this.ringCache.get(key)
    if (entry && entry.refCount > 0) {
      entry.refCount--
    }
  }

  /**
   * Clear all caches and dispose of all textures
   * Useful for cleanup or when switching projects
   */
  clearAll(): void {
    this.planetCache.forEach((entry) => {
      entry.texture.dispose()
    })
    this.cloudCache.forEach((entry) => {
      entry.texture.dispose()
    })
    this.ringCache.forEach((entry) => {
      entry.texture.dispose()
    })

    this.planetCache.clear()
    this.cloudCache.clear()
    this.ringCache.clear()
  }

  /**
   * Get cache statistics for debugging
   */
  getStats() {
    return {
      planets: {
        size: this.planetCache.size,
        totalRefs: Array.from(this.planetCache.values()).reduce((sum, e) => sum + e.refCount, 0)
      },
      clouds: {
        size: this.cloudCache.size,
        totalRefs: Array.from(this.cloudCache.values()).reduce((sum, e) => sum + e.refCount, 0)
      },
      rings: {
        size: this.ringCache.size,
        totalRefs: Array.from(this.ringCache.values()).reduce((sum, e) => sum + e.refCount, 0)
      }
    }
  }
}

// Export singleton instance
export const textureCache = new TextureCache()
