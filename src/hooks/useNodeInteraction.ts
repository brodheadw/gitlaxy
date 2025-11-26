import { useState } from 'react'
import type { RepoNode } from '../types'
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
  const { selectNode, hoverNode } = useStore()

  const handlers: NodeInteractionHandlers = {
    onClick: (e) => {
      e.stopPropagation()
      selectNode(node)
    },
    onPointerOver: (e) => {
      e.stopPropagation()
      setIsHovered(true)
      hoverNode(node)
      document.body.style.cursor = 'pointer'
    },
    onPointerOut: () => {
      setIsHovered(false)
      hoverNode(null)
      document.body.style.cursor = 'default'
    },
  }

  return { isHovered, handlers }
}
