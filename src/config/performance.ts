// Performance configuration for rendering and animations

export const PERFORMANCE = {
  // Nebula controls
  nebula: {
    quantity: {
      total: 12,
      wispMin: 3,
      wispMax: 6,
      dustPrimary: 200,
      dustSecondary: 100,
      blobMin: 3,
      blobMax: 5,
      layersMin: 3,
      layersMax: 5,
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
      wispOpacity: 0.004,
      dustOpacity: 0.02,
      layerOpacity: 0.003,
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

  // Stars controls
  stars: {
    count: 15000,
    radius: 50000,
    depth: 80,
    size: 8,
    saturation: 0.1,
  },

  // Folder (sun) controls
  folders: {
    // Star size calculation based on depth and descendants
    sizing: {
      depth0Large: { base: 120, multiplier: 2, max: 100, minDescendants: 10 },
      depth0Small: { base: 80, multiplier: 5, max: 60 },
      depth1Large: { base: 60, multiplier: 4, max: 50, minChildren: 5 },
      depth1Small: { base: 45, multiplier: 3, max: 35 },
      depth2: { base: 35, multiplier: 2, max: 25 },
      depthDeep: { base: 25, multiplier: 1.5, max: 15 },
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
      coreDetail: 32,
      coronaInner: 16,
      coronaOuter: 16,
      glowDetail: 16,
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
    // UI elements
    ui: {
      labelDistance: 200,
      hoverBackground: 'rgba(0, 0, 0, 0.9)',
      defaultBackground: 'rgba(0, 0, 0, 0.5)',
    },
  },

  // File (planet) controls
  files: {
    // Planet sizing
    sizing: {
      baseSize: 15,
      sizeMultiplier: 8,
      minFileSize: 100,
    },
    // Geometry detail levels
    geometry: {
      sphereDetail: 16,
      cloudDetail: 12,
      ringDetail: 32,
      interactionDetail: 8,
      selectionRingDetail: 32,
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
      width: 128,
      height: 64,
      octaves: 3,
      scale: 6,
    },
    // Atmosphere settings
    atmosphere: {
      innerScale: 1.08,
      outerScale: 1.15,
    },
    // Orbit calculation
    orbit: {
      radiusBase: 2.5,
      radiusSpacing: 100,
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
    // UI elements
    ui: {
      labelDistance: 120,
      background: 'rgba(0, 0, 0, 0.85)',
    },
  },

  // Orbit ring visualization
  orbitRings: {
    thickness: 1.0,
    detail: 128,
    opacity: 0.08,
  },

  // Ship controls
  ship: {
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
    // Max speed for each ship type
    maxSpeed: {
      falcon: 800,     // Fast fighter
      viper: 1000,     // Fastest interceptor
      hauler: 600,     // Slowest cargo ship
      explorer: 700,   // Balanced science vessel
      custom: 700,     // Default for custom ships
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
    orbitAnimation: false,
    folderAnimation: true,
    exhaustAnimation: true,
  },

  // Update intervals
  updates: {
    nebulaInterval: 3,
    orbitInterval: 2,
  },

  // Lighting controls
  lighting: {
    ambient: 0.05,
    directional: 0.3,
    folderDistance: 25,
    folderDecay: 2,
  },
} as const
