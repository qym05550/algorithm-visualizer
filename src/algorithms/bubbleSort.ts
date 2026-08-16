import type { Operation } from '../operations/operation'

/**
 * Generates the ordered sequence of Operations for an ascending Bubble
 * Sort of `input` (PROJECT.md sections 4, 18.2).
 *
 * This function only determines what operations should happen — it does
 * not execute them, render anything, or know about the Execution Engine,
 * the Visualizer, or React. The Execution Engine is what actually applies
 * the returned Operations to a Working Array.
 *
 * `input` is never mutated: Bubble Sort works against a private copy so
 * it knows the correct values for later comparisons, and only the copy
 * is changed.
 *
 * Standard adjacent-comparison Bubble Sort, with no early-exit
 * optimization — every pass runs across its full (shrinking) unsorted
 * range, so every actual adjacent comparison is recorded as a COMPARE,
 * whether or not it results in a SWAP.
 */
export function bubbleSort(input: readonly number[]): readonly Operation[] {
  const operations: Operation[] = []
  const workingCopy = [...input]
  const length = workingCopy.length

  for (let pass = 0; pass < length - 1; pass++) {
    const unsortedBoundary = length - pass - 1

    for (let i = 0; i < unsortedBoundary; i++) {
      operations.push({ type: 'compare', indices: [i, i + 1] })

      if (workingCopy[i] > workingCopy[i + 1]) {
        operations.push({ type: 'swap', indices: [i, i + 1] })
        const left = workingCopy[i]
        workingCopy[i] = workingCopy[i + 1]
        workingCopy[i + 1] = left
      }
    }
  }

  return operations
}
