import * as THREE from 'three'

/**
 * WebGL Context Loss Recovery System
 *
 * Handles WebGL context loss/restore events to prevent the "black screen" issue
 * that occurs when the browser loses the WebGL context (e.g., due to GPU memory exhaustion,
 * tab switching, or system sleep).
 *
 * The system:
 * 1. Prevents default context loss behavior
 * 2. Saves scene state before loss
 * 3. Restores scene assets when context is regained
 * 4. Provides callbacks for custom recovery logic
 */

export interface ContextRecoveryCallbacks {
  onContextLost?: () => void
  onContextRestore?: () => void
  onContextRestoreError?: (error: Error) => void
}

export interface SceneState {
  cameraPosition: THREE.Vector3
  cameraRotation: THREE.Euler
  cameraZoom?: number
  timestamp: number
  customData?: Record<string, any>
}

export class WebGLContextRecovery {
  private renderer: THREE.WebGLRenderer | null = null
  private canvas: HTMLCanvasElement | null = null
  private callbacks: ContextRecoveryCallbacks = {}
  private sceneState: SceneState | null = null
  private isContextLost = false

  /**
   * Initialize context recovery for a renderer
   */
  initialize(renderer: THREE.WebGLRenderer, callbacks: ContextRecoveryCallbacks = {}): void {
    this.renderer = renderer
    this.canvas = renderer.domElement
    this.callbacks = callbacks

    // Add event listeners
    this.canvas.addEventListener('webglcontextlost', this.handleContextLost, false)
    this.canvas.addEventListener('webglcontextrestored', this.handleContextRestored, false)

    console.log('[ContextRecovery] Initialized WebGL context recovery')
  }

  /**
   * Handle context lost event
   */
  private handleContextLost = (event: Event): void => {
    event.preventDefault() // Prevent default browser behavior (which would abandon the context)

    this.isContextLost = true
    console.warn('[ContextRecovery] WebGL context lost')

    // Call user callback
    if (this.callbacks.onContextLost) {
      this.callbacks.onContextLost()
    }
  }

  /**
   * Handle context restored event
   */
  private handleContextRestored = async (_event: Event): Promise<void> => {
    console.log('[ContextRecovery] WebGL context restored')

    try {
      this.isContextLost = false

      // The renderer should automatically handle context restoration
      // But we need to notify the application to reload any assets

      // Call user callback
      if (this.callbacks.onContextRestore) {
        this.callbacks.onContextRestore()
      }

      console.log('[ContextRecovery] Context restoration complete')
    } catch (error) {
      console.error('[ContextRecovery] Error during context restoration:', error)

      if (this.callbacks.onContextRestoreError) {
        this.callbacks.onContextRestoreError(error as Error)
      }
    }
  }

  /**
   * Save current scene state for recovery
   */
  saveSceneState(camera: THREE.Camera, customData?: Record<string, any>): void {
    this.sceneState = {
      cameraPosition: camera.position.clone(),
      cameraRotation: camera.rotation.clone(),
      cameraZoom: (camera as any).zoom,
      timestamp: Date.now(),
      customData,
    }
  }

  /**
   * Restore saved scene state
   */
  restoreSceneState(camera: THREE.Camera): SceneState | null {
    if (!this.sceneState) return null

    camera.position.copy(this.sceneState.cameraPosition)
    camera.rotation.copy(this.sceneState.cameraRotation)

    if (this.sceneState.cameraZoom !== undefined && 'zoom' in camera) {
      ;(camera as any).zoom = this.sceneState.cameraZoom
    }

    // Update projection matrix if camera has the method
    if ('updateProjectionMatrix' in camera && typeof (camera as any).updateProjectionMatrix === 'function') {
      ;(camera as any).updateProjectionMatrix()
    }

    return this.sceneState
  }

  /**
   * Check if context is currently lost
   */
  get contextLost(): boolean {
    return this.isContextLost
  }

  /**
   * Get saved scene state
   */
  get savedState(): SceneState | null {
    return this.sceneState
  }

  /**
   * Force a context loss (for testing)
   */
  forceContextLoss(): void {
    if (!this.canvas) return

    const ext = this.renderer?.getContext().getExtension('WEBGL_lose_context')
    if (ext) {
      ext.loseContext()
      console.log('[ContextRecovery] Forced context loss for testing')
    }
  }

  /**
   * Force a context restore (for testing)
   */
  forceContextRestore(): void {
    if (!this.canvas) return

    const ext = this.renderer?.getContext().getExtension('WEBGL_lose_context')
    if (ext) {
      ext.restoreContext()
      console.log('[ContextRecovery] Forced context restore for testing')
    }
  }

  /**
   * Cleanup event listeners
   */
  dispose(): void {
    if (this.canvas) {
      this.canvas.removeEventListener('webglcontextlost', this.handleContextLost)
      this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored)
    }

    this.renderer = null
    this.canvas = null
    this.sceneState = null
    this.callbacks = {}

    console.log('[ContextRecovery] Disposed')
  }
}

/**
 * Singleton instance for global context recovery
 */
export const contextRecovery = new WebGLContextRecovery()

/**
 * React hook for WebGL context recovery
 */
export function useWebGLContextRecovery(
  renderer: THREE.WebGLRenderer | null,
  camera: THREE.Camera | null,
  callbacks: ContextRecoveryCallbacks = {}
): WebGLContextRecovery {
  // Initialize on mount
  if (renderer && !contextRecovery.contextLost) {
    contextRecovery.initialize(renderer, callbacks)
  }

  // Save scene state periodically
  if (camera) {
    contextRecovery.saveSceneState(camera)
  }

  return contextRecovery
}
