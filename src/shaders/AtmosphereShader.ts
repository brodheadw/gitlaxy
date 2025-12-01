import * as THREE from 'three'

// Improvements #8-10: Custom atmospheric scattering shader for realistic planet glow
// Features:
// - Rayleigh scattering for realistic atmospheric limb
// - Sun position influence for day/night terminator
// - Fresnel effect for edge glow
// - HDR emissive values for bloom integration
// - Dynamic colors per planet type

export interface AtmosphereShaderUniforms {
  planetColor: { value: THREE.Color }
  sunPosition: { value: THREE.Vector3 }
  planetPosition: { value: THREE.Vector3 }
  atmosphereThickness: { value: number }
  scatterStrength: { value: number }
  fresnelPower: { value: number }
  hdrMultiplier: { value: number }
  emissiveIntensity: { value: number }
  time: { value: number }
  planetType: { value: number } // 0-4 for different atmosphere types
  animationAmount: { value: number }
}

const vertexShader = `
varying vec3 vNormal;
varying vec3 vPositionW;
varying vec3 vViewDir;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vPositionW = worldPosition.xyz;
  vViewDir = normalize(cameraPosition - vPositionW);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
uniform vec3 planetColor;
uniform vec3 sunPosition;
uniform vec3 planetPosition;
uniform float atmosphereThickness;
uniform float scatterStrength;
uniform float fresnelPower;
uniform float hdrMultiplier;
uniform float emissiveIntensity;
uniform float time;
uniform int planetType;
uniform float animationAmount;

varying vec3 vNormal;
varying vec3 vPositionW;
varying vec3 vViewDir;

// Improvement #10: Get atmosphere color based on planet type
vec3 getAtmosphereColor(int type, float sunAngle) {
  vec3 dayColor;
  vec3 sunsetColor;
  vec3 nightColor;

  if (type == 0) {
    // Rocky planets - Earth-like blue atmosphere with red sunset
    dayColor = vec3(0.4, 0.6, 1.0);
    sunsetColor = vec3(1.0, 0.4, 0.2);
    nightColor = vec3(0.1, 0.1, 0.3);
  } else if (type == 1) {
    // Gas giants - use planet color for thick atmosphere
    dayColor = planetColor;
    sunsetColor = planetColor * vec3(1.2, 0.8, 0.6);
    nightColor = planetColor * 0.2;
  } else if (type == 2) {
    // Ice planets - crisp white-blue
    dayColor = vec3(0.8, 0.9, 1.0);
    sunsetColor = vec3(0.6, 0.8, 1.0);
    nightColor = vec3(0.3, 0.4, 0.6);
  } else if (type == 3) {
    // Lava planets - orange-red emission
    dayColor = vec3(1.0, 0.5, 0.1);
    sunsetColor = vec3(1.0, 0.3, 0.0);
    nightColor = vec3(0.8, 0.2, 0.0);
  } else {
    // Ocean planets - deep blue
    dayColor = vec3(0.2, 0.5, 0.9);
    sunsetColor = vec3(0.4, 0.6, 1.0);
    nightColor = vec3(0.1, 0.2, 0.4);
  }

  // Blend based on sun angle
  float dayFactor = smoothstep(-0.2, 0.2, sunAngle);
  float sunsetFactor = 1.0 - abs(sunAngle);
  sunsetFactor = pow(sunsetFactor, 2.0) * 0.5;

  vec3 baseColor = mix(nightColor, dayColor, dayFactor);
  return mix(baseColor, sunsetColor, sunsetFactor);
}

void main() {
  // Improvement #8: Calculate Rayleigh scattering
  float viewDotNormal = dot(vNormal, vViewDir);
  float scatter = pow(1.0 - viewDotNormal, 4.0) * scatterStrength;

  // Improvement #8: Sun influence on atmosphere
  vec3 sunDir = normalize(sunPosition - planetPosition);
  float sunAngle = dot(vNormal, sunDir);
  float sunFactor = max(sunAngle, 0.0);

  // Improvement #8: Fresnel effect for edge glow
  float fresnel = pow(1.0 - viewDotNormal, fresnelPower);

  // Improvement #10: Get dynamic atmosphere color
  vec3 atmosphereColor = getAtmosphereColor(planetType, sunAngle);

  // Combine effects
  float intensity = (scatter + sunFactor * 0.5) * fresnel * atmosphereThickness;

  // Improvement #9: Add subtle animation (pulsing)
  float pulse = sin(time * 0.5) * animationAmount;
  float animatedIntensity = intensity * (emissiveIntensity + pulse);

  // Improvement #9: Output HDR values for bloom
  vec3 finalColor = atmosphereColor * animatedIntensity * hdrMultiplier;

  // Alpha based on intensity
  float alpha = clamp(intensity * 0.8, 0.0, 1.0);

  gl_FragColor = vec4(finalColor, alpha);
}
`

export function createAtmosphereShader(
  planetColor: THREE.Color,
  sunPosition: THREE.Vector3,
  planetPosition: THREE.Vector3,
  planetType: number,
  config: {
    scatterStrength?: number
    fresnelPower?: number
    hdrMultiplier?: number
    emissiveIntensity?: number
    animationAmount?: number
  } = {}
): THREE.ShaderMaterial {
  const uniforms: AtmosphereShaderUniforms = {
    planetColor: { value: planetColor.clone() },
    sunPosition: { value: sunPosition.clone() },
    planetPosition: { value: planetPosition.clone() },
    atmosphereThickness: { value: 1.0 },
    scatterStrength: { value: config.scatterStrength ?? 2.5 },
    fresnelPower: { value: config.fresnelPower ?? 3.0 },
    hdrMultiplier: { value: config.hdrMultiplier ?? 2.0 },
    emissiveIntensity: { value: config.emissiveIntensity ?? 1.0 },
    time: { value: 0 },
    planetType: { value: planetType },
    animationAmount: { value: config.animationAmount ?? 0.1 },
  }

  const material = new THREE.ShaderMaterial({
    uniforms: uniforms as any,
    vertexShader,
    fragmentShader,
    transparent: true,
    side: THREE.BackSide, // Render from inside out
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false, // Improvement #9: Preserve HDR values for bloom
  })

  return material
}

// Helper to update time uniform for animation
export function updateAtmosphereTime(material: THREE.ShaderMaterial, time: number) {
  if (material.uniforms.time) {
    material.uniforms.time.value = time
  }
}

// Helper to update sun position
export function updateSunPosition(material: THREE.ShaderMaterial, sunPos: THREE.Vector3) {
  if (material.uniforms.sunPosition) {
    material.uniforms.sunPosition.value.copy(sunPos)
  }
}

// Helper to update planet position
export function updatePlanetPosition(material: THREE.ShaderMaterial, planetPos: THREE.Vector3) {
  if (material.uniforms.planetPosition) {
    material.uniforms.planetPosition.value.copy(planetPos)
  }
}
