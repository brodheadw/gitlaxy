varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying float vDisplacement;
varying float vRadialDist;
varying vec3 vFilamentData;
varying float vShockIntensity;
varying vec3 vJetDirection;
varying float vTurbulence;

uniform float uTime;
uniform float uBoilIntensity;
uniform float uSunspotIntensity;

// Simplex 3D Noise
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0);
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// PHASE 8: Fractal Brownian Motion (multi-scale turbulence)
float fbm(vec3 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  
  for(int i = 0; i < 8; i++) {
    if(i >= octaves) break;
    value += amplitude * snoise(p * frequency);
    frequency *= 2.07;
    amplitude *= 0.49;
  }
  
  return value;
}

// PHASE 6: Curl noise for vorticity
vec3 curlNoise(vec3 p) {
  float eps = 0.1;
  float n1 = snoise(vec3(p.x, p.y + eps, p.z));
  float n2 = snoise(vec3(p.x, p.y - eps, p.z));
  float n3 = snoise(vec3(p.x, p.y, p.z + eps));
  float n4 = snoise(vec3(p.x, p.y, p.z - eps));
  float n5 = snoise(vec3(p.x + eps, p.y, p.z));
  float n6 = snoise(vec3(p.x - eps, p.y, p.z));
  
  float x = (n1 - n2) - (n3 - n4);
  float y = (n3 - n4) - (n5 - n6);
  float z = (n5 - n6) - (n1 - n2);
  
  return normalize(vec3(x, y, z));
}

// PHASE 2: Weibel instability filaments
vec3 weibelFilaments(vec3 p, float time) {
  float scale1 = 4.0;
  float scale2 = 8.0;
  float scale3 = 16.0;
  
  float f1 = snoise(p * scale1 + vec3(time * 0.05, 0.0, time * 0.03));
  float f2 = snoise(p * scale2 + vec3(time * 0.08, time * 0.06, 0.0));
  float f3 = snoise(p * scale3 - vec3(time * 0.04, 0.0, time * 0.07));
  
  float filamentDensity = f1 * 0.5 + f2 * 0.3 + f3 * 0.2;
  float filamentThickness = abs(f2) * 0.15;
  
  vec3 filamentDir = curlNoise(p * 3.0 + time * 0.1);
  
  return vec3(filamentDensity, filamentThickness, length(filamentDir));
}

void main() {
  vNormal = normalize(normalMatrix * normal);
  vUv = uv;
  
  vec3 normalizedPos = normalize(position);
  float radius = length(position);
  vRadialDist = radius;
  
  // PHASE 1: Shock wave expansion (Sedov-Taylor dynamics)
  float expansionTime = uTime * 0.15;
  float shockRadius = 100.0 + expansionTime * 25.0;
  float shockThickness = 15.0;
  
  float distFromShock = abs(radius - shockRadius);
  float shockMask = 1.0 - smoothstep(0.0, shockThickness, distFromShock);
  vShockIntensity = shockMask;
  
  // PHASE 1: Rayleigh-Taylor instabilities (mushroom fingers)
  vec3 rtNoisePos = normalizedPos * 2.0 + vec3(uTime * 0.08);
  float rtNoise1 = fbm(rtNoisePos, 5);
  float rtNoise2 = fbm(rtNoisePos * 2.3 + vec3(100.0), 4);
  
  float rtInstability = rtNoise1 * 0.7 + rtNoise2 * 0.3;
  float rtFingers = sin(rtInstability * 12.0 + uTime) * 0.5 + 0.5;
  rtFingers *= shockMask * 8.0;
  
  // PHASE 9: Expansion velocity (deceleration over time)
  float expansionVelocity = 20.0 * (1.0 / (1.0 + expansionTime * 0.05));
  float radialExpansion = expansionVelocity * sin(uTime * 0.5) * 0.3;
  
  // PHASE 3: Asymmetric explosion (bipolar jets)
  vec3 jetAxis = normalize(vec3(0.3, 1.0, 0.2));
  float jetAlignment = abs(dot(normalizedPos, jetAxis));
  float jetMask = smoothstep(0.7, 0.95, jetAlignment);
  
  float jetExpansion = jetMask * radialExpansion * 2.5;
  vJetDirection = jetAxis * jetAlignment;
  
  // PHASE 3: Asymmetry factor (non-spherical)
  float asymmetryNoise = fbm(normalizedPos * 1.5 + uTime * 0.1, 4);
  float asymmetryFactor = 1.0 + asymmetryNoise * 0.4;
  
  // PHASE 2: Plasma filaments (Weibel instability)
  vec3 filamentData = weibelFilaments(position * 0.02, uTime);
  vFilamentData = filamentData;
  
  float filamentDisplacement = filamentData.x * 3.0 * shockMask;
  vec3 filamentDirection = curlNoise(position * 0.05 + uTime * 0.1);
  
  // PHASE 6: Turbulent vorticity (Kelvin-Helmholtz)
  vec3 vorticity = curlNoise(position * 0.08 + vec3(uTime * 0.15, 0.0, uTime * 0.12));
  float khInstability = length(vorticity) * shockMask;
  vec3 khDisplacement = vorticity * khInstability * 4.0;
  
  vTurbulence = khInstability;
  
  // PHASE 8: Multi-scale fractal turbulence
  float turbulence1 = fbm(position * 0.03 + uTime * 0.1, 6);
  float turbulence2 = fbm(position * 0.08 - uTime * 0.08, 5);
  float turbulence3 = fbm(position * 0.15 + uTime * 0.12, 4);
  
  float fractalTurbulence = turbulence1 * 0.5 + turbulence2 * 0.3 + turbulence3 * 0.2;
  
  // Combine all displacement sources
  vec3 totalDisplacement = vec3(0.0);
  
  // Radial expansion
  totalDisplacement += normalizedPos * (radialExpansion + jetExpansion) * asymmetryFactor;
  
  // RT instability fingers
  totalDisplacement += normal * rtFingers;
  
  // Filaments
  totalDisplacement += filamentDirection * filamentDisplacement;
  
  // Turbulent vorticity
  totalDisplacement += khDisplacement;
  
  // Fractal detail
  totalDisplacement += normal * fractalTurbulence * 2.0 * shockMask;
  
  // Original boiling (reduced, for core activity)
  float coreBoil = fbm(position * 0.5 + uTime * 0.1, 3) * uBoilIntensity * (1.0 - shockMask);
  totalDisplacement += normal * coreBoil;
  
  vDisplacement = length(totalDisplacement);
  
  vec3 finalPosition = position + totalDisplacement;
  vPosition = finalPosition;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPosition, 1.0);
}
