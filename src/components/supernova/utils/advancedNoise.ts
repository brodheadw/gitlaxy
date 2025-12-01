// Advanced noise functions for NASA-grade rendering
import { perlinNoise2D, fbm as basicFbm } from '../../../utils/noiseUtils';

// Curl noise for divergence-free turbulence
export function curlNoise2D(x: number, y: number, epsilon: number = 0.001): [number, number] {
  const n = perlinNoise2D(x, y);
  const n1 = perlinNoise2D(x + epsilon, y);
  const n2 = perlinNoise2D(x, y + epsilon);
  
  const dx = (n2 - n) / epsilon;
  const dy = -(n1 - n) / epsilon;
  
  return [dx, dy];
}

// Domain warping for more organic patterns
export function domainWarp(
  x: number,
  y: number,
  warpStrength: number = 0.5,
  octaves: number = 4
): [number, number] {
  const offsetX = basicFbm(x * 0.5, y * 0.5, octaves) * warpStrength;
  const offsetY = basicFbm(x * 0.5 + 100, y * 0.5 + 100, octaves) * warpStrength;
  
  return [x + offsetX, y + offsetY];
}

// Multi-octave curl noise
export function multiscaleCurl(
  x: number,
  y: number,
  octaves: number = 6
): [number, number] {
  let dx = 0;
  let dy = 0;
  let amplitude = 1;
  let frequency = 1;
  
  for (let i = 0; i < octaves; i++) {
    const [cdx, cdy] = curlNoise2D(x * frequency, y * frequency);
    dx += cdx * amplitude;
    dy += cdy * amplitude;
    
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  
  return [dx, dy];
}

// Billowy noise (absolute value)
export function billowyNoise(
  x: number,
  y: number,
  octaves: number = 6
): number {
  let total = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;
  
  for (let i = 0; i < octaves; i++) {
    total += Math.abs(perlinNoise2D(x * frequency, y * frequency)) * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  
  return total / maxValue;
}

// Swiss turbulence (derivative-based)
export function swissTurbulence(
  x: number,
  y: number,
  octaves: number = 6,
  warp: number = 0.15
): number {
  let sum = 0;
  let amp = 1;
  let freq = 1;
  let dSumX = 0;
  let dSumY = 0;
  
  for (let i = 0; i < octaves; i++) {
    const n = perlinNoise2D((x + warp * dSumX) * freq, (y + warp * dSumY) * freq);
    sum += amp * (1 - Math.abs(n));
    
    const dx = perlinNoise2D((x + warp * dSumX + 0.01) * freq, (y + warp * dSumY) * freq) - n;
    const dy = perlinNoise2D((x + warp * dSumX) * freq, (y + warp * dSumY + 0.01) * freq) - n;
    
    dSumX += amp * dx * 100;
    dSumY += amp * dy * 100;
    
    amp *= 0.5;
    freq *= 2.0;
  }
  
  return sum;
}

// Jordan turbulence
export function jordanTurbulence(
  x: number,
  y: number,
  octaves: number = 6,
  gain: number = 0.8,
  warp0: number = 0.4,
  warp: number = 0.35
): number {
  let n = perlinNoise2D(x, y);
  let n2 = n * n;
  let sum = n2;
  let amp = 1;
  let freq = 2;
  let dSumX = 0;
  let dSumY = 0;
  
  dSumX = warp0 * n;
  dSumY = warp0 * n;
  
  for (let i = 1; i < octaves; i++) {
    n = perlinNoise2D((x + warp * dSumX) * freq, (y + warp * dSumY) * freq);
    n2 = n * n;
    sum += n2 * amp;
    
    dSumX += warp * n;
    dSumY += warp * n;
    
    amp *= gain;
    freq *= 2.0;
  }
  
  return sum;
}
