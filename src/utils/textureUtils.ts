import * as THREE from 'three'

/**
 * Spherical coordinates representation
 */
export interface SphericalCoordinates {
  sx: number
  sy: number
  sz: number
}

/**
 * RGB color representation
 */
export interface RGBColor {
  r: number
  g: number
  b: number
}

/**
 * Calculate spherical coordinates from UV texture coordinates
 * @param u - Horizontal texture coordinate (0-1)
 * @param v - Vertical texture coordinate (0-1)
 * @returns Spherical coordinates { sx, sy, sz }
 */
export function getSphericalCoordinates(u: number, v: number): SphericalCoordinates {
  const theta = u * Math.PI * 2
  const phi = v * Math.PI
  const sx = Math.sin(phi) * Math.cos(theta)
  const sy = Math.cos(phi)
  const sz = Math.sin(phi) * Math.sin(theta)

  return { sx, sy, sz }
}

/**
 * Pixel function type that computes color based on UV and spherical coordinates
 * @param u - Horizontal texture coordinate (0-1)
 * @param v - Vertical texture coordinate (0-1)
 * @param sx - Spherical X coordinate
 * @param sy - Spherical Y coordinate
 * @param sz - Spherical Z coordinate
 * @returns RGB color values (0-1 range) or null for transparent pixels
 */
export type PixelFunction = (
  u: number,
  v: number,
  sx: number,
  sy: number,
  sz: number
) => RGBColor | null

/**
 * Create a canvas texture using a pixel function
 * @param width - Canvas width in pixels
 * @param height - Canvas height in pixels
 * @param pixelFn - Function that computes color for each pixel
 * @param clearCanvas - Whether to clear canvas before drawing (for transparent textures)
 * @returns THREE.CanvasTexture with proper wrapping settings
 */
export function createCanvasTexture(
  width: number,
  height: number,
  pixelFn: PixelFunction,
  clearCanvas = false
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // Clear canvas for transparent textures
  if (clearCanvas) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // Iterate through each pixel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width
      const v = y / height

      // Get spherical coordinates
      const { sx, sy, sz } = getSphericalCoordinates(u, v)

      // Compute color using the pixel function
      const color = pixelFn(u, v, sx, sy, sz)

      // Only draw if color is returned (allows for transparency)
      if (color !== null) {
        if ('a' in color) {
          // RGBA color with alpha
          const rgba = color as RGBColor & { a: number }
          ctx.fillStyle = `rgba(${Math.floor(rgba.r * 255)}, ${Math.floor(rgba.g * 255)}, ${Math.floor(rgba.b * 255)}, ${rgba.a})`
        } else {
          // RGB color
          ctx.fillStyle = `rgb(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)})`
        }
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }

  // Create and configure texture
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}
