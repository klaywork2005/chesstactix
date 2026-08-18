import { useLayoutEffect, useRef, useState } from 'react'

export type Size = { width: number; height: number }

// Reports an element's content-box size and keeps it up to date as the window
// (or anything else) resizes it. The board layout is sized from real measured
// space rather than from viewport math, so it stays correct no matter what the
// header or the chrome around it ends up costing.
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
