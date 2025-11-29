import { useEffect, useRef } from 'react'
import { OrbitControls, Stars } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { useStore } from '../store'
import Galaxy from './Galaxy'
import SpaceBackground from './SpaceBackground'
import Spaceship from './Spaceship'
import { FlyCamera } from './ShipControls'
import { PERFORMANCE } from '../config/performance'
import { contextRecovery } from '../utils/contextRecovery'
import { detectMemoryLeaks } from '../utils/disposeObject'
import { useProximityDetection } from '../hooks/useProximityDetection'

// Component to run proximity detection
function ProximityDetector() {
  useProximityDetection()
  return null
}

export default function Scene() {
  const { cameraMode, controlSettings } = useStore()
  const { camera, gl } = useThree()
  const frameCount = useRef(0)
  const memoryCheckInterval = 300 // Check every 300 frames (~5 seconds at 60fps)


  // Initialize WebGL context recovery
  useEffect(() => {
    contextRecovery.initialize(gl, {
      onContextLost: () => {
        console.warn('[Scene] WebGL context lost - pausing rendering')
      },
      onContextRestore: () => {
        console.log('[Scene] WebGL context restored - resuming rendering')
        // Restore camera state
        contextRecovery.restoreSceneState(camera)
      },
      onContextRestoreError: (error) => {
        console.error('[Scene] Failed to restore context:', error)
      },
    })

    return () => {
      contextRecovery.dispose()
    }
  }, [gl, camera])

  // Handle window resize - update camera aspect ratio
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      // Update camera aspect ratio
      if ('aspect' in camera) {
        camera.aspect = width / height
        camera.updateProjectionMatrix()
      }

      // Update renderer size
      gl.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    // Also listen for fullscreen changes
    document.addEventListener('fullscreenchange', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('fullscreenchange', handleResize)
    }
  }, [camera, gl])

  // Save scene state periodically and check for memory leaks
  useFrame(() => {
    frameCount.current++

    // Save scene state every 60 frames for context recovery
    if (frameCount.current % 60 === 0) {
      contextRecovery.saveSceneState(camera)
    }

    // Periodic memory leak detection (debug mode only)
    if (frameCount.current % memoryCheckInterval === 0 && import.meta.env.DEV) {
      detectMemoryLeaks(gl)
    }
  })

  return (
    <>
      {/* Ambient space lighting */}
      <ambientLight intensity={PERFORMANCE.lighting.ambient} />

      {/* Distant sun-like light source */}
      <directionalLight
        position={[5000, 3000, 2000]}
        intensity={PERFORMANCE.lighting.directional}
        color="#fff8e7"
      />

      {/* Stars - two layers to fill volume without empty center */}
      <Stars
        radius={PERFORMANCE.stars.innerRadius}
        depth={PERFORMANCE.stars.innerDepth}
        count={PERFORMANCE.stars.innerCount}
        factor={PERFORMANCE.stars.size}
        saturation={PERFORMANCE.stars.saturation}
        fade={false}
      />
      <Stars
        radius={PERFORMANCE.stars.outerRadius}
        depth={PERFORMANCE.stars.outerDepth}
        count={PERFORMANCE.stars.outerCount}
        factor={PERFORMANCE.stars.size}
        saturation={PERFORMANCE.stars.saturation}
        fade={false}
      />

      {/* Volumetric nebulae in the scene */}
      <SpaceBackground />

      {/* Repository galaxy visualization */}
      <Galaxy />

      {/* Spaceship visible in fly mode */}
      <Spaceship />

      {/* Proximity detection for landing */}
      <ProximityDetector />

      {/* Camera controls (5x scale) */}
      {cameraMode === 'orbit' && (
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          zoomSpeed={0.5}
          panSpeed={0.5}
          rotateSpeed={0.3}
          minDistance={250}
          maxDistance={250000}
        />
      )}

      {cameraMode === 'fly' && (
        <FlyCamera controlSettings={controlSettings} />
      )}

      {/* NMS-style post-processing */}
      {PERFORMANCE.effects.enabled && (
        <EffectComposer>
          {PERFORMANCE.effects.bloom.enabled && (
            <Bloom
              intensity={PERFORMANCE.effects.bloom.intensity}
              luminanceThreshold={PERFORMANCE.effects.bloom.threshold}
              luminanceSmoothing={PERFORMANCE.effects.bloom.smoothing}
              mipmapBlur={PERFORMANCE.effects.bloom.mipmap}
            />
          )}
          {PERFORMANCE.effects.aberration.enabled && (
            <ChromaticAberration
              blendFunction={BlendFunction.NORMAL}
              offset={new Vector2(PERFORMANCE.effects.aberration.offsetX, PERFORMANCE.effects.aberration.offsetY)}
              radialModulation={PERFORMANCE.effects.aberration.radial}
              modulationOffset={PERFORMANCE.effects.aberration.modulation}
            />
          )}
          {PERFORMANCE.effects.vignette.enabled && (
            <Vignette
              offset={PERFORMANCE.effects.vignette.offset}
              darkness={PERFORMANCE.effects.vignette.darkness}
              blendFunction={BlendFunction.NORMAL}
            />
          )}
          {PERFORMANCE.effects.noise.enabled && (
            <Noise
              blendFunction={BlendFunction.SOFT_LIGHT}
              opacity={PERFORMANCE.effects.noise.opacity}
            />
          )}
        </EffectComposer>
      )}
    </>
  )
}
