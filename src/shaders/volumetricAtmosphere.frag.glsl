// Volumetric atmosphere shader with ray marching (Phase 2 & 9)
// Replaces simple corona spheres with true 3D volumetric rendering

varying vec3 vWorldPosition;
varying vec3 vViewDirection;

uniform vec3 uStarPosition;
uniform float uStarRadius;
uniform vec3 uStarColor;
uniform float uTime;
uniform vec3 uCameraPosition;
uniform float uAtmosphereRadius; // Outer atmosphere boundary
uniform float uDensity; // Base atmosphere density

// Simplex noise for density variation
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
  
  vec3 x1 = x0 - i1 + C.xxx;
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

// PHASE 9: Rayleigh scattering (blue light scatters more)
vec3 rayleighScattering(float cosTheta) {
  // Wavelength-dependent scattering (blue scatters ~10x more than red)
  vec3 scattering = vec3(
    5.8e-6,  // Red
    13.5e-6, // Green  
    33.1e-6  // Blue
  );
  
  // Phase function for Rayleigh scattering
  float phase = 0.75 * (1.0 + cosTheta * cosTheta);
  
  return scattering * phase;
}

// PHASE 9: Mie scattering (forward scattering for dust/plasma)
float mieScattering(float cosTheta, float g) {
  // Henyey-Greenstein phase function
  float g2 = g * g;
  float num = 1.0 - g2;
  float denom = pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5);
  return (1.0 / (4.0 * 3.14159265)) * (num / denom);
}

// PHASE 2: Atmospheric density function
float getAtmosphereDensity(vec3 position) {
  float distFromCenter = length(position - uStarPosition);
  
  // Exponential falloff from star surface
  float heightAboveSurface = distFromCenter - uStarRadius;
  float normalizedHeight = heightAboveSurface / (uAtmosphereRadius - uStarRadius);
  
  // Base exponential density
  float baseDensity = exp(-normalizedHeight * 4.0);
  
  // Add noise for wispy variation
  float noise1 = snoise(position * 0.0003 + vec3(uTime * 0.02, 0.0, uTime * 0.015));
  float noise2 = snoise(position * 0.0008 + vec3(-uTime * 0.01, uTime * 0.02, 0.0));
  
  // Combine base density with noise
  float density = baseDensity * (0.7 + noise1 * 0.2 + noise2 * 0.1) * uDensity;
  
  return max(0.0, density);
}

// PHASE 2: Ray-sphere intersection
bool intersectSphere(vec3 origin, vec3 direction, vec3 center, float radius, out float t0, out float t1) {
  vec3 L = origin - center;
  float a = dot(direction, direction);
  float b = 2.0 * dot(direction, L);
  float c = dot(L, L) - radius * radius;
  float discriminant = b * b - 4.0 * a * c;
  
  if (discriminant < 0.0) return false;
  
  float sqrtDisc = sqrt(discriminant);
  t0 = (-b - sqrtDisc) / (2.0 * a);
  t1 = (-b + sqrtDisc) / (2.0 * a);
  
  return true;
}

void main() {
  vec3 rayOrigin = uCameraPosition;
  vec3 rayDirection = normalize(vWorldPosition - uCameraPosition);
  
  // Intersect with atmosphere sphere
  float tNear, tFar;
  if (!intersectSphere(rayOrigin, rayDirection, uStarPosition, uAtmosphereRadius, tNear, tFar)) {
    discard; // No intersection with atmosphere
  }
  
  // Clamp to positive distances
  tNear = max(0.0, tNear);
  
  // Check if inside star (don't render atmosphere there)
  float tStarNear, tStarFar;
  bool hitStar = intersectSphere(rayOrigin, rayDirection, uStarPosition, uStarRadius * 1.1, tStarNear, tStarFar);
  if (hitStar && tStarNear < tNear) {
    tNear = tStarFar; // Start ray march after exiting star
  }
  
  // PHASE 2: Ray marching through atmosphere
  const int NUM_STEPS = 32; // Quality vs performance
  float stepSize = (tFar - tNear) / float(NUM_STEPS);
  
  vec3 accumulatedColor = vec3(0.0);
  float accumulatedAlpha = 0.0;
  
  vec3 dirToStar = normalize(uStarPosition - rayOrigin);
  float cosTheta = dot(rayDirection, dirToStar);
  
  // March through volume
  for (int i = 0; i < NUM_STEPS; i++) {
    float t = tNear + float(i) * stepSize;
    vec3 samplePos = rayOrigin + rayDirection * t;
    
    // Sample atmospheric density at this point
    float density = getAtmosphereDensity(samplePos);
    
    if (density > 0.001) {
      // Distance to star center for lighting
      float distToStar = length(samplePos - uStarPosition);
      float lightAttenuation = 1.0 / (distToStar * distToStar * 0.0000001);
      
      // PHASE 9: Apply Rayleigh and Mie scattering
      vec3 rayleigh = rayleighScattering(cosTheta) * 100000.0;
      float mie = mieScattering(cosTheta, 0.76) * 0.1; // Forward scattering
      
      // Combine scattering with star color
      vec3 scatteredLight = (rayleigh + vec3(mie)) * uStarColor * lightAttenuation * density;
      
      // Accumulate color (front-to-back compositing)
      float alpha = density * stepSize * 0.3;
      accumulatedColor += scatteredLight * alpha * (1.0 - accumulatedAlpha);
      accumulatedAlpha += alpha * (1.0 - accumulatedAlpha);
      
      // Early ray termination if fully opaque
      if (accumulatedAlpha >= 0.95) break;
    }
  }
  
  // PHASE 2: God rays (optional enhancement)
  // Add extra brightness when looking near the star
  if (cosTheta > 0.9) {
    float godRayIntensity = pow((cosTheta - 0.9) / 0.1, 2.0);
    accumulatedColor += uStarColor * godRayIntensity * 0.3;
  }
  
  gl_FragColor = vec4(accumulatedColor, accumulatedAlpha);
}
