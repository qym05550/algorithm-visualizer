// Only Bubble Sort exists for now. This establishes the UI structure for
// future algorithms — it does not select or run anything yet.
const ALGORITHMS = ['Bubble Sort'] as const

function AlgorithmSelector() {
  return (
    <div className="sidebar-section">
      <label className="sidebar-section__label" htmlFor="algorithm-select">
        Algorithm
      </label>
      <select
        id="algorithm-select"
        className="select-control"
        defaultValue={ALGORITHMS[0]}
      >
        {ALGORITHMS.map((algorithm) => (
          <option key={algorithm} value={algorithm}>
            {algorithm}
          </option>
        ))}
      </select>
    </div>
  )
}

export default AlgorithmSelector
