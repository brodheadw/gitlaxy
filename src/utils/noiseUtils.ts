/**
 * Noise utilities for procedural generation
 * Used to create photorealistic supernova textures
 */

// Perlin noise permutation table
const p = new Array(512);
const permutation = [151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];

for (let i = 0; i < 256; i++) {
    p[256 + i] = p[i] = permutation[i];
}

function fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
}

function grad(hash: number, x: number, y: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

/**
 * 2D Perlin noise
 * @returns value in range [-1, 1]
 */
export function perlinNoise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);

    const u = fade(x);
    const v = fade(y);

    const a = p[X] + Y;
    const aa = p[a];
    const ab = p[a + 1];
    const b = p[X + 1] + Y;
    const ba = p[b];
    const bb = p[b + 1];

    return lerp(v,
        lerp(u, grad(p[aa], x, y), grad(p[ba], x - 1, y)),
        lerp(u, grad(p[ab], x, y - 1), grad(p[bb], x - 1, y - 1))
    );
}

/**
 * Fractional Brownian Motion (multi-octave noise)
 * Creates natural-looking turbulence by combining multiple scales
 */
export function fbm(
    x: number,
    y: number,
    octaves: number = 6,
    persistence: number = 0.5,
    lacunarity: number = 2.0
): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
        total += perlinNoise2D(x * frequency, y * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }

    return total / maxValue;
}

/**
 * Turbulence (absolute value of FBM)
 * Creates flame-like, billowing patterns
 */
export function turbulence(
    x: number,
    y: number,
    octaves: number = 6
): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
        total += Math.abs(perlinNoise2D(x * frequency, y * frequency)) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }

    return total / maxValue;
}

/**
 * Ridged noise - inverted turbulence
 * Creates sharp ridge-like features, good for filaments
 */
export function ridgedNoise(
    x: number,
    y: number,
    octaves: number = 6
): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
        let signal = 1 - Math.abs(perlinNoise2D(x * frequency, y * frequency));
        signal *= signal; // Square for sharper ridges
        total += signal * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }

    return total / maxValue;
}

/**
 * Simplex-style noise using domain warping
 * Smoother gradients than Perlin
 */
export function simplexNoise2D(x: number, y: number): number {
    // Domain warping for better isotropy
    const s = (x + y) * 0.366025403784;
    const xs = x + s;
    const ys = y + s;
    return perlinNoise2D(xs, ys);
}

/**
 * Voronoi cell distance
 * Returns distance to nearest cell center
 */
export function voronoi(
    x: number,
    y: number,
    scale: number = 1.0,
    randomness: number = 1.0
): number {
    x *= scale;
    y *= scale;

    const xi = Math.floor(x);
    const yi = Math.floor(y);

    let minDist = 10000;

    // Check 3x3 grid of cells
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const cellX = xi + dx;
            const cellY = yi + dy;

            // Pseudo-random cell center based on cell coordinates
            const hash = (cellX * 374761393 + cellY * 668265263) & 0x7fffffff;
            const px = cellX + (hash / 0x7fffffff) * randomness;
            const py = cellY + ((hash * 1597) / 0x7fffffff) * randomness;

            const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
            minDist = Math.min(minDist, dist);
        }
    }

    return minDist;
}

/**
 * Voronoi cells (0 at cell centers, 1 at edges)
 */
export function voronoiCells(
    x: number,
    y: number,
    scale: number = 1.0
): number {
    const dist = voronoi(x, y, scale);
    return Math.min(dist * 2, 1);
}

/**
 * Curl noise - creates swirling, divergence-free patterns
 * Perfect for fluid-like motion
 */
export function curlNoise(x: number, y: number, epsilon: number = 0.01): [number, number] {
    const n = perlinNoise2D(x, y);
    const n1 = perlinNoise2D(x + epsilon, y);
    const n2 = perlinNoise2D(x, y + epsilon);

    const dx = (n2 - n) / epsilon;
    const dy = -(n1 - n) / epsilon;

    return [dx, dy];
}

/**
 * Radial gradient helper
 */
export function radialGradient(
    x: number,
    y: number,
    centerX: number,
    centerY: number,
    radius: number
): number {
    const dx = x - centerX;
    const dy = y - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return 1 - Math.min(dist / radius, 1);
}

/**
 * Smooth step function (0 to 1 interpolation)
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

/**
 * Mix two values
 */
export function mix(a: number, b: number, t: number): number {
    return a * (1 - t) + b * t;
}
