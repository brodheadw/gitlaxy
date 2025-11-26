import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import Scene from './components/Scene'
import HUD from './components/HUD'
import SettingsMenu from './components/SettingsMenu'
import FPSCounter from './components/FPSCounter'
import { useStore } from './store'
import './index.css'

function App() {
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

  return (
    <>
      <Canvas
        camera={{ position: [0, 800, 4000], fov: 60, near: 0.1, far: 100000 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#010103']} />
        {/* Removed fog - it was causing the black circle effect */}
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <HUD />
      <SettingsMenu />
      {showFPS && <FPSCounter />}
    </>
  )
}

export default App
