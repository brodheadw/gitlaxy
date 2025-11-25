import { OrbitControls, Stars } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'
import { useStore } from '../store'
import Galaxy from './Galaxy'
import SpaceBackground from './SpaceBackground'
import Spaceship from './Spaceship'
import { FlyCamera } from './ShipControls'

export default function Scene() {
  const { cameraMode } = useStore()

  return (
    <>
      {/* Ambient space lighting - very subtle */}
      <ambientLight intensity={0.05} />

      {/* Distant sun-like light source */}
      <directionalLight
        position={[5000, 3000, 2000]}
        intensity={0.3}
        color="#fff8e7"
      />

      {/* Stars - uses points that render at infinity, no depth issues */}
      <Stars radius={50000} depth={80} count={15000} factor={8} saturation={0.1} fade={false} />

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
        <FlyCamera speed={3} damping={0.92} />
      )}

      {/* NMS-style post-processing */}
      <EffectComposer>
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new Vector2(0.0005, 0.0005)}
          radialModulation={true}
          modulationOffset={0.5}
        />
        <Vignette
          offset={0.2}
          darkness={0.5}
          blendFunction={BlendFunction.NORMAL}
        />
        <Noise
          blendFunction={BlendFunction.SOFT_LIGHT}
          opacity={0.06}
        />
      </EffectComposer>
    </>
  )
}
