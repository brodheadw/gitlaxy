import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// High-resolution procedural nebula skybox
function createNebulaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 4096
  canvas.height = 4096
  const ctx = canvas.getContext('2d')!

  // Deep space gradient base
  const bgGradient = ctx.createRadialGradient(2048, 2048, 0, 2048, 2048, 2900)
  bgGradient.addColorStop(0, '#0a0a15')
  bgGradient.addColorStop(0.5, '#050510')
  bgGradient.addColorStop(1, '#020208')
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, 4096, 4096)

  // NMS-style vibrant nebula colors - more spread out for backdrop
  const nebulaConfigs = [
    { x: 800, y: 600, color1: '#ff3366', color2: '#ff6b9d', size: 1200, intensity: 0.2 },
    { x: 3200, y: 800, color1: '#00ffcc', color2: '#4ecdc4', size: 1100, intensity: 0.18 },
    { x: 2000, y: 3000, color1: '#9933ff', color2: '#cc66ff', size: 1300, intensity: 0.2 },
    { x: 400, y: 2400, color1: '#ff6600', color2: '#ffaa33', size: 1000, intensity: 0.16 },
    { x: 3400, y: 2800, color1: '#0099ff', color2: '#66ccff', size: 1100, intensity: 0.18 },
    { x: 1600, y: 1200, color1: '#ff0066', color2: '#ff66aa', size: 900, intensity: 0.15 },
    { x: 2800, y: 1600, color1: '#ffcc00', color2: '#ffee66', size: 800, intensity: 0.12 },
    { x: 1000, y: 3200, color1: '#00ff99', color2: '#66ffcc', size: 850, intensity: 0.13 },
    { x: 3600, y: 400, color1: '#ff3399', color2: '#ff77bb', size: 750, intensity: 0.11 },
    { x: 600, y: 1000, color1: '#6633ff', color2: '#9966ff', size: 780, intensity: 0.12 },
  ]

  // Draw nebulae with multiple layers for depth
  for (const nebula of nebulaConfigs) {
    for (let layer = 0; layer < 6; layer++) {
      const layerSize = nebula.size * (1 + layer * 0.5)
      const opacity = nebula.intensity * (1 - layer * 0.15)

      const gradient = ctx.createRadialGradient(
        nebula.x + (Math.random() - 0.5) * 80,
        nebula.y + (Math.random() - 0.5) * 80,
        0,
        nebula.x,
        nebula.y,
        layerSize
      )

      const color1 = new THREE.Color(nebula.color1)
      const color2 = new THREE.Color(nebula.color2)

      gradient.addColorStop(0, `rgba(${Math.floor(color1.r * 255)}, ${Math.floor(color1.g * 255)}, ${Math.floor(color1.b * 255)}, ${opacity})`)
      gradient.addColorStop(0.3, `rgba(${Math.floor(color2.r * 255)}, ${Math.floor(color2.g * 255)}, ${Math.floor(color2.b * 255)}, ${opacity * 0.5})`)
      gradient.addColorStop(0.6, `rgba(${Math.floor(color2.r * 255)}, ${Math.floor(color2.g * 255)}, ${Math.floor(color2.b * 255)}, ${opacity * 0.15})`)
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 4096, 4096)
    }

    // Add wispy tendrils
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    for (let t = 0; t < 10; t++) {
      const angle = (t / 10) * Math.PI * 2 + Math.random() * 0.5
      const tendrilLength = nebula.size * (0.6 + Math.random() * 0.8)

      const tendrilGradient = ctx.createLinearGradient(
        nebula.x,
        nebula.y,
        nebula.x + Math.cos(angle) * tendrilLength,
        nebula.y + Math.sin(angle) * tendrilLength
      )

      const color = new THREE.Color(nebula.color1)
      tendrilGradient.addColorStop(0, `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, ${nebula.intensity * 0.25})`)
      tendrilGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

      ctx.strokeStyle = tendrilGradient
      ctx.lineWidth = 20 + Math.random() * 50
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(nebula.x, nebula.y)

      const cx = nebula.x + Math.cos(angle + 0.3) * tendrilLength * 0.5
      const cy = nebula.y + Math.sin(angle + 0.3) * tendrilLength * 0.5
      ctx.quadraticCurveTo(cx, cy, nebula.x + Math.cos(angle) * tendrilLength, nebula.y + Math.sin(angle) * tendrilLength)
      ctx.stroke()
    }
    ctx.restore()
  }

  // Dense star field
  const starColors = ['#ffffff', '#fff8f0', '#f0f8ff', '#fffaf0', '#fff0f5', '#f0ffff']

  for (let i = 0; i < 10000; i++) {
    const x = Math.random() * 4096
    const y = Math.random() * 4096
    const size = Math.random() * 1.2 + 0.3
    const brightness = Math.random() * 0.6 + 0.2

    ctx.fillStyle = starColors[Math.floor(Math.random() * starColors.length)]
    ctx.globalAlpha = brightness
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalAlpha = 1
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * 4096
    const y = Math.random() * 4096
    const size = Math.random() * 2.5 + 1
    const brightness = Math.random() * 0.4 + 0.6

    const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 6)
    const starColor = starColors[Math.floor(Math.random() * starColors.length)]
    glowGradient.addColorStop(0, starColor)
    glowGradient.addColorStop(0.1, `rgba(255, 255, 255, ${brightness * 0.8})`)
    glowGradient.addColorStop(0.4, `rgba(255, 255, 255, ${brightness * 0.2})`)
    glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

    ctx.fillStyle = glowGradient
    ctx.fillRect(x - size * 6, y - size * 6, size * 12, size * 12)

    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()

    if (brightness > 0.8 && Math.random() > 0.5) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${brightness * 0.5})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x - size * 4, y)
      ctx.lineTo(x + size * 4, y)
      ctx.moveTo(x, y - size * 4)
      ctx.lineTo(x, y + size * 4)
      ctx.stroke()
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 16
  return texture
}

// Amorphous volumetric nebula cloud - multiple overlapping transparent layers
function VolumetricNebula({ position, color, secondaryColor, size, seed }: {
  position: [number, number, number]
  color: string
  secondaryColor: string
  size: number
  seed: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const threeColor = useMemo(() => new THREE.Color(color), [color])
  const threeSecondary = useMemo(() => new THREE.Color(secondaryColor), [secondaryColor])

  // Create multiple blob positions for this nebula region
  const blobs = useMemo(() => {
    const result = []
    const blobCount = 8 + Math.floor(seed % 6)

    for (let i = 0; i < blobCount; i++) {
      const angle = (i / blobCount) * Math.PI * 2 + (seed * 0.1)
      const dist = (0.2 + Math.random() * 0.8) * size
      const verticalOffset = (Math.random() - 0.5) * size * 0.6

      result.push({
        offset: [
          Math.cos(angle) * dist,
          verticalOffset,
          Math.sin(angle) * dist
        ] as [number, number, number],
        scale: 0.3 + Math.random() * 0.7,
        colorMix: Math.random(),
        rotationSpeed: (Math.random() - 0.5) * 0.002,
        layers: 4 + Math.floor(Math.random() * 4)
      })
    }
    return result
  }, [size, seed])

  useFrame((state) => {
    if (!groupRef.current) return
    const time = state.clock.elapsedTime
    groupRef.current.rotation.y = time * 0.002
  })

  return (
    <group ref={groupRef} position={position}>
      {blobs.map((blob, blobIndex) => (
        <group key={blobIndex} position={blob.offset}>
          {/* Multiple overlapping spheres create the amorphous effect */}
          {Array.from({ length: blob.layers }).map((_, layerIndex) => {
            const layerScale = blob.scale * size * (0.3 + layerIndex * 0.25)
            const opacity = 0.02 / (layerIndex + 1)
            const mixedColor = new THREE.Color().lerpColors(
              threeColor,
              threeSecondary,
              blob.colorMix + layerIndex * 0.1
            )

            return (
              <mesh
                key={layerIndex}
                rotation={[
                  layerIndex * 0.4 + blobIndex * 0.2,
                  layerIndex * 0.3 + blobIndex * 0.1,
                  layerIndex * 0.2
                ]}
                scale={[
                  1 + Math.sin(blobIndex + layerIndex) * 0.3,
                  1 + Math.cos(blobIndex + layerIndex) * 0.2,
                  1 + Math.sin(blobIndex * 2 + layerIndex) * 0.25
                ]}
              >
                <icosahedronGeometry args={[layerScale, 3]} />
                <meshBasicMaterial
                  color={mixedColor}
                  transparent
                  opacity={opacity}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            )
          })}
        </group>
      ))}
    </group>
  )
}

export default function SpaceBackground() {
  const skyTexture = useMemo(() => createNebulaTexture(), [])

  // Volumetric nebula regions - positioned to create blending regions
  const nebulaRegions = useMemo(() => [
    // Large primary regions
    { position: [-4000, 800, -3000] as [number, number, number], color: '#ff3366', secondaryColor: '#ff9933', size: 2500, seed: 1 },
    { position: [3500, -500, -2500] as [number, number, number], color: '#00ffcc', secondaryColor: '#33ccff', size: 2200, seed: 2 },
    { position: [0, 1200, -4000] as [number, number, number], color: '#9933ff', secondaryColor: '#ff33cc', size: 2800, seed: 3 },
    { position: [-3000, -800, 2000] as [number, number, number], color: '#ff6600', secondaryColor: '#ffcc00', size: 2000, seed: 4 },
    { position: [4000, 300, 1000] as [number, number, number], color: '#0099ff', secondaryColor: '#00ffcc', size: 2300, seed: 5 },

    // Overlapping transition regions (positioned between main regions to create blending)
    { position: [-500, 500, -3500] as [number, number, number], color: '#cc66ff', secondaryColor: '#ff3366', size: 1800, seed: 6 },
    { position: [2000, -200, -1000] as [number, number, number], color: '#33ffcc', secondaryColor: '#6699ff', size: 1600, seed: 7 },
    { position: [-2000, 0, -500] as [number, number, number], color: '#ff9966', secondaryColor: '#cc33ff', size: 1500, seed: 8 },
    { position: [1000, 600, 2000] as [number, number, number], color: '#66ccff', secondaryColor: '#ff66cc', size: 1700, seed: 9 },
    { position: [-1500, -400, -2000] as [number, number, number], color: '#ff6699', secondaryColor: '#ffcc66', size: 1400, seed: 10 },

    // Smaller accent clouds for additional depth
    { position: [2500, 1000, -500] as [number, number, number], color: '#ffcc00', secondaryColor: '#ff6633', size: 1000, seed: 11 },
    { position: [-2500, -600, 3000] as [number, number, number], color: '#00ff99', secondaryColor: '#33ccff', size: 1100, seed: 12 },
    { position: [500, -800, 1500] as [number, number, number], color: '#ff3399', secondaryColor: '#9966ff', size: 900, seed: 13 },
  ], [])

  return (
    <group>
      {/* Skybox sphere - VERY far away */}
      <mesh>
        <sphereGeometry args={[20000, 64, 64]} />
        <meshBasicMaterial
          map={skyTexture}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Volumetric nebulae within the scene - these blend together */}
      {nebulaRegions.map((region, i) => (
        <VolumetricNebula key={i} {...region} />
      ))}
    </group>
  )
}
