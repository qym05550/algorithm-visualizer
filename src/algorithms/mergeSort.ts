import type { Operation } from '../operations/operation'

/**
 * Generates the ordered sequence of Operations for an ascending Merge Sort
 * of `input` (PROJECT.md sections 4, 18.2).
 *
 * This function only determines what operations should happen — it does
 * not execute them, render anything, or know about the Execution Engine,
 * the Visualizer, or React. The Execution Engine is what actually applies
 * the returned Operations to a Working Array.
 *
 * `input` is never mutated: Merge Sort works against a private copy so it
 * knows the correct values for later comparisons, and only the copy is
 * changed.
 *
 * The MVP's Operation model supports only COMPARE and SWAP (PROJECT.md
 * 18.3) — no MOVE, INSERT, or OVERWRITE operation exists for representing
 * "write this value from the auxiliary array into this slot," which is how
 * merge sort is usually described. Rather than introduce a new Operation
 * type, this implementation performs a classic *in-place* merge: whenever
 * the right run's current element belongs before the left run's current
 * element, it is walked into place one adjacent position at a time via a
 * sequence of adjacent SWAPs — exactly the same "represent a shift as a
 * sequence of adjacent SWAPs" convention insertionSort.ts already
 * establishes for its own left-shift step. This keeps every operation
 * Merge Sort ever emits fully explainable by the existing COMPARE/SWAP
 * model and directly reversible by the existing Execution Engine, with no
 * auxiliary array ever entering the Operation stream.
 *
 * Concretely, merging the sorted run `[left..mid]` with the sorted run
 * `[mid + 1..right]` walks two cursors, `start` (into the left run) and
 * `start2` (into the right run):
 *
 *   - Emit a COMPARE between `start` and `start2`.
 *   - If the left run's element already belongs first (`<=`), it's already
 *     in the correct relative position — advance `start` with no SWAP.
 *   - Otherwise, the right run's element belongs before it: rotate it into
 *     position `start` by walking it leftward one adjacent SWAP at a time
 *     (`start2` down to `start`, exactly mirroring insertionSort.ts's own
 *     leftward-walk loop). This is a plain right-rotation of the slice
 *     `[start..start2]` by one position — mathematically identical to the
 *     textbook "shift everything right by one, then drop the saved value
 *     in the gap" in-place merge technique, just performed as a sequence
 *     of self-inverse adjacent SWAPs instead of raw array writes. `mid`
 *     and `start2` both advance by one afterward, since the left run's
 *     unconsumed portion has grown by the element just rotated in.
 *
 * This is deliberately the standard "no early exit" behavior: unlike some
 * textbook presentations, there is no `if (array[mid] <= array[mid + 1])
 * return` short-circuit before merging — that would silently skip
 * generating (and visualizing) an entire run's worth of real comparisons
 * whenever a merge happens to already be in order, which conflicts with
 * this project's existing convention (see bubbleSort.ts's own doc comment)
 * of never adding an optimization that skips a comparison that would
 * otherwise occur.
 *
 * Standard top-down Merge Sort: recursively sorts `[0, mid]` and
 * `[mid + 1, length - 1]` before merging them, splitting at the midpoint
 * exactly like the textbook algorithm.
 */
export function mergeSort(input: readonly number[]): readonly Operation[] {
  const operations: Operation[] = []
  const workingCopy = [...input]

  function sortRange(left: number, right: number): void {
    if (left >= right) {
      // Zero or one element: already sorted, nothing to compare or move.
      return
    }

    const mid = Math.floor((left + right) / 2)
    sortRange(left, mid)
    sortRange(mid + 1, right)
    merge(left, mid, right)
  }

  function merge(left: number, mid: number, right: number): void {
    let start = left
    let boundary = mid
    let start2 = mid + 1

    while (start <= boundary && start2 <= right) {
      operations.push({ type: 'compare', indices: [start, start2] })

      if (workingCopy[start] <= workingCopy[start2]) {
        start += 1
        continue
      }

      // workingCopy[start2] belongs before workingCopy[start]: rotate it
      // leftward into position `start`, one adjacent SWAP at a time.
      let index = start2
      while (index !== start) {
        operations.push({ type: 'swap', indices: [index - 1, index] })
        const left = workingCopy[index - 1]
        workingCopy[index - 1] = workingCopy[index]
        workingCopy[index] = left
        index -= 1
      }

      start += 1
      boundary += 1
      start2 += 1
    }
  }

  sortRange(0, workingCopy.length - 1)

  return operations
}
