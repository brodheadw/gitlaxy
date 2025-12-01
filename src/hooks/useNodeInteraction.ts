import { useState } from 'react'
import type { RepoNode, FileNode } from '../types'
import { useStore } from '../store'

interface NodeInteractionHandlers {
  onClick: (e: React.MouseEvent) => void
  onPointerOver: (e: React.PointerEvent) => void
  onPointerOut: () => void
}

interface UseNodeInteractionReturn {
  isHovered: boolean
  handlers: NodeInteractionHandlers
}

export function useNodeInteraction(node: RepoNode): UseNodeInteractionReturn {
  const [isHovered, setIsHovered] = useState(false)
  const { selectNode, hoverNode, initiateLanding, cameraMode } = useStore()

  const handlers: NodeInteractionHandlers = {
    onClick: (e) => {
      // Ignore clicks during fly mode or when pointer is locked
      if (cameraMode === 'fly' || document.pointerLockElement) return

      e.stopPropagation()
      selectNode(node)

      // If clicking on a file (planet), open editor directly
      if (node.type === 'file') {
        initiateLanding(node as FileNode)
      }
    },
    onPointerOver: (e) => {
      // Don't change cursor/hover during fly mode or pointer lock
      if (cameraMode === 'fly' || document.pointerLockElement) return

      e.stopPropagation()
      setIsHovered(true)
      hoverNode(node)
      document.body.style.cursor = 'pointer'
    },
    onPointerOut: () => {
      // Don't change cursor/hover during fly mode or pointer lock
      if (cameraMode === 'fly' || document.pointerLockElement) return

      setIsHovered(false)
      hoverNode(null)
      document.body.style.cursor = 'default'
    },
  }

  return { isHovered, handlers }
}
