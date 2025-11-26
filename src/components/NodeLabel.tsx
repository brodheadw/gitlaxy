import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { PERFORMANCE } from '../config/performance'

interface NodeLabelProps {
  position: [number, number, number]
  distanceFactor: number
  color: THREE.Color
  label: string
  isHovered: boolean
  variant: 'sun' | 'planet'
}

export default function NodeLabel({
  position,
  distanceFactor,
  color,
  label,
  isHovered,
  variant,
}: NodeLabelProps) {
  // Determine styling based on variant
  const isSun = variant === 'sun'
  const padding = isSun ? '4px 10px' : '3px 8px'
  const borderRadius = isSun ? '4px' : '3px'
  const fontSize = isSun ? '13px' : '11px'

  // Get background from PERFORMANCE config
  const background = isSun
    ? (isHovered ? PERFORMANCE.folders.ui.hoverBackground : PERFORMANCE.folders.ui.defaultBackground)
    : PERFORMANCE.files.ui.background

  const hexColor = `#${color.getHexString()}`

  return (
    <Html
      position={position}
      center
      distanceFactor={distanceFactor}
      style={{ pointerEvents: 'none' }}
    >
      <div
        style={{
          background,
          color: hexColor,
          padding,
          borderRadius,
          fontSize,
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
          border: `1px solid ${hexColor}44`,
          ...(isSun && { textShadow: `0 0 10px ${hexColor}` }),
        }}
      >
        {label}
      </div>
    </Html>
  )
}
