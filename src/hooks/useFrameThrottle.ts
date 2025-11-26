import { useRef } from 'react'

/**
 * Custom hook to throttle frame updates in useFrame callbacks.
 *
 * This hook creates a counter that increments on each call and determines
 * whether the current frame should be processed based on the specified interval.
 *
 * @param interval - The throttling interval. Only every Nth frame will return true from shouldUpdate().
 *                   For example, interval=1 means every frame, interval=2 means every other frame.
 * @returns An object with a shouldUpdate() function that returns true when the frame should be processed.
 *
 * @example
 * ```tsx
 * const throttle = useFrameThrottle(PERFORMANCE.updates.nebulaInterval)
 *
 * useFrame((state) => {
 *   if (!meshRef.current) return
 *   if (!throttle.shouldUpdate()) return
 *
 *   // Your frame logic here...
 * })
 * ```
 */
export function useFrameThrottle(interval: number) {
  const updateCounter = useRef(0)

  const shouldUpdate = () => {
    updateCounter.current += 1
    return updateCounter.current % interval === 0
  }

  return { shouldUpdate }
}
