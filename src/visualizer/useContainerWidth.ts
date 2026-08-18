import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Dynamic Visualization Sizing task: the assumed available width before
 * the first real measurement arrives, and the value used in environments
 * with no ResizeObserver at all (this project's jsdom-based unit tests —
 * jsdom does not compute real layout, so even a polyfilled observer would
 * have nothing meaningful to report; see itemSizing.test.ts's own doc
 * comment for why the sizing *math* is instead tested directly, DOM-free).
 * Chosen as a plausible, typical `.visualizer` content width at common
 * desktop viewports — close enough that the very first paint (before
 * ResizeObserver's callback corrects it, which happens after layout but
 * before the browser paints) is never a jarring wrong size.
 */
const DEFAULT_WIDTH_FALLBACK = 900

/**
 * Measures a container element's own content-box width and keeps it up to
 * date as the element is resized — by the browser window changing, the
 * sidebar's own responsive width changing, Code View's pseudocode
 * reflowing the page at a fixed viewport size, or anything else that
 * changes how much horizontal space the container actually has.
 *
 * A ResizeObserver on the element itself, rather than a global window
 * `resize` listener, specifically because the container's available width
 * can change for reasons that have nothing to do with the window resizing
 * (see above) — ResizeObserver reacts to the exact element, not a proxy
 * for it.
 *
 * Attach the returned `containerRef` to whichever element's width should
 * be measured. Presentation-layer only: this hook has no idea what it's
 * being used for (Array View cell sizing, Bar View track sizing, or
 * anything else) — it only ever reports a width in pixels.
 */
export function useContainerWidth<T extends HTMLElement>() {
  const containerRef = useRef<T | null>(null)
  const [width, setWidth] = useState(DEFAULT_WIDTH_FALLBACK)

  useLayoutEffect(() => {
    const element = containerRef.current
    if (!element || typeof ResizeObserver === 'undefined') {
      // No element yet (e.g. the empty-array early return never renders
      // the measured container) or no ResizeObserver support (this
      // project's jsdom test environment) — the fallback width above is
      // exactly what should be used in either case.
      return
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setWidth(entry.contentRect.width)
      }
    })
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return { containerRef, width }
}
