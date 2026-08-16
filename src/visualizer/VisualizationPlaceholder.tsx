import './VisualizationPlaceholder.css'

interface VisualizationPlaceholderProps {
  /** The most recently confirmed array, if any. Purely informational here —
   * this component does not visualize or execute anything yet. */
  array: number[] | null
}

/**
 * Stands in for the future Visualizer in the main area. Occupies the same
 * layout position the real visualization will use later, so no layout
 * rewrite is needed when it's replaced.
 */
function VisualizationPlaceholder({ array }: VisualizationPlaceholderProps) {
  return (
    <div className="main-area">
      <div className="visualization-placeholder">
        <p className="visualization-placeholder__title">Visualization area</p>
        <p className="visualization-placeholder__hint">
          {array
            ? `Array confirmed (${array.length} elements). The algorithm visualization will appear here in a later stage.`
            : 'The algorithm visualization will appear here once an array is confirmed.'}
        </p>
      </div>
    </div>
  )
}

export default VisualizationPlaceholder
