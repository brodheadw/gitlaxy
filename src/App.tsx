import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import Scene from './components/Scene'
import HUD from './components/HUD'
import SettingsMenu from './components/SettingsMenu'
<<<<<<< HEAD
import Editor from './components/Editor'
=======
import FPSCounter from './components/FPSCounter'
>>>>>>> origin/main
import { useStore } from './store'
import './index.css'

function App() {
<<<<<<< HEAD
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
=======
  const showFPS = useStore((state) => state.showFPS)

  // Cleanup on unmount and window close
  useEffect(() => {
    const cleanup = () => {
      // Clear any stored state
      sessionStorage.clear()

      // Cancel any pending animations
      const highestId = window.setTimeout(() => {}, 0)
      for (let i = 0; i < highestId; i++) {
        window.clearTimeout(i)
        window.clearInterval(i)
      }
    }

    // Handle beforeunload event
    const handleBeforeUnload = () => {
      cleanup()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      cleanup()
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])
>>>>>>> origin/main

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
<<<<<<< HEAD
      <Editor />
=======
      {showFPS && <FPSCounter />}
>>>>>>> origin/main
    </>
  )
}

export default App
