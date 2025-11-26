import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import Scene from './components/Scene'
import HUD from './components/HUD'
import SettingsMenu from './components/SettingsMenu'
import './index.css'

function App() {
  return (
    <>
      <Canvas
        camera={{ position: [0, 4000, 20000], fov: 60, near: 1, far: 500000 }}
        gl={{ antialias: true, alpha: false, logarithmicDepthBuffer: true }}
      >
        <color attach="background" args={['#010103']} />
        {/* Removed fog - it was causing the black circle effect */}
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <HUD />
      <SettingsMenu />
    </>
  )
}

export default App
