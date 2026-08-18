import type { CSSProperties } from 'react'
import { useSwapSlideAnimation } from './useSwapSlideAnimation'
import { useContainerWidth } from './useContainerWidth'
import { computeItemSize } from './itemSizing'
import './BarRenderer.css'

/**
 * How far a bar can extend from the zero baseline, in either direction,
 * at the array's current largest-magnitude value. Every other value's bar
 * length is a proportion of this ceiling (see barLengthPx below) — this
 * constant only defines the *scale*, it never becomes any single bar's
 * fixed height on its own (Bar View task section 2: "Do not hardcode a
 * fixed height for each numeric value").
 *
 * Dynamic Visualization Sizing task: raised from the original 90px to
 * give the chart the "meaningful minimum/target height" the task asks
 * for (section 4) — deliberately a plain constant, not something that
 * scales with array length: bar *height* represents value magnitude,
 * bar *width* represents how many elements share the row, and those two
 * concerns stay strictly separate (task section 5). Keep in sync with
 * BarRenderer.css's `.bar-renderer__zone` height.
 */
const MAX_BAR_LENGTH_PX = 180

/**
 * Dynamic Visualization Sizing task: the smallest and largest a bar's
 * track (the whole vertical column — both zones, baseline, and label —
 * that one array index occupies) is ever allowed to be, in pixels.
 * `TRACK_MIN_PX` is the project's previous fixed track width
 * (BarRenderer.css used to hardcode `.bar-renderer__track { width: 28px }`
 * regardless of array length) — kept as the floor, the same "old fixed
 * value becomes the new floor" pattern ArrayRenderer.tsx's CELL_MIN_PX
 * follows. `TRACK_MAX_PX` is the new ceiling a handful of elements can
 * grow up to. `TRACK_GAP_PX` matches BarRenderer.css's own
 * `.bar-renderer { gap: 12px }`.
 */
const TRACK_MIN_PX = 28
const TRACK_MAX_PX = 72
const TRACK_GAP_PX = 12

/**
 * Professional Bar View Redesign task: the value label's font size at
 * TRACK_MIN_PX and TRACK_MAX_PX respectively, interpolated exactly the way
 * ArrayRenderer.tsx already interpolates FONT_MIN_PX/FONT_MAX_PX from its
 * own cellSize — the same "old fixed value becomes the floor, a new
 * ceiling is added for generously-sized tracks" pattern. VALUE_FONT_MIN_PX
 * matches this component's previous fixed `font-size: 12px`
 * (BarRenderer.css), so a large array's labels are pixel-identical to
 * before this task; VALUE_FONT_MAX_PX is the new ceiling a handful of
 * elements (wide tracks) can grow up to, keeping labels legible and
 * proportioned to their now-larger bars instead of staying a fixed small
 * size regardless of how much room is available (task section 3: "make
 * labels feel integrated with the visualization"). Deliberately a much
 * smaller range than ArrayRenderer's own (15->26px) — this is a secondary
 * annotation next to a bar, not the primary content the way an array cell's
 * value is.
 */
const VALUE_FONT_MIN_PX = 12
const VALUE_FONT_MAX_PX = 14

interface BarRendererProps {
  /** The array to display, in order. Never read from anywhere else. */
  array: readonly number[]
  /**
   * Indices to visually emphasize — the same prop ArrayRenderer accepts,
   * with the same meaning. This component doesn't know or care why an
   * index is highlighted, only which ones are.
   */
  highlightedIndices?: readonly number[]
  /**
   * The two indices that just physically exchanged values as a result of
   * a SWAP, if the most recent visualization action was one. Same
   * contract as ArrayRenderer's identically-named prop — see
   * useSwapSlideAnimation for how it's consumed.
   */
  animateSwapIndices?: readonly [number, number] | null
  /**
   * Increments once per distinct visualization action. Same contract as
   * ArrayRenderer's identically-named prop.
   */
  animationTick?: number
}

/**
 * Renders a numeric array as a row of vertical bars extending from a
 * shared zero baseline — positive values upward, negative values
 * downward — wrapping onto multiple lines for large arrays exactly like
 * ArrayRenderer already does (Bar View task).
 *
 * Purely presentational, mirroring ArrayRenderer's own contract and
 * constraints: it only reads its props and renders them, has no idea
 * where the array came from, does not mutate or sort anything, and knows
 * nothing about Operations, the Execution Engine, or any specific
 * algorithm. It consumes exactly the same VisualState-derived data
 * ArrayRenderer does (array, highlightedIndices, animateSwapIndices,
 * animationTick) — no new state was added anywhere upstream of this
 * component to support it.
 *
 * The SWAP slide animation reuses useSwapSlideAnimation — the exact same
 * presentation-layer technique ArrayRenderer uses, extracted into a
 * shared hook rather than duplicated or reimplemented for bars.
 */
function BarRenderer({
  array,
  highlightedIndices,
  animateSwapIndices = null,
  animationTick = 0,
}: BarRendererProps) {
  const { registerRef } = useSwapSlideAnimation(animateSwapIndices, animationTick)
  // Dynamic Visualization Sizing task: same technique as ArrayRenderer —
  // measure this renderer's own root element (which BarRenderer.css now
  // stretches to its parent's full available width, for the same
  // measurement-would-be-circular reason ArrayRenderer.css documents) and
  // derive a per-track width from the array's length and that measured
  // width. Exposed to CSS as --track-size; BarRenderer.css's
  // .bar-renderer__track reads it, so the bar's own width
  // (.bar-renderer__bar) simply stays 100% of its track rather than
  // needing a second, separately-clamped value.
  const { containerRef, width } = useContainerWidth<HTMLDivElement>()
  const trackSize = computeItemSize(array.length, width, {
    min: TRACK_MIN_PX,
    max: TRACK_MAX_PX,
    gap: TRACK_GAP_PX,
  })
  // Professional Bar View Redesign task: same linear interpolation
  // ArrayRenderer.tsx already uses for its own font size, driven by this
  // renderer's track size instead of ArrayRenderer's cell size — see
  // VALUE_FONT_MIN_PX/VALUE_FONT_MAX_PX above. TRACK_MAX_PX is always
  // greater than TRACK_MIN_PX (both are constants), so this division is
  // never at risk of dividing by zero.
  const trackSizeRatio = (trackSize - TRACK_MIN_PX) / (TRACK_MAX_PX - TRACK_MIN_PX)
  const valueFontSize = VALUE_FONT_MIN_PX + trackSizeRatio * (VALUE_FONT_MAX_PX - VALUE_FONT_MIN_PX)
  const containerStyle = {
    '--track-size': `${trackSize}px`,
    '--value-font-size': `${valueFontSize}px`,
  } as CSSProperties

  if (array.length === 0) {
    return <p className="bar-renderer__empty">No array to display.</p>
  }

  const highlighted = new Set(
    (highlightedIndices ?? []).filter((index) => index >= 0 && index < array.length),
  )

  // The single shared scale every bar is measured against: the current
  // array's largest magnitude, floored at 1 so an all-zero (or empty-ish)
  // array never divides by zero — every bar simply renders at length 0 in
  // that case, which is exactly correct (PROJECT.md-style guard, Bar View
  // task section 2: "Avoid division-by-zero or invalid scaling when all
  // values are identical or all values are zero.").
  const maxAbsValue = Math.max(1, ...array.map((value) => Math.abs(value)))

  return (
    <div
      className="bar-renderer"
      role="list"
      aria-label="Array elements"
      ref={containerRef}
      style={containerStyle}
    >
      {array.map((value, index) => {
        const isHighlighted = highlighted.has(index)
        const isNegative = value < 0
        // Professional Bar View Redesign task (section 5/6): COMPARE and
        // SWAP are both still communicated purely through highlightedIndices/
        // animateSwapIndices, exactly as before — this renderer still has no
        // idea what a COMPARE or SWAP *is*. It only additionally asks "is
        // this index the one currently sliding?" using the same
        // presentation-layer prop useSwapSlideAnimation already consumes,
        // so a highlighted bar can be styled more boldly while it's the
        // subject of an actual SWAP than while it's merely part of a
        // COMPARE — a purely visual distinction, not a new behavior.
        const isSwapping = Boolean(animateSwapIndices && animateSwapIndices.includes(index))
        // Proportional to the shared scale, not to a fixed per-value
        // height — a value twice as large (in magnitude) always renders
        // exactly twice as long a bar, regardless of sign.
        const barLengthPx = (Math.abs(value) / maxAbsValue) * MAX_BAR_LENGTH_PX
        // Only the zone that actually represents this value's sign ever
        // renders a visible (nonzero-height) bar — the other zone's bar
        // is always zero-height for this item. Highlighting (and, within
        // it, the swap-vs-compare distinction) is applied only to that one
        // real bar, not to its invisible zero-height counterpart, so
        // exactly one bar per highlighted index ever carries the
        // --highlighted class — the same guarantee this project's existing
        // BarRenderer tests already assert.
        const highlightModifier = isSwapping ? ' bar-renderer__bar--highlighted bar-renderer__bar--swap' : ' bar-renderer__bar--highlighted'
        const positiveBarClassName = `bar-renderer__bar${isHighlighted && !isNegative ? highlightModifier : ''}`
        const negativeBarClassName = `bar-renderer__bar${isHighlighted && isNegative ? highlightModifier : ''}`
        const valueClassName = isHighlighted
          ? 'bar-renderer__value bar-renderer__value--highlighted'
          : 'bar-renderer__value'

        return (
          <div
            key={index}
            role="listitem"
            aria-label={`Value ${value} at index ${index}${isHighlighted ? ', highlighted' : ''}`}
            className="bar-renderer__item"
          >
            {/* The whole track (both zones, the baseline, both possible
                labels) is what the SWAP animation moves as one unit — the
                same "one animatable element per index" contract
                ArrayRenderer uses for its value span. */}
            <div className="bar-renderer__track" ref={(element) => registerRef(index, element)}>
              <div className="bar-renderer__zone bar-renderer__zone--positive">
                {/* Zero intentionally renders here (as a zero-length
                    "positive" bar) rather than in the negative zone —
                    either way its bar has zero length, but this keeps its
                    label sitting immediately above the baseline rather
                    than below it, matching "a value of 0 should sit
                    exactly on the zero baseline" without being a
                    misleading positive OR negative bar. */}
                {!isNegative && <span className={valueClassName}>{value}</span>}
                <div
                  className={positiveBarClassName}
                  style={{ height: isNegative ? 0 : barLengthPx }}
                />
              </div>
              <div className="bar-renderer__baseline" />
              <div className="bar-renderer__zone bar-renderer__zone--negative">
                <div
                  className={negativeBarClassName}
                  style={{ height: isNegative ? barLengthPx : 0 }}
                />
                {isNegative && <span className={valueClassName}>{value}</span>}
              </div>
            </div>
            <span className="bar-renderer__index">{index}</span>
          </div>
        )
      })}
    </div>
  )
}

export default BarRenderer
