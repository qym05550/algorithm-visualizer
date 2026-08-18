import type { Operation } from '../operations/operation'

/**
 * Generates the ordered sequence of Operations for an ascending Quick Sort
 * of `input` (PROJECT.md sections 4, 18.2).
 *
 * This function only determines what operations should happen — it does
 * not execute them, render anything, or know about the Execution Engine,
 * the Visualizer, or React. The Execution Engine is what actually applies
 * the returned Operations to a Working Array.
 *
 * `input` is never mutated: Quick Sort works against a private copy so it
 * knows the correct values for later comparisons, and only the copy is
 * changed.
 *
 * Standard educational Quick Sort: divide (pick a pivot), partition
 * (rearrange so everything less than the pivot ends up to its left and
 * everything else to its right), then recursively sort both sides.
 *
 * Pivot strategy: the LAST element of the current range (`array[high]`),
 * partitioned with the classic Lomuto scheme. This is deliberately the
 * simplest, most commonly taught partition scheme, and it happens to map
 * onto the existing COMPARE/SWAP Operation model with no translation layer
 * needed at all — unlike a median-of-three or randomized pivot, a
 * last-element pivot needs no extra Operation just to "mark" or "select"
 * the pivot; it's always simply `array[high]` for whichever range is
 * currently being partitioned, and every SWAP the visualizer shows is a
 * real position exchange Lomuto partitioning actually performs, not a
 * detail synthesized for display. A random or median-of-three pivot would
 * make the algorithm faster on adversarial inputs, but this project's Bar
 * View/Array View visualizer has no way to show "why this element was
 * chosen as the pivot" beyond the same COMPARE/SWAP operations the rest of
 * partitioning already produces — so, per this task's own "prioritize
 * clarity and visualizability over micro-optimizations" instruction, a
 * deterministic last-element pivot is used instead. Determinism is also
 * required outright (PROJECT.md 18.7, "Operations sequence should be
 * treated as immutable" — the same input must always produce the same
 * Operations), which rules out a randomized pivot regardless.
 *
 * No PIVOT Operation is introduced. `array[high]` (the pivot for the
 * *current* partition call) is always the second index in every COMPARE
 * this function emits — see quickSortMetadata.ts for how Code View surfaces
 * "compare against the pivot" purely from that convention, with no new
 * Operation type or metadata field required.
 *
 * Lomuto partition, walking `j` from `low` to `high - 1`:
 *
 *   - Emit a COMPARE between `j` (the element being examined) and `high`
 *     (the pivot's position) — a real comparison against the pivot value.
 *   - If `workingCopy[j]` is less than the pivot, it belongs in the
 *     "less than pivot" region: advance the boundary index `i` and, if the
 *     element isn't already sitting at that boundary (`i !== j`), SWAP it
 *     into place. Skipping the SWAP when `i === j` follows the same
 *     "never record a no-op SWAP" convention selectionSort.ts already
 *     uses when its running minimum is already in place.
 *   - After the scan, SWAP the pivot itself (still at `high`) into its
 *     final sorted position at `i + 1` — unless it's already there
 *     (`i + 1 === high`), again skipping the no-op case. This is the one
 *     SWAP that is unconditional on the pivot's own value: Lomuto always
 *     performs it whenever the pivot isn't already in place, even if the
 *     value being swapped in happens to equal the pivot (e.g. sorting
 *     `[4, 4]` still performs this SWAP) — it's a genuine position
 *     exchange the algorithm performs, not a value-equality check, so it
 *     is correctly represented as a real SWAP rather than skipped.
 *
 * The pivot's final index is returned so the caller can recurse on the two
 * resulting sub-ranges, `[low, pivotIndex - 1]` and `[pivotIndex + 1, high]`
 * — the pivot itself is already in its correct sorted position and is
 * never touched again by either recursive call.
 */
export function quickSort(input: readonly number[]): readonly Operation[] {
  const operations: Operation[] = []
  const workingCopy = [...input]

  function partition(low: number, high: number): number {
    const pivot = workingCopy[high]
    let i = low - 1

    for (let j = low; j < high; j++) {
      operations.push({ type: 'compare', indices: [j, high] })

      if (workingCopy[j] < pivot) {
        i += 1

        if (i !== j) {
          operations.push({ type: 'swap', indices: [i, j] })
          const temp = workingCopy[i]
          workingCopy[i] = workingCopy[j]
          workingCopy[j] = temp
        }
      }
    }

    if (i + 1 !== high) {
      operations.push({ type: 'swap', indices: [i + 1, high] })
      const temp = workingCopy[i + 1]
      workingCopy[i + 1] = workingCopy[high]
      workingCopy[high] = temp
    }

    return i + 1
  }

  function sortRange(low: number, high: number): void {
    if (low >= high) {
      // Zero or one element: already sorted, nothing to compare or swap.
      return
    }

    const pivotIndex = partition(low, high)
    sortRange(low, pivotIndex - 1)
    sortRange(pivotIndex + 1, high)
  }

  sortRange(0, workingCopy.length - 1)

  return operations
}
