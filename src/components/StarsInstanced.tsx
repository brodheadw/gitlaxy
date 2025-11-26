import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { PERFORMANCE } from '../config/performance'

/**
 * High-performance instanced stars replacement
 * Uses InstancedMesh instead of Points for better control and performance
 * Single draw call for all stars
 */

export default function StarsInstanced() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const { positions, colors, scales } = useMemo(() => {
    const count = PERFORMANCE.stars.count
    const radius = PERFORMANCE.stars.radius
    const saturation = PERFORMANCE.stars.saturation

    const pos: THREE.Vector3[] = []
    const col = new Float32Array(count * 3)
    const sca: number[] = []

    for (let i = 0; i < count; i++) {
      // Spherical distribution
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = radius * (0.5 + Math.random() * 0.5) // Inner 50% to outer edge

      pos.push(new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      ))

      // Star colors - mostly white with slight color variation
      const hue = Math.random()
      const color = new THREE.Color().setHSL(hue, saturation, 0.8 + Math.random() * 0.2)
      col[i * 3] = color.r
      col[i * 3 + 1] = color.g
      col[i * 3 + 2] = color.b

      // Variable sizes for depth perception
      sca.push(PERFORMANCE.stars.size * (0.5 + Math.random() * 1.5))
    }

    return { positions: pos, colors: col, scales: sca }
  }, [])

  // Initialize instance transforms
  useEffect(() => {
    if (!meshRef.current) return

    const geometry = meshRef.current.geometry
    geometry.setAttribute('color', new THREE.InstancedBufferAttribute(colors, 3))

    positions.forEach((pos, i) => {
      dummy.position.copy(pos)
      dummy.scale.setScalar(scales[i])
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  }, [positions, colors, scales, dummy])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PERFORMANCE.stars.count]} frustumCulled={false}>
      {/* Small sphere for each star */}
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial
        vertexColors
        transparent={false}
        fog={false}
      />
    </instancedMesh>
  )
}
