import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import Scene from './components/Scene'
import HUD from './components/HUD'
import SettingsMenu from './components/SettingsMenu'
import Editor from './components/Editor'
import { useStore } from './store'
import './index.css'

function App() {
  const cameraMode = useStore((s) => s.cameraMode)

  // Add fly-mode class to body when in fly mode
  useEffect(() => {
    if (cameraMode === 'fly') {
      document.body.classList.add('fly-mode')
    } else {
      document.body.classList.remove('fly-mode')
    }
    return () => {
      document.body.classList.remove('fly-mode')
    }
  }, [cameraMode])

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
      <Editor />
    </>
  )
}

export default App
