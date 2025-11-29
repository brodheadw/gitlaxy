import { create } from 'zustand'
import type { FolderNode, FileNode, GitCommit, RepoInfo, RepoNode, LayoutNode } from '../types'
import { createDemoRepo, createDemoCommits, getRepoInfo } from '../utils/gitParser'
import { DEFAULT_CONTROLS, type ControlSettings } from '../config/controls'

export type ViewMode = 'explore' | 'history'
export type CameraMode = 'orbit' | 'fly'
export type ViewLevel = 'galaxy' | 'system' // galaxy = all systems, system = inside one folder
export type ShipType = 'falcon' | 'viper' | 'hauler' | 'explorer' | 'custom'
export type LandingState = 'flying' | 'approaching' | 'landed'

// Info about the nearest planet for landing
interface NearestPlanetInfo {
  node: FileNode
  distance: number
  worldPosition: [number, number, number]
}

interface CameraState {
  position: { x: number; y: number; z: number }
  target: { x: number; y: number; z: number }
  velocity: { x: number; y: number; z: number }
}

interface RepoState {
  // Repository data
  repoInfo: RepoInfo | null
  rootNode: FolderNode | null
  commits: GitCommit[]
  layoutNodes: LayoutNode[]

  // Navigation state
  viewLevel: ViewLevel
  currentSystem: FolderNode | null  // The folder we're currently viewing as a solar system
  targetPosition: { x: number; y: number; z: number } | null  // For smooth camera transitions

  // UI state
  viewMode: ViewMode
  cameraMode: CameraMode
  selectedNode: RepoNode | null
  hoveredNode: RepoNode | null
  camera: CameraState

  // History mode state
  historyIndex: number
  isPlaying: boolean
  playbackSpeed: number

  // Controls state
  keysPressed: Set<string>

  // Ship selection
  selectedShip: ShipType

  // Flight state (shared between ShipControls and Spaceship for visual sync)
  flightState: {
    speed: number
    isBoosting: boolean
    yawVelocity: number
    pitchVelocity: number
    rollVelocity: number
    autoBankAngle: number
  }

  // Settings state
  showSettings: boolean
  controlSettings: ControlSettings
  showFPS: boolean

  // Landing state
  landingState: LandingState
  landingTarget: FileNode | null
  nearestPlanet: NearestPlanetInfo | null

  // Editor state
  isEditorOpen: boolean
  editorContent: string | null
  hasUnsavedChanges: boolean
  editorError: string | null

  // Actions
  loadRepo: () => void
  setViewMode: (mode: ViewMode) => void
  setCameraMode: (mode: CameraMode) => void
  selectNode: (node: RepoNode | null) => void
  hoverNode: (node: RepoNode | null) => void
  setLayoutNodes: (nodes: LayoutNode[]) => void

  // Navigation actions
  enterSystem: (folder: FolderNode) => void
  exitSystem: () => void
  travelTo: (position: { x: number; y: number; z: number }) => void
  clearTarget: () => void

  // History actions
  setHistoryIndex: (index: number) => void
  nextCommit: () => void
  prevCommit: () => void
  togglePlayback: () => void
  setPlaybackSpeed: (speed: number) => void

  // Camera actions
  updateCameraPosition: (pos: Partial<CameraState['position']>) => void
  updateCameraTarget: (target: Partial<CameraState['target']>) => void
  updateCameraVelocity: (vel: Partial<CameraState['velocity']>) => void

  // Controls actions
  setKeyPressed: (key: string, pressed: boolean) => void

  // Ship actions
  setSelectedShip: (ship: ShipType) => void

  // Flight state actions
  updateFlightState: (state: Partial<RepoState['flightState']>) => void

  // Settings actions
  setShowSettings: (show: boolean) => void
  setControlSettings: (settings: ControlSettings) => void
  setShowFPS: (show: boolean) => void

  // Landing actions
  setLandingState: (state: LandingState) => void
  setLandingTarget: (target: FileNode | null) => void
  setNearestPlanet: (info: NearestPlanetInfo | null) => void
  initiateLanding: (planet: FileNode) => void
  completeTakeoff: () => void

  // Editor actions
  openEditor: (content: string) => void
  closeEditor: () => void
  setEditorContent: (content: string) => void
  setEditorError: (error: string | null) => void
  setHasUnsavedChanges: (dirty: boolean) => void
}

export const useStore = create<RepoState>((set, get) => ({
  // Initial state
  repoInfo: null,
  rootNode: null,
  commits: [],
  layoutNodes: [],

  viewLevel: 'galaxy',
  currentSystem: null,
  targetPosition: null,

  viewMode: 'explore',
  cameraMode: 'fly',
  selectedNode: null,
  hoveredNode: null,
  camera: {
    position: { x: 0, y: 0, z: 50 },
    target: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
  },

  historyIndex: 0,
  isPlaying: false,
  playbackSpeed: 1,

  keysPressed: new Set(),
  selectedShip: 'custom', // Changed from 'falcon' to test custom ship
  flightState: {
    speed: 0,
    isBoosting: false,
    yawVelocity: 0,
    pitchVelocity: 0,
    rollVelocity: 0,
    autoBankAngle: 0,
  },

  showSettings: false,
  controlSettings: DEFAULT_CONTROLS,
  showFPS: false,

  // Landing state
  landingState: 'flying',
  landingTarget: null,
  nearestPlanet: null,

  // Editor state
  isEditorOpen: false,
  editorContent: null,
  hasUnsavedChanges: false,
  editorError: null,

  // Actions
  loadRepo: () => {
    const repoInfo = getRepoInfo()
    const rootNode = createDemoRepo()
    const commits = createDemoCommits()

    set({ repoInfo, rootNode, commits })
  },

  setViewMode: (viewMode) => set({ viewMode }),
  setCameraMode: (cameraMode) => set({ cameraMode }),

  selectNode: (selectedNode) => set({ selectedNode }),
  hoverNode: (hoveredNode) => set({ hoveredNode }),

  setLayoutNodes: (layoutNodes) => set({ layoutNodes }),

  // Navigation actions
  enterSystem: (folder) => {
    set({
      viewLevel: 'system',
      currentSystem: folder,
      selectedNode: folder,
    })
  },

  exitSystem: () => {
    set({
      viewLevel: 'galaxy',
      currentSystem: null,
    })
  },

  travelTo: (position) => {
    set({ targetPosition: position })
  },

  clearTarget: () => {
    set({ targetPosition: null })
  },

  // History actions
  setHistoryIndex: (historyIndex) => set({ historyIndex }),

  nextCommit: () => {
    const { historyIndex, commits } = get()
    if (historyIndex < commits.length - 1) {
      set({ historyIndex: historyIndex + 1 })
    }
  },

  prevCommit: () => {
    const { historyIndex } = get()
    if (historyIndex > 0) {
      set({ historyIndex: historyIndex - 1 })
    }
  },

  togglePlayback: () => {
    const { isPlaying } = get()
    set({ isPlaying: !isPlaying })
  },

  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),

  // Camera actions
  updateCameraPosition: (pos) => {
    const { camera } = get()
    set({
      camera: {
        ...camera,
        position: { ...camera.position, ...pos },
      },
    })
  },

  updateCameraTarget: (target) => {
    const { camera } = get()
    set({
      camera: {
        ...camera,
        target: { ...camera.target, ...target },
      },
    })
  },

  updateCameraVelocity: (vel) => {
    const { camera } = get()
    set({
      camera: {
        ...camera,
        velocity: { ...camera.velocity, ...vel },
      },
    })
  },

  // Controls actions
  setKeyPressed: (key, pressed) => {
    const { keysPressed } = get()
    const newKeys = new Set(keysPressed)
    if (pressed) {
      newKeys.add(key)
    } else {
      newKeys.delete(key)
    }
    set({ keysPressed: newKeys })
  },

  // Ship actions
  setSelectedShip: (selectedShip) => set({ selectedShip }),

  // Flight state actions
  updateFlightState: (state) => {
    const { flightState } = get()
    set({ flightState: { ...flightState, ...state } })
  },

  // Settings actions
  setShowSettings: (showSettings) => set({ showSettings }),
  setControlSettings: (controlSettings) => set({ controlSettings }),
  setShowFPS: (showFPS) => set({ showFPS }),

  // Landing actions
  setLandingState: (landingState) => set({ landingState }),
  setLandingTarget: (landingTarget) => set({ landingTarget }),
  setNearestPlanet: (nearestPlanet) => set({ nearestPlanet }),

  initiateLanding: (planet) => {
    set({
      landingState: 'landed',
      landingTarget: planet,
      cameraMode: 'orbit', // Switch to orbit mode when landed
      isEditorOpen: true,
    })
  },

  completeTakeoff: () => {
    set({
      landingState: 'flying',
      landingTarget: null,
      isEditorOpen: false,
      editorContent: null,
      hasUnsavedChanges: false,
      editorError: null,
      cameraMode: 'fly', // Return to fly mode
    })
  },

  // Editor actions
  openEditor: (content) => {
    set({
      isEditorOpen: true,
      editorContent: content,
      hasUnsavedChanges: false,
      editorError: null,
    })
  },

  closeEditor: () => {
    set({
      isEditorOpen: false,
      editorContent: null,
      hasUnsavedChanges: false,
      editorError: null,
    })
  },

  setEditorContent: (content) => {
    const { editorContent } = get()
    set({
      editorContent: content,
      hasUnsavedChanges: content !== editorContent,
    })
  },

  setEditorError: (editorError) => set({ editorError }),

  setHasUnsavedChanges: (hasUnsavedChanges) => set({ hasUnsavedChanges }),
}))

// Selector hooks for performance
export const useRepoInfo = () => useStore((s) => s.repoInfo)
export const useRootNode = () => useStore((s) => s.rootNode)
export const useCommits = () => useStore((s) => s.commits)
export const useLayoutNodes = () => useStore((s) => s.layoutNodes)
export const useViewMode = () => useStore((s) => s.viewMode)
export const useCameraMode = () => useStore((s) => s.cameraMode)
export const useSelectedNode = () => useStore((s) => s.selectedNode)
export const useHoveredNode = () => useStore((s) => s.hoveredNode)
export const useViewLevel = () => useStore((s) => s.viewLevel)
export const useCurrentSystem = () => useStore((s) => s.currentSystem)
export const useHistoryState = () =>
  useStore((s) => ({
    historyIndex: s.historyIndex,
    isPlaying: s.isPlaying,
    playbackSpeed: s.playbackSpeed,
    commits: s.commits,
  }))

// Landing state selectors
export const useLandingState = () => useStore((s) => s.landingState)
export const useLandingTarget = () => useStore((s) => s.landingTarget)
export const useNearestPlanet = () => useStore((s) => s.nearestPlanet)

// Editor state selectors
export const useIsEditorOpen = () => useStore((s) => s.isEditorOpen)
export const useEditorContent = () => useStore((s) => s.editorContent)
export const useEditorHasUnsavedChanges = () => useStore((s) => s.hasUnsavedChanges)
export const useEditorError = () => useStore((s) => s.editorError)
