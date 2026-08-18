import type { AlgorithmMetadata } from './algorithmMetadata'

/**
 * Educational pseudocode for Bubble Sort — teaches the idea (repeated
 * passes, adjacent comparison, swap when out of order), not
 * bubbleSort.ts's actual TypeScript. Indentation is embedded as leading
 * spaces so CodeView can render it verbatim with a monospace, whitespace-
 * preserving style.
 */
const CODE = [
  'for pass = 1 to n - 1',
  '    for i = 0 to n - pass - 1',
  '        compare array[i] with array[i + 1]',
  '        if array[i] > array[i + 1]',
  '            swap array[i] and array[i + 1]',
] as const

/** 1-based line numbers into CODE above — kept as named constants so the
 *  mapping function below reads as intent, not magic numbers. */
const COMPARE_LINE = 3
const SWAP_LINE = 5

/**
 * bubbleSort.ts pushes exactly one COMPARE per adjacent pair examined,
 * and exactly one SWAP when that pair is out of order (see its own doc
 * comment) — so the operation's `type` alone is enough to pick a line;
 * the indices carry no additional educational meaning here.
 */
export const bubbleSortMetadata: AlgorithmMetadata = {
  name: 'Bubble Sort',
  code: CODE,
  // Conventional complexity for the standard in-place adjacent-comparison
  // Bubble Sort this project implements (no early-exit optimization —
  // bubbleSort.ts always runs every pass across its full shrinking range,
  // so even an already-sorted input still takes O(n) comparisons with no
  // swaps, matching the "Best: O(n)" case below).
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
