import { OrbitControls, Stars } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'
import { useStore } from '../store'
import Galaxy from './Galaxy'
import SpaceBackground from './SpaceBackground'
import Spaceship from './Spaceship'
import { FlyCamera } from './ShipControls'
import { PERFORMANCE } from '../config/performance'

export default function Scene() {
  const { cameraMode, controlSettings } = useStore()

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
