import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PERFORMANCE } from '../config/performance'

/**
 * High-performance instanced version of SpaceBackground
 * Uses InstancedMesh for massive performance gains
 * - Reduces draw calls from O(N) to O(1)
 * - Can render 10,000+ particles with no frame drop
 */

interface InstanceData {
  basePosition: THREE.Vector3
  baseRotation: THREE.Euler
  baseScale: THREE.Vector3
  animationPhase: number
  animationSpeed: number
  colorIndex: number
}

// Instanced dust particles (replaces individual NebulaDust points)
function InstancedDust({ count, color }: { count: number; color: THREE.Color }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const instanceData = useMemo(() => {
    const data: InstanceData[] = []
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = Math.random() * 20000 + 5000 // Spread across space

      data.push({
        basePosition: new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        ),
        baseRotation: new THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        ),
        baseScale: new THREE.Vector3().setScalar(2 + Math.random() * 6),
        animationPhase: Math.random() * Math.PI * 2,
        animationSpeed: 0.5 + Math.random() * 1.5,
        colorIndex: i
      })
    }
    return data
  }, [count])

  // Initialize instance transforms
  useEffect(() => {
    if (!meshRef.current) return

    instanceData.forEach((data, i) => {
      dummy.position.copy(data.basePosition)
      dummy.rotation.copy(data.baseRotation)
      dummy.scale.copy(data.baseScale)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [instanceData, dummy])

  useFrame((state) => {
    if (!meshRef.current) return
    if (!PERFORMANCE.toggles.dustAnimation) return

    const time = state.clock.elapsedTime
    const anim = PERFORMANCE.nebula.animation

    instanceData.forEach((data, i) => {
      // Gentle rotation animation
      dummy.position.copy(data.basePosition)
      dummy.rotation.set(
        data.baseRotation.x + time * anim.dustRotateX * data.animationSpeed,
        data.baseRotation.y + time * anim.dustRotateY * data.animationSpeed,
        data.baseRotation.z
      )
      dummy.scale.copy(data.baseScale)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={PERFORMANCE.nebula.visual.dustOpacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  )
}

// Instanced nebula wisps (replaces individual NebulaWisp meshes)
function InstancedWisps({ count, colorPalette }: { count: number; colorPalette: THREE.Color[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const colorsRef = useRef<Float32Array>(new Float32Array(count * 3))

  const instanceData = useMemo(() => {
    const data: InstanceData[] = []
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = Math.random() * 15000 + 3000
      const y = (Math.random() - 0.5) * 10000

      const colorIndex = Math.floor(Math.random() * colorPalette.length)
      const color = colorPalette[colorIndex]

      // Store color in instance color array
      colorsRef.current[i * 3] = color.r
      colorsRef.current[i * 3 + 1] = color.g
      colorsRef.current[i * 3 + 2] = color.b

      data.push({
        basePosition: new THREE.Vector3(
          Math.cos(angle) * dist,
          y,
          Math.sin(angle) * dist
        ),
        baseRotation: new THREE.Euler(0, 0, 0),
        baseScale: new THREE.Vector3().setScalar(400 + Math.random() * 800),
        animationPhase: Math.random() * Math.PI * 2,
        animationSpeed: 0.8 + Math.random() * 0.4,
        colorIndex
      })
    }
    return data
  }, [count, colorPalette])

  useFrame((state) => {
    if (!meshRef.current) return
    if (!PERFORMANCE.toggles.wispAnimation) return

    const time = state.clock.elapsedTime
    const anim = PERFORMANCE.nebula.animation

    instanceData.forEach((data, i) => {
      // Floating animation with pulse
      const pulse = 1 + Math.sin(time * anim.wispPulse + data.animationPhase) * 0.15

      dummy.position.set(
        data.basePosition.x + Math.sin(time * anim.wispFloatX + data.animationPhase) * 100,
        data.basePosition.y + Math.cos(time * anim.wispFloatY + data.animationPhase * 2) * 80,
        data.basePosition.z + Math.sin(time * anim.wispFloatZ + data.animationPhase * 3) * 100
      )

      dummy.rotation.set(
        time * anim.wispRotateX * data.animationSpeed + data.animationPhase,
        time * anim.wispRotateY * data.animationSpeed,
        0
      )

      dummy.scale.copy(data.baseScale).multiplyScalar(pulse)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  // Set up instance colors
  useEffect(() => {
    if (!meshRef.current) return

    const geometry = meshRef.current.geometry
    geometry.setAttribute('color', new THREE.InstancedBufferAttribute(colorsRef.current, 3))

    instanceData.forEach((data, i) => {
      dummy.position.copy(data.basePosition)
      dummy.rotation.copy(data.baseRotation)
      dummy.scale.copy(data.baseScale)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  }, [instanceData, dummy])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <icosahedronGeometry args={[1, 1]} />
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={PERFORMANCE.nebula.visual.wispOpacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  )
}

export default function SpaceBackgroundInstanced() {
  // Color palette for nebula elements
  const colorPalette = useMemo(() => [
    new THREE.Color('#9933ff'),
    new THREE.Color('#ff33cc'),
    new THREE.Color('#ff3366'),
    new THREE.Color('#ff9933'),
    new THREE.Color('#00ffcc'),
    new THREE.Color('#33ccff'),
    new THREE.Color('#ff6600'),
    new THREE.Color('#ffcc00'),
    new THREE.Color('#0099ff'),
    new THREE.Color('#cc66ff'),
    new THREE.Color('#33ffcc'),
    new THREE.Color('#6699ff'),
  ], [])

  // Calculate particle counts based on config
  const totalDustCount = PERFORMANCE.nebula.quantity.dustPrimary + PERFORMANCE.nebula.quantity.dustSecondary
  const totalWispCount = PERFORMANCE.nebula.quantity.wispMax * PERFORMANCE.nebula.quantity.total

  return (
    <group>
      {/* Instanced dust particles - single draw call for all dust */}
      <InstancedDust count={totalDustCount} color={colorPalette[0]} />

      {/* Instanced wisps - single draw call for all wisps */}
      <InstancedWisps count={totalWispCount} colorPalette={colorPalette} />
    </group>
  )
}
