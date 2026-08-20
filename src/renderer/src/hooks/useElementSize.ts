import { useLayoutEffect, useRef, useState } from 'react'

/** An element's content-box dimensions in CSS pixels. */
export type Size = { width: number; height: number }

/**
 * Measures an element's content box and keeps the value current as anything
 * resizes it.
 *
 * The board layout is sized from real measured space rather than viewport math,
 * so it stays correct regardless of what the header and surrounding chrome end
 * up costing. The first measurement happens synchronously in a layout effect,
 * before paint, so the first frame is already laid out correctly instead of
 * flashing at the wrong size.
 *
 * @typeParam T - The element type the returned ref will be attached to.
 * @returns A tuple of the ref to attach and the element's current size, which
 * is `{ width: 0, height: 0 }` until the element mounts.
 *
 * @example
 * ```tsx
 * const [ref, { width, height }] = useElementSize<HTMLDivElement>()
 * return <div ref={ref}>{Math.min(width, height)}px available</div>
 * ```
 */
export function useElementSize<T extends HTMLElement>(): [React.RefObject<T | null>, Size] {
  const ref = useRef<T>(null)
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }

    // measure once synchronously, before the browser paints, so the first
    // frame is already laid out at the right size instead of flashing
    const style = getComputedStyle(element)
    const horizontalPadding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
    const verticalPadding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom)
    const rect = element.getBoundingClientRect()
    setSize({
      width: Math.max(0, rect.width - horizontalPadding),
      height: Math.max(0, rect.height - verticalPadding)
    })

    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect
      if (box) {
        setSize({ width: box.width, height: box.height })
      }
    })
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return [ref, size]
}
