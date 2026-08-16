import './VisualizerControls.css'

interface VisualizerControlsProps {
  /** Called when the Previous button is clicked. */
  onPrevious: () => void
  /** Called when the Next button is clicked. */
  onNext: () => void
  /** Called when the Reset button is clicked. */
  onReset: () => void
  /** Whether Previous should currently be enabled. */
  canGoPrevious: boolean
  /** Whether Next should currently be enabled. */
  canGoNext: boolean
  /** The current position in the Operations sequence, for display only. */
  currentStep: number
  /** The total number of Operations in this session, for display only. */
  totalSteps: number
}

/**
 * Presentational execution controls for the Visualizer: a step indicator
 * plus the Previous, Next, and Reset buttons. This component only renders
 * what it's given and reports clicks upward — it knows nothing about
 * Bubble Sort, the Execution Engine, Operations, or VisualizerController
 * itself (PROJECT.md 12, 18.14, 18.15). currentStep/totalSteps are passed
 * straight through from VisualizerController's own VisualState; no step
 * counting happens here.
 *
 * Reset has no disabled state: it is always available, per PROJECT.md 18.13.
 */
function VisualizerControls({
  onPrevious,
  onNext,
  onReset,
  canGoPrevious,
  canGoNext,
  currentStep,
  totalSteps,
}: VisualizerControlsProps) {
  return (
    <div className="visualizer-controls">
      <p className="visualizer-controls__step" aria-live="polite">
        Step {currentStep} / {totalSteps}
      </p>
      <div className="visualizer-controls__row">
        <button
          type="button"
          className="button button--secondary visualizer-controls__nav"
          onClick={onPrevious}
          disabled={!canGoPrevious}
        >
          <span className="visualizer-controls__arrow visualizer-controls__arrow--left" aria-hidden="true">
            ←
          </span>
          <span>Previous</span>
        </button>
        <button
          type="button"
          className="button button--secondary visualizer-controls__nav"
          onClick={onNext}
          disabled={!canGoNext}
        >
          <span>Next</span>
          <span className="visualizer-controls__arrow visualizer-controls__arrow--right" aria-hidden="true">
            →
          </span>
        </button>
      </div>
      <button type="button" className="button button--secondary" onClick={onReset}>
        Reset
      </button>
    </div>
  )
}

export default VisualizerControls
