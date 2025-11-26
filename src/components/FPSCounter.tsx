import { useEffect, useRef, useState } from 'react'

/**
 * Simple FPS counter overlay
 * Displays current FPS with color coding:
 * - Green: 55+ FPS (excellent)
 * - Yellow: 30-54 FPS (playable)
 * - Red: <30 FPS (poor)
 */

export default function FPSCounter() {
  const [fps, setFps] = useState(60)
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())
  const frameRef = useRef<number>()

  useEffect(() => {
    const updateFPS = () => {
      frameCount.current++

      const now = performance.now()
      const delta = now - lastTime.current

      // Update FPS display every 500ms
      if (delta >= 500) {
        const currentFPS = Math.round((frameCount.current / delta) * 1000)
        setFps(currentFPS)
        frameCount.current = 0
        lastTime.current = now
      }

      frameRef.current = requestAnimationFrame(updateFPS)
    }

    frameRef.current = requestAnimationFrame(updateFPS)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  const getColorForFPS = (fps: number) => {
    if (fps >= 55) return '#00ff00'
    if (fps >= 30) return '#ffaa00'
    return '#ff0000'
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 10,
        left: 10,
        background: 'rgba(0, 0, 0, 0.7)',
        color: getColorForFPS(fps),
        padding: '8px 12px',
        fontFamily: 'monospace',
        fontSize: '16px',
        fontWeight: 'bold',
        borderRadius: '4px',
        zIndex: 1000,
        border: `2px solid ${getColorForFPS(fps)}`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    >
      {fps} FPS
    </div>
  )
}
