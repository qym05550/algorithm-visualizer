import type { CSSProperties } from 'react'
import { useSwapSlideAnimation } from './useSwapSlideAnimation'
import { useContainerWidth } from './useContainerWidth'
import { computeItemSize } from './itemSizing'
import './ArrayRenderer.css'

/**
 * Dynamic Visualization Sizing task: the smallest and largest a cell is
 * ever allowed to be, in pixels. `CELL_MIN_PX` is the project's previous
 * fixed cell size (ArrayRenderer.css used to hardcode `min-width: 42px;
 * height: 42px;` regardless of array length) — kept as the floor so a
 * large array never renders any smaller than it already did before this
 * task. `CELL_MAX_PX` is the new ceiling a handful of elements can grow
 * up to: substantial without being absurd (task section 1). `CELL_GAP_PX`
 * matches ArrayRenderer.css's own `.array-renderer { gap: 12px }` — kept
 * in sync there, the same convention BarRenderer.tsx already uses for
 * MAX_BAR_LENGTH_PX and its CSS counterpart.
 */
const CELL_MIN_PX = 42
const CELL_MAX_PX = 84
const CELL_GAP_PX = 12
/** The cell value's font size at CELL_MIN_PX and CELL_MAX_PX respectively
 *  — FONT_MIN_PX matches ArrayRenderer.css's previous fixed `font-size:
 *  15px`, so a large array's text is unchanged from before this task.
 *  Interpolated linearly with cellSize below, the same "old fixed value
 *  becomes the floor, a new ceiling is added" pattern CELL_MIN_PX/
 *  CELL_MAX_PX themselves follow. */
const FONT_MIN_PX = 15
const FONT_MAX_PX = 26

interface ArrayRendererProps {
  /** The array to display, in order. Never read from anywhere else. */
  array: readonly number[]
  /**
   * Indices to visually emphasize. This is purely visual state — the
   * renderer does not know or care why an index is highlighted (a
   * COMPARE, a SWAP, or anything else). Indices outside the array's
   * bounds are ignored rather than causing an error, duplicates collapse
   * to a single highlight, and `undefined`/`[]` highlight nothing.
   */
  highlightedIndices?: readonly number[]
  /**
   * The two indices that just physically exchanged values as a result of
   * a SWAP, if the most recent visualization action was one — `null`/
   * omitted for anything else (a COMPARE, the initial render, a Reset).
   * Purely a presentation-layer instruction: this component still has no
   * idea what a "SWAP operation" is, it only knows "animate these two
   * positions trading places." See the animation effect below for how
   * that motion is produced.
   */
  animateSwapIndices?: readonly [number, number] | null
  /**
   * Increments once per distinct visualization action (Next, Previous, an
   * autoplay tick, Reset, a new session...). This — not
   * animateSwapIndices — is the actual animation trigger: two consecutive
   * actions can legitimately report the *same* pair of indices (a SWAP
   * immediately followed by Previous undoing it is still a swap between
   * the same two positions), and the animation must still replay each
   * time. Defaults to 0 so callers that never animate don't need to pass it.
   */
  animationTick?: number
}

/**
 * Renders a numeric array as a row of value/index cells that wraps onto
 * multiple lines for large arrays (PROJECT.md 12, 18.15, 18.16).
 *
 * Purely presentational: it only reads its props and renders them. It
 * does not know where the array came from, does not mutate or sort
 * anything, and knows nothing about Operations, the Execution Engine, or
 * Bubble Sort — including *why* an index might be highlighted or
 * animated. The SWAP slide animation below reuses useSwapSlideAnimation
 * (Animation System / Visual Motion Polish task, later extracted for the
 * Bar View task so both renderers share one animation implementation) —
 * no animation library, no algorithm/engine knowledge, and no changes to
 * the logical array state, which remains driven solely by the `array`
 * prop exactly as before.
 */
function ArrayRenderer({
  array,
  highlightedIndices,
  animateSwapIndices = null,
  animationTick = 0,
}: ArrayRendererProps) {
  // PROJECT.md 18.17: "A visual swap animation may be implemented later"
  // — this is that later. registerRef is attached to each cell's value
  // span below; the hook measures/transforms/settles it exactly as
  // ArrayRenderer used to do inline (see useSwapSlideAnimation.ts).
  const { registerRef } = useSwapSlideAnimation(animateSwapIndices, animationTick)
  // Dynamic Visualization Sizing task: `containerRef` measures this
  // renderer's own root element, which now stretches to fill its parent's
  // full available width (ArrayRenderer.css's `.array-renderer` gained an
  // explicit `width: 100%` for exactly this reason — previously it only
  // had `max-width: 100%`, so a flex-wrap container with no explicit
  // width shrinks to fit its content instead of reporting the space that
  // was actually available). `cellSize` is exposed to CSS as the
  // `--cell-size` custom property below; ArrayRenderer.css derives both
  // the cell's box size and its font size from that one value, so all of
  // "few elements → larger cells" lives in one place rather than being
  // recomputed per-property here.
  const { containerRef, width } = useContainerWidth<HTMLDivElement>()
  const cellSize = computeItemSize(array.length, width, {
    min: CELL_MIN_PX,
    max: CELL_MAX_PX,
    gap: CELL_GAP_PX,
  })
  // Linear interpolation between the two fixed (size, font) pairs above —
  // CELL_MAX_PX is always greater than CELL_MIN_PX (both are constants),
  // so this division is never at risk of dividing by zero.
  const sizeRatio = (cellSize - CELL_MIN_PX) / (CELL_MAX_PX - CELL_MIN_PX)
  const fontSize = FONT_MIN_PX + sizeRatio * (FONT_MAX_PX - FONT_MIN_PX)
  const containerStyle = {
    '--cell-size': `${cellSize}px`,
    '--cell-font-size': `${fontSize}px`,
  } as CSSProperties

  if (array.length === 0) {
    return <p className="array-renderer__empty">No array to display.</p>
  }

  const highlighted = new Set(
    (highlightedIndices ?? []).filter((index) => index >= 0 && index < array.length),
  )

  return (
    <div
      className="array-renderer"
      role="list"
      aria-label="Array elements"
      ref={containerRef}
      style={containerStyle}
    >
      {array.map((value, index) => {
        const isHighlighted = highlighted.has(index)

        return (
          <div
            key={index}
            role="listitem"
            aria-label={`Value ${value} at index ${index}${isHighlighted ? ', highlighted' : ''}`}
            className="array-renderer__item"
          >
            <span
              ref={(element) => registerRef(index, element)}
              className={
                isHighlighted
                  ? 'array-renderer__value array-renderer__value--highlighted'
                  : 'array-renderer__value'
              }
            >
              {value}
            </span>
            <span className="array-renderer__index">{index}</span>
          </div>
        )
      })}
    </div>
  )
}

export default ArrayRenderer
