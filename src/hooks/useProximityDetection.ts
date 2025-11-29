import { useRef, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'
import type { FileNode } from '../types'

// Proximity thresholds (scaled for 5x universe)
const LANDING_RANGE = 1000     // Can land when within this distance of planet surface
const APPROACH_RANGE = 3000    // Detection range for nearby planets

// Registry of planet positions - updated by planets when they render
interface PlanetPosition {
  node: FileNode
  worldPosition: THREE.Vector3
  radius: number
}

// Global registry for planet positions (shared across components)
const planetRegistry = new Map<string, PlanetPosition>()

// Functions to register/unregister planets
export function registerPlanet(id: string, node: FileNode, worldPosition: THREE.Vector3, radius: number) {
  planetRegistry.set(id, { node, worldPosition: worldPosition.clone(), radius })
}

export function unregisterPlanet(id: string) {
  planetRegistry.delete(id)
}

export function updatePlanetPosition(id: string, worldPosition: THREE.Vector3) {
  const entry = planetRegistry.get(id)
  if (entry) {
    entry.worldPosition.copy(worldPosition)
  }
}

// Hook for proximity detection
export function useProximityDetection() {
  const { camera } = useThree()
  const {
    cameraMode,
    landingState,
    setLandingState,
    setNearestPlanet
  } = useStore()

  const frameCount = useRef(0)
  const lastNearestId = useRef<string | null>(null)

  // Only check proximity every N frames for performance
  const FRAME_SKIP = 3

  useFrame(() => {
    // Only detect proximity in fly mode when not already landed
    if (cameraMode !== 'fly' || landingState === 'landed') {
      return
    }

    frameCount.current++
    if (frameCount.current % FRAME_SKIP !== 0) {
      return
    }

    const cameraPos = camera.position
    let nearestPlanet: PlanetPosition | null = null
    let nearestDistance = Infinity

    // Find nearest planet
    planetRegistry.forEach((planet) => {
      const distanceToCenter = cameraPos.distanceTo(planet.worldPosition)
      const distanceToSurface = distanceToCenter - planet.radius

      if (distanceToSurface < nearestDistance && distanceToSurface < APPROACH_RANGE) {
        nearestDistance = distanceToSurface
        nearestPlanet = planet
      }
    })

    // Update state based on proximity
    if (nearestPlanet !== null) {
      const planet = nearestPlanet as PlanetPosition
      const canLand = nearestDistance <= LANDING_RANGE
      const newState = canLand ? 'approaching' : 'flying'

      setLandingState(newState)

      setNearestPlanet({
        node: planet.node,
        distance: nearestDistance,
        worldPosition: [
          planet.worldPosition.x,
          planet.worldPosition.y,
          planet.worldPosition.z
        ]
      })

      lastNearestId.current = planet.node.id
    } else {
      // No planet nearby
      if (lastNearestId.current !== null) {
        setNearestPlanet(null)
        if (landingState === 'approaching') {
          setLandingState('flying')
        }
        lastNearestId.current = null
      }
    }
  })
}

// Hook for planets to register themselves
export function usePlanetRegistration(node: FileNode, radius: number) {
  const meshRef = useRef<THREE.Group>(null)
  const worldPos = useRef(new THREE.Vector3())

  // Register on mount, update position each frame
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.getWorldPosition(worldPos.current)

      // Register or update
      if (!planetRegistry.has(node.id)) {
        registerPlanet(node.id, node, worldPos.current, radius)
      } else {
        updatePlanetPosition(node.id, worldPos.current)
      }
    }
  })

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    unregisterPlanet(node.id)
  }, [node.id])

  return { meshRef, cleanup }
}
