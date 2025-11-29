// Performance configuration for rendering and animations

export const PERFORMANCE = {
  // Nebula controls
  nebula: {
    quantity: {
      total: 34,
      wispMin: 8,
      wispMax: 14,
      dustPrimary: 600,
      dustSecondary: 400,
      blobMin: 6,
      blobMax: 10,
      layersMin: 5,
      layersMax: 10,
    },
    animation: {
      wispFloatX: 0.1,
      wispFloatY: 0.08,
      wispFloatZ: 0.12,
      wispRotateX: 0.02,
      wispRotateY: 0.015,
      wispPulse: 0.3,
      dustRotateY: 0.008,
      dustRotateX: 0.003,
      groupRotate: 0.003,
      coreWobbleX: 0.05,
      coreWobbleZ: 0.04,
    },
    visual: {
      wispOpacity: 0.002,
      dustOpacity: 0.012,
      layerOpacity: 0.0015,
    },
  },

  // Post-processing effects controls
  effects: {
    enabled: true,
    bloom: {
      enabled: true,
      intensity: 1.2,
      threshold: 0.15,
      smoothing: 0.9,
      mipmap: true,
    },
    aberration: {
      enabled: true,
      offsetX: 0.0005,
      offsetY: 0.0005,
      radial: true,
      modulation: 0.5,
    },
    vignette: {
      enabled: true,
      offset: 0.2,
      darkness: 0.5,
    },
    noise: {
      enabled: true,
      opacity: 0.06,
    },
  },

  // Stars controls - using multiple layers to fill volume (scaled 5x for immersive universe)
  // Note: drei Stars spawns from `radius` to `radius + depth`
  stars: {
    // Inner layer - close stars visible from camera
    innerRadius: 100,      // Start very close
    innerDepth: 100000,    // Extend to 100000 units
    innerCount: 10000,
    // Outer layer - distant backdrop
    outerRadius: 100000,
    outerDepth: 400000,    // Extend to 500000 units
    outerCount: 15000,
    // Shared settings
    size: 8,
    saturation: 0.1,
  },

  // Folder (sun) controls - scaled 5x for immersive universe
  folders: {
    // Star size calculation based on depth and descendants (5x scale)
    sizing: {
      depth0Large: { base: 600, multiplier: 10, max: 500, minDescendants: 10 },
      depth0Small: { base: 400, multiplier: 25, max: 300 },
      depth1Large: { base: 300, multiplier: 20, max: 250, minChildren: 5 },
      depth1Small: { base: 225, multiplier: 15, max: 175 },
      depth2: { base: 175, multiplier: 10, max: 125 },
      depthDeep: { base: 125, multiplier: 7.5, max: 75 },
    },
    // Star intensity by type
    intensity: {
      blueSupergiant: 4,
      blueWhite: 3,
      yellowGiant: 2.5,
      yellowMain: 2,
      orangeDwarf: 1.5,
      redDwarf: 1,
    },
    // Geometry detail levels
    geometry: {
      coreDetail: 64,
      coronaInner: 32,
      coronaOuter: 32,
      glowDetail: 32,
      interactionDetail: 16,
    },
    // Animation speeds
    animation: {
      rotateSpeed: 0.0005,
      coronaPulse: 0.5,
      coronaAmount: 0.05,
    },
    // Scale multipliers
    scale: {
      coronaInner: 1.1,
      coronaOuter: 1.3,
      glow: 2.0,
      interaction: 1.3,
      labelOffset: 1.5,
    },
    // Visual properties
    visual: {
      coronaInnerOpacity: 0.4,
      coronaOuterOpacity: 0.15,
      glowOpacity: 0.05,
    },
    // UI elements (5x scale)
    ui: {
      labelDistance: 1000,
      hoverBackground: 'rgba(0, 0, 0, 0.9)',
      defaultBackground: 'rgba(0, 0, 0, 0.5)',
    },
  },

  // File (planet) controls - scaled 5x for immersive universe
  files: {
    // Planet sizing (5x scale)
    sizing: {
      baseSize: 75,
      sizeMultiplier: 40,
      minFileSize: 100,
    },
    // Geometry detail levels
    geometry: {
      sphereDetail: 64,
      cloudDetail: 48,
      ringDetail: 64,
      interactionDetail: 16,
      selectionRingDetail: 64,
    },
    // Animation speeds
    animation: {
      orbitUpdate: 1,
      wobbleFactor: 0.05,
      wobbleSpeed: 0.5,
      rotationSpeed: 0.005,
    },
    // Texture generation
    texture: {
      width: 512,
      height: 256,
      octaves: 5,
      scale: 8,
    },
    // Atmosphere settings
    atmosphere: {
      innerScale: 1.12,
      outerScale: 1.2,
    },
    // Orbit calculation (5x scale)
    orbit: {
      radiusBase: 12.5,
      radiusSpacing: 500,
      speedBase: 0.02,
      angleSpacing: 0.3,
    },
    // Selection ring
    selectionRing: {
      innerScale: 2.0,
      outerScale: 2.3,
      opacity: 0.7,
    },
    // Visual properties
    visual: {
      interactionScale: 1.2,
      labelOffset: 1.5,
      labelExtraOffset: 5,
    },
    // UI elements (5x scale)
    ui: {
      labelDistance: 600,
      background: 'rgba(0, 0, 0, 0.85)',
    },
  },

  // Orbit ring visualization (5x scale)
  orbitRings: {
    thickness: 5.0,
    detail: 128,
    opacity: 0.08,
  },

  // Ship controls
  ship: {
    maxSpeed: {
      falcon: 1800,
      viper: 2200,
      hauler: 1400,
      explorer: 1600,
      custom: 1800,
    },
    controls: {
      updateFrequency: 1,
      mouseSensitivity: 1.0,
    },
    exhaust: {
      primaryFreq: 40,
      interferenceFreq: 67,
      baseOpacity: 0.8,
      opacityVariation: 0.3,
    },
  },

  // Connection lines controls
  connections: {
    curvePoints: 50,
  },

  // Animation toggles
  toggles: {
    nebulaAnimation: true,
    wispAnimation: true,
    dustAnimation: true,
    orbitAnimation: true,
    folderAnimation: true,
    exhaustAnimation: true,
  },

  // Update intervals
  updates: {
    nebulaInterval: 1,
    orbitInterval: 1,
  },

  // Lighting controls (5x scale for folder light distance)
  lighting: {
    ambient: 0.05,
    directional: 0.3,
    folderDistance: 125,
    folderDecay: 2,
  },
} as const
