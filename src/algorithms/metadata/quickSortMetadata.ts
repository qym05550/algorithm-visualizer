import type { AlgorithmMetadata } from './algorithmMetadata'

/**
 * Educational pseudocode for Quick Sort — divide (pick the pivot),
 * partition (rearrange around it), then recursively sort both sides. Not
 * quickSort.ts's actual TypeScript; this teaches the conceptual algorithm
 * the way it's normally taught, the same relationship the other four
 * algorithms' pseudocode already has to their own implementations.
 *
 * Matches quickSort.ts's own pivot choice (the last element of the current
 * range) and Lomuto partition scheme exactly, so a reader can follow one
 * against the other line by line.
 */
const CODE = [
  'quickSort(array, low, high)',
  '    if low >= high, return',
  '    pivotIndex = partition(array, low, high)',
  '    quickSort(array, low, pivotIndex - 1)',
  '    quickSort(array, pivotIndex + 1, high)',
  'partition(array, low, high)',
  '    pivot = array[high]',
  '    i = low - 1',
  '    for j = low to high - 1',
  '        compare array[j] with pivot',
  '        if array[j] < pivot',
  '            i = i + 1',
  '            swap array[i] and array[j]',
  '    swap array[i + 1] and array[high]',
  '    return i + 1',
] as const

/** 1-based line numbers into CODE above — kept as named constants so the
 *  mapping function below reads as intent, not magic numbers. */
const COMPARE_LINE = 10
const SWAP_LINE = 13

/**
 * quickSort.ts pushes exactly one COMPARE per element examined against the
 * pivot during partitioning (always the candidate index paired with the
 * pivot's own index), and one SWAP per actual position exchange performed
 * during partitioning — both the "move a smaller element into the
 * less-than-pivot region" swaps and the final "put the pivot in its sorted
 * position" swap — so, exactly like the other four algorithms' metadata,
 * the operation's `type` alone is enough to pick a line; the indices carry
 * no additional educational meaning here. Both partitioning SWAPs share
 * line 13 rather than distinguishing the final pivot-placement swap with
 * its own line, the same "every SWAP this algorithm performs maps to one
 * conceptual swap line" simplification mergeSortMetadata.ts already makes
 * for its own two kinds of SWAP (mid-scan vs. rotation-into-place).
 */
export const quickSortMetadata: AlgorithmMetadata = {
  name: 'Quick Sort',
  code: CODE,
  // Conventional textbook complexity for Quick Sort: a well-balanced
  // partition every time gives the same O(n log n) shape as Merge Sort for
  // best and average case, but an already-sorted or reverse-sorted input
  // is the worst case for a last-element pivot specifically (see
  // quickSort.ts's own doc comment on pivot choice) — every partition call
  // only ever shrinks the range by one element instead of splitting it
  // roughly in half, giving O(n²) worst-case time. Space is O(log n) for
  // the recursive call stack in this in-place implementation (no auxiliary
  // array is ever allocated — partitioning happens directly on the working
  // array, exactly like Bubble/Selection/Insertion Sort's O(1)-space
  // in-place swaps), assuming a balanced recursion depth; the same
  // last-element-pivot worst case that produces O(n²) time also produces
  // O(n) recursion depth (and therefore O(n) space) for that specific
  // input shape, which is the conventional caveat this complexity is
  // documented with rather than a claim this implementation guarantees
  // O(log n) depth unconditionally.
  complexity: {
    time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)' },
    space: 'O(log n)',
  },
  getHighlightedLine(operation) {
    if (!operation) return null

    switch (operation.type) {
      case 'compare':
        return COMPARE_LINE
      case 'swap':
        return SWAP_LINE
      default:
        return null
    }
  },
}
