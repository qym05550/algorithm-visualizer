import type { ExecutionStatistics } from '../statistics/executionStatistics'
import type { AlgorithmComplexity } from '../algorithms/metadata/algorithmMetadata'
import './StatisticsPanel.css'

interface StatisticsPanelProps {
  /** How many Operations have executed so far in this session. */
  currentStep: number
  /** The total number of Operations this session will ever run. */
  totalSteps: number
  /** Live counters already derived (see src/statistics/executionStatistics.ts)
   *  from the operations executed up to currentStep — this component does
   *  no counting of its own. */
  statistics: ExecutionStatistics
  /** The confirmed algorithm's static Big-O complexity, from its
   *  AlgorithmMetadata — never hardcoded here per algorithm name. */
  complexity: AlgorithmComplexity
}

/**
 * A compact "Statistics" card for the main visualization area (Statistics
 * & Complexity Panel task): the live progress/counters for the current
 * session, plus the confirmed algorithm's static complexity underneath as
 * secondary information.
 *
 * Purely presentational, exactly like CodeView: it receives already-
 * derived numbers and a complexity description through props and renders
 * them verbatim. It does not import Bubble Sort, Selection Sort, or
 * Insertion Sort, does not import VisualizerController or the Execution
 * Engine, does not count Operations itself, and does not know which
 * algorithm is currently selected — only what its caller tells it to
 * display.
 */
function StatisticsPanel({ currentStep, totalSteps, statistics, complexity }: StatisticsPanelProps) {
  return (
    <div className="statistics-panel">
      <p className="statistics-panel__label">Statistics</p>

      <p className="statistics-panel__step">
        Step {currentStep} / {totalSteps}
      </p>

      <dl className="statistics-panel__counters">
        <div className="statistics-panel__counter">
          <dt>Comparisons</dt>
          <dd>{statistics.comparisons}</dd>
        </div>
        <div className="statistics-panel__counter">
          <dt>Swaps</dt>
          <dd>{statistics.swaps}</dd>
        </div>
        <div className="statistics-panel__counter statistics-panel__counter--total">
          <dt>Operations</dt>
          <dd>{statistics.totalOperations}</dd>
        </div>
      </dl>

      <div className="statistics-panel__complexity">
        <p className="statistics-panel__complexity-label">Complexity</p>

        <p className="statistics-panel__complexity-group-label">Time</p>
        <div className="statistics-panel__complexity-row">
          <span>Best</span>
          <span>{complexity.time.best}</span>
        </div>
        <div className="statistics-panel__complexity-row">
          <span>Average</span>
          <span>{complexity.time.average}</span>
        </div>
        <div className="statistics-panel__complexity-row">
          <span>Worst</span>
          <span>{complexity.time.worst}</span>
        </div>

        <p className="statistics-panel__complexity-group-label">Space</p>
        <div className="statistics-panel__complexity-row">
          <span>{complexity.space}</span>
        </div>
      </div>
    </div>
  )
}

export default StatisticsPanel
