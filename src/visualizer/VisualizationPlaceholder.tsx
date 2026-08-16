import { useRef, useState } from 'react'
import ArrayRenderer from './ArrayRenderer'
import VisualizerControls from '../components/VisualizerControls'
import { VisualizerController } from './visualizerController'
import './VisualizationPlaceholder.css'

interface VisualizationPlaceholderProps {
  /** The most recently confirmed array, if any. */
  array: number[] | null
}

/**
 * Occupies the main Visualizer area. This is the container that connects
 * VisualizerController to the presentational ArrayRenderer and
 * VisualizerControls components: it owns the controller instance for the
 * current session, calls next()/previous()/reset() on it, and re-reads
 * getState() to know what to render (PROJECT.md 12, 14, 18.15).
 *
 * Before an array has been confirmed, no controller exists and this shows
 * only the placeholder message — no Bubble Sort run, no Operations
 * generated, no execution controls displayed.
 */
function VisualizationPlaceholder({ array }: VisualizationPlaceholderProps) {
  // The controller for the current visualization session. A ref (not
  // state) because it must be readable synchronously within the same
  // render that creates it, and because replacing it must never itself
  // trigger a re-render — `tick` below does that instead.
  const controllerRef = useRef<VisualizerController | null>(null)
  // The confirmed array the current controller was built from, used only
  // to detect a *new* confirmation (Done clicked again) — never read for
  // display.
  const sessionArrayRef = useRef<number[] | null>(null)
  // controller.next()/previous()/reset() mutate the controller's internal
  // state in place rather than producing a new object reference, so this
  // tick is what tells React a re-render is needed after one.
  const [, setTick] = useState(0)

  // A new confirmed array reference means Done was clicked again: create
  // exactly one new VisualizerController for that session. Confirming
  // still generates a fresh array object every time (see ArrayInput /
  // parseArrayInput), so this reliably fires once per Done click and
  // never on an unrelated re-render.
  if (array && array !== sessionArrayRef.current) {
    controllerRef.current = new VisualizerController(array)
    sessionArrayRef.current = array
  }

  if (!array) {
    return (
      <div className="main-area">
        <div className="visualization-placeholder">
          <p className="visualization-placeholder__title">Visualization area</p>
          <p className="visualization-placeholder__hint">
            The algorithm visualization will appear here once an array is confirmed.
          </p>
        </div>
      </div>
    )
  }

  // `array` is non-null here, so controllerRef.current was just set above
  // (first confirmation) or already holds this session's controller from
  // an earlier render (same array reference).
  const controller = controllerRef.current!
  const state = controller.getState()

  function refresh() {
    setTick((tick) => tick + 1)
  }

  function handlePrevious() {
    controller.previous()
    refresh()
  }

  function handleNext() {
    controller.next()
    refresh()
  }

  function handleReset() {
    controller.reset()
    refresh()
  }

  return (
    <div className="main-area">
      <div className="visualizer">
        <ArrayRenderer array={state.array} highlightedIndices={state.highlightedIndices} />
        <VisualizerControls
          onPrevious={handlePrevious}
          onNext={handleNext}
          onReset={handleReset}
          canGoPrevious={state.canGoPrevious}
          canGoNext={state.canGoNext}
          currentStep={state.currentStep}
          totalSteps={state.totalSteps}
        />
      </div>
    </div>
  )
}

export default VisualizationPlaceholder
