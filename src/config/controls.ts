// Ship control presets and sensitivity settings

/**
 * Base multiplier for mouse sensitivity calculations.
 * This value is applied before preset and user sensitivity multipliers.
 * Range: 0.004 (original, very slow) to 0.5 (very fast)
 * Recommended: 0.02-0.05 for responsive but controllable flight
 */
export const MOUSE_SENSITIVITY_BASE = 0.035

export interface ControlPreset {
  name: string
  description: string
  mouseSensitivity: number
  acceleration: number
  turnRate: number
  rollRate: number
}

// Predefined control presets
export const CONTROL_PRESETS: Record<string, ControlPreset> = {
  casual: {
    name: 'Casual',
    description: 'Relaxed, easy flying',
    mouseSensitivity: 0.5,
    acceleration: 100,
    turnRate: 2.0,
    rollRate: 2.0,
  },
  standard: {
    name: 'Standard',
    description: 'Balanced controls',
    mouseSensitivity: 1.0,
    acceleration: 150,
    turnRate: 1.5,
    rollRate: 2.5,
  },
  responsive: {
    name: 'Responsive',
    description: 'Quick and agile',
    mouseSensitivity: 1.5,
    acceleration: 200,
    turnRate: 1.8,
    rollRate: 3.0,
  },
  expert: {
    name: 'Expert',
    description: 'High precision flying',
    mouseSensitivity: 2.0,
    acceleration: 250,
    turnRate: 2.2,
    rollRate: 3.5,
  },
}

// Physics curve settings for natural movement
export interface PhysicsCurves {
  // Thrust acceleration curves
  thrustBuildupTime: number        // Time to reach max acceleration (0.5-1.5s)
  boostWindupTime: number          // Delay before full boost (0.3s)
  decelerationCurve: number        // Exponential falloff multiplier (2.0 = natural)

  // Rotation inertia
  rotationAccelTime: number        // Time to reach full turn rate (0.2-0.4s)
  rotationDecelTime: number        // Time to stop rotating after input ends

  // Drift and momentum
  driftRetention: number           // Velocity retained when thrust stops (0-1)
  frictionCoefficient: number      // Gradual slowdown rate (0.05-0.2)
  boostMomentumDecay: number       // Speed decay time after boost ends (2-3s)

  // Banking behavior
  bankLeadIn: number               // Anticipatory banking amount (0-0.2)
  bankSpeedMultiplier: number      // Speed affects bank angle (0.5-2.0)
  bankRecoveryTime: number         // Time to return to level (0.3-0.8s)
  counterBankStrength: number      // Opposite bank when stopping turn (0-0.3)
}

// Default physics curves
export const DEFAULT_PHYSICS_CURVES: PhysicsCurves = {
  thrustBuildupTime: 1.0,
  boostWindupTime: 0.3,
  decelerationCurve: 2.0,
  rotationAccelTime: 0.3,
  rotationDecelTime: 0.2,
  driftRetention: 0.85,
  frictionCoefficient: 0.1,
  boostMomentumDecay: 2.5,
  bankLeadIn: 0.1,
  bankSpeedMultiplier: 1.0,
  bankRecoveryTime: 0.5,
  counterBankStrength: 0.15,
}

// User-customizable control settings
export interface ControlSettings {
  preset: keyof typeof CONTROL_PRESETS
  mouseSensitivity: number
  invertY: boolean
  invertX: boolean
  acceleration: number
  deceleration: number
  brakeForce: number
  turnRate: number
  rollRate: number
  autoBankStrength: number
  physicsCurves: PhysicsCurves
}

// Default control settings
export const DEFAULT_CONTROLS: ControlSettings = {
  preset: 'standard',
  mouseSensitivity: 1.0,
  invertY: false,
  invertX: false,
  acceleration: 150,
  deceleration: 100,
  brakeForce: 300,
  turnRate: 1.5,
  rollRate: 2.5,
  autoBankStrength: 0.4,
  physicsCurves: DEFAULT_PHYSICS_CURVES,
}

// Apply a preset to control settings
export function applyPreset(preset: keyof typeof CONTROL_PRESETS): ControlSettings {
  const presetConfig = CONTROL_PRESETS[preset]
  return {
    preset,
    mouseSensitivity: presetConfig.mouseSensitivity,
    invertY: false,
    invertX: false,
    acceleration: presetConfig.acceleration,
    deceleration: 100,
    brakeForce: 300,
    turnRate: presetConfig.turnRate,
    rollRate: presetConfig.rollRate,
    autoBankStrength: 0.4,
    physicsCurves: DEFAULT_PHYSICS_CURVES,
  }
}

// Sensitivity multiplier ranges
export const SENSITIVITY_RANGES = {
  min: 0.1,
  max: 3.0,
  step: 0.1,
  default: 1.0,
}

// Keybinding configuration
export interface KeyBindings {
  thrust: string[]
  brake: string[]
  rollLeft: string[]
  rollRight: string[]
  strafeUp: string[]
  strafeDown: string[]
  boost: string[]
  toggleCamera: string[]
  exitFly: string[]
}

export const DEFAULT_KEYBINDINGS: KeyBindings = {
  thrust: ['KeyW', 'ArrowUp'],
  brake: ['KeyS', 'ArrowDown'],
  rollLeft: ['KeyA', 'ArrowLeft'],
  rollRight: ['KeyD', 'ArrowRight'],
  strafeUp: ['KeyQ'],
  strafeDown: ['KeyE'],
  boost: ['ShiftLeft', 'ShiftRight'],
  toggleCamera: ['KeyC'],
  exitFly: ['Escape'],
}
