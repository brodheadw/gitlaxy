import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PERFORMANCE } from '../config/performance'
import { createSeededRandom, fbm, RANDOM_SEEDS } from '../utils/random'
import { createCanvasTexture, type RGBColor } from '../utils/textureUtils'

// Create procedural planet texture
function createPlanetTexture(
  baseColor: THREE.Color,
  secondaryColor: THREE.Color,
  tertiaryColor: THREE.Color,
  planetType: number,
  seed: number
): THREE.CanvasTexture {
  const textureCfg = PERFORMANCE.files.texture
  const baseScale = textureCfg.scale
  const baseOctaves = textureCfg.octaves

  // Create seeded random function for planet texture
  const random = createSeededRandom(seed, RANDOM_SEEDS.planetTexture)

  return createCanvasTexture(
    textureCfg.width,
    textureCfg.height,
    (_u, _v, sx, sy, sz): RGBColor => {
      let r: number, g: number, b: number

      if (planetType === 0) {
        // Rocky planet with continents
        const continents = fbm(sx * baseScale * 0.25, sy * baseScale * 0.25, random, baseScale, baseOctaves, seed)
        const mountains = fbm(sx * baseScale * 0.5, sz * baseScale * 0.5, random, baseScale, Math.max(1, baseOctaves - 2), seed) * 0.3
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
        const bands = Math.sin(sy * 12 + fbm(sx * baseScale * 0.15, sz * baseScale * 0.15, random, baseScale, Math.max(1, baseOctaves - 2), seed) * 2) * 0.5 + 0.5
        const storms = fbm(sx * baseScale * 0.4, sz * baseScale * 0.4 + sy, random, baseScale, Math.max(1, baseOctaves - 1), seed)

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
        const ice = fbm(sx * baseScale * 0.25, sy * baseScale * 0.25, random, baseScale, Math.max(1, baseOctaves - 1), seed)
        const cracks = fbm(sx * baseScale, sz * baseScale, random, baseScale, Math.max(1, baseOctaves - 3), seed)

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
        const tectonics = fbm(sx * baseScale * 0.25 + seed * 0.01, sy * baseScale * 0.25, random, baseScale, baseOctaves, seed)
        const heat = fbm(sx * baseScale * 0.5, sz * baseScale * 0.5, random, baseScale, Math.max(1, baseOctaves - 2), seed)

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
        const waves = fbm(sx * baseScale * 0.35, sz * baseScale * 0.35, random, baseScale, Math.max(1, baseOctaves - 1), seed)
        const depth = fbm(sx * baseScale * 0.15, sy * baseScale * 0.15, random, baseScale, Math.max(1, baseOctaves - 2), seed)

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

      return { r, g, b }
    }
  )
}

// Create cloud texture
function createCloudTexture(seed: number): THREE.CanvasTexture {
  const textureCfg = PERFORMANCE.files.texture
  const baseScale = textureCfg.scale
  const baseOctaves = textureCfg.octaves

  // Create seeded random function for cloud texture
  const random = createSeededRandom(seed, RANDOM_SEEDS.cloudTexture)

  return createCanvasTexture(
    textureCfg.width,
    textureCfg.height,
    (_u, _v, sx, sy, sz): RGBColor | null => {
      const clouds = fbm(sx * baseScale * 0.25, sz * baseScale * 0.25 + sy, random, baseScale, baseOctaves, seed)

      if (clouds > 0.5) {
        const alpha = Math.min((clouds - 0.5) * 3, 0.8)
        return { r: 1, g: 1, b: 1, a: alpha } as RGBColor & { a: number }
      }

      // Return null for transparent pixels
      return null
    },
    true // Clear canvas for transparency
  )
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
  rotationSpeed = PERFORMANCE.files.animation.rotationSpeed
}: ProceduralPlanetProps) {
  const planetRef = useRef<THREE.Mesh>(null)
  const cloudsRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const geometryCfg = PERFORMANCE.files.geometry
  const atmosphereCfg = PERFORMANCE.files.atmosphere

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
    return new THREE.RingGeometry(inner, outer, PERFORMANCE.files.geometry.ringDetail)
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
    if (!PERFORMANCE.toggles.orbitAnimation) return

    if (planetRef.current) {
      planetRef.current.rotation.y += rotationSpeed
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += rotationSpeed * 1.2
    }
  })

  // Cleanup textures on unmount to prevent VRAM leaks
  useEffect(() => {
    return () => {
      // Dispose of all procedurally generated textures
      planetTexture?.dispose()
      cloudTexture?.dispose()
      ringTexture?.dispose()

      // Dispose of ring geometry if it exists
      ringGeometry?.dispose()
    }
  }, [planetTexture, cloudTexture, ringTexture, ringGeometry])

  return (
    <group>
      {/* Planet surface */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[size, geometryCfg.sphereDetail, geometryCfg.sphereDetail]} />
        <meshStandardMaterial
          map={planetTexture}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>

      {/* Cloud layer */}
      {config.hasClouds && cloudTexture && (
        <mesh ref={cloudsRef}>
          <sphereGeometry args={[size * 1.02, geometryCfg.cloudDetail, geometryCfg.cloudDetail]} />
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
        <sphereGeometry args={[size * atmosphereCfg.innerScale, geometryCfg.cloudDetail, geometryCfg.cloudDetail]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer atmosphere */}
      <mesh>
        <sphereGeometry args={[size * atmosphereCfg.outerScale, geometryCfg.cloudDetail, geometryCfg.cloudDetail]} />
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
