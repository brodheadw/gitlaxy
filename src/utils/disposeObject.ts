import * as THREE from 'three'

/**
 * Recursive Garbage Collection for Three.js Objects
 *
 * Three.js in a long-running editor tab will cause VRAM exhaustion because
 * removing meshes from the scene does NOT free GPU memory automatically.
 *
 * This utility provides comprehensive disposal of Three.js objects by:
 * 1. Traversing every child of the object being destroyed
 * 2. Identifying geometry, material, and texture properties
 * 3. Explicitly calling .dispose() on each resource type
 * 4. Nullifying references to allow JS Garbage Collection to reclaim CPU memory
 */

/**
 * Dispose of a material and all its textures
 */
function disposeMaterial(material: THREE.Material): void {
  // Dispose all textures in the material
  Object.keys(material).forEach((key) => {
    const value = (material as any)[key]
    if (value && typeof value === 'object' && 'isTexture' in value) {
      value.dispose()
    }
  })

  // Dispose the material itself
  material.dispose()
}

/**
 * Dispose of geometry
 */
function disposeGeometry(geometry: THREE.BufferGeometry): void {
  geometry.dispose()
}

/**
 * Recursively dispose of a Three.js object and all its children
 *
 * This function:
 * - Traverses the entire object hierarchy
 * - Disposes geometries, materials (including textures), and skeletons
 * - Removes all children
 * - Clears parent references
 *
 * @param object - The Three.js object to dispose
 * @param disposeGeometry - Whether to dispose geometries (default: true)
 * @param disposeMaterials - Whether to dispose materials (default: true)
 */
export function disposeObject(
  object: THREE.Object3D,
  options: {
    disposeGeometry?: boolean
    disposeMaterials?: boolean
    removeFromParent?: boolean
  } = {}
): void {
  const {
    disposeGeometry: shouldDisposeGeometry = true,
    disposeMaterials: shouldDisposeMaterials = true,
    removeFromParent = true,
  } = options

  if (!object) return

  // Traverse all children first (depth-first)
  const children = [...object.children]
  children.forEach((child) => {
    disposeObject(child, {
      disposeGeometry: shouldDisposeGeometry,
      disposeMaterials: shouldDisposeMaterials,
      removeFromParent: false, // We'll handle removal manually
    })
  })

  // Dispose of the object's resources
  if ('geometry' in object && shouldDisposeGeometry) {
    const mesh = object as THREE.Mesh
    if (mesh.geometry) {
      disposeGeometry(mesh.geometry)
    }
  }

  if ('material' in object && shouldDisposeMaterials) {
    const mesh = object as THREE.Mesh
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material) => disposeMaterial(material))
      } else {
        disposeMaterial(mesh.material)
      }
    }
  }

  // Dispose of skeleton if present (for skinned meshes)
  if ('skeleton' in object) {
    const skinnedMesh = object as THREE.SkinnedMesh
    if (skinnedMesh.skeleton) {
      skinnedMesh.skeleton.dispose()
    }
  }

  // Dispose of render target if it's a camera with one
  if (object instanceof THREE.Camera) {
    // Some camera types might have render targets
    const cam = object as any
    if (cam.renderTarget && typeof cam.renderTarget.dispose === 'function') {
      cam.renderTarget.dispose()
    }
  }

  // Remove all children
  while (object.children.length > 0) {
    object.remove(object.children[0])
  }

  // Remove from parent if requested
  if (removeFromParent && object.parent) {
    object.parent.remove(object)
  }

  // Clear references to help GC
  ;(object as any).geometry = null
  ;(object as any).material = null
}

/**
 * Dispose of a scene and all its contents
 */
export function disposeScene(scene: THREE.Scene): void {
  // Dispose all children
  disposeObject(scene, { removeFromParent: false })

  // Clear the scene
  scene.clear()

  // Dispose the scene's background if it's a texture
  if (scene.background && typeof (scene.background as any).dispose === 'function') {
    ;(scene.background as any).dispose()
  }

  // Dispose the scene's environment if it's a texture
  if (scene.environment && typeof scene.environment.dispose === 'function') {
    scene.environment.dispose()
  }
}

/**
 * Dispose of a group of objects
 */
export function disposeGroup(group: THREE.Group): void {
  disposeObject(group)
}

/**
 * Track and dispose of objects automatically
 */
export class DisposableObjectTracker {
  private objects: Set<THREE.Object3D> = new Set()

  /**
   * Track an object for automatic disposal
   */
  track(object: THREE.Object3D): THREE.Object3D {
    this.objects.add(object)
    return object
  }

  /**
   * Stop tracking an object
   */
  untrack(object: THREE.Object3D): void {
    this.objects.delete(object)
  }

  /**
   * Dispose all tracked objects
   */
  disposeAll(): void {
    this.objects.forEach((object) => {
      disposeObject(object)
    })
    this.objects.clear()
  }

  /**
   * Get the number of tracked objects
   */
  get count(): number {
    return this.objects.size
  }
}

/**
 * Utility to check for potential memory leaks
 * Logs objects that might not be properly disposed
 */
export function detectMemoryLeaks(renderer: THREE.WebGLRenderer): void {
  const info = renderer.info

  console.group('[Memory Leak Detection]')
  console.log('Geometries in memory:', info.memory.geometries)
  console.log('Textures in memory:', info.memory.textures)
  console.log('Programs in memory:', info.programs?.length || 0)
  console.log('Render calls:', info.render.calls)
  console.log('Triangles rendered:', info.render.triangles)
  console.log('Points rendered:', info.render.points)
  console.log('Lines rendered:', info.render.lines)
  console.groupEnd()

  // Warn if counts are unusually high
  if (info.memory.geometries > 1000) {
    console.warn('⚠️ High geometry count detected. Possible memory leak.')
  }
  if (info.memory.textures > 500) {
    console.warn('⚠️ High texture count detected. Possible memory leak.')
  }
}
