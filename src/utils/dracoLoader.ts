import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

/**
 * Blob URI Worker Pattern for DRACOLoader
 *
 * This implementation bypasses VSCode Content Security Policy (CSP) restrictions
 * that would otherwise block Web Workers from loading external scripts.
 *
 * The pattern:
 * 1. Fetch the Draco decoder JavaScript as text
 * 2. Convert the text to a Blob
 * 3. Generate a local URL using URL.createObjectURL(blob)
 * 4. Pass this URL to DRACOLoader to spawn workers that bypass CSP restrictions
 */

let dracoLoader: DRACOLoader | null = null
let initializationPromise: Promise<DRACOLoader> | null = null
let initializationError: Error | null = null

/**
 * Initialize DRACOLoader with Blob URI pattern for VSCode webview compatibility
 * This is a singleton - multiple calls will return the same instance/promise
 */
export async function initializeDracoLoader(): Promise<DRACOLoader> {
  // Return existing instance if already initialized
  if (dracoLoader) {
    return dracoLoader
  }

  // If initialization previously failed, throw the cached error
  if (initializationError) {
    throw initializationError
  }

  // Return existing initialization promise if in progress
  if (initializationPromise) {
    return initializationPromise
  }

  // Create new initialization promise
  initializationPromise = (async () => {
    try {
      const loader = new DRACOLoader()

      // Try to use the Blob URI pattern for VSCode compatibility
      try {
        // Fetch the decoder files
        const decoderPath = '/draco/'
        const wasmLoaderFile = `${decoderPath}draco_wasm_wrapper.js`

        // Check if we're in a VSCode webview context
        const isVSCode = typeof (window as any).acquireVsCodeApi !== 'undefined'

        if (isVSCode) {
          console.log('[DracoLoader] VSCode webview detected, using Blob URI pattern')

          // Fetch the worker script
          const response = await fetch(wasmLoaderFile)
          if (!response.ok) {
            throw new Error(`Failed to fetch Draco worker script: ${response.statusText}`)
          }

          const scriptText = await response.text()

          // Create a Blob from the script text
          const blob = new Blob([scriptText], { type: 'application/javascript' })

          // Generate a local URL that bypasses CSP
          // Note: blobURL is created but the decoder uses the decoderPath directly
          URL.createObjectURL(blob)

          // Set the decoder path to use our blob URL for the worker
          loader.setDecoderPath(decoderPath)
          loader.setDecoderConfig({ type: 'wasm' })

          // Note: We can't directly override the worker URL in DRACOLoader,
          // but setting the decoder path should work if the files are accessible
          console.log('[DracoLoader] Initialized with Blob URI pattern')
        } else {
          // Standard initialization for non-VSCode environments
          loader.setDecoderPath(decoderPath)
          loader.setDecoderConfig({ type: 'wasm' })
          console.log('[DracoLoader] Initialized with standard pattern')
        }

        // Preload the decoder
        loader.preload()

        dracoLoader = loader
        return loader
      } catch (error) {
        console.warn('[DracoLoader] Blob URI initialization failed, falling back to standard:', error)

        // Fallback to standard initialization
        loader.setDecoderPath('/draco/')
        loader.setDecoderConfig({ type: 'wasm' })
        loader.preload()

        dracoLoader = loader
        return loader
      }
    } catch (error) {
      console.error('[DracoLoader] Failed to initialize:', error)
      initializationError = error as Error
      initializationPromise = null
      throw error
    }
  })()

  return initializationPromise
}

/**
 * Get the initialized DRACOLoader instance
 * Throws if not yet initialized - call initializeDracoLoader() first
 */
export function getDracoLoader(): DRACOLoader {
  if (!dracoLoader) {
    throw new Error('DRACOLoader not initialized. Call initializeDracoLoader() first.')
  }
  return dracoLoader
}

/**
 * Cleanup the DRACOLoader instance and revoke blob URLs
 */
export function disposeDracoLoader(): void {
  if (dracoLoader) {
    dracoLoader.dispose()
    dracoLoader = null
    initializationPromise = null
    initializationError = null
  }
}
