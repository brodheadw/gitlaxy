/**
 * Seeded random number generation and noise functions for procedural generation.
 * These utilities provide deterministic randomness for consistent visual outputs.
 */

/**
 * Random seed multipliers for different procedural generation contexts.
 * These constants ensure consistent visual outputs across different components.
 */
export const RANDOM_SEEDS = {
  planetTexture: 9999,
  cloudTexture: 7777,
  dustParticles: 1337,
  nebulaWisps: 9999,
} as const

/**
 * Creates a seeded random number generator function.
 *
 * @param seed - The seed value for random generation
 * @param multiplier - Optional multiplier for the seed (default: 9999)
 * @returns A function that takes a number and returns a deterministic random value between 0 and 1
 */
export function createSeededRandom(seed: number, multiplier: number = 9999): (n: number) => number {
  return (n: number) => {
    const x = Math.sin(seed * multiplier + n) * 10000
    return x - Math.floor(x)
  }
}

/**
 * Generates 2D noise using a seeded random function.
 *
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param random - Seeded random function from createSeededRandom
 * @param scale - Optional scale factor for noise frequency
 * @param seed - Optional seed offset for noise generation
 * @returns A noise value between 0 and 1
 */
export function noise(
  x: number,
  y: number,
  random: (n: number) => number,
  scale: number = 1,
  seed: number = 0
): number {
  const nx = Math.floor(x * scale) + seed
  const ny = Math.floor(y * scale)
  return random(nx * 57 + ny * 131)
}

/**
 * Fractal Brownian Motion - layered noise for natural-looking patterns.
 * Combines multiple octaves of noise at different frequencies and amplitudes.
 *
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param random - Seeded random function from createSeededRandom
 * @param scale - Scale factor for base noise frequency
 * @param octaves - Number of noise layers to combine (more = more detail)
 * @param seed - Optional seed offset for noise generation
 * @returns A fractal noise value between 0 and 1
 */
export function fbm(
  x: number,
  y: number,
  random: (n: number) => number,
  scale: number = 1,
  octaves: number = 4,
  seed: number = 0
): number {
  let value = 0
  let amplitude = 0.5
  let frequency = 1

  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise(x * frequency, y * frequency, random, scale, seed)
    amplitude *= 0.5
    frequency *= 2
  }
  return value
}
