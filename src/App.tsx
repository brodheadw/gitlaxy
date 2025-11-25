import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import Scene from './components/Scene'
import './index.css'

function App() {
  return (
    <Canvas
      camera={{ position: [0, 0, 50], fov: 75, near: 0.1, far: 10000 }}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#050510']} />
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  )
}

export default App
