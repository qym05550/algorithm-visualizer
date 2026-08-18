import type { ReactNode, RefObject } from 'react'
import { useDraggablePanel } from './useDraggablePanel'
import './DraggablePanel.css'

interface DraggablePanelProps {
  /** Ref to the positioning container (`.main-area`) all drag math and
   *  boundary clamping is relative to — shared by both panels, but each
   *  gets its own fully independent drag state (task requirement 7),
   *  since useDraggablePanel is called fresh for each DraggablePanel
   *  instance. */
  containerRef: RefObject<HTMLElement | null>
  /** The panel's existing overlay class — `"statistics-panel-overlay"` or
   *  `"code-view-overlay"` — kept as the *only* class on the rendered root
   *  element (never combined with an extra class here) so it stays
   *  byte-for-byte what it already was before this task; drag state is
   *  communicated instead via inline style and a `data-dragging`
   *  attribute, which don't disturb `className`. */
  overlayClassName: string
  /** Used only for the drag handle's accessible label ("Drag Statistics
   *  panel") — never rendered as visible text, since the wrapped panel
   *  already shows its own name in its own header (StatisticsPanel /
   *  CodeView are untouched and stay purely presentational, task
   *  requirement 3). */
  label: string
  children: ReactNode
}

/**
 * Draggable Statistics/Code View Panels task: wraps an existing overlay
 * panel (Statistics or Code View) with a small dedicated drag handle and
 * wires up `useDraggablePanel` for the actual pointer-drag mechanics.
 *
 * A small reusable component specifically so both panels share the exact
 * same drag behavior/boundary-clamping from one implementation rather than
 * two hand-tuned copies — the same "extract the shared presentation-layer
 * piece" reasoning already used for useContainerWidth.ts / itemSizing.ts.
 *
 * Renders the *same* root element the panel already had (still carrying
 * exactly `overlayClassName`, still positioned by the same stylesheet
 * rules in VisualizationPlaceholder.css) with one new child prepended: the
 * drag handle. `children` (the actual StatisticsPanel/CodeView) is
 * untouched, so its own content, scrolling, and text selection keep
 * working exactly as before (task requirement 3, 12).
 */
function DraggablePanel({ containerRef, overlayClassName, label, children }: DraggablePanelProps) {
  const { panelRef, isDragging, style, handleProps } = useDraggablePanel(containerRef)

  return (
    <div
      ref={panelRef}
      className={overlayClassName}
      style={style}
      // Not part of `className` on purpose (see the prop doc comment
      // above) — a plain boolean data attribute is enough for the small
      // "currently being dragged" CSS hook in DraggablePanel.css, without
      // touching the className string any existing test/consumer may
      // depend on.
      data-dragging={isDragging ? 'true' : undefined}
    >
      <div
        className="draggable-panel__handle"
        role="button"
        aria-label={`Drag ${label} panel`}
        onPointerDown={handleProps.onPointerDown}
      >
        <span className="draggable-panel__grip" aria-hidden="true">
          ⋮⋮
        </span>
      </div>
      {children}
    </div>
  )
}

export default DraggablePanel
