import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import Scene from './components/Scene'
import HUD from './components/HUD'
import SettingsMenu from './components/SettingsMenu'
import Editor from './components/Editor'
import FPSCounter from './components/FPSCounter'
import MainMenu from './components/MainMenu'
import LoadingScreen from './components/LoadingScreen'
import { useStore } from './store'
import './index.css'

function App() {
  const cameraMode = useStore((s) => s.cameraMode)
  const showFPS = useStore((state) => state.showFPS)
  const appState = useStore((state) => state.appState)

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

  // Track pointer lock state to show/hide cursor appropriately
  useEffect(() => {
    const handlePointerLockChange = () => {
      if (document.pointerLockElement) {
        document.body.classList.add('pointer-locked')
      } else {
        document.body.classList.remove('pointer-locked')
      }
    }

    document.addEventListener('pointerlockchange', handlePointerLockChange)
    document.addEventListener('mozpointerlockchange', handlePointerLockChange)
    document.addEventListener('webkitpointerlockchange', handlePointerLockChange)

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange)
      document.removeEventListener('mozpointerlockchange', handlePointerLockChange)
      document.removeEventListener('webkitpointerlockchange', handlePointerLockChange)
      document.body.classList.remove('pointer-locked')
    }
  }, [])

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
          <Editor />
          {showFPS && <FPSCounter />}
        </>
      )}
    </>
  )
}

export default App