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
  /** Whether autoplay is currently running. Drives whether this renders a
   *  Play or a Stop button — this component has no autoplay state of its
   *  own, it only reflects what it's told. */
  isPlaying: boolean
  /** Called when Play is clicked (only rendered/reachable while !isPlaying). */
  onPlay: () => void
  /** Called when Stop is clicked (only rendered/reachable while isPlaying). */
  onStop: () => void
  /** The currently selected autoplay speed name, e.g. "Normal". */
  speed: string
  /** The available speed names, in display order. */
  speedOptions: readonly string[]
  /** Called with the newly selected speed name when the user changes it. */
  onSpeedChange: (speed: string) => void
}

/**
 * Presentational execution controls for the Visualizer: a step indicator,
 * the Previous/Play-or-Stop/Next row, and a second row with Reset and the
 * speed selector. This component only renders what it's given and reports
 * interactions upward — it knows nothing about Bubble Sort, the Execution
 * Engine, Operations, VisualizerController, or autoplay timers themselves
 * (PROJECT.md 12, 18.14, 18.15). All of currentStep/totalSteps/isPlaying/
 * speed are passed straight through from the container's own state; no
 * counting, playback scheduling, or algorithm knowledge happens here.
 *
 * Reset has no disabled state: it is always available, per PROJECT.md 18.13.
 * Play reuses the existing canGoNext — it's disabled under exactly the same
 * conditions Next already is (zero steps, or already at the final step),
 * so no separate "canPlay" concept is needed. Stop has no disabled state:
 * it's only ever rendered while autoplay is actually running, so stopping
 * is always available whenever it's shown.
 */
function VisualizerControls({
  onPrevious,
  onNext,
  onReset,
  canGoPrevious,
  canGoNext,
  currentStep,
  totalSteps,
  isPlaying,
  onPlay,
  onStop,
  speed,
  speedOptions,
  onSpeedChange,
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
          className="button button--secondary visualizer-controls__play"
          onClick={isPlaying ? onStop : onPlay}
          disabled={!isPlaying && !canGoNext}
        >
          {isPlaying ? (
            <>
              <span aria-hidden="true">■</span>
              <span>Stop</span>
            </>
          ) : (
            <>
              <span aria-hidden="true">▶</span>
              <span>Play</span>
            </>
          )}
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
      <div className="visualizer-controls__row visualizer-controls__row--secondary">
        <button type="button" className="button button--secondary" onClick={onReset}>
          Reset
        </button>
        <div className="visualizer-controls__speed">
          <label htmlFor="playback-speed" className="visualizer-controls__speed-label">
            Speed
          </label>
          <select
            id="playback-speed"
            className="select-control visualizer-controls__speed-select"
            value={speed}
            onChange={(event) => onSpeedChange(event.target.value)}
          >
            {speedOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

export default VisualizerControls
