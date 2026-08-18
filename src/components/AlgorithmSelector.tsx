interface AlgorithmSelectorProps {
  /** The algorithm names to list, in display order. */
  options: readonly string[]
  /** The currently selected algorithm name. */
  value: string
  /** Called with the newly selected algorithm name when the user changes it. */
  onChange: (value: string) => void
}

/**
 * Purely presentational: a controlled dropdown that displays whichever
 * algorithm names it's given and reports selection changes upward. It
 * does not know what an algorithm *is* (no Operation, no Algorithm
 * function, no import from src/algorithms) — the parent owns the mapping
 * from name to implementation and decides what this represents (the next
 * session's algorithm, not necessarily the one currently visualizing).
 */
function AlgorithmSelector({ options, value, onChange }: AlgorithmSelectorProps) {
  return (
    <div className="sidebar-section">
      <label className="sidebar-section__label" htmlFor="algorithm-select">
        Algorithm
      </label>
      <select
        id="algorithm-select"
        className="select-control"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((algorithm) => (
          <option key={algorithm} value={algorithm}>
            {algorithm}
          </option>
        ))}
      </select>
    </div>
  )
}

export default AlgorithmSelector
