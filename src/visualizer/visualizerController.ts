import { ExecutionEngine } from '../engine/executionEngine'
import type { Operation } from '../operations/operation'

/**
 * The shape any algorithm must have to be usable by VisualizerController:
 * a pure function from an input array to the ordered Operations sequence
 * that produces it (PROJECT.md 4, 18.2). Derived directly from the
 * existing `Operation` type; nothing new is introduced into the operation
 * model itself. VisualizerController depends only on this shape, never on
 * a specific implementation of it.
 */
export type Algorithm = (input: readonly number[]) => readonly Operation[]

/**
 * The visual state a rendering layer needs for one frame of a
 * visualization session — everything ArrayRenderer (and, later, playback
 * controls) require, and nothing about *why* it looks that way.
 */
export interface VisualState {
  /** The array to display right now, reflecting the current step. */
  readonly array: readonly number[]
  /** Indices to visually emphasize, derived from currentOperation. */
  readonly highlightedIndices: readonly number[]
  /** How many Operations have executed so far. */
  readonly currentStep: number
  /** The total number of Operations in this session (e.g. for "Step X / Y"
   *  display) — the same count the Engine already tracks internally. */
  readonly totalSteps: number
  /** The most recently executed Operation, or undefined before step 1. */
  readonly currentOperation: Operation | undefined
  /** Whether next() would currently do anything. */
  readonly canGoNext: boolean
  /** Whether previous() would currently do anything. */
  readonly canGoPrevious: boolean
}

/**
 * Adapts an Algorithm's execution session (Algorithm -> Operations ->
 * ExecutionEngine) into the VisualState a rendering layer needs
 * (PROJECT.md 3, 12, 17, 18.15-18.17).
 *
 * Takes the algorithm to run as a constructor parameter rather than
 * importing one directly, so this class has no dependency on any specific
 * algorithm implementation — only on the Algorithm shape above and on
 * ExecutionEngine. Calls that algorithm exactly once, at construction, and
 * creates a single ExecutionEngine that owns the rest of the session — the
 * same Operations sequence is reused for the whole session, including
 * across reset(). This class does not duplicate the Engine's state;
 * getState() simply reads it and reshapes it for display.
 *
 * Framework-independent: no React import, nothing rendered here. A UI
 * layer calls next() / previous() / reset() and re-reads getState() to
 * know what to display; it never has to talk to the algorithm, Operations,
 * or the ExecutionEngine directly.
 */
export class VisualizerController {
  private readonly engine: ExecutionEngine

  constructor(initialArray: readonly number[], algorithm: Algorithm) {
    const operations = algorithm(initialArray)
    this.engine = new ExecutionEngine(initialArray, operations)
  }

  /** Returns the visual state a UI layer should currently render. */
  getState(): VisualState {
    const state = this.engine.getState()

    return {
      array: state.workingArray,
      highlightedIndices: toHighlightedIndices(state.currentOperation),
      currentStep: state.currentStep,
      totalSteps: state.operations.length,
      currentOperation: state.currentOperation ?? undefined,
      canGoNext: state.currentStep < state.operations.length,
      canGoPrevious: state.currentStep > 0,
    }
  }

  /** Advances the session by one Operation, if one is available. */
  next(): void {
    this.engine.next()
  }

  /** Reverses the most recently executed Operation, if one exists. */
  previous(): void {
    this.engine.previous()
  }

  /** Returns the session to its initial state. Operations are not regenerated. */
  reset(): void {
    this.engine.reset()
  }
}

/**
 * Converts an Operation into the visual information ArrayRenderer
 * understands: only its indices. ArrayRenderer never sees an Operation
 * or learns whether it was a COMPARE or a SWAP.
 */
function toHighlightedIndices(operation: Operation | null): readonly number[] {
  return operation ? [...operation.indices] : []
}
