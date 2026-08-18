import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
import { clampPanelPosition, type PanelPosition } from './panelPosition'

/** Applied only while a panel is actively being dragged, so it visually
 *  rises above the other panel and the visualization beneath it (task
 *  requirement 14). Reverts to the ordinary stylesheet z-index
 *  (`.statistics-panel-overlay` / `.code-view-overlay`, both `z-index: 2`)
 *  the instant the drag ends, by simply omitting this from `style`. */
const DRAGGING_Z_INDEX = 50

export interface UseDraggablePanelResult {
  /** Attach to the panel's positioned root element (the same element that
   *  already carries `.statistics-panel-overlay` / `.code-view-overlay`) —
   *  used to measure the panel's own size for boundary clamping and to
   *  read its current on-screen position when a drag begins. */
  panelRef: RefObject<HTMLDivElement | null>
  /** True for exactly the duration of an active drag (pointerdown on the
   *  handle through pointerup/pointercancel). */
  isDragging: boolean
  /** Inline style to spread onto the panel's root element. Deliberately
   *  empty until the user's first drag — before that, the panel keeps its
   *  default CSS-driven corner untouched (task requirement 6: "Keep the
   *  current default positions... Only after the user drags a panel
   *  should its position change"). `position` itself is never set here;
   *  only `left`/`top`/`right` and `zIndex` are — `position: absolute` vs
   *  `position: static` stays entirely governed by the existing responsive
   *  stylesheet rules (VisualizationPlaceholder.css), so a container that
   *  has fallen back to normal document flow at narrow widths keeps
   *  ignoring left/top exactly as it always did (CSS `position: static`
   *  always ignores offset properties, regardless of their origin), which
   *  is what keeps a previously-dragged position from fighting the
   *  existing narrow-layout fallback (task requirement 10). */
  style: CSSProperties
  /** Spread onto the dedicated drag-handle element only — never onto the
   *  panel's own content, so clicking/selecting/scrolling inside the panel
   *  behaves exactly as before (task requirement 12). */
  handleProps: {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => void
  }
}

/**
 * Draggable Statistics/Code View Panels task: makes a single overlay panel
 * freely draggable, with its position clamped to stay fully inside
 * `containerRef`'s box (`.main-area`).
 *
 * Purely presentation-layer UI state — this hook has no idea what panel it
 * is being used for, never imports ExecutionEngine/VisualizerController/
 * Operation, and never reads or writes anything about the current
 * algorithm session. Called once per panel instance (see DraggablePanel),
 * so each panel gets its own independent `position`/`isDragging` state
 * (task requirement 7) purely because each call closes over its own React
 * state — no shared/global store involved (task requirement 18).
 */
export function useDraggablePanel(
  containerRef: RefObject<HTMLElement | null>,
): UseDraggablePanelResult {
  const panelRef = useRef<HTMLDivElement | null>(null)
  // null = "not yet dragged, use the default CSS corner" (see `style`
  // above). Only ever becomes non-null the moment a drag starts.
  const [position, setPosition] = useState<PanelPosition | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  // The offset between the pointer and the panel's own top-left corner at
  // the moment the drag began, so the panel keeps the exact point the user
  // grabbed instead of re-centering itself under the cursor.
  const grabOffsetRef = useRef<PanelPosition>({ x: 0, y: 0 })

  const clampToContainer = useCallback(
    (next: PanelPosition): PanelPosition => {
      const container = containerRef.current
      const panel = panelRef.current
      if (!container || !panel) return next

      return clampPanelPosition(next, {
        containerWidth: container.clientWidth,
        containerHeight: container.clientHeight,
        panelWidth: panel.offsetWidth,
        panelHeight: panel.offsetHeight,
      })
    },
    [containerRef],
  )

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      // Only the primary mouse button / primary touch-or-pen contact
      // starts a drag — a right-click (button 2) or similar must not.
      if (event.button !== 0) return

      const container = containerRef.current
      const panel = panelRef.current
      if (!container || !panel) return

      const containerRect = container.getBoundingClientRect()
      const panelRect = panel.getBoundingClientRect()

      grabOffsetRef.current = {
        x: event.clientX - panelRect.left,
        y: event.clientY - panelRect.top,
      }

      // Seeds the position from the panel's current on-screen location
      // (its default CSS corner, the very first time this runs) so
      // switching from CSS-driven positioning to JS-driven positioning
      // never causes a visible jump.
      setPosition(
        clampToContainer({
          x: panelRect.left - containerRect.left,
          y: panelRect.top - containerRect.top,
        }),
      )
      setIsDragging(true)

      // Stops the browser's native text-selection/drag-image gesture from
      // starting on the handle itself.
      event.preventDefault()
    },
    [containerRef, clampToContainer],
  )

  // Global pointermove/pointerup/pointercancel listeners — attached to
  // `window` (not the small handle element) so the drag keeps tracking the
  // pointer even once it moves off the handle, which is what makes this
  // "feel like a normal floating desktop panel" (task requirement 1)
  // rather than one that stops following the instant the cursor leaves a
  // few pixels of chrome. Added only while isDragging is true and always
  // removed by this effect's own cleanup on the way out — never a
  // permanently-attached listener (task requirement 11).
  useEffect(() => {
    if (!isDragging) return

    function handlePointerMove(event: PointerEvent) {
      const container = containerRef.current
      if (!container) return
      const containerRect = container.getBoundingClientRect()

      setPosition(
        clampToContainer({
          x: event.clientX - containerRect.left - grabOffsetRef.current.x,
          y: event.clientY - containerRect.top - grabOffsetRef.current.y,
        }),
      )
    }

    function stopDragging() {
      setIsDragging(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopDragging)
      window.removeEventListener('pointercancel', stopDragging)
    }
  }, [isDragging, containerRef, clampToContainer])

  // Prevents an active drag from turning into an accidental page-wide text
  // selection (task requirement 11) — scoped to exactly the duration of
  // the drag and restored the instant it ends.
  useEffect(() => {
    if (!isDragging) return

    const previousUserSelect = document.body.style.userSelect
    document.body.style.userSelect = 'none'

    return () => {
      document.body.style.userSelect = previousUserSelect
    }
  }, [isDragging])

  // Keeps an already-dragged panel inside the container if the container
  // itself is later resized (e.g. the browser window shrinking) — the
  // same ResizeObserver-with-jsdom-fallback pattern already established by
  // useContainerWidth.ts (Dynamic Visualization Sizing task). Only ever
  // re-clamps an *existing* position; a panel that hasn't been dragged yet
  // stays on its default CSS corner, which the stylesheet's own responsive
  // rules already handle.
  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(() => {
      setPosition((current) => (current ? clampToContainer(current) : current))
    })
    observer.observe(container)

    return () => observer.disconnect()
  }, [containerRef, clampToContainer])

  const style: CSSProperties = {}
  if (position) {
    style.left = `${position.x}px`
    style.top = `${position.y}px`
    style.right = 'auto'
  }
  if (isDragging) {
    style.zIndex = DRAGGING_Z_INDEX
  }

  return {
    panelRef,
    isDragging,
    style,
    handleProps: { onPointerDown: handlePointerDown },
  }
}
