import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import Scene from './components/Scene'
import HUD from './components/HUD'
import SettingsMenu from './components/SettingsMenu'
import FPSCounter from './components/FPSCounter'
import MainMenu from './components/MainMenu'
import LoadingScreen from './components/LoadingScreen'
import { useStore } from './store'
import './index.css'

function App() {
  const showFPS = useStore((state) => state.showFPS)
  const appState = useStore((state) => state.appState)

  // Cleanup on unmount and window close
  useEffect(() => {
    const cleanup = () => {
      // Clear any stored state
      sessionStorage.clear()

      // Cancel any pending animations
      const highestId = window.setTimeout(() => { }, 0)
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
      {/* Main Menu - shown before initialization */}
      {appState === 'menu' && <MainMenu />}

      {/* Loading Screen - shown during repo loading */}
      {appState === 'loading' && <LoadingScreen />}

      {/* Main 3D Scene - shown after loading complete */}
      {appState === 'ready' && (
        <>
          <Canvas
            camera={{ position: [0, 4000, 20000], fov: 60, near: 1, far: 500000 }}
            gl={{ antialias: true, alpha: false, logarithmicDepthBuffer: true }}
          >
            <color attach="background" args={['#010103']} />
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </Canvas>
          <HUD />
          <SettingsMenu />
          {showFPS && <FPSCounter />}
        </>
      )}
    </>
  )
}

export default App
