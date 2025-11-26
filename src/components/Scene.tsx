import { useEffect } from 'react'
import { OrbitControls, Stars } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'
import { useThree } from '@react-three/fiber'
import { useStore } from '../store'
import Galaxy from './Galaxy'
import SpaceBackground from './SpaceBackground'
import Spaceship from './Spaceship'
import { FlyCamera } from './ShipControls'
import { PERFORMANCE } from '../config/performance'

export default function Scene() {
  const { cameraMode, controlSettings } = useStore()
  const { camera, gl } = useThree()

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

  return (
    <>
      {/* Ambient space lighting - very subtle */}
      <ambientLight intensity={PERFORMANCE.lighting.ambient} />

      {/* Distant sun-like light source */}
      <directionalLight
        position={[5000, 3000, 2000]}
        intensity={PERFORMANCE.lighting.directional}
        color="#fff8e7"
      />

      {/* Stars - uses points that render at infinity, no depth issues */}
      <Stars
        radius={PERFORMANCE.stars.radius}
        depth={PERFORMANCE.stars.depth}
        count={PERFORMANCE.stars.count}
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

      {/* Camera controls based on mode */}
      {cameraMode === 'orbit' && (
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          zoomSpeed={0.5}
          panSpeed={0.5}
          rotateSpeed={0.3}
          minDistance={50}
          maxDistance={50000}
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
