import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { getPoolStats } from '../utils/objectPool'

/**
 * Performance monitoring hook
 * Tracks FPS, frame time, memory usage, and object pool statistics
 */

export interface PerformanceStats {
  fps: number
  frameTime: number
  drawCalls: number
  triangles: number
  geometries: number
  textures: number
  programs: number
  memoryUsage: {
    geometries: number
    textures: number
  }
  poolStats: {
    vector3: { allocated: number; total: number }
    quaternion: { allocated: number; total: number }
    euler: { allocated: number; total: number }
    matrix4: { allocated: number; total: number }
  }
}

interface UsePerformanceMonitorOptions {
  enabled?: boolean
  sampleInterval?: number // How often to update stats (in frames)
}

export function usePerformanceMonitor(options: UsePerformanceMonitorOptions = {}) {
  const { enabled = true, sampleInterval = 60 } = options

  const { gl } = useThree()
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    programs: 0,
    memoryUsage: {
      geometries: 0,
      textures: 0,
    },
    poolStats: {
      vector3: { allocated: 0, total: 0 },
      quaternion: { allocated: 0, total: 0 },
      euler: { allocated: 0, total: 0 },
      matrix4: { allocated: 0, total: 0 },
    },
  })

  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())
  const frameTimes = useRef<number[]>([])

  useFrame(() => {
    if (!enabled) return

    frameCount.current++

    // Calculate frame time
    const now = performance.now()
    const delta = now - lastTime.current
    lastTime.current = now

    // Store last 60 frame times for average
    frameTimes.current.push(delta)
    if (frameTimes.current.length > 60) {
      frameTimes.current.shift()
    }

    // Update stats at interval
    if (frameCount.current % sampleInterval === 0) {
      const avgFrameTime = frameTimes.current.reduce((a, b) => a + b, 0) / frameTimes.current.length
      const fps = 1000 / avgFrameTime

      const info = gl.info
      const memory = info.memory

      setStats({
        fps: Math.round(fps),
        frameTime: Math.round(avgFrameTime * 100) / 100,
        drawCalls: info.render.calls,
        triangles: info.render.triangles,
        geometries: memory.geometries,
        textures: memory.textures,
        programs: info.programs?.length || 0,
        memoryUsage: {
          geometries: memory.geometries,
          textures: memory.textures,
        },
        poolStats: getPoolStats(),
      })
    }
  })

  return stats
}

/**
 * Hook to display performance stats in console at intervals
 */
export function usePerformanceLogger(intervalMs = 5000) {
  const stats = usePerformanceMonitor({ sampleInterval: 30 })
  const lastLog = useRef(0)

  useEffect(() => {
    const now = Date.now()
    if (now - lastLog.current > intervalMs) {
      lastLog.current = now
      console.group('🚀 Performance Stats')
      console.log(`FPS: ${stats.fps}`)
      console.log(`Frame Time: ${stats.frameTime}ms`)
      console.log(`Draw Calls: ${stats.drawCalls}`)
      console.log(`Triangles: ${stats.triangles.toLocaleString()}`)
      console.log(`Geometries: ${stats.geometries}`)
      console.log(`Textures: ${stats.textures}`)
      console.log(`Programs: ${stats.programs}`)
      console.group('Object Pools')
      console.log(`Vector3: ${stats.poolStats.vector3.allocated}/${stats.poolStats.vector3.total}`)
      console.log(`Quaternion: ${stats.poolStats.quaternion.allocated}/${stats.poolStats.quaternion.total}`)
      console.log(`Euler: ${stats.poolStats.euler.allocated}/${stats.poolStats.euler.total}`)
      console.log(`Matrix4: ${stats.poolStats.matrix4.allocated}/${stats.poolStats.matrix4.total}`)
      console.groupEnd()
      console.groupEnd()
    }
  }, [stats, intervalMs])

  return stats
}

/**
 * Performance overlay component
 */
export function PerformanceOverlay({ stats }: { stats: PerformanceStats }) {
  const getColorForFPS = (fps: number) => {
    if (fps >= 55) return '#00ff00'
    if (fps >= 30) return '#ffff00'
    return '#ff0000'
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        fontFamily: 'monospace',
        fontSize: '12px',
        borderRadius: '4px',
        zIndex: 1000,
        minWidth: '200px',
      }}
    >
      <div style={{ color: getColorForFPS(stats.fps), fontWeight: 'bold', fontSize: '14px' }}>
        {stats.fps} FPS ({stats.frameTime}ms)
      </div>
      <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.9 }}>
        <div>Draw Calls: {stats.drawCalls}</div>
        <div>Triangles: {stats.triangles.toLocaleString()}</div>
        <div>Geometries: {stats.geometries}</div>
        <div>Textures: {stats.textures}</div>
      </div>
      <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.8, borderTop: '1px solid #444', paddingTop: '6px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Object Pools:</div>
        <div>Vec3: {stats.poolStats.vector3.allocated}/{stats.poolStats.vector3.total}</div>
        <div>Quat: {stats.poolStats.quaternion.allocated}/{stats.poolStats.quaternion.total}</div>
        <div>Euler: {stats.poolStats.euler.allocated}/{stats.poolStats.euler.total}</div>
        <div>Mat4: {stats.poolStats.matrix4.allocated}/{stats.poolStats.matrix4.total}</div>
      </div>
    </div>
  )
}
