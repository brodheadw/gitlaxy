import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PERFORMANCE } from '../config/performance'
import { createSeededRandom, RANDOM_SEEDS } from '../utils/random'
import { useFrameThrottle } from '../hooks/useFrameThrottle'
import { fastSin, fastCos } from '../utils/mathTables'

// Individual animated wisp/tendril within a nebula
function NebulaWisp({ position, color, size, seed }: {
  position: [number, number, number]
  color: THREE.Color
  size: number
  seed: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const throttle = useFrameThrottle(PERFORMANCE.updates.nebulaInterval)

  useFrame((state) => {
    if (!meshRef.current) return
    if (!PERFORMANCE.toggles.nebulaAnimation || !PERFORMANCE.toggles.wispAnimation) return
    if (!throttle.shouldUpdate()) return

    const time = state.clock.elapsedTime
    const anim = PERFORMANCE.nebula.animation

    // Gentle floating motion - using fast lookup tables
    meshRef.current.position.x = position[0] + fastSin(time * anim.wispFloatX + seed) * size * 0.1
    meshRef.current.position.y = position[1] + fastCos(time * anim.wispFloatY + seed * 2) * size * 0.08
    meshRef.current.position.z = position[2] + fastSin(time * anim.wispFloatZ + seed * 3) * size * 0.1

    // Slow rotation
    meshRef.current.rotation.x = time * anim.wispRotateX + seed
    meshRef.current.rotation.y = time * anim.wispRotateY

    // Pulsing scale - using fast lookup table
    const pulse = 1 + fastSin(time * anim.wispPulse + seed) * 0.15
    meshRef.current.scale.setScalar(pulse)
  })

  return (
    <mesh ref={meshRef} position={position}>
      <icosahedronGeometry args={[size, 1]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={PERFORMANCE.nebula.visual.wispOpacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// Swirling dust particles within nebula
function NebulaDust({ basePosition, color, count, spread, seed }: {
  basePosition: [number, number, number]
  color: THREE.Color
  count: number
  spread: number
  seed: number
}) {
  const pointsRef = useRef<THREE.Points>(null)
  const throttle = useFrameThrottle(PERFORMANCE.updates.nebulaInterval)

  const { positions, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const siz = new Float32Array(count)
    const seeded = createSeededRandom(seed, RANDOM_SEEDS.dustParticles)

    for (let i = 0; i < count; i++) {
      const theta = seeded(i) * Math.PI * 2
      const phi = Math.acos(2 * seeded(i + 1000) - 1)
      const r = seeded(i + 2000) * spread

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
      siz[i] = 3 + seeded(i + 3000) * 8
    }
    return { positions: pos, sizes: siz }
  }, [count, spread, seed])

  useFrame((state) => {
    if (!pointsRef.current) return
    if (!PERFORMANCE.toggles.nebulaAnimation || !PERFORMANCE.toggles.dustAnimation) return
    if (!throttle.shouldUpdate()) return

    const time = state.clock.elapsedTime
    const anim = PERFORMANCE.nebula.animation

    // Slow swirling motion - using fast lookup table
    pointsRef.current.rotation.y = time * anim.dustRotateY + seed
    pointsRef.current.rotation.x = fastSin(time * anim.dustRotateX) * 0.1
  })

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return geo
  }, [positions, sizes])

  return (
    <points ref={pointsRef} position={basePosition} geometry={geometry}>
      <pointsMaterial
        color={color}
        size={4}
        transparent
        opacity={PERFORMANCE.nebula.visual.dustOpacity}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}


// Amorphous volumetric nebula cloud - multiple overlapping transparent layers with animation
function VolumetricNebula({ position, color, secondaryColor, size, seed }: {
  position: [number, number, number]
  color: string
  secondaryColor: string
  size: number
  seed: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const coreRef = useRef<THREE.Group>(null)
  const threeColor = useMemo(() => new THREE.Color(color), [color])
  const threeSecondary = useMemo(() => new THREE.Color(secondaryColor), [secondaryColor])
  const cfg = PERFORMANCE.nebula

  // Seeded random for consistent generation
  const seededRandom = createSeededRandom(seed, RANDOM_SEEDS.nebulaWisps)

  // Create multiple blob positions for this nebula region
  const blobs = useMemo(() => {
    const result = []
    const blobRange = cfg.quantity.blobMax - cfg.quantity.blobMin + 1
    const blobCount = cfg.quantity.blobMin + Math.floor(seededRandom(0) * blobRange)

    for (let i = 0; i < blobCount; i++) {
      const angle = (i / blobCount) * Math.PI * 2 + (seed * 0.1)
      const dist = (0.15 + seededRandom(i) * 0.85) * size
      const verticalOffset = (seededRandom(i + 100) - 0.5) * size * 0.7

      result.push({
        offset: [
          Math.cos(angle) * dist,
          verticalOffset,
          Math.sin(angle) * dist
        ] as [number, number, number],
        scale: 0.25 + seededRandom(i + 200) * 0.75,
        colorMix: seededRandom(i + 300),
        phaseOffset: seededRandom(i + 400) * Math.PI * 2,
        layers: cfg.quantity.layersMin + Math.floor(seededRandom(i + 500) * (cfg.quantity.layersMax - cfg.quantity.layersMin + 1))
      })
    }
    return result
  }, [cfg.quantity.blobMax, cfg.quantity.blobMin, cfg.quantity.layersMax, cfg.quantity.layersMin, size, seed, seededRandom])

  // Create wisps - floating tendrils
  const wisps = useMemo(() => {
    const result = []
    const wispCount = cfg.quantity.wispMin + Math.floor(seededRandom(1000) * (cfg.quantity.wispMax - cfg.quantity.wispMin + 1))

    for (let i = 0; i < wispCount; i++) {
      const angle = seededRandom(i + 2000) * Math.PI * 2
      const dist = seededRandom(i + 2100) * size * 1.2
      const y = (seededRandom(i + 2200) - 0.5) * size * 0.8

      const mixedColor = new THREE.Color().lerpColors(
        threeColor,
        threeSecondary,
        seededRandom(i + 2300)
      )

      result.push({
        position: [
          Math.cos(angle) * dist,
          y,
          Math.sin(angle) * dist
        ] as [number, number, number],
        color: mixedColor,
        size: size * (0.3 + seededRandom(i + 2400) * 0.5),
        seed: seed + i
      })
    }
    return result
  }, [cfg.quantity.wispMax, cfg.quantity.wispMin, size, seed, threeColor, threeSecondary, seededRandom])


  useFrame((state) => {
    if (!groupRef.current) return
    if (!PERFORMANCE.toggles.nebulaAnimation) return
    const time = state.clock.elapsedTime
    const anim = cfg.animation

    // Very slow overall rotation
    groupRef.current.rotation.y = time * anim.groupRotate

    // Core group has slight wobble - using fast lookup tables
    if (coreRef.current) {
      coreRef.current.rotation.x = fastSin(time * anim.coreWobbleX) * 0.05
      coreRef.current.rotation.z = fastCos(time * anim.coreWobbleZ) * 0.03
    }
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Core blobs - the main body of the nebula */}
      <group ref={coreRef}>
        {blobs.map((blob, blobIndex) => (
          <group key={blobIndex} position={blob.offset}>
            {/* Multiple overlapping shapes create the amorphous effect */}
            {Array.from({ length: blob.layers }).map((_, layerIndex) => {
              const layerScale = blob.scale * size * (0.4 + layerIndex * 0.35)
              const opacity = cfg.visual.layerOpacity / (layerIndex * 0.4 + 1)
              const mixedColor = new THREE.Color().lerpColors(
                threeColor,
                threeSecondary,
                blob.colorMix + layerIndex * 0.08
              )

              return (
                <mesh
                  key={layerIndex}
                  rotation={[
                    layerIndex * 0.5 + blobIndex * 0.25 + blob.phaseOffset,
                    layerIndex * 0.4 + blobIndex * 0.15,
                    layerIndex * 0.3 + blob.phaseOffset * 0.5
                  ]}
                  scale={[
                    1 + Math.sin(blobIndex + layerIndex + blob.phaseOffset) * 0.35,
                    1 + Math.cos(blobIndex + layerIndex) * 0.25,
                    1 + Math.sin(blobIndex * 2 + layerIndex + blob.phaseOffset) * 0.3
                  ]}
                >
                  <icosahedronGeometry args={[layerScale, 2]} />
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

      {/* Animated wisps floating around the core */}
      {wisps.map((wisp, i) => (
        <NebulaWisp key={`wisp-${i}`} {...wisp} />
      ))}

      {/* Swirling dust particles - extended for blending */}
      <NebulaDust
        basePosition={[0, 0, 0]}
        color={threeColor}
        count={cfg.quantity.dustPrimary}
        spread={size * 3}
        seed={seed}
      />
      <NebulaDust
        basePosition={[0, 0, 0]}
        color={threeSecondary}
        count={cfg.quantity.dustSecondary}
        spread={size * 2}
        seed={seed + 1000}
      />
    </group>
  )
}

export default function SpaceBackground() {
  // Volumetric nebula regions - spread throughout entire space with 3D distribution (5x scale)
  const nebulaRegions = useMemo(() => {
    const regions = [
    // Core region nebulae - some above and below (5x scale)
    { position: [0, 15000, -10000] as [number, number, number], color: '#9933ff', secondaryColor: '#ff33cc', size: 20000, seed: 1 },
    { position: [-10000, -20000, 5000] as [number, number, number], color: '#ff3366', secondaryColor: '#ff9933', size: 17500, seed: 2 },
    { position: [12500, 25000, -2500] as [number, number, number], color: '#00ffcc', secondaryColor: '#33ccff', size: 19000, seed: 3 },

    // Inner sphere (25000-40000 units out) - distributed in 3D (5x scale)
    { position: [-25000, 30000, -20000] as [number, number, number], color: '#ff6600', secondaryColor: '#ffcc00', size: 22500, seed: 4 },
    { position: [30000, -35000, 15000] as [number, number, number], color: '#0099ff', secondaryColor: '#00ffcc', size: 21000, seed: 5 },
    { position: [15000, -25000, -30000] as [number, number, number], color: '#cc66ff', secondaryColor: '#ff3366', size: 19000, seed: 6 },
    { position: [-20000, 40000, 25000] as [number, number, number], color: '#33ffcc', secondaryColor: '#6699ff', size: 20000, seed: 7 },

    // Mid sphere (50000-75000 units out) (5x scale)
    { position: [-60000, 50000, -40000] as [number, number, number], color: '#ff9966', secondaryColor: '#cc33ff', size: 27500, seed: 8 },
    { position: [50000, -60000, 50000] as [number, number, number], color: '#66ccff', secondaryColor: '#ff66cc', size: 26000, seed: 9 },
    { position: [70000, 40000, -25000] as [number, number, number], color: '#ff6699', secondaryColor: '#ffcc66', size: 24000, seed: 10 },
    { position: [-40000, -50000, 60000] as [number, number, number], color: '#ffcc00', secondaryColor: '#ff6633', size: 22500, seed: 11 },
    { position: [25000, 75000, 40000] as [number, number, number], color: '#99ff66', secondaryColor: '#ccff99', size: 25000, seed: 20 },
    { position: [-50000, -40000, -50000] as [number, number, number], color: '#ff66aa', secondaryColor: '#ffaacc', size: 24000, seed: 21 },

    // Outer sphere (90000-125000 units out) - larger nebulae at the edges (5x scale)
    { position: [-100000, 75000, -60000] as [number, number, number], color: '#00ff99', secondaryColor: '#33ccff', size: 32500, seed: 12 },
    { position: [110000, -90000, 40000] as [number, number, number], color: '#ff3399', secondaryColor: '#9966ff', size: 31000, seed: 13 },
    { position: [40000, 100000, -90000] as [number, number, number], color: '#6699ff', secondaryColor: '#99ccff', size: 29000, seed: 14 },
    { position: [-75000, -100000, 75000] as [number, number, number], color: '#ff6644', secondaryColor: '#ffaa66', size: 30000, seed: 15 },
    { position: [90000, 60000, 90000] as [number, number, number], color: '#66ffcc', secondaryColor: '#aaffee', size: 27500, seed: 22 },
    { position: [-90000, 90000, -25000] as [number, number, number], color: '#ff99cc', secondaryColor: '#ffccee', size: 29000, seed: 23 },

    // Far outer nebulae (140000-200000 units) - at the edges of visible space (5x scale)
    { position: [-150000, 125000, -75000] as [number, number, number], color: '#9966ff', secondaryColor: '#cc99ff', size: 40000, seed: 16 },
    { position: [140000, -125000, -100000] as [number, number, number], color: '#66ffcc', secondaryColor: '#99ffdd', size: 37500, seed: 17 },
    { position: [0, 175000, 100000] as [number, number, number], color: '#ff9999', secondaryColor: '#ffcccc', size: 39000, seed: 18 },
    { position: [-125000, -150000, -125000] as [number, number, number], color: '#99ccff', secondaryColor: '#cceeff', size: 36000, seed: 19 },
    { position: [175000, 50000, 50000] as [number, number, number], color: '#ffcc66', secondaryColor: '#ffee99', size: 35000, seed: 24 },
    { position: [-50000, -175000, 150000] as [number, number, number], color: '#cc99ff', secondaryColor: '#eeccff', size: 37500, seed: 25 },
    { position: [100000, 150000, -150000] as [number, number, number], color: '#99ffcc', secondaryColor: '#ccffee', size: 40000, seed: 26 },
    { position: [-175000, 25000, 125000] as [number, number, number], color: '#ff6699', secondaryColor: '#ff99bb', size: 36000, seed: 27 },

    // Extreme distance nebulae (200000+ units) - backdrop nebulae (5x scale)
    { position: [0, -200000, 0] as [number, number, number], color: '#6666ff', secondaryColor: '#9999ff', size: 50000, seed: 28 },
    { position: [0, 200000, 0] as [number, number, number], color: '#ff6666', secondaryColor: '#ff9999', size: 50000, seed: 29 },
    { position: [200000, 0, 0] as [number, number, number], color: '#66ff66', secondaryColor: '#99ff99', size: 45000, seed: 30 },
    { position: [-200000, 0, 0] as [number, number, number], color: '#ffff66', secondaryColor: '#ffff99', size: 45000, seed: 31 },
    { position: [0, 0, 200000] as [number, number, number], color: '#66ffff', secondaryColor: '#99ffff', size: 45000, seed: 32 },
    { position: [0, 0, -200000] as [number, number, number], color: '#ff66ff', secondaryColor: '#ff99ff', size: 45000, seed: 33 },
    ]

    return regions.slice(0, Math.min(regions.length, PERFORMANCE.nebula.quantity.total))
  }, [])

  return (
    <group>
      {/* Volumetric nebulae within the scene - these blend together */}
      {nebulaRegions.map((region, i) => (
        <VolumetricNebula key={i} {...region} />
      ))}
    </group>
  )
}
