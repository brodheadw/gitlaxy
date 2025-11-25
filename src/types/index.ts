// Core types for Gitlaxy

export interface FileNode {
  id: string
  name: string
  path: string
  type: 'file'
  extension: string
  size: number
  lastModified: Date
  position?: { x: number; y: number; z: number }
}

export interface FolderNode {
  id: string
  name: string
  path: string
  type: 'folder'
  children: (FileNode | FolderNode)[]
  position?: { x: number; y: number; z: number }
}

export type RepoNode = FileNode | FolderNode

export interface GitCommit {
  hash: string
  shortHash: string
  message: string
  author: string
  email: string
  date: Date
  files: CommitFile[]
}

export interface CommitFile {
  path: string
  status: 'added' | 'modified' | 'deleted' | 'renamed'
  oldPath?: string // for renamed files
  additions: number
  deletions: number
}

export interface RepoInfo {
  name: string
  path: string
  branch: string
  remoteUrl?: string
}

export interface LayoutNode {
  id: string
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  node: RepoNode
  parentId?: string
}

// Extension to color mapping for visual variety
export const EXTENSION_COLORS: Record<string, string> = {
  // JavaScript/TypeScript
  ts: '#3178c6',
  tsx: '#61dafb',
  js: '#f7df1e',
  jsx: '#61dafb',

  // Web
  html: '#e34f26',
  css: '#264de4',
  scss: '#cc6699',
  less: '#1d365d',

  // Config
  json: '#292929',
  yaml: '#cb171e',
  yml: '#cb171e',
  toml: '#9c4121',
  xml: '#f16529',

  // Documentation
  md: '#083fa1',
  mdx: '#fcb32c',
  txt: '#6e6e6e',

  // Backend
  py: '#3776ab',
  rb: '#cc342d',
  go: '#00add8',
  rs: '#dea584',
  java: '#b07219',
  kt: '#a97bff',
  scala: '#c22d40',

  // Systems
  c: '#555555',
  cpp: '#f34b7d',
  h: '#438eff',
  hpp: '#f34b7d',

  // Shell
  sh: '#89e051',
  bash: '#89e051',
  zsh: '#89e051',

  // Data
  sql: '#e38c00',
  graphql: '#e10098',

  // Images
  png: '#ff6b6b',
  jpg: '#ff6b6b',
  jpeg: '#ff6b6b',
  gif: '#ff6b6b',
  svg: '#ffb13b',
  ico: '#ff6b6b',

  // Other
  lock: '#4a4a4a',
  gitignore: '#f05032',
  env: '#ecd53f',
  dockerfile: '#2496ed',

  // Default
  default: '#8b8b8b',
}

export function getColorForExtension(ext: string): string {
  return EXTENSION_COLORS[ext.toLowerCase()] || EXTENSION_COLORS.default
}

// Folder colors based on common folder names
export const FOLDER_COLORS: Record<string, string> = {
  src: '#4ecdc4',
  components: '#ff6b6b',
  hooks: '#ffe66d',
  utils: '#95e1d3',
  lib: '#aa96da',
  types: '#3178c6',
  styles: '#cc6699',
  assets: '#ff9f43',
  public: '#6c5ce7',
  test: '#89e051',
  tests: '#89e051',
  __tests__: '#89e051',
  node_modules: '#333333',
  dist: '#4a4a4a',
  build: '#4a4a4a',
  '.git': '#f05032',
  default: '#a8d8ea',
}

export function getColorForFolder(name: string): string {
  return FOLDER_COLORS[name.toLowerCase()] || FOLDER_COLORS.default
}
