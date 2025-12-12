// File System Access API utilities for reading local directories
import type { FileNode, FolderNode, RepoNode, RepoInfo } from '../types'

// Type declarations for File System Access API
declare global {
  interface Window {
    showDirectoryPicker(options?: { mode?: 'read' | 'readwrite' }): Promise<FileSystemDirectoryHandle>
  }

  interface FileSystemDirectoryHandle {
    values(): AsyncIterableIterator<FileSystemHandle>
  }
}

// Check if File System Access API is supported
export function isFileSystemAccessSupported(): boolean {
  return 'showDirectoryPicker' in window
}

// Open directory picker and return the handle
export async function pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser')
  }

  try {
    const handle = await window.showDirectoryPicker({
      mode: 'read',
    })
    return handle
  } catch (err) {
    // User cancelled the picker
    if ((err as Error).name === 'AbortError') {
      return null
    }
    throw err
  }
}

// Read a directory recursively and build FolderNode tree
export async function readDirectoryAsTree(
  dirHandle: FileSystemDirectoryHandle,
  path: string = '/',
  skipPatterns: string[] = ['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', '.cache']
): Promise<FolderNode> {
  const children: RepoNode[] = []

  for await (const entry of dirHandle.values()) {
    // Skip hidden files and common large directories
    if (entry.name.startsWith('.') && entry.name !== '.gitignore' && entry.name !== '.env') {
      continue
    }
    if (skipPatterns.includes(entry.name)) {
      continue
    }

    const entryPath = path === '/' ? `/${entry.name}` : `${path}/${entry.name}`

    if (entry.kind === 'file') {
      const fileHandle = entry as FileSystemFileHandle
      const file = await fileHandle.getFile()

      children.push({
        id: entryPath,
        name: entry.name,
        path: entryPath,
        type: 'file',
        extension: entry.name.split('.').pop() || '',
        size: file.size,
        lastModified: new Date(file.lastModified),
      } as FileNode)
    } else if (entry.kind === 'directory') {
      const subDirHandle = entry as FileSystemDirectoryHandle
      const subFolder = await readDirectoryAsTree(subDirHandle, entryPath, skipPatterns)
      children.push(subFolder)
    }
  }

  // Sort: folders first, then files, alphabetically
  children.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })

  return {
    id: path,
    name: path === '/' ? dirHandle.name : path.split('/').pop() || dirHandle.name,
    path,
    type: 'folder',
    children,
  }
}

// Get repo info from directory handle
export function getRepoInfoFromHandle(dirHandle: FileSystemDirectoryHandle): RepoInfo {
  return {
    name: dirHandle.name,
    path: `/${dirHandle.name}`,
    branch: 'main', // Can't read git info without .git access
  }
}

// Count files and folders in tree
export function countTreeStats(node: FolderNode): { files: number; folders: number } {
  let files = 0
  let folders = 0

  function count(n: RepoNode) {
    if (n.type === 'file') {
      files++
    } else {
      folders++
      n.children.forEach(count)
    }
  }

  node.children.forEach(count)
  return { files, folders }
}
