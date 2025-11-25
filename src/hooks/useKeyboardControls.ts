import { useEffect, useCallback } from 'react'
import { useStore } from '../store'

export type KeyMap = {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  up: boolean
  down: boolean
  boost: boolean
  brake: boolean
}

const KEY_BINDINGS: Record<string, keyof KeyMap> = {
  // WASD
  KeyW: 'forward',
  KeyS: 'backward',
  KeyA: 'left',
  KeyD: 'right',

  // Arrow keys
  ArrowUp: 'forward',
  ArrowDown: 'backward',
  ArrowLeft: 'left',
  ArrowRight: 'right',

  // Vertical movement
  Space: 'up',
  ShiftLeft: 'down',
  ShiftRight: 'down',

  // Speed modifiers
  KeyE: 'boost',
  KeyQ: 'brake',
}

export function useKeyboardControls(): KeyMap {
  const { keysPressed, setKeyPressed, cameraMode } = useStore()

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Only handle controls in fly mode
      if (cameraMode !== 'fly') return

      // Prevent default for game controls
      if (KEY_BINDINGS[e.code]) {
        e.preventDefault()
        setKeyPressed(e.code, true)
      }
    },
    [cameraMode, setKeyPressed]
  )

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (KEY_BINDINGS[e.code]) {
        setKeyPressed(e.code, false)
      }
    },
    [setKeyPressed]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  // Convert pressed keys to KeyMap
  const keyMap: KeyMap = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    boost: false,
    brake: false,
  }

  for (const code of keysPressed) {
    const action = KEY_BINDINGS[code]
    if (action) {
      keyMap[action] = true
    }
  }

  return keyMap
}
