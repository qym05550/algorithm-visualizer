import { useEffect, useRef, useState } from 'react'
import ArrayRenderer from './ArrayRenderer'
import BarRenderer from './BarRenderer'
import ViewToggle, { type VisualizationView } from './ViewToggle'
import VisualizerControls from '../components/VisualizerControls'
import CodeView from '../components/CodeView'
import StatisticsPanel from '../components/StatisticsPanel'
import DraggablePanel from './DraggablePanel'
import { VisualizerController, type Algorithm } from './visualizerController'
import type { Operation } from '../operations/operation'
import type { AlgorithmMetadata } from '../algorithms/metadata/algorithmMetadata'
import { computeExecutionStatistics } from '../statistics/executionStatistics'
import './VisualizationPlaceholder.css'

/**
 * Autoplay speed name -> interval in milliseconds. Centralized here (the
 * one place that actually schedules autoplay ticks) so the values can be
 * changed later without touching anything else. Object key order is also
 * the display order offered to VisualizerControls.
 */
const AUTOPLAY_SPEEDS_MS: Record<string, number> = {
  Slow: 1000,
  Normal: 500,
  Fast: 200,
}

const DEFAULT_SPEED = 'Normal'

interface VisualizationPlaceholderProps {
  /** The most recently confirmed array, if any. */
  array: number[] | null
  /** The algorithm the current confirmed session should use. Supplied by
   *  the parent (App), which owns which algorithm was selected at the
   *  moment Done was last pressed — this component never imports or
   *  chooses an algorithm itself. */
  algorithm: Algorithm
  /** The Code View metadata (pseudocode + Operation-to-line mapping) for
   *  the same confirmed algorithm above (Educational Code View task).
   *  Optional so every existing caller/test that doesn't pass one keeps
   *  working unchanged — CodeView simply isn't rendered without it. Kept
   *  as a separate prop rather than folded into `algorithm` because
   *  `Algorithm` (PROJECT.md 18.2) is intentionally just the Operation-
   *  generating function shape; metadata is a distinct, presentation-
   *  adjacent concern layered on top of it, never on the function itself. */
  metadata?: AlgorithmMetadata
}

/**
 * Occupies the main Visualizer area. This is the container that connects
 * VisualizerController to the presentational ArrayRenderer and
 * VisualizerControls components: it owns the controller instance for the
 * current session, calls next()/previous()/reset() on it, and re-reads
 * getState() to know what to render (PROJECT.md 12, 14, 18.15).
 *
 * Before an array has been confirmed, no controller exists and this shows
 * only the placeholder message — no algorithm run, no Operations
 * generated, no execution controls displayed.
 */
function VisualizationPlaceholder({ array, algorithm, metadata }: VisualizationPlaceholderProps) {
  // The controller for the current visualization session. A ref (not
  // state) because it must be readable synchronously within the same
  // render that creates it, and because replacing it must never itself
  // trigger a re-render — `tick` below does that instead.
  // Draggable Statistics/Code View Panels task: the shared positioning
  // container both panels clamp their dragged position against. A plain
  // ref (not state) — its identity never needs to trigger a re-render,
  // only to be read by useDraggablePanel (via DraggablePanel) at drag
  // time and inside its ResizeObserver callback.
  const mainAreaRef = useRef<HTMLDivElement>(null)
  const controllerRef = useRef<VisualizerController | null>(null)
  // The confirmed array the current controller was built from, used only
  // to detect a *new* confirmation (Done clicked again) — never read for
  // display.
  const sessionArrayRef = useRef<number[] | null>(null)
  // controller.next()/previous()/reset() mutate the controller's internal
  // state in place rather than producing a new object reference, so this
  // tick is what tells React a re-render is needed after one. The value
  // itself is also handed to ArrayRenderer as animationTick — see
  // lastChangedOperationRef below for why.
  const [tick, setTick] = useState(0)
  // Autoplay state lives here, at the container level — the controller
  // itself knows nothing about autoplay, timers, or speed; it only ever
  // sees the same next()/previous()/reset() calls it always did.
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(DEFAULT_SPEED)
  // Which presentation (Array View or Bar View) is currently shown. Pure
  // presentation state, completely orthogonal to the session: switching
  // it never touches controllerRef, sessionArrayRef, tick, isPlaying, or
  // lastChangedOperationRef, so it can never reset the step, restart the
  // algorithm, modify the array, or disturb an in-progress animation or
  // autoplay run (Bar View task section 6). Both renderers below are
  // simply handed the exact same already-computed state/props; only which
  // one is mounted changes.
  const [view, setView] = useState<VisualizationView>('array')
  // Presentation-only, direction-aware record of "the Operation whose
  // execution or reversal just produced the array you're currently
  // looking at" — used solely to drive ArrayRenderer's SWAP slide
  // animation (Animation System / Visual Motion Polish). This is
  // deliberately NOT the same thing as state.currentOperation below:
  // after Previous, getState().currentOperation reports the operation now
  // "pointed at" (operations[currentStep - 1], PROJECT.md 18.12) for
  // highlighting purposes, which is correct and unchanged, but the
  // operation that just *physically* moved values — the one that should
  // animate — is whichever one Previous just reversed. Forward and
  // backward both funnel through this ref so ArrayRenderer never needs to
  // know which direction produced it, only "this pair just swapped."
  // Never read by VisualizerController/ExecutionEngine — those remain
  // completely unaware this exists.
  const lastChangedOperationRef = useRef<Operation | undefined>(undefined)
  // The full Operations sequence for the current session, captured once
  // alongside controllerRef below (Statistics & Complexity Panel task).
  // VisualizerController's own VisualState deliberately does not expose
  // the raw Operations array (only currentStep/currentOperation/
  // totalSteps) — extending it to do so would mean widening a protected
  // layer's public shape purely for a UI-side concern, and would break
  // its own exact-VisualState tests (see visualizerController.test.ts,
  // which asserts getState() via toEqual against a fully-enumerated
  // object). `algorithm` is already a pure, deterministic function of
  // `array` (VisualizerController itself relies on exactly this to
  // generate the same Operations internally), so calling it a second time
  // here — with the exact same array reference the controller above was
  // just built from — reproduces the identical sequence without
  // duplicating any algorithm logic or touching the controller/engine.
  const operationsRef = useRef<readonly Operation[]>([])

  // A new confirmed array reference means Done was clicked again: create
  // exactly one new VisualizerController for that session. Confirming
  // still generates a fresh array object every time (see ArrayInput /
  // parseArrayInput), so this reliably fires once per Done click and
  // never on an unrelated re-render.
  if (array && array !== sessionArrayRef.current) {
    // `algorithm` reflects whichever algorithm was selected at the moment
    // this array was confirmed (App sets both together) — reading it here,
    // only when a *new* array arrives, is what keeps an already-running
    // session isolated from later AlgorithmSelector changes: those change
    // the prop on a future render, but never retroactively re-trigger this
    // block for the array that's already active.
    controllerRef.current = new VisualizerController(array, algorithm)
    sessionArrayRef.current = array
    operationsRef.current = algorithm(array)
    // A brand new session always starts paused at step 0 — any autoplay
    // still running from a previous session must not carry over. This is
    // the same "adjust state during render when a prop changes" pattern
    // already used for controllerRef/sessionArrayRef above; React reruns
    // this render immediately with the new state before anything commits,
    // so there's no frame where a stale interval could tick against the
    // new controller. Speed is intentionally left as-is — only *whether*
    // it's playing resets, not the user's chosen pace.
    setIsPlaying(false)
    // A brand new session has no "just happened" operation yet — nothing
    // should animate on the render that first shows it.
    lastChangedOperationRef.current = undefined
  }

  // controller.next()/previous()/reset() mutate the controller's internal
  // state in place rather than producing a new object reference, so this
  // is what tells React a re-render is needed after one — including from
  // inside the autoplay timer below, which is why it's defined before that
  // effect rather than after the early return.
  function refresh() {
    setTick((tick) => tick + 1)
  }

  // The autoplay timer — the one place a timer is ever created. Re-run
  // whenever isPlaying, speed, or the session (array) changes, and always
  // cleaned up on the way out: this is what makes Reset, a new session,
  // a speed change, and unmounting all reliably cancel any pending tick
  // rather than leaving a stray interval that could fire afterward.
  useEffect(() => {
    if (!isPlaying) return

    const controller = controllerRef.current
    if (!controller) return

    const intervalId = setInterval(() => {
      // Re-read state fresh on every tick instead of closing over a
      // VisualState from render time — canGoNext must reflect the
      // *current* step when the tick actually fires, not the step that
      // was current when the timer was scheduled.
      if (!controller.getState().canGoNext) {
        setIsPlaying(false)
        return
      }
      controller.next()
      lastChangedOperationRef.current = controller.getState().currentOperation
      refresh()
    }, AUTOPLAY_SPEEDS_MS[speed])

    return () => clearInterval(intervalId)
  }, [isPlaying, speed, array])

  if (!array) {
    return (
      <div className="main-area" ref={mainAreaRef}>
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

  function handlePrevious() {
    // The operation Previous is *about* to reverse is whatever is
    // currently "current" — capture it before calling previous(), because
    // afterward getState().currentOperation reports a different thing
    // (see lastChangedOperationRef's doc comment above).
    const operationBeingUndone = controller.getState().currentOperation
    controller.previous()
    lastChangedOperationRef.current = operationBeingUndone
    refresh()
  }

  function handleNext() {
    controller.next()
    lastChangedOperationRef.current = controller.getState().currentOperation
    refresh()
  }

  function handleReset() {
    controller.reset()
    // Reset must stop any running autoplay immediately, in addition to
    // moving the controller back to step 0 — otherwise a timer already
    // scheduled from before the reset could still fire and advance the
    // freshly-reset visualization. Setting isPlaying to false here also
    // reruns the autoplay effect's cleanup on this same commit, clearing
    // that interval before it can ever tick again.
    setIsPlaying(false)
    // Nothing should animate back in after a Reset — ArrayRenderer's own
    // effect also synchronously snaps any still-transforming cell back to
    // rest the instant it sees no swap indices, so this guarantees no
    // stale slide can survive a Reset even if one was mid-flight.
    lastChangedOperationRef.current = undefined
    refresh()
  }

  function handlePlay() {
    setIsPlaying(true)
  }

  function handleStop() {
    setIsPlaying(false)
  }

  function handleSpeedChange(newSpeed: string) {
    setSpeed(newSpeed)
  }

  // Only a SWAP should ever produce a position-exchange slide — a COMPARE
  // (or the absence of any "just happened" operation, e.g. right after a
  // Reset) intentionally yields null, so ArrayRenderer's effect settles
  // any leftover animation instead of starting a new one.
  const lastChangedOperation = lastChangedOperationRef.current
  const animateSwapIndices =
    lastChangedOperation?.type === 'swap' ? lastChangedOperation.indices : null

  // Educational Code View: derived straight from state.currentOperation —
  // the same Engine-maintained field toHighlightedIndices() above already
  // uses for the array/bar highlight — not from lastChangedOperationRef.
  // The Engine already recomputes currentOperation as
  // operations[currentStep - 1] on every previous() call (see
  // ExecutionEngine.previous() and PROJECT.md 18.12), so it is already
  // correct and direction-aware for "what's currently true" after an
  // undo; lastChangedOperationRef exists only to answer the different
  // question "what pair should physically slide right now" for the SWAP
  // animation. Reusing currentOperation keeps the code line, the array
  // highlight, and the step counter all describing the exact same
  // instant. metadata is optional (see prop doc comment above), so
  // CodeView only renders once a real AlgorithmMetadata is supplied.
  const activeLine = metadata ? metadata.getHighlightedLine(state.currentOperation ?? null) : null

  // Statistics & Complexity Panel: derived from the same operationsRef
  // captured above and state.currentStep — the same currentStep the step
  // indicator and Previous/Next boundary checks already use — so the
  // counters, the step indicator, and the Code View's active line can
  // never disagree about which point in the session they're describing.
  // Naturally correct in both directions: Previous simply lowers
  // currentStep, and computeExecutionStatistics recomputes from scratch
  // each time rather than incrementing/decrementing a separate counter.
  const statistics = computeExecutionStatistics(operationsRef.current, state.currentStep)

  return (
    <div className="main-area" ref={mainAreaRef}>
      {/* Move Code View into the Main Visualization Area: rendered as a
          sibling of .visualizer, positioned by .code-view-overlay
          (VisualizationPlaceholder.css) rather than by CodeView itself —
          CodeView stays exactly as presentational as before, only its
          container/CSS context changed. Kept as a direct child of
          .main-area (not nested inside .visualizer) specifically so it can
          be positioned relative to the whole visualization region, not
          just the centered visualizer column.

          Draggable Statistics/Code View Panels task: now wrapped in
          DraggablePanel, which renders the exact same
          .code-view-overlay-classed root (still positioned by the same
          VisualizationPlaceholder.css rules) plus a small drag handle
          above CodeView itself — CodeView's own content/behavior is
          completely untouched. */}
      {metadata && (
        <DraggablePanel containerRef={mainAreaRef} overlayClassName="code-view-overlay" label="Code View">
          <CodeView code={metadata.code} activeLine={activeLine} algorithmName={metadata.name} />
        </DraggablePanel>
      )}
      {/* Move Statistics Panel to the Top-Left of the Visualization Area:
          same treatment as .code-view-overlay above, mirrored to the
          opposite corner — a sibling of .visualizer positioned by
          .statistics-panel-overlay (VisualizationPlaceholder.css) rather
          than by StatisticsPanel itself, which stays exactly as
          presentational as before.

          Draggable Statistics/Code View Panels task: same DraggablePanel
          wrapper as Code View above, given its own independent drag state
          purely because it's a separate component instance/hook call. */}
      {metadata && (
        <DraggablePanel
          containerRef={mainAreaRef}
          overlayClassName="statistics-panel-overlay"
          label="Statistics"
        >
          <StatisticsPanel
            currentStep={state.currentStep}
            totalSteps={state.totalSteps}
            statistics={statistics}
            complexity={metadata.complexity}
          />
        </DraggablePanel>
      )}
      <div className="visualizer">
        <ViewToggle view={view} onViewChange={setView} />
        {view === 'array' ? (
          <ArrayRenderer
            array={state.array}
            highlightedIndices={state.highlightedIndices}
            animateSwapIndices={animateSwapIndices}
            animationTick={tick}
          />
        ) : (
          <BarRenderer
            array={state.array}
            highlightedIndices={state.highlightedIndices}
            animateSwapIndices={animateSwapIndices}
            animationTick={tick}
          />
        )}
        <VisualizerControls
          onPrevious={handlePrevious}
          onNext={handleNext}
          onReset={handleReset}
          canGoPrevious={state.canGoPrevious}
          canGoNext={state.canGoNext}
          currentStep={state.currentStep}
          totalSteps={state.totalSteps}
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onStop={handleStop}
          speed={speed}
          speedOptions={Object.keys(AUTOPLAY_SPEEDS_MS)}
          onSpeedChange={handleSpeedChange}
        />
      </div>
    </div>
  )
}

export default VisualizationPlaceholder
