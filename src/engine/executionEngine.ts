import type { Operation, OperationIndices } from '../operations/operation'

/**
 * The full execution state exposed by the Execution Engine
 * (PROJECT.md sections 5 and 18.8-18.12).
 */
export interface ExecutionState {
  /** The original array. Never mutated. */
  readonly initialArray: readonly number[]
  /** The current, mutable execution array. Replaced (never mutated) when it changes. */
  readonly workingArray: readonly number[]
  /** The immutable sequence of Operations being executed. */
  readonly operations: readonly Operation[]
  /** The number of Operations already executed. */
  readonly currentStep: number
  /** The most recently executed Operation, or null before any Operation has run. */
  readonly currentOperation: Operation | null
}

/**
 * Controls execution of an immutable Operations sequence against a
 * Working Array, without knowing anything about how those Operations
 * were generated (Algorithm) or how the result is displayed (Visualizer).
 *
 * Holds no UI, styling, or presentation logic — see PROJECT.md 18.8.
 */
export class ExecutionEngine {
  private readonly initialArray: readonly number[]
  private readonly operations: readonly Operation[]
  private workingArray: readonly number[]
  private currentStep: number
  private currentOperation: Operation | null

  constructor(initialArray: readonly number[], operations: readonly Operation[]) {
    // Defensive copies: the Engine owns its own Initial Array and
    // Operations sequence and must not be affected by later external
    // mutation of the arrays passed in.
    this.initialArray = [...initialArray]
    this.operations = [...operations]
    this.workingArray = [...initialArray]
    this.currentStep = 0
    this.currentOperation = null
  }

  /** Returns a snapshot of the current execution state. */
  getState(): ExecutionState {
    return {
      initialArray: this.initialArray,
      workingArray: this.workingArray,
      operations: this.operations,
      currentStep: this.currentStep,
      currentOperation: this.currentOperation,
    }
  }

  /**
   * Executes the next Operation, if one is available. Does nothing at the
   * end of the Operations sequence (PROJECT.md 18.13, 18.14).
   */
  next(): void {
    if (this.currentStep === this.operations.length) {
      return
    }

    const operation = this.operations[this.currentStep]
    this.applyOperation(operation)
    this.currentStep += 1
    this.currentOperation = operation
  }

  /**
   * Reverses the most recently executed Operation, if one exists. Does
   * nothing at the initial state (PROJECT.md 18.13, 18.14).
   */
  previous(): void {
    if (this.currentStep === 0) {
      return
    }

    const operation = this.operations[this.currentStep - 1]
    // A COMPARE is reversed by re-validating with no state change, and a
    // SWAP is reversed by performing the same swap again — so applying
    // the operation a second time is exactly how it's reversed.
    this.applyOperation(operation)
    this.currentStep -= 1
    this.currentOperation = this.currentStep === 0 ? null : this.operations[this.currentStep - 1]
  }

  /**
   * Restores the Working Array to a copy of the Initial Array and resets
   * execution to the initial state. The Operations sequence is untouched.
   */
  reset(): void {
    this.workingArray = [...this.initialArray]
    this.currentStep = 0
    this.currentOperation = null
  }

  private applyOperation(operation: Operation): void {
    switch (operation.type) {
      case 'compare':
        // COMPARE never changes the Working Array — only its indices are
        // validated so the Visualizer can trust them.
        this.assertValidIndices(operation.indices)
        return
      case 'swap':
        this.workingArray = this.swapped(operation.indices)
        return
    }
  }

  private swapped(indices: OperationIndices): number[] {
    this.assertValidIndices(indices)
    const [a, b] = indices
    const next = [...this.workingArray]
    ;[next[a], next[b]] = [next[b], next[a]]
    return next
  }

  private assertValidIndices(indices: OperationIndices): void {
    const isValid = (index: number) =>
      Number.isInteger(index) && index >= 0 && index < this.workingArray.length

    if (!isValid(indices[0]) || !isValid(indices[1])) {
      throw new RangeError(
        `Invalid operation indices [${indices[0]}, ${indices[1]}] for a working array of length ${this.workingArray.length}.`,
      )
    }
  }
}
