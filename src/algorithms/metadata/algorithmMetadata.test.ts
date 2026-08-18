// Educational Code View task: verifies each algorithm's metadata exports
// valid pseudocode and correctly maps every supported Operation type to
// its conceptual line, independent of the actual indices involved (the
// mapping is purely by operation.type — see each metadata file's own doc
// comment for why that's sufficient given how bubbleSort/selectionSort/
// insertionSort actually emit their Operations).
//
// Statistics & Complexity Panel task: also verifies each algorithm's
// static AlgorithmComplexity (time best/average/worst, space) matches the
// project's documented conventional complexity for its in-place
// implementation.
import { describe, expect, it } from 'vitest'
import type { Operation } from '../../operations/operation'
import { bubbleSortMetadata } from './bubbleSortMetadata'
import { selectionSortMetadata } from './selectionSortMetadata'
import { insertionSortMetadata } from './insertionSortMetadata'
import { mergeSortMetadata } from './mergeSortMetadata'
import { quickSortMetadata } from './quickSortMetadata'
import type { AlgorithmComplexity, AlgorithmMetadata } from './algorithmMetadata'

const ALGORITHMS: Array<{
  metadata: AlgorithmMetadata
  expectedName: string
  compareLine: number
  swapLine: number
  expectedComplexity: AlgorithmComplexity
}> = [
  {
    metadata: bubbleSortMetadata,
    expectedName: 'Bubble Sort',
    compareLine: 3,
    swapLine: 5,
    expectedComplexity: {
      time: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
      space: 'O(1)',
    },
  },
  {
    metadata: selectionSortMetadata,
    expectedName: 'Selection Sort',
    compareLine: 4,
    swapLine: 7,
    expectedComplexity: {
      time: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)' },
      space: 'O(1)',
    },
  },
  {
    metadata: insertionSortMetadata,
    expectedName: 'Insertion Sort',
    compareLine: 4,
    swapLine: 6,
    expectedComplexity: {
      time: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
      space: 'O(1)',
    },
  },
  {
    metadata: mergeSortMetadata,
    expectedName: 'Merge Sort',
    compareLine: 10,
    swapLine: 14,
    expectedComplexity: {
      time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
      space: 'O(n)',
    },
  },
  {
    metadata: quickSortMetadata,
    expectedName: 'Quick Sort',
    compareLine: 10,
    swapLine: 13,
    expectedComplexity: {
      time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)' },
      space: 'O(log n)',
    },
  },
]

describe.each(ALGORITHMS)(
  '$expectedName metadata',
  ({ metadata, expectedName, compareLine, swapLine, expectedComplexity }) => {
    it('exists and reports the expected display name', () => {
      expect(metadata).toBeTruthy()
      expect(metadata.name).toBe(expectedName)
    })

    it('has non-empty, readable pseudocode', () => {
      expect(Array.isArray(metadata.code)).toBe(true)
      expect(metadata.code.length).toBeGreaterThan(0)
      for (const line of metadata.code) {
        expect(typeof line).toBe('string')
      }
    })

    it('the compareLine/swapLine fixtures above point at real lines within the pseudocode', () => {
      expect(compareLine).toBeGreaterThanOrEqual(1)
      expect(compareLine).toBeLessThanOrEqual(metadata.code.length)
      expect(swapLine).toBeGreaterThanOrEqual(1)
      expect(swapLine).toBeLessThanOrEqual(metadata.code.length)
    })

    it('maps every COMPARE operation to the expected line, regardless of indices', () => {
      const a: Operation = { type: 'compare', indices: [0, 1] }
      const b: Operation = { type: 'compare', indices: [7, 12] }

      expect(metadata.getHighlightedLine(a)).toBe(compareLine)
      expect(metadata.getHighlightedLine(b)).toBe(compareLine)
    })

    it('maps every SWAP operation to the expected line, regardless of indices', () => {
      const a: Operation = { type: 'swap', indices: [0, 1] }
      const b: Operation = { type: 'swap', indices: [3, 9] }

      expect(metadata.getHighlightedLine(a)).toBe(swapLine)
      expect(metadata.getHighlightedLine(b)).toBe(swapLine)
    })

    it('the compare line and swap line are never the same line', () => {
      expect(compareLine).not.toBe(swapLine)
    })

    it('a null operation safely produces no active line', () => {
      expect(metadata.getHighlightedLine(null)).toBeNull()
    })

    it('an unrecognized operation type safely produces no active line, not a thrown error', () => {
      const unknownOperation = { type: 'mark', indices: [0, 1] } as unknown as Operation

      expect(() => metadata.getHighlightedLine(unknownOperation)).not.toThrow()
      expect(metadata.getHighlightedLine(unknownOperation)).toBeNull()
    })

    it('exposes the expected time and space complexity', () => {
      expect(metadata.complexity).toEqual(expectedComplexity)
    })

    it('complexity values are non-empty Big-O strings, not blank placeholders', () => {
      const { time, space } = metadata.complexity
      for (const value of [time.best, time.average, time.worst, space]) {
        expect(typeof value).toBe('string')
        expect(value.length).toBeGreaterThan(0)
        expect(value).toMatch(/^O\(/)
      }
    })
  },
)

describe('Algorithm metadata — each algorithm has distinct pseudocode', () => {
  it('no two algorithms share the exact same code lines', () => {
    const codeStrings = ALGORITHMS.map(({ metadata }) => metadata.code.join('\n'))
    expect(new Set(codeStrings).size).toBe(ALGORITHMS.length)
  })
})

describe('Algorithm metadata — complexity distinguishes Selection Sort from the other two', () => {
  it('Selection Sort has no better best-case than its average/worst case, unlike Bubble Sort and Insertion Sort', () => {
    expect(selectionSortMetadata.complexity.time.best).toBe(
      selectionSortMetadata.complexity.time.average,
    )
    expect(bubbleSortMetadata.complexity.time.best).not.toBe(
      bubbleSortMetadata.complexity.time.average,
    )
    expect(insertionSortMetadata.complexity.time.best).not.toBe(
      insertionSortMetadata.complexity.time.average,
    )
  })

  it('Bubble Sort, Selection Sort, and Insertion Sort are O(1) space, matching their in-place implementations', () => {
    for (const metadata of [bubbleSortMetadata, selectionSortMetadata, insertionSortMetadata]) {
      expect(metadata.complexity.space).toBe('O(1)')
    }
  })

  it('Merge Sort is documented as O(n) space, the conventional complexity for the textbook algorithm, unlike the other three', () => {
    expect(mergeSortMetadata.complexity.space).toBe('O(n)')
    expect(mergeSortMetadata.complexity.space).not.toBe(bubbleSortMetadata.complexity.space)
  })

  it('Merge Sort is the only algorithm that guarantees O(n log n) even in the worst case', () => {
    expect(mergeSortMetadata.complexity.time.worst).toBe('O(n log n)')
    for (const metadata of [bubbleSortMetadata, selectionSortMetadata, insertionSortMetadata, quickSortMetadata]) {
      expect(metadata.complexity.time.worst).not.toBe('O(n log n)')
    }
  })

  it('Quick Sort shares Merge Sort\'s O(n log n) best/average case but, unlike Merge Sort, degrades to O(n²) worst case', () => {
    expect(quickSortMetadata.complexity.time.best).toBe(mergeSortMetadata.complexity.time.best)
    expect(quickSortMetadata.complexity.time.average).toBe(mergeSortMetadata.complexity.time.average)
    expect(quickSortMetadata.complexity.time.worst).toBe('O(n²)')
    expect(quickSortMetadata.complexity.time.worst).not.toBe(mergeSortMetadata.complexity.time.worst)
  })

  it('Quick Sort is documented as O(log n) space (recursive call stack), distinct from every other algorithm\'s complexity', () => {
    expect(quickSortMetadata.complexity.space).toBe('O(log n)')
    const otherSpaces = new Set(
      [bubbleSortMetadata, selectionSortMetadata, insertionSortMetadata, mergeSortMetadata].map(
        (metadata) => metadata.complexity.space,
      ),
    )
    expect(otherSpaces.has('O(log n)')).toBe(false)
  })
})
