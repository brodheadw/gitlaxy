// Git repository parser utilities
// Note: This runs in browser, so we simulate git operations
// In production, this would call a backend API or use isomorphic-git

import type { FileNode, FolderNode, RepoNode, GitCommit, RepoInfo } from '../types'

// Demo repository structure for testing
// In production, this would be fetched from a git API
export function createDemoRepo(): FolderNode {
  const createFile = (name: string, path: string, size = 1000): FileNode => ({
    id: path,
    name,
    path,
    type: 'file',
    extension: name.split('.').pop() || '',
    size,
    lastModified: new Date(),
  })

  const createFolder = (name: string, path: string, children: RepoNode[]): FolderNode => ({
    id: path,
    name,
    path,
    type: 'folder',
    children,
  })

  return createFolder('gitlaxy', '/', [
    createFile('package.json', '/package.json', 1200),
    createFile('tsconfig.json', '/tsconfig.json', 800),
    createFile('vite.config.ts', '/vite.config.ts', 400),
    createFile('index.html', '/index.html', 500),
    createFile('README.md', '/README.md', 2000),
    createFile('.gitignore', '/.gitignore', 200),
    createFolder('src', '/src', [
      createFile('main.tsx', '/src/main.tsx', 300),
      createFile('App.tsx', '/src/App.tsx', 800),
      createFile('index.css', '/src/index.css', 600),
      createFolder('components', '/src/components', [
        createFile('Scene.tsx', '/src/components/Scene.tsx', 1500),
        createFile('Starfield.tsx', '/src/components/Starfield.tsx', 2000),
        createFile('Galaxy.tsx', '/src/components/Galaxy.tsx', 3000),
        createFile('FileNode.tsx', '/src/components/FileNode.tsx', 1800),
        createFile('FolderNode.tsx', '/src/components/FolderNode.tsx', 1600),
        createFile('HUD.tsx', '/src/components/HUD.tsx', 1200),
        createFile('ShipControls.tsx', '/src/components/ShipControls.tsx', 2500),
      ]),
      createFolder('hooks', '/src/hooks', [
        createFile('useKeyboardControls.ts', '/src/hooks/useKeyboardControls.ts', 1000),
        createFile('useGitHistory.ts', '/src/hooks/useGitHistory.ts', 1500),
      ]),
      createFolder('store', '/src/store', [
        createFile('index.ts', '/src/store/index.ts', 2000),
      ]),
      createFolder('types', '/src/types', [
        createFile('index.ts', '/src/types/index.ts', 2500),
      ]),
      createFolder('utils', '/src/utils', [
        createFile('gitParser.ts', '/src/utils/gitParser.ts', 3000),
        createFile('layout.ts', '/src/utils/layout.ts', 2500),
      ]),
    ]),
    createFolder('public', '/public', [
      createFile('favicon.ico', '/public/favicon.ico', 100),
    ]),
  ])
}

// Demo git commits for history visualization
export function createDemoCommits(): GitCommit[] {
  const now = new Date()
  const day = 24 * 60 * 60 * 1000

  return [
    {
      hash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
      shortHash: 'a1b2c3d',
      message: 'Add ship controls and WASD navigation',
      author: 'Developer',
      email: 'dev@example.com',
      date: new Date(now.getTime() - day * 0),
      files: [
        { path: '/src/components/ShipControls.tsx', status: 'added', additions: 150, deletions: 0 },
        { path: '/src/hooks/useKeyboardControls.ts', status: 'added', additions: 80, deletions: 0 },
        { path: '/src/components/Scene.tsx', status: 'modified', additions: 20, deletions: 5 },
      ],
    },
    {
      hash: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1',
      shortHash: 'b2c3d4e',
      message: 'Implement history mode with commit visualization',
      author: 'Developer',
      email: 'dev@example.com',
      date: new Date(now.getTime() - day * 1),
      files: [
        { path: '/src/hooks/useGitHistory.ts', status: 'added', additions: 120, deletions: 0 },
        { path: '/src/components/HUD.tsx', status: 'modified', additions: 45, deletions: 10 },
      ],
    },
    {
      hash: 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2',
      shortHash: 'c3d4e5f',
      message: 'Add interactive file nodes with hover states',
      author: 'Developer',
      email: 'dev@example.com',
      date: new Date(now.getTime() - day * 2),
      files: [
        { path: '/src/components/FileNode.tsx', status: 'added', additions: 180, deletions: 0 },
        { path: '/src/components/FolderNode.tsx', status: 'added', additions: 160, deletions: 0 },
        { path: '/src/types/index.ts', status: 'modified', additions: 50, deletions: 5 },
      ],
    },
    {
      hash: 'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3',
      shortHash: 'd4e5f6g',
      message: 'Create force-directed layout algorithm',
      author: 'Developer',
      email: 'dev@example.com',
      date: new Date(now.getTime() - day * 3),
      files: [
        { path: '/src/utils/layout.ts', status: 'added', additions: 250, deletions: 0 },
        { path: '/src/components/Galaxy.tsx', status: 'added', additions: 300, deletions: 0 },
      ],
    },
    {
      hash: 'e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4',
      shortHash: 'e5f6g7h',
      message: 'Set up Zustand store for state management',
      author: 'Developer',
      email: 'dev@example.com',
      date: new Date(now.getTime() - day * 4),
      files: [
        { path: '/src/store/index.ts', status: 'added', additions: 200, deletions: 0 },
      ],
    },
    {
      hash: 'f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5',
      shortHash: 'f6g7h8i',
      message: 'Add types and git parser utilities',
      author: 'Developer',
      email: 'dev@example.com',
      date: new Date(now.getTime() - day * 5),
      files: [
        { path: '/src/types/index.ts', status: 'added', additions: 150, deletions: 0 },
        { path: '/src/utils/gitParser.ts', status: 'added', additions: 300, deletions: 0 },
      ],
    },
    {
      hash: 'g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
      shortHash: 'g7h8i9j',
      message: 'Initial project setup with Three.js and post-processing',
      author: 'Developer',
      email: 'dev@example.com',
      date: new Date(now.getTime() - day * 7),
      files: [
        { path: '/package.json', status: 'added', additions: 40, deletions: 0 },
        { path: '/src/main.tsx', status: 'added', additions: 15, deletions: 0 },
        { path: '/src/App.tsx', status: 'added', additions: 25, deletions: 0 },
        { path: '/src/components/Scene.tsx', status: 'added', additions: 70, deletions: 0 },
        { path: '/src/components/Starfield.tsx', status: 'added', additions: 100, deletions: 0 },
        { path: '/src/index.css', status: 'added', additions: 20, deletions: 0 },
      ],
    },
  ]
}

export function getRepoInfo(): RepoInfo {
  return {
    name: 'gitlaxy',
    path: '/Users/willb/Github/gitlaxy',
    branch: 'main',
    remoteUrl: 'https://github.com/user/gitlaxy',
  }
}

// Count total files in a tree
export function countFiles(node: RepoNode): number {
  if (node.type === 'file') return 1
  return node.children.reduce((sum, child) => sum + countFiles(child), 0)
}

// Count total folders in a tree
export function countFolders(node: RepoNode): number {
  if (node.type === 'file') return 0
  return 1 + node.children.reduce((sum, child) => sum + countFolders(child), 0)
}

// Flatten tree to array of all nodes
export function flattenTree(node: RepoNode): RepoNode[] {
  if (node.type === 'file') return [node]
  return [node, ...node.children.flatMap(flattenTree)]
}

// Get file by path
export function getNodeByPath(root: FolderNode, path: string): RepoNode | null {
  if (root.path === path) return root

  for (const child of root.children) {
    if (child.path === path) return child
    if (child.type === 'folder') {
      const found = getNodeByPath(child, path)
      if (found) return found
    }
  }

  return null
}

// Get parent folder path
export function getParentPath(path: string): string {
  const parts = path.split('/').filter(Boolean)
  if (parts.length <= 1) return '/'
  return '/' + parts.slice(0, -1).join('/')
}

// Get depth of a path
export function getPathDepth(path: string): number {
  return path.split('/').filter(Boolean).length
}
