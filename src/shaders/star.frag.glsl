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
uniform vec3 uStarColor;
uniform vec3 uSunspotColor;
uniform float uFlareIntensity;
uniform float uCoreTemperature;
uniform vec3 uCameraPosition;

// Simplex noise
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
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
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// PHASE 5: Extreme temperature to color
vec3 extremeTemperatureToColor(float temp) {
  temp = clamp(temp, 3000.0, 100000000.0);
  if(temp > 10000000.0) {
    float t = clamp((temp - 10000000.0) / 90000000.0, 0.0, 1.0);
    return mix(vec3(0.7, 0.9, 1.0), vec3(0.9, 0.95, 1.0), t);
  } else if(temp > 1000000.0) {
    float t = clamp((temp - 1000000.0) / 9000000.0, 0.0, 1.0);
    return mix(vec3(0.6, 0.8, 1.0), vec3(0.7, 0.9, 1.0), t);
  } else if(temp > 100000.0) {
    float t = clamp((temp - 100000.0) / 900000.0, 0.0, 1.0);
    return mix(vec3(0.5, 0.7, 1.0), vec3(0.6, 0.8, 1.0), t);
  } else if(temp > 10000.0) {
    float t = clamp((temp - 10000.0) / 90000.0, 0.0, 1.0);
    return mix(vec3(0.9, 0.95, 1.0), vec3(0.5, 0.7, 1.0), t);
  } else {
    float kelvin = temp / 100.0;
    vec3 color;
    if (kelvin <= 66.0) { color.r = 1.0; } else { color.r = clamp(329.698727446 * pow(kelvin - 60.0, -0.1332047592) / 255.0, 0.0, 1.0); }
    if (kelvin <= 66.0) { color.g = clamp((99.4708025861 * log(kelvin) - 161.1195681661) / 255.0, 0.0, 1.0); } else { color.g = clamp(288.1221695283 * pow(kelvin - 60.0, -0.0755148492) / 255.0, 0.0, 1.0); }
    if (kelvin >= 66.0) { color.b = 1.0; } else if (kelvin <= 19.0) { color.b = 0.0; } else { color.b = clamp((138.5177312231 * log(kelvin - 10.0) - 305.0447927307) / 255.0, 0.0, 1.0); }
    return color;
  }
}

// PHASE 10: Volumetric density
float sampleDensity(vec3 pos) {
  return snoise(pos * 0.05) * 0.6 + snoise(pos * 0.12) * 0.4;
}

// PHASE 11: Spectral emission lines (element-specific colors)
vec3 getEmissionLines(float temp, float density, vec3 pos) {
  vec3 emission = vec3(0.0);
  
  // Hydrogen-alpha (656nm - deep red)
  float hAlphaMask = smoothstep(8000.0, 12000.0, temp) * smoothstep(20000.0, 15000.0, temp);
  emission += vec3(1.0, 0.25, 0.18) * hAlphaMask * density * 0.8;
  
  // [OIII] doublet (496/501nm - blue-green forbidden line)
  float oiiiMask = smoothstep(25000.0, 40000.0, temp) * smoothstep(80000.0, 60000.0, temp);
  emission += vec3(0.2, 0.9, 0.7) * oiiiMask * (1.0 - density * 0.5) * 1.2;
  
  // [SII] (672nm - deep red)
  float siiMask = smoothstep(6000.0, 10000.0, temp) * smoothstep(18000.0, 14000.0, temp);
  emission += vec3(0.9, 0.2, 0.15) * siiMask * density * 0.6;
  
  // [NII] (658nm - orange-red)
  float niiMask = smoothstep(10000.0, 15000.0, temp) * smoothstep(25000.0, 20000.0, temp);
  emission += vec3(0.95, 0.4, 0.2) * niiMask * density * 0.7;
  
  // Iron lines (orange)
  float feMask = smoothstep(3000.0, 6000.0, temp) * smoothstep(15000.0, 10000.0, temp);
  emission += vec3(1.0, 0.6, 0.3) * feMask * density * 0.5;
  
  // Calcium H+K (violet)
  float caMask = smoothstep(5000.0, 8000.0, temp) * smoothstep(12000.0, 10000.0, temp);
  float caPattern = step(0.7, snoise(pos * 2.0));
  emission += vec3(0.6, 0.4, 0.9) * caMask * caPattern * 0.4;
  
  return emission;
}

// PHASE 12 & 14: Doppler shift and dust scattering
vec3 applyDopplerAndScattering(vec3 baseColor, vec3 velocity, float dustDensity) {
  // Radial velocity component
  float vRadial = length(velocity) * 0.01;
  float redshift = vRadial / 3.0;
  float blueshift = -redshift;
  
  vec3 shifted = baseColor;
  // Approaching material: blueshifted
  if(vRadial < 0.0) {
    shifted = mix(baseColor, baseColor * vec3(0.8, 0.9, 1.3), abs(blueshift));
  }
  // Receding material: redshifted  
  else {
    shifted = mix(baseColor, baseColor * vec3(1.3, 0.9, 0.7), redshift);
  }
  
  // Rayleigh scattering: blue light scattered more
  float scatterRatio = 1.0 / (1.0 + dustDensity * 2.0);
  shifted.b *= scatterRatio * 1.2;
  shifted.r *= (1.0 + dustDensity * 0.3);
  shifted.g *= (1.0 + dustDensity * 0.1);
  
  return shifted;
}

// PHASE 13: Photoionization fronts
vec3 getIonizationColors(float temp, float density, vec3 pos) {
  vec3 ionization = vec3(0.0);
  
  // HII regions (pink-red ionized hydrogen)
  float hiiMask = smoothstep(8000.0, 13000.0, temp) * smoothstep(20000.0, 16000.0, temp);
  float hiiPattern = snoise(pos * 0.5 + uTime * 0.05);
  ionization += vec3(1.0, 0.4, 0.55) * hiiMask * smoothstep(0.3, 0.7, hiiPattern) * 0.9;
  
  // Ionization fronts (sharp boundaries)
  float frontNoise = snoise(pos * 1.2);
  float sharpFront = smoothstep(0.48, 0.52, frontNoise);
  ionization += vec3(0.3, 0.8, 1.0) * sharpFront * (1.0 - density) * 0.4;
  
  return ionization;
}

// PHASE 17: Density-dependent color saturation
vec3 applyDensitySaturation(vec3 color, float density) {
  float saturation = 0.5 + density * 1.5;
  float luminance = dot(color, vec3(0.299, 0.587, 0.114));
  return mix(vec3(luminance), color, clamp(saturation, 0.3, 2.0));
}

// PHASE 20: Temporal color evolution
vec3 getTemporalColorShift(vec3 color, float evolutionTime) {
  float phase = clamp(evolutionTime / 50.0, 0.0, 1.0);  
  // Early: blue-white dominated
  if(phase < 0.3) {
    return color * mix(vec3(0.9, 0.95, 1.2), vec3(1.0), phase / 0.3);
  }
  // Mid: multi-color peak
  else if(phase < 0.7) {
    return color * vec3(1.1, 1.05, 1.0);
  }
  // Late: red/IR dominated (cooling)
  else {
    float lateFraction = (phase - 0.7) / 0.3;
    return color * mix(vec3(1.0), vec3(1.3, 0.8, 0.6), lateFraction);
  }
}

void main() {
  // Calculate base temperatures
  float shockTemperature = 50000000.0 * vShockIntensity;
  float coreDistance = vRadialDist;
  float coreHeat = smoothstep(120.0, 80.0, coreDistance) * 80000000.0;
  float baseSurfaceTemp = uCoreTemperature * 1000.0;
  float coolingFactor = 1.0 / (1.0 + uTime * 0.02);
  
  // Magnetic reconnection
  float reconnectionNoise = snoise(vPosition * 0.3 + vec3(uTime * 2.0));
  float reconnectionEvent = step(0.85, reconnectionNoise) * smoothstep(0.85, 0.95, reconnectionNoise);
  float reconnectionTemp = reconnectionEvent * 100000000.0;
  
  // Turbulent heating
  float turbulentHeat = vTurbulence * 5000000.0;
  
  // Total temperature
  float totalTemp = baseSurfaceTemp + shockTemperature + coreHeat + reconnectionTemp + turbulentHeat;
  totalTemp *= coolingFactor;
  
  // Base temperature color
  vec3 temperatureColor = extremeTemperatureToColor(totalTemp);
  
  // PHASE 11: Add spectral emission lines
  float localDensity = sampleDensity(vPosition);
  vec3 emissionLines = getEmissionLines(totalTemp, localDensity, vPosition);
  
  // PHASE 13: Photoionization zones
  vec3 ionizationColor = getIonizationColors(totalTemp, localDensity, vPosition);
  
  // Filament colors
  float filamentDensity = vFilamentData.x;
  float filamentBrightness = 0.9 + filamentDensity * 0.3;
  float filamentCooling = (1.0 - abs(filamentDensity)) * 10000.0;
  vec3 filamentColor = extremeTemperatureToColor(totalTemp - filamentCooling) * filamentBrightness;
  
  // Jet colors (Doppler boosted)
  float jetStrength = length(vJetDirection);
  vec3 jetColor = vec3(0.6, 0.8, 1.2) * jetStrength * 2.0;
  
  // Synchrotron radiation
  float synchrotronNoise = snoise(vPosition * 0.8 + vec3(uTime * 0.3, 0.0, -uTime * 0.2));
  float synchrotronMask = smoothstep(0.5, 0.8, abs(synchrotronNoise));
  vec3 synchrotronColor = vec3(0.5, 0.7, 1.0) * synchrotronMask * vShockIntensity * 0.8;
  
  // Fractal detail
  float fractalNoise1 = snoise(vPosition * 0.1 + uTime * 0.05);
  float fractalNoise2 = snoise(vPosition * 0.25 - uTime * 0.08);
  float fractalDetail = fractalNoise1 * 0.6 + fractalNoise2 * 0.4;
  float fractalBrightness = 0.9 + fractalDetail * 0.2;
  
  // Combine color sources
  vec3 baseColor = temperatureColor;
  baseColor = mix(baseColor, filamentColor, 0.5);
  
  // PHASE 11: Blend in emission lines
  baseColor += emissionLines * 1.5;
  
  // PHASE 13: Add ionization colors
  baseColor += ionizationColor * 0.8;
  
  baseColor += jetColor;
  baseColor += synchrotronColor;
  baseColor *= fractalBrightness;
  
  // PHASE 12 & 14: Apply Doppler and dust effects
  vec3 velocity = normalize(vPosition) * vShockIntensity;
  float dustDensity = localDensity * 0.5;
  baseColor = applyDopplerAndScattering(baseColor, velocity, dustDensity);
  
  // PHASE 17: Density-dependent saturation
  baseColor = applyDensitySaturation(baseColor, localDensity);
  
  // Reconnection flare
  if(reconnectionEvent > 0.5) {
    vec3 flareColor = vec3(1.5, 1.3, 1.0);
    float flashIntensity = sin(uTime * 20.0) * 0.5 + 0.5;
    baseColor += flareColor * flashIntensity * 3.0 * reconnectionEvent;
  }
  
  // Volumetric scattering
  vec3 viewDir = normalize(uCameraPosition - vPosition);
  float viewAngle = dot(viewDir, normalize(vPosition));
  float scatteringFactor = pow(1.0 - abs(viewAngle), 2.0);
  float scattering = scatteringFactor * localDensity * vShockIntensity * 0.3;
  baseColor += temperatureColor * scattering;
  
  // Shock edge brightening with chromatic aberration
  float edgeBrightness = smoothstep(0.8, 1.0, vShockIntensity) * 2.0;
  vec3 edgeColor = vec3(0.7, 0.85, 1.0) + vec3(0.1, 0.05, 0.0) * edgeBrightness;
  baseColor += edgeColor * edgeBrightness;
  
  // PHASE 20: Temporal evolution
  baseColor = getTemporalColorShift(baseColor, uTime);
  
  // Overall intensity
  baseColor *= 1.2;
  baseColor *= (1.0 + uFlareIntensity * 0.5);
  
  // Depth fading
  float depthFade = smoothstep(300.0, 100.0, coreDistance);
  baseColor = mix(baseColor * 0.3, baseColor, depthFade);
  
  gl_FragColor = vec4(baseColor, 1.0);
}
