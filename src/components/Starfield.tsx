import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// NMS-inspired color palette - vibrant sci-fi colors
const NMS_COLORS = [
  '#ff6b6b', // coral red
  '#4ecdc4', // teal
  '#ffe66d', // yellow
  '#95e1d3', // mint
  '#f38181', // salmon
  '#aa96da', // lavender
  '#fcbad3', // pink
  '#a8d8ea', // sky blue
  '#ff9f43', // orange
  '#6c5ce7', // purple
]

interface StarData {
  position: THREE.Vector3
  color: THREE.Color
  size: number
  baseY: number
  speed: number
  phase: number
}

export default function Starfield() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const count = 200

  // Generate star data
  const stars = useMemo<StarData[]>(() => {
    return Array.from({ length: count }, () => {
      const color = new THREE.Color(NMS_COLORS[Math.floor(Math.random() * NMS_COLORS.length)])
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100
      )
      return {
        position,
        color,
        size: 0.3 + Math.random() * 0.7,
        baseY: position.y,
        speed: 0.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
      }
    })
  }, [])

  // Set up initial positions and colors
  useMemo(() => {
    if (!meshRef.current) return

    const dummy = new THREE.Object3D()
    const color = new THREE.Color()

    stars.forEach((star, i) => {
      dummy.position.copy(star.position)
      dummy.scale.setScalar(star.size)
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)

      color.copy(star.color)
      meshRef.current!.setColorAt(i, color)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  }, [stars])

  // Gentle floating animation
  useFrame((state) => {
    if (!meshRef.current) return

    const time = state.clock.elapsedTime
    const dummy = new THREE.Object3D()

    stars.forEach((star, i) => {
      // Gentle bob up and down
      const y = star.baseY + Math.sin(time * star.speed + star.phase) * 0.5

      dummy.position.set(star.position.x, y, star.position.z)
      dummy.scale.setScalar(star.size * (1 + Math.sin(time * 2 + star.phase) * 0.1))
      dummy.updateMatrix()
      meshRef.current!.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <icosahedronGeometry args={[1, 2]} />
      <meshStandardMaterial
        emissive="#ffffff"
        emissiveIntensity={0.5}
        toneMapped={false}
      />
    </instancedMesh>
  )
}
