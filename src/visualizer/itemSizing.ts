/**
 * Dynamic Visualization Sizing task: the single formula both ArrayRenderer
 * and BarRenderer use to size their per-index elements (a cell's
 * width/height for Array View, a bar's track width for Bar View) based on
 * how many elements need to share the available horizontal space.
 *
 * Deliberately a plain, pure function — no DOM, no React — so it is
 * trivially unit-testable and so the exact same math is guaranteed to run
 * for both renderers rather than two hand-tuned, potentially-diverging
 * copies (the same "extract a shared presentation-layer piece" reasoning
 * that already justified useSwapSlideAnimation.ts).
 *
 * The core idea (task sections 1 and 2): an element's ideal size is the
 * available width divided evenly among however many elements need to
 * share it, accounting for the gaps between them — then clamped to a
 * sensible [min, max] range so a handful of elements never becomes
 * absurdly large and a huge array never shrinks into unreadable slivers.
 * When the "ideal" size would be smaller than the minimum, the caller's
 * own existing flex-wrap layout (ArrayRenderer.css / BarRenderer.css) is
 * what actually keeps things from overflowing — every item still renders
 * at exactly `min`, and simply wraps onto more rows, exactly as it always
 * has for large arrays.
 */

/**
 * A small safety margin subtracted from the reported available width
 * before dividing it among items. Without this, an "ideal" size computed
 * to fit *exactly* the measured width sits precisely on the flex-wrap
 * boundary — any sub-pixel rounding difference between this calculation
 * and the browser's own layout (fractional pixels, border rendering,
 * scrollbar width, etc.) is then enough to push the last item onto a
 * lonely second row it wasn't supposed to need. A few pixels of slack
 * here costs nothing visually but reliably keeps a row that should fit
 * from wrapping by an accident of rounding.
 */
const SAFETY_MARGIN_PX = 8

export interface ItemSizeOptions {
  /** The smallest an item is ever allowed to shrink to, in pixels. */
  readonly min: number
  /** The largest an item is ever allowed to grow to, in pixels. */
  readonly max: number
  /** The gap the caller's own flex layout places between items, in
   *  pixels — subtracted out so the computed size describes the item's
   *  own box, not its share of the row including the gap after it. */
  readonly gap: number
}

/**
 * Returns the ideal per-item size, in pixels, for `count` items sharing
 * `availableWidth` of horizontal space, clamped to `options.min`/
 * `options.max`.
 *
 * `count <= 0` or `availableWidth <= 0` (nothing to size yet, or a
 * container that hasn't been measured) both safely fall back to `min`
 * rather than dividing by zero or returning a negative/NaN size.
 */
export function computeItemSize(
  count: number,
  availableWidth: number,
  options: ItemSizeOptions,
): number {
  const { min, max, gap } = options

  if (count <= 0 || availableWidth <= 0) {
    return min
  }

  const usableWidth = Math.max(0, availableWidth - SAFETY_MARGIN_PX)
  const totalGapWidth = gap * (count - 1)
  const idealSize = (usableWidth - totalGapWidth) / count

  return Math.min(max, Math.max(min, idealSize))
}
