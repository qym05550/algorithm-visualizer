import './ArrayRenderer.css'

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
}

/**
 * Renders a numeric array as a row of value/index cells that wraps onto
 * multiple lines for large arrays (PROJECT.md 12, 18.15, 18.16).
 *
 * Purely presentational: it only reads its props and renders them. It
 * does not know where the array came from, does not mutate or sort
 * anything, and knows nothing about Operations, the Execution Engine, or
 * Bubble Sort — including *why* an index might be highlighted.
 */
function ArrayRenderer({ array, highlightedIndices }: ArrayRendererProps) {
  if (array.length === 0) {
    return <p className="array-renderer__empty">No array to display.</p>
  }

  const highlighted = new Set(
    (highlightedIndices ?? []).filter((index) => index >= 0 && index < array.length),
  )

  return (
    <div className="array-renderer" role="list" aria-label="Array elements">
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
