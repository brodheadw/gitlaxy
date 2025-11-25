import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import Scene from './components/Scene'
import HUD from './components/HUD'
import './index.css'

function App() {
  return (
    <>
      <Canvas
        camera={{ position: [0, 500, 2000], fov: 60, near: 0.1, far: 50000 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#010103']} />
        {/* Removed fog - it was causing the black circle effect */}
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <HUD />
    </>
  )
}

export default App
