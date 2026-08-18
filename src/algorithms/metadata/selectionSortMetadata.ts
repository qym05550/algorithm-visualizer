import type { AlgorithmMetadata } from './algorithmMetadata'

/**
 * Educational pseudocode for Selection Sort — the current position, a
 * running minimum index, scanning the remaining elements, updating the
 * minimum, and one final swap per pass. Not selectionSort.ts's actual
 * TypeScript.
 */
const CODE = [
  'for i = 0 to n - 2',
  '    minIndex = i',
  '    for j = i + 1 to n - 1',
  '        compare array[j] with array[minIndex]',
  '        if array[j] < array[minIndex]',
  '            minIndex = j',
  '    swap array[i] and array[minIndex]',
] as const

const COMPARE_LINE = 4
const SWAP_LINE = 7

/**
 * selectionSort.ts pushes one COMPARE per candidate examined during the
 * minimum search (always against the current best-known minimum), and
 * exactly one SWAP once the minimum for this pass is found (only when it
 * isn't already in place) — so `type` alone identifies the line: every
 * COMPARE is the minimum-search comparison, every SWAP is the final swap.
 */
export const selectionSortMetadata: AlgorithmMetadata = {
  name: 'Selection Sort',
  code: CODE,
  // Selection Sort always scans the entire remaining unsorted portion to
  // find the minimum, regardless of the input's existing order — so
  // unlike Bubble Sort or Insertion Sort, its best case is no better than
  // its average/worst case.
  complexity: {
    time: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)' },
    space: 'O(1)',
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
