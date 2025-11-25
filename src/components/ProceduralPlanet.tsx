import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Create procedural planet texture
function createPlanetTexture(
  baseColor: THREE.Color,
  secondaryColor: THREE.Color,
  tertiaryColor: THREE.Color,
  planetType: number,
  seed: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')!

  // Seeded random function
  const random = (n: number) => {
    const x = Math.sin(seed * 9999 + n) * 10000
    return x - Math.floor(x)
  }

  // Noise function
  const noise = (x: number, y: number, scale: number) => {
    const nx = Math.floor(x * scale) + seed
    const ny = Math.floor(y * scale)
    return random(nx * 57 + ny * 131)
  }

  // Fractal noise
  const fbm = (x: number, y: number, octaves: number) => {
    let value = 0
    let amplitude = 0.5
    let frequency = 1

    for (let i = 0; i < octaves; i++) {
      value += amplitude * noise(x * frequency, y * frequency, 8)
      amplitude *= 0.5
      frequency *= 2
    }
    return value
  }

  // Draw based on planet type
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const u = x / canvas.width
      const v = y / canvas.height

      // Spherical coordinates
      const theta = u * Math.PI * 2
      const phi = v * Math.PI
      const sx = Math.sin(phi) * Math.cos(theta)
      const sy = Math.cos(phi)
      const sz = Math.sin(phi) * Math.sin(theta)

      let r: number, g: number, b: number

      if (planetType === 0) {
        // Rocky planet with continents
        const continents = fbm(sx * 2, sy * 2, 5)
        const mountains = fbm(sx * 4, sz * 4, 3) * 0.3
        const terrain = continents + mountains

        if (terrain < 0.45) {
          // Ocean
          r = secondaryColor.r * 0.7
          g = secondaryColor.g * 0.7
          b = secondaryColor.b * 0.9
        } else if (terrain < 0.55) {
          // Beach/coast
          r = (baseColor.r + tertiaryColor.r) * 0.5
          g = (baseColor.g + tertiaryColor.g) * 0.5
          b = (baseColor.b + tertiaryColor.b) * 0.4
        } else if (terrain < 0.7) {
          // Land
          r = baseColor.r
          g = baseColor.g
          b = baseColor.b
        } else {
          // Mountains
          const snowLine = Math.abs(sy) > 0.7 ? 0.2 : 0
          r = tertiaryColor.r * (0.8 + snowLine)
          g = tertiaryColor.g * (0.8 + snowLine)
          b = tertiaryColor.b * (0.8 + snowLine)
        }

        // Polar caps
        if (Math.abs(sy) > 0.85) {
          r = 0.95
          g = 0.98
          b = 1.0
        }
      } else if (planetType === 1) {
        // Gas giant with bands
        const bands = Math.sin(sy * 12 + fbm(sx, sz, 3) * 2) * 0.5 + 0.5
        const storms = fbm(sx * 3, sz * 3 + sy, 4)

        r = baseColor.r * (0.7 + bands * 0.4) + storms * 0.1
        g = secondaryColor.g * (0.6 + bands * 0.5)
        b = tertiaryColor.b * (0.5 + storms * 0.3)

        // Great spot
        const spotDist = Math.sqrt((sx - 0.3) ** 2 + (sy - 0.2) ** 2 + sz ** 2)
        if (spotDist < 0.3) {
          const spotIntensity = 1 - spotDist / 0.3
          r = tertiaryColor.r * spotIntensity + r * (1 - spotIntensity)
          g = tertiaryColor.g * spotIntensity * 0.5 + g * (1 - spotIntensity)
          b = tertiaryColor.b * spotIntensity * 0.3 + b * (1 - spotIntensity)
        }
      } else if (planetType === 2) {
        // Ice planet
        const ice = fbm(sx * 2, sy * 2, 4)
        const cracks = fbm(sx * 8, sz * 8, 2)

        r = baseColor.r * 0.9 + ice * 0.1
        g = baseColor.g * 0.95 + ice * 0.1
        b = 0.95 + ice * 0.05

        // Cracks in ice
        if (cracks > 0.7) {
          r = secondaryColor.r
          g = secondaryColor.g
          b = secondaryColor.b * 1.2
        }
      } else if (planetType === 3) {
        // Lava planet
        const tectonics = fbm(sx * 2 + seed * 0.01, sy * 2, 5)
        const heat = fbm(sx * 4, sz * 4, 3)

        if (tectonics > 0.45) {
          // Lava flows
          r = 1.0
          g = 0.3 + heat * 0.4
          b = 0.05
        } else {
          // Cooled crust
          r = secondaryColor.r * 0.3 + tectonics * 0.1
          g = secondaryColor.g * 0.2
          b = secondaryColor.b * 0.1
        }
      } else {
        // Ocean planet
        const waves = fbm(sx * 3, sz * 3, 4)
        const depth = fbm(sx, sy, 3)

        r = secondaryColor.r * (0.4 + depth * 0.3)
        g = baseColor.g * (0.6 + waves * 0.2)
        b = baseColor.b * (0.8 + waves * 0.2)

        // Small islands
        if (depth > 0.75 && waves > 0.6) {
          r = tertiaryColor.r
          g = tertiaryColor.g * 0.8
          b = tertiaryColor.b * 0.5
        }
      }

      ctx.fillStyle = `rgb(${Math.floor(r * 255)}, ${Math.floor(g * 255)}, ${Math.floor(b * 255)})`
      ctx.fillRect(x, y, 1, 1)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}

// Create cloud texture
function createCloudTexture(seed: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')!

  const random = (n: number) => {
    const x = Math.sin(seed * 7777 + n) * 10000
    return x - Math.floor(x)
  }

  const noise = (x: number, y: number, scale: number) => {
    const nx = Math.floor(x * scale) + seed
    const ny = Math.floor(y * scale)
    return random(nx * 57 + ny * 131)
  }

  const fbm = (x: number, y: number, octaves: number) => {
    let value = 0
    let amplitude = 0.5
    let frequency = 1
    for (let i = 0; i < octaves; i++) {
      value += amplitude * noise(x * frequency, y * frequency, 8)
      amplitude *= 0.5
      frequency *= 2
    }
    return value
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const u = x / canvas.width
      const v = y / canvas.height

      const theta = u * Math.PI * 2
      const phi = v * Math.PI
      const sx = Math.sin(phi) * Math.cos(theta)
      const sy = Math.cos(phi)
      const sz = Math.sin(phi) * Math.sin(theta)

      const clouds = fbm(sx * 2, sz * 2 + sy, 5)

      if (clouds > 0.5) {
        const alpha = Math.min((clouds - 0.5) * 3, 0.8)
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}

// Planet type configuration based on file extension
function getPlanetConfig(extension: string, baseColor: THREE.Color) {
  const hash = extension.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

  const typeMap: Record<string, number> = {
    'ts': 0, 'tsx': 0, 'js': 0, 'jsx': 0, 'py': 0, 'rs': 0, 'go': 0, 'c': 0, 'cpp': 0, 'h': 0,
    'json': 1, 'yaml': 1, 'yml': 1, 'xml': 1, 'toml': 1, 'lock': 1,
    'css': 2, 'scss': 2, 'less': 2, 'sass': 2, 'styl': 2,
    'md': 3, 'txt': 3, 'rst': 3, 'doc': 3,
    'html': 4, 'htm': 4, 'vue': 4, 'svelte': 4,
  }

  const planetType = typeMap[extension] ?? (hash % 5)

  const hsl = { h: 0, s: 0, l: 0 }
  baseColor.getHSL(hsl)

  const secondary = new THREE.Color().setHSL((hsl.h + 0.15) % 1, hsl.s * 0.8, hsl.l * 0.6)
  const tertiary = new THREE.Color().setHSL((hsl.h + 0.05) % 1, hsl.s * 0.5, Math.min(hsl.l * 1.5, 0.95))

  const hasRings = planetType === 1 || (hash % 7 === 0)
  const hasClouds = planetType === 0 || planetType === 4 || (hash % 5 === 0)

  return {
    planetType,
    secondary,
    tertiary,
    hasRings,
    hasClouds,
    seed: hash,
  }
}

interface ProceduralPlanetProps {
  size: number
  color: THREE.Color
  extension: string
  rotationSpeed?: number
}

export default function ProceduralPlanet({
  size,
  color,
  extension,
  rotationSpeed = 0.01
}: ProceduralPlanetProps) {
  const planetRef = useRef<THREE.Mesh>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)

  const config = useMemo(() => getPlanetConfig(extension, color), [extension, color])

  // Create textures
  const planetTexture = useMemo(
    () => createPlanetTexture(color, config.secondary, config.tertiary, config.planetType, config.seed),
    [color, config]
  )

  const cloudTexture = useMemo(
    () => config.hasClouds ? createCloudTexture(config.seed) : null,
    [config]
  )

  // Ring geometry
  const ringGeometry = useMemo(() => {
    if (!config.hasRings) return null
    const inner = size * 1.4
    const outer = size * 2.2
    return new THREE.RingGeometry(inner, outer, 64)
  }, [size, config.hasRings])

  // Ring texture
  const ringTexture = useMemo(() => {
    if (!config.hasRings) return null

    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 1
    const ctx = canvas.getContext('2d')!

    // Create ring bands
    for (let x = 0; x < canvas.width; x++) {
      const t = x / canvas.width
      const bandNoise = Math.sin(t * 50 + config.seed) * 0.3 + Math.sin(t * 120 + config.seed * 2) * 0.2
      const alpha = Math.max(0, Math.min(1, 0.5 + bandNoise))

      // Gaps
      const gap = Math.sin(t * 30) > 0.9 ? 0 : 1

      const brightness = 0.6 + bandNoise * 0.4
      ctx.fillStyle = `rgba(${Math.floor(config.tertiary.r * 255 * brightness)}, ${Math.floor(config.tertiary.g * 255 * brightness)}, ${Math.floor(config.tertiary.b * 255 * brightness)}, ${alpha * gap})`
      ctx.fillRect(x, 0, 1, 1)
    }

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.ClampToEdgeWrapping
    return texture
  }, [config])

  useFrame(() => {
    if (planetRef.current) {
      planetRef.current.rotation.y += rotationSpeed
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += rotationSpeed * 1.2
    }
  })

  return (
    <group>
      {/* Planet surface */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[size, 64, 64]} />
        <meshStandardMaterial
          map={planetTexture}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>

      {/* Cloud layer */}
      {config.hasClouds && cloudTexture && (
        <mesh ref={cloudsRef}>
          <sphereGeometry args={[size * 1.02, 48, 48]} />
          <meshStandardMaterial
            map={cloudTexture}
            transparent
            opacity={0.6}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[size * 1.12, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer atmosphere */}
      <mesh>
        <sphereGeometry args={[size * 1.2, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Rings */}
      {config.hasRings && ringGeometry && ringTexture && (
        <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0, 0]} geometry={ringGeometry}>
          <meshBasicMaterial
            map={ringTexture}
            transparent
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}
