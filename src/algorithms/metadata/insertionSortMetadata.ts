import type { AlgorithmMetadata } from './algorithmMetadata'

/**
 * Educational pseudocode for Insertion Sort — selecting the current
 * element, comparing it against its left neighbor, shifting it left while
 * out of order, and stopping the moment it finds its correct position.
 * Not insertionSort.ts's actual TypeScript.
 */
const CODE = [
  'for i = 1 to n - 1',
  '    j = i',
  '    while j > 0',
  '        compare array[j - 1] with array[j]',
  '        if array[j - 1] > array[j]',
  '            swap array[j - 1] and array[j]',
  '            j = j - 1',
  '        else',
  '            break',
] as const

const COMPARE_LINE = 4
const SWAP_LINE = 6

/**
 * insertionSort.ts pushes one COMPARE at every leftward step (checking
 * the element against its current left neighbor), and a SWAP only when
 * the neighbor is greater — the shift that moves the element one position
 * left. The moment a COMPARE finds the neighbor not greater, the walk
 * stops without a swap (the element has found its place) — matching the
 * "else / break" line, which never gets its own Operation since it
 * represents "nothing happened," not an action to visualize.
 */
export const insertionSortMetadata: AlgorithmMetadata = {
  name: 'Insertion Sort',
  code: CODE,
  // An already-sorted input never enters the inner while loop's body (the
  // very first compare per element always finds the left neighbor
  // already <=), so insertionSort.ts performs only O(n) comparisons and
  // zero swaps in that case — the same "Best: O(n)" shape as Bubble Sort.
  complexity: {
    time: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
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
