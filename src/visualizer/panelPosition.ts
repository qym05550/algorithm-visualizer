/**
 * Draggable Statistics/Code View Panels task: the pure boundary-clamping
 * math shared by both panels' drag interaction, kept completely separate
 * from any DOM/pointer-event code — the same "extract the formula, test it
 * DOM-free" reasoning already used for itemSizing.ts's computeItemSize.
 *
 * A panel's position is always expressed in pixels relative to its
 * positioning container's own top-left corner (`.main-area`'s padding-box,
 * since it is the nearest `position: relative` ancestor — see
 * VisualizationPlaceholder.css) — never viewport/page coordinates.
 */

export interface PanelPosition {
  readonly x: number
  readonly y: number
}

export interface PanelPositionBounds {
  /** `.main-area`'s own measured content/padding-box width in pixels. */
  readonly containerWidth: number
  /** `.main-area`'s own measured content/padding-box height in pixels. */
  readonly containerHeight: number
  /** The dragged panel's own rendered width in pixels. */
  readonly panelWidth: number
  /** The dragged panel's own rendered height in pixels. */
  readonly panelHeight: number
}

/**
 * Clamps a single axis value into `[min, max]`. If the container is
 * currently smaller than the panel (max < min) — e.g. a panel wider than
 * an unusually narrow container — pins to `min` (the container's own
 * origin edge) rather than producing a negative-width "allowed range" or
 * a value outside the container entirely.
 */
function clampAxis(value: number, min: number, max: number): number {
  if (max < min) return min
  return Math.min(max, Math.max(min, value))
}

/**
 * Clamps a candidate panel position so the panel's full box — top-left
 * corner at `(x, y)`, sized `panelWidth` x `panelHeight` — stays entirely
 * within `[0, containerWidth] x [0, containerHeight]` (task requirement 5:
 * "A panel must never be draggable outside .main-area").
 *
 * Example: `x = clamp(x, 0, containerWidth - panelWidth)`, and the same for
 * `y` — exactly the formula the task itself specifies.
 */
export function clampPanelPosition(
  position: PanelPosition,
  bounds: PanelPositionBounds,
): PanelPosition {
  const maxX = bounds.containerWidth - bounds.panelWidth
  const maxY = bounds.containerHeight - bounds.panelHeight

  return {
    x: clampAxis(position.x, 0, maxX),
    y: clampAxis(position.y, 0, maxY),
  }
}
