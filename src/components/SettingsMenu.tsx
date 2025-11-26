import { useState, useEffect } from 'react'
import { useStore } from '../store'
import {
  CONTROL_PRESETS,
  SENSITIVITY_RANGES,
  applyPreset,
  type ControlSettings
} from '../config/controls'

export default function SettingsMenu() {
  const { showSettings, setShowSettings, controlSettings, setControlSettings } = useStore()
  const [controls, setControls] = useState<ControlSettings>(controlSettings)

  // Sync local state with store when menu opens
  useEffect(() => {
    if (showSettings) {
      setControls(controlSettings)
    }
  }, [showSettings, controlSettings])

  // Handle ESC key to close settings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSettings) {
        setShowSettings(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSettings, setShowSettings])

  if (!showSettings) return null

  const handlePresetChange = (presetKey: keyof typeof CONTROL_PRESETS) => {
    setControls(applyPreset(presetKey))
  }

  const handleSensitivityChange = (value: number) => {
    setControls({ ...controls, mouseSensitivity: value })
  }

  const handleToggle = (key: keyof ControlSettings) => {
    setControls({ ...controls, [key]: !controls[key] })
  }

  const handleSliderChange = (key: keyof ControlSettings, value: number) => {
    setControls({ ...controls, [key]: value })
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        color: '#ffffff',
      }}
      onClick={() => setShowSettings(false)}
    >
      <div
        style={{
          backgroundColor: '#1a1a2e',
          border: '2px solid #00ffcc',
          borderRadius: '8px',
          padding: '30px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 0 30px rgba(0, 255, 204, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: '25px', borderBottom: '1px solid #00ffcc', paddingBottom: '15px' }}>
          <h2 style={{ margin: 0, color: '#00ffcc', fontSize: '24px' }}>Flight Settings</h2>
          <button
            onClick={() => setShowSettings(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'none',
              border: '1px solid #ff6644',
              color: '#ff6644',
              padding: '8px 16px',
              cursor: 'pointer',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '14px',
            }}
          >
            Close [ESC]
          </button>
        </div>

        {/* Control Presets */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#00ffcc', fontSize: '16px', marginBottom: '12px' }}>Control Preset</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {Object.entries(CONTROL_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => handlePresetChange(key as keyof typeof CONTROL_PRESETS)}
                style={{
                  padding: '12px',
                  backgroundColor: controls.preset === key ? '#00ffcc' : '#2a2a3e',
                  color: controls.preset === key ? '#1a1a2e' : '#ffffff',
                  border: controls.preset === key ? '2px solid #00ffcc' : '1px solid #444466',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{preset.name}</div>
                <div style={{ fontSize: '11px', opacity: 0.8 }}>{preset.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Mouse Sensitivity */}
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', color: '#00ffcc', fontSize: '14px', marginBottom: '8px' }}>
            Mouse Sensitivity: {controls.mouseSensitivity.toFixed(1)}x
          </label>
          <input
            type="range"
            min={SENSITIVITY_RANGES.min}
            max={SENSITIVITY_RANGES.max}
            step={SENSITIVITY_RANGES.step}
            value={controls.mouseSensitivity}
            onChange={(e) => handleSensitivityChange(parseFloat(e.target.value))}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: `linear-gradient(to right, #00ffcc 0%, #00ffcc ${((controls.mouseSensitivity - SENSITIVITY_RANGES.min) / (SENSITIVITY_RANGES.max - SENSITIVITY_RANGES.min)) * 100}%, #444466 ${((controls.mouseSensitivity - SENSITIVITY_RANGES.min) / (SENSITIVITY_RANGES.max - SENSITIVITY_RANGES.min)) * 100}%, #444466 100%)`,
              outline: 'none',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Invert Axes */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#00ffcc', fontSize: '14px', marginBottom: '10px' }}>Axis Inversion</h3>
          <div style={{ display: 'flex', gap: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={controls.invertY}
                onChange={() => handleToggle('invertY')}
                style={{ marginRight: '8px', cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <span>Invert Y-Axis</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={controls.invertX}
                onChange={() => handleToggle('invertX')}
                style={{ marginRight: '8px', cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <span>Invert X-Axis</span>
            </label>
          </div>
        </div>

        {/* Advanced Settings */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#00ffcc', fontSize: '14px', marginBottom: '12px' }}>Advanced</h3>

          {/* Acceleration */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>
              Acceleration: {controls.acceleration}
            </label>
            <input
              type="range"
              min={50}
              max={300}
              step={10}
              value={controls.acceleration}
              onChange={(e) => handleSliderChange('acceleration', parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          {/* Turn Rate */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>
              Turn Rate: {controls.turnRate.toFixed(1)}
            </label>
            <input
              type="range"
              min={0.5}
              max={3.0}
              step={0.1}
              value={controls.turnRate}
              onChange={(e) => handleSliderChange('turnRate', parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          {/* Roll Rate */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>
              Roll Rate: {controls.rollRate.toFixed(1)}
            </label>
            <input
              type="range"
              min={1.0}
              max={5.0}
              step={0.1}
              value={controls.rollRate}
              onChange={(e) => handleSliderChange('rollRate', parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          {/* Auto-Bank Strength */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>
              Auto-Bank Strength: {controls.autoBankStrength.toFixed(2)}
            </label>
            <input
              type="range"
              min={0}
              max={1.0}
              step={0.05}
              value={controls.autoBankStrength}
              onChange={(e) => handleSliderChange('autoBankStrength', parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Keybindings Info */}
        <div style={{
          backgroundColor: '#2a2a3e',
          padding: '15px',
          borderRadius: '4px',
          border: '1px solid #444466',
          fontSize: '12px',
        }}>
          <h3 style={{ color: '#00ffcc', fontSize: '13px', marginTop: 0, marginBottom: '10px' }}>
            Default Controls
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div><span style={{ color: '#00ffcc' }}>W/ArrowUp:</span> Thrust</div>
            <div><span style={{ color: '#00ffcc' }}>S/ArrowDown:</span> Brake</div>
            <div><span style={{ color: '#00ffcc' }}>A/ArrowLeft:</span> Roll Left</div>
            <div><span style={{ color: '#00ffcc' }}>D/ArrowRight:</span> Roll Right</div>
            <div><span style={{ color: '#00ffcc' }}>Shift/E:</span> Boost</div>
            <div><span style={{ color: '#00ffcc' }}>ESC:</span> Exit Fly Mode</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: '25px', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setControls(applyPreset('standard'))}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#444466',
              color: '#ffffff',
              border: '1px solid #666688',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '13px',
            }}
          >
            Reset to Default
          </button>
          <button
            onClick={() => {
              setControlSettings(controls)
              setShowSettings(false)
            }}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#00ffcc',
              color: '#1a1a2e',
              border: '2px solid #00ffcc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '13px',
              fontWeight: 'bold',
            }}
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  )
}
