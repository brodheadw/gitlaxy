import { OrbitControls, Stars } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import Starfield from './Starfield'
import { Vector2 } from 'three'

export default function Scene() {
  return (
    <>
      {/* Ambient space lighting */}
      <ambientLight intensity={0.1} />
      <pointLight position={[100, 100, 100]} intensity={0.5} color="#fff8e7" />

      {/* Background stars (distant) */}
      <Stars
        radius={500}
        depth={100}
        count={5000}
        factor={4}
        saturation={0.5}
        fade
        speed={0.5}
      />

      {/* Demo starfield representing files */}
      <Starfield />

      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        zoomSpeed={0.5}
        panSpeed={0.5}
        rotateSpeed={0.3}
        minDistance={5}
        maxDistance={500}
      />

      {/* NMS-style post-processing */}
      <EffectComposer>
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new Vector2(0.0015, 0.0015)}
          radialModulation={true}
          modulationOffset={0.5}
        />
        <Vignette
          offset={0.3}
          darkness={0.6}
          blendFunction={BlendFunction.NORMAL}
        />
        <Noise
          blendFunction={BlendFunction.SOFT_LIGHT}
          opacity={0.15}
        />
      </EffectComposer>
    </>
  )
}
