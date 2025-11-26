import { create } from 'zustand'
import type { FolderNode, GitCommit, RepoInfo, RepoNode, LayoutNode } from '../types'
import { createDemoRepo, createDemoCommits, getRepoInfo } from '../utils/gitParser'

export type ViewMode = 'explore' | 'history'
export type CameraMode = 'orbit' | 'fly'
export type ViewLevel = 'galaxy' | 'system' // galaxy = all systems, system = inside one folder
export type ShipType = 'falcon' | 'viper' | 'hauler' | 'explorer'

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
  cameraMode: 'orbit',
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
  selectedShip: 'falcon',
  flightState: {
    speed: 0,
    isBoosting: false,
    yawVelocity: 0,
    pitchVelocity: 0,
    rollVelocity: 0,
    autoBankAngle: 0,
  },

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
