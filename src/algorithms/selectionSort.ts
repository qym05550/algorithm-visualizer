import type { Operation } from '../operations/operation'

/**
 * Generates the ordered sequence of Operations for an ascending Selection
 * Sort of `input` (PROJECT.md sections 4, 18.2).
 *
 * This function only determines what operations should happen — it does
 * not execute them, render anything, or know about the Execution Engine,
 * the Visualizer, or React. The Execution Engine is what actually applies
 * the returned Operations to a Working Array.
 *
 * `input` is never mutated: Selection Sort works against a private copy so
 * it knows the correct values for later comparisons, and only the copy is
 * changed.
 *
 * Standard selection sort: for each position `i` (from the start up to,
 * but not including, the last position), the remaining unsorted portion
 * `[i + 1, length)` is scanned for the smallest value. Every candidate
 * examined during that scan is recorded as a COMPARE between the current
 * best-known minimum's index and the candidate's index — so as a smaller
 * value is found partway through the scan, later COMPAREs in the same
 * pass are against that new minimum, exactly reflecting the real
 * comparisons Selection Sort performs. Once the minimum for position `i`
 * is known, exactly one SWAP is emitted between `i` and the minimum's
 * index — but only if the minimum isn't already at `i`, matching Bubble
 * Sort's existing convention of never recording a no-op SWAP.
 */
export function selectionSort(input: readonly number[]): readonly Operation[] {
  const operations: Operation[] = []
  const workingCopy = [...input]
  const length = workingCopy.length

  for (let i = 0; i < length - 1; i++) {
    let minIndex = i

    for (let j = i + 1; j < length; j++) {
      operations.push({ type: 'compare', indices: [minIndex, j] })

      if (workingCopy[j] < workingCopy[minIndex]) {
        minIndex = j
      }
    }

    if (minIndex !== i) {
      operations.push({ type: 'swap', indices: [i, minIndex] })
      const smallest = workingCopy[minIndex]
      workingCopy[minIndex] = workingCopy[i]
      workingCopy[i] = smallest
    }
  }

  return operations
}
