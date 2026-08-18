import './CodeView.css'

interface CodeViewProps {
  /** Pseudocode lines to display, in order — line 1 is code[0]. Indentation
   *  is expected to already be embedded as leading spaces in each string. */
  code: readonly string[]
  /** The 1-based line number to highlight, or null to highlight nothing. */
  activeLine: number | null
  /** Optional label shown above the code, e.g. "Bubble Sort" — purely
   *  displayed text, never branched on. */
  algorithmName?: string
}

/**
 * A small, read-only "code editor" panel that shows an algorithm's
 * educational pseudocode and highlights whichever line the currently
 * active Operation represents (Educational Code View task).
 *
 * Purely presentational, like ArrayRenderer/BarRenderer: it renders
 * exactly the `code` and `activeLine` it's given and nothing else. It has
 * no idea what Bubble Sort, Selection Sort, or Insertion Sort are, does
 * not import any algorithm, does not know about VisualizerController or
 * the Execution Engine, and never calls next()/previous()/reset() or runs
 * any autoplay logic itself — the mapping from an Operation to a line
 * number already happened in the caller, via the selected algorithm's
 * AlgorithmMetadata.getHighlightedLine(). This component only ever sees
 * the resulting line number, never an Operation.
 */
function CodeView({ code, activeLine, algorithmName }: CodeViewProps) {
  return (
    <div className="code-view">
      <p className="code-view__label">
        Pseudocode{algorithmName ? ` — ${algorithmName}` : ''}
      </p>
      <ol className="code-view__lines" aria-label="Algorithm pseudocode">
        {code.map((line, index) => {
          const lineNumber = index + 1
          const isActive = lineNumber === activeLine

          return (
            <li
              key={lineNumber}
              className={
                isActive ? 'code-view__line code-view__line--active' : 'code-view__line'
              }
            >
              <span className="code-view__line-number">{lineNumber}</span>
              <span className="code-view__line-text">{line}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default CodeView
