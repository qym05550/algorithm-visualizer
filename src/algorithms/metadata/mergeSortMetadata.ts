import type { AlgorithmMetadata } from './algorithmMetadata'

/**
 * Educational pseudocode for Merge Sort — the recursive split down to
 * single elements, then the merge of two already-sorted runs by walking
 * two cursors and comparing their current elements. Not mergeSort.ts's
 * actual TypeScript (which performs the merge's "move" step as a sequence
 * of adjacent swaps to stay within the existing COMPARE/SWAP Operation
 * model — see that file's own doc comment); this teaches the conceptual
 * algorithm the way it's normally taught, the same relationship
 * bubbleSort/selectionSort/insertionSort's pseudocode already has to their
 * own implementations.
 */
const CODE = [
  'mergeSort(array, left, right)',
  '    if left >= right, return',
  '    mid = (left + right) / 2',
  '    mergeSort(array, left, mid)',
  '    mergeSort(array, mid + 1, right)',
  '    merge(array, left, mid, right)',
  'merge(array, left, mid, right)',
  '    start = left, start2 = mid + 1',
  '    while start <= mid and start2 <= right',
  '        compare array[start] with array[start2]',
  '        if array[start] <= array[start2]',
  '            start = start + 1',
  '        else',
  '            swap array[start2] into position start',
  '            start = start + 1, mid = mid + 1, start2 = start2 + 1',
] as const

/** 1-based line numbers into CODE above — kept as named constants so the
 *  mapping function below reads as intent, not magic numbers. */
const COMPARE_LINE = 10
const SWAP_LINE = 14

/**
 * mergeSort.ts pushes exactly one COMPARE per pair of cursor positions
 * examined during a merge, and one SWAP per adjacent exchange performed
 * while rotating an out-of-order element into place — so, exactly like the
 * other three algorithms' metadata, the operation's `type` alone is enough
 * to pick a line; the indices carry no additional educational meaning
 * here.
 */
export const mergeSortMetadata: AlgorithmMetadata = {
  name: 'Merge Sort',
  code: CODE,
  // Conventional complexity for Merge Sort as it's taught and analyzed:
  // the array is always split in half regardless of its existing order (no
  // best-case shortcut, unlike Bubble/Insertion Sort), giving the same
  // O(n log n) shape across best/average/worst, with O(n) space for the
  // auxiliary storage the textbook (out-of-place) merge step uses. This
  // project's mergeSort.ts specifically avoids introducing a new Operation
  // type by performing that merge step in place via adjacent SWAPs instead
  // of an auxiliary array (see its own doc comment) — a visualization-
  // layer implementation detail that intentionally does not change the
  // conventional complexity Merge Sort is documented and taught with here.
  complexity: {
    time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
    space: 'O(n)',
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
