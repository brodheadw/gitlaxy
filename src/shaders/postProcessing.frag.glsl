// Post-processing shader for cinematic effects (Phase 10)
// Implements: Bloom, Lens Flare, Auto-Exposure, Vignette

uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uStarScreenPosition; // Star position in screen space
uniform float uStarBrightness; // Current star brightness
uniform float uExposure; // Auto-exposure value

varying vec2 vUv;

// Hexagonal pattern for lens artifacts
float hexagon(vec2 p, float r) {
  const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
  p = abs(p);
  p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
  p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
  return length(p) * sign(p.y);
}

// Lens flare streaks
float lensFlare(vec2 uv, vec2 pos, float brightness) {
  vec2 delta = uv - pos;
  float dist = length(delta);
  float angle = atan(delta.y, delta.x);
  
  // Six diffraction spikes (hexagonal aperture)
  float spikes = 0.0;
  for (int i = 0; i < 6; i++) {
    float spikeAngle = float(i) * 3.14159265 / 3.0;
    float angleDiff = abs(mod(angle - spikeAngle + 3.14159265, 6.28318531) - 3.14159265);
    float spike = smoothstep(0.02, 0.0, angleDiff) * smoothstep(0.5, 0.05, dist);
    spikes += spike;
  }
  
  return spikes * brightness * 0.5;
}

// Anamorphic lens flare (horizontal streak)
float anamorphicFlare(vec2 uv, vec2 pos, float brightness) {
  float horizontalDist = abs(uv.y - pos.y);
  float verticalFade = smoothstep(0.2, 0.0, abs(uv.x - pos.x));
  return smoothstep(0.015, 0.0, horizontalDist) * verticalFade * brightness * 0.3;
}

// Ghost reflections (internal lens reflections)
vec3 lensGhosts(vec2 uv, vec2 pos, vec3 color) {
  vec3 ghosts = vec3(0.0);
  vec2 center = vec2(0.5);
  
  // Create ghost reflections
  for (int i = 1; i <= 4; i++) {
    float scale = float(i) * 0.15;
    vec2 ghostPos = center + (pos - center) * scale;
    float dist = length(uv - ghostPos);
    
    // Hexagonal ghost with chromatic aberration
    float hexSize = 0.02 + float(i) * 0.01;
    float ghost = smoothstep(hexSize, hexSize * 0.8, dist);
    
    // Color shift for each ghost
    vec3 ghostColor = color;
    if (i == 1) ghostColor *= vec3(1.2, 0.8, 0.6); // Warm
    if (i == 2) ghostColor *= vec3(0.6, 0.9, 1.3); // Cool
    if (i == 3) ghostColor *= vec3(1.0, 1.2, 0.7); // Yellow
    if (i == 4) ghostColor *= vec3(0.8, 0.6, 1.2); // Purple
    
    ghosts += ghostColor * (1.0 - ghost) * 0.15;
  }
  
  return ghosts;
}

// Vignette effect
float vignette(vec2 uv, float intensity) {
  vec2 center = uv - 0.5;
  float dist = length(center);
  return smoothstep(0.8, 0.3, dist) * (1.0 - intensity * 0.3) + intensity * 0.3;
}

// Simple bloom
vec3 bloom(sampler2D tex, vec2 uv, float threshold, float intensity) {
  vec3 bloom = vec3(0.0);
  float total = 0.0;
  
  // 9-tap blur
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      vec2 offset = vec2(float(x), float(y)) * 0.003;
      vec4 sample = texture2D(tex, uv + offset);
      
      // Threshold for bloom
      float brightness = dot(sample.rgb, vec3(0.2126, 0.7152, 0.0722));
      if (brightness > threshold) {
        bloom += sample.rgb * (brightness - threshold);
        total += 1.0;
      }
    }
  }
  
  return total > 0.0 ? (bloom / total) * intensity : vec3(0.0);
}

void main() {
  vec4 color = texture2D(tDiffuse, vUv);
  
  // PHASE 10: Auto-exposure
  // Reduce brightness if star is too bright
  float adaptedExposure = uExposure * (1.0 / (1.0 + uStarBrightness * 0.5));
  color.rgb *= adaptedExposure;
  
  // PHASE 10: Bloom
  vec3 bloomColor = bloom(tDiffuse, vUv, 0.8, 1.5);
  color.rgb += bloomColor;
  
  // PHASE 10: Lens flare (only if star is in view)
  if (uStarScreenPosition.x > 0.0 && uStarScreenPosition.x < 1.0 &&
      uStarScreenPosition.y > 0.0 && uStarScreenPosition.y < 1.0) {
    
    vec2 starPos = uStarScreenPosition.xy;
    vec3 starColor = vec3(1.0, 0.85, 0.6); // Warm star color
    
    // Diffraction spikes
    float spikes = lensFlare(vUv, starPos, uStarBrightness);
    color.rgb += starColor * spikes;
    
    // Anamorphic streak
    float streak = anamorphicFlare(vUv, starPos, uStarBrightness);
    color.rgb += starColor * streak;
    
    // Ghost reflections
    vec3 ghosts = lensGhosts(vUv, starPos, starColor);
    color.rgb += ghosts * uStarBrightness * 0.5;
  }
  
  // PHASE 10: Vignette (stronger when star is very bright)
  float vignetteIntensity = clamp(uStarBrightness * 0.2, 0.0, 0.5);
  color.rgb *= vignette(vUv, vignetteIntensity);
  
  // Tonemap (simple Reinhard)
  color.rgb = color.rgb / (1.0 + color.rgb);
  
  gl_FragColor = color;
}
