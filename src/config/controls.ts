// Ship control presets and sensitivity settings

/**
 * Base multiplier for mouse sensitivity calculations.
 * This value is applied before preset and user sensitivity multipliers.
 */
export const MOUSE_SENSITIVITY_BASE = 0.004

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
