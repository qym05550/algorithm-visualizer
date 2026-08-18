import type { Operation } from '../operations/operation'

/**
 * Generates the ordered sequence of Operations for an ascending Insertion
 * Sort of `input` (PROJECT.md sections 4, 18.2).
 *
 * This function only determines what operations should happen — it does
 * not execute them, render anything, or know about the Execution Engine,
 * the Visualizer, or React. The Execution Engine is what actually applies
 * the returned Operations to a Working Array.
 *
 * `input` is never mutated: Insertion Sort works against a private copy so
 * it knows the correct values for later comparisons, and only the copy is
 * changed.
 *
 * Standard insertion sort, with the usual "shift elements right to make
 * room" step represented as a sequence of adjacent SWAPs rather than a new
 * Operation type — exactly what the existing COMPARE/SWAP model already
 * supports, so the Execution Engine can replay it unmodified. For each
 * position `i` from 1 to `length - 1`, the element at `i` is walked
 * leftward one adjacent position at a time: at each step, a COMPARE is
 * recorded between the element and its left neighbor; if the neighbor is
 * greater, a SWAP moves the element one position left and the walk
 * continues; the moment a COMPARE finds the neighbor is not greater, the
 * element has reached its sorted position and the walk for this `i` stops
 * (no swap recorded for that final, decisive COMPARE) — matching Bubble
 * Sort's and Selection Sort's existing convention of never recording a
 * no-op SWAP.
 */
export function insertionSort(input: readonly number[]): readonly Operation[] {
  const operations: Operation[] = []
  const workingCopy = [...input]
  const length = workingCopy.length

  for (let i = 1; i < length; i++) {
    let j = i

    while (j > 0) {
      operations.push({ type: 'compare', indices: [j - 1, j] })

      if (workingCopy[j - 1] <= workingCopy[j]) {
        break
      }

      operations.push({ type: 'swap', indices: [j - 1, j] })
      const left = workingCopy[j - 1]
      workingCopy[j - 1] = workingCopy[j]
      workingCopy[j] = left
      j -= 1
    }
  }

  return operations
}
