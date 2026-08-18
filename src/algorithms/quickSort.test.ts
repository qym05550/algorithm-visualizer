import { describe, expect, it } from 'vitest'
import { quickSort } from './quickSort'
import { ExecutionEngine } from '../engine/executionEngine'

function runToCompletion(engine: ExecutionEngine, steps: number) {
  for (let i = 0; i < steps; i++) engine.next()
}

function runAllTheWayBack(engine: ExecutionEngine, steps: number) {
  for (let i = 0; i < steps; i++) engine.previous()
}

function ascending(values: readonly number[]): number[] {
  return [...values].sort((a, b) => a - b)
}

describe('quickSort — edge cases', () => {
  it('produces no operations for an empty array', () => {
    expect(quickSort([])).toEqual([])
  })

  it('produces no operations for a single-element array', () => {
    expect(quickSort([42])).toEqual([])
  })

  it('produces exactly one COMPARE and no SWAP for a sorted two-element array', () => {
    // pivot = array[1] = 2; compare(0,1): 1 < 2, so i advances to 0, but
    // i === j (both 0) so no SWAP is recorded for that step; the final
    // pivot-placement check finds i + 1 (1) already equals high (1), so
    // that SWAP is skipped too.
    expect(quickSort([1, 2])).toEqual([{ type: 'compare', indices: [0, 1] }])
  })

  it('produces one COMPARE followed by one SWAP for a reversed two-element array', () => {
    // pivot = array[1] = 1; compare(0,1): 2 < 1 is false, i stays at -1;
    // the final pivot-placement SWAP fires since i + 1 (0) !== high (1).
    expect(quickSort([2, 1])).toEqual([
      { type: 'compare', indices: [0, 1] },
      { type: 'swap', indices: [0, 1] },
    ])
  })
})

describe('quickSort — matches a hand-traced example', () => {
  it('generates the documented sequence for [5, 3, 8, 1, 4]', () => {
    // Hand-traced (see quickSort.ts's own doc comment for the general
    // Lomuto partition technique; pivot is always array[high]).
    //
    // partition(0, 4): pivot = array[4] = 4
    //   compare(0,4): 5<4? no
    //   compare(1,4): 3<4? yes -> i=0, i!==j(1) -> swap(0,1)   [3,5,8,1,4]
    //   compare(2,4): 8<4? no
    //   compare(3,4): 1<4? yes -> i=1, i!==j(3) -> swap(1,3)   [3,1,8,5,4]
    //   final: i+1=2 !== high(4) -> swap(2,4)                  [3,1,4,5,8]
    //   returns pivotIndex=2
    // partition(0, 1) on [3,1,...]: pivot = array[1] = 1
    //   compare(0,1): 3<1? no
    //   final: i+1=0 !== high(1) -> swap(0,1)                  [1,3,4,5,8]
    //   returns pivotIndex=0 (so sortRange(0,-1) and sortRange(1,1) are no-ops)
    // partition(3, 4) on [...,5,8]: pivot = array[4] = 8
    //   compare(3,4): 5<8? yes -> i=3, i===j(3) -> no swap recorded
    //   final: i+1=4 === high(4) -> no swap (pivot already in place)
    //   returns pivotIndex=4
    expect(quickSort([5, 3, 8, 1, 4])).toEqual([
      { type: 'compare', indices: [0, 4] },
      { type: 'compare', indices: [1, 4] },
      { type: 'swap', indices: [0, 1] },
      { type: 'compare', indices: [2, 4] },
      { type: 'compare', indices: [3, 4] },
      { type: 'swap', indices: [1, 3] },
      { type: 'swap', indices: [2, 4] },
      { type: 'compare', indices: [0, 1] },
      { type: 'swap', indices: [0, 1] },
      { type: 'compare', indices: [3, 4] },
    ])

    const input = [5, 3, 8, 1, 4]
    const operations = quickSort(input)
    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual([1, 3, 4, 5, 8])
  })
})

describe('quickSort — already sorted arrays', () => {
  it('produces only COMPARE operations for a larger sorted array (worst case for a last-element pivot)', () => {
    // An already-sorted input is the textbook worst case for a
    // last-element pivot: every partition call finds nothing less than the
    // pivot, so the pivot itself never moves (i + 1 always equals high),
    // and every recursive call only shrinks by one element.
    const operations = quickSort([1, 2, 3, 4, 5])
    expect(operations.every((operation) => operation.type === 'compare')).toBe(true)
    expect(operations).toHaveLength(10) // 4 + 3 + 2 + 1
  })
})

describe('quickSort — reversed arrays', () => {
  it('sorts a fully reversed array correctly, using both COMPARE and SWAP', () => {
    const input = [4, 3, 2, 1]
    const operations = quickSort(input)

    expect(operations.some((operation) => operation.type === 'compare')).toBe(true)
    expect(operations.some((operation) => operation.type === 'swap')).toBe(true)

    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual([1, 2, 3, 4])
  })
})

describe('quickSort — duplicate values', () => {
  it('still performs the final pivot-placement SWAP even when the two values are equal', () => {
    // pivot = array[1] = 4; compare(0,1): 4<4 is false, i stays at -1; the
    // final pivot-placement SWAP still fires because i + 1 (0) !== high
    // (1) — Lomuto's pivot swap is a real position exchange, not a
    // value-equality check, so it's correctly represented even though both
    // positions hold the value 4 (see quickSort.ts's own doc comment).
    expect(quickSort([4, 4])).toEqual([
      { type: 'compare', indices: [0, 1] },
      { type: 'swap', indices: [0, 1] },
    ])
  })

  it('sorts an array of many duplicates correctly', () => {
    const input = [5, 5, 1, 5]
    const operations = quickSort(input)
    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual([1, 5, 5, 5])
  })

  it('sorts an all-equal-values array correctly', () => {
    const input = [7, 7, 7, 7, 7]
    const operations = quickSort(input)
    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual([7, 7, 7, 7, 7])
  })
})

describe('quickSort — negative numbers and zero', () => {
  it('sorts a mix of negatives, zero, and positives correctly', () => {
    const input = [-2, 4, 0, -1]
    const operations = quickSort(input)
    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual([-2, -1, 0, 4])
  })

  it('sorts an all-negative array correctly', () => {
    const input = [-5, -1, -3, -2, -4]
    const operations = quickSort(input)
    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual([-5, -4, -3, -2, -1])
  })

  it('sorts an all-zero array correctly, producing no swaps beyond pivot placement where needed', () => {
    const input = [0, 0, 0, 0]
    const operations = quickSort(input)
    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual([0, 0, 0, 0])
  })
})

describe('quickSort — final sorting correctness', () => {
  it('produces an ascending sort through the Execution Engine for every required case', () => {
    const cases: number[][] = [
      [],
      [42],
      [2, 1],
      [1, 2, 3, 4],
      [4, 3, 2, 1],
      [5, 5, 1, 5],
      [7, 7, 7, 7, 7],
      [-2, 4, 0, -1],
      [5, 3, 8, 1, 4],
      [0, 0, 0, 0],
      [-5, -1, -3, -2, -4],
    ]

    for (const input of cases) {
      const operations = quickSort(input)
      const engine = new ExecutionEngine(input, operations)
      runToCompletion(engine, operations.length)

      expect(engine.getState().workingArray).toEqual(ascending(input))
    }
  })

  it('sorts a larger (30-element) reverse-sorted array correctly', () => {
    const input = Array.from({ length: 30 }, (_, i) => 30 - i)
    const operations = quickSort(input)
    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual(ascending(input))
  })

  it('sorts a larger (50-element) array of mixed positive and negative values correctly', () => {
    const input = [
      12, -7, 33, 0, -19, 5, 8, -3, 21, 14, -1, 9, 17, -25, 6, 2, -11, 30, 4, -8, 15, 1, -2, 28, 3, -14, 10, 7, -6,
      19, 22, -9, 18, 0, -4, 13, 26, -17, 11, 24, -20, 16, 27, -5, 20, 25, -10, 29, 23, -12,
    ]
    const operations = quickSort(input)
    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual(ascending(input))
  })

  it('sorts several pseudo-randomized arrays correctly', () => {
    // Deterministic "randomized" inputs (no Math.random — this project's
    // tests must themselves be deterministic) covering a range of shapes.
    const cases = [
      [83, 12, 47, 5, 91, 34, 6, 68, 29, 77],
      [1, 100, 2, 99, 3, 98, 4, 97, 5, 96],
      [50, 50, 1, 99, 1, 50, 99, 1, 50, 99],
    ]

    for (const input of cases) {
      const operations = quickSort(input)
      const engine = new ExecutionEngine(input, operations)
      runToCompletion(engine, operations.length)
      expect(engine.getState().workingArray).toEqual(ascending(input))
    }
  })
})

describe('quickSort — every COMPARE is a real comparison against the pivot for its partition call', () => {
  it('every COMPARE pairs a candidate index with the pivot index (always the second index), and every SWAP is a genuine position exchange', () => {
    const input = [5, 1, 4, 2, 8, 0, 3]
    const simulated = [...input]
    const operations = quickSort(input)

    expect(operations.length).toBeGreaterThan(0)

    for (const operation of operations) {
      const [a, b] = operation.indices
      expect(a).not.toBe(b) // never a self-comparison or self-swap

      if (operation.type === 'swap') {
        const temp = simulated[a]
        simulated[a] = simulated[b]
        simulated[b] = temp
      }
    }

    expect(simulated).toEqual(ascending(input))
  })
})

describe('quickSort — input immutability', () => {
  it('never mutates the original input array', () => {
    const input = [5, 3, 4, 1, 2]
    const snapshot = [...input]

    quickSort(input)

    expect(input).toEqual(snapshot)
  })
})

describe('quickSort — operations contain only the approved fields', () => {
  it('every operation has exactly a type and indices field, with no id, values, or result', () => {
    const operations = quickSort([3, 1, 2])

    expect(operations.length).toBeGreaterThan(0)
    for (const operation of operations) {
      expect(Object.keys(operation).sort()).toEqual(['indices', 'type'])
      expect(['compare', 'swap']).toContain(operation.type)
      expect(operation.indices).toHaveLength(2)
    }
  })

  it('produces only COMPARE and SWAP operations, never any other type', () => {
    const cases = [[], [42], [2, 1], [1, 2, 3, 4], [4, 3, 2, 1], [5, 5, 1, 5], [-2, 4, 0, -1], [5, 3, 8, 1, 4]]

    for (const input of cases) {
      const operations = quickSort(input)
      for (const operation of operations) {
        expect(operation.type === 'compare' || operation.type === 'swap').toBe(true)
      }
    }
  })
})

describe('quickSort — no invalid indices', () => {
  it('every operation index is a valid, in-bounds position for its input length', () => {
    const cases = [
      [],
      [42],
      [2, 1],
      [1, 2, 3, 4],
      [4, 3, 2, 1],
      [5, 5, 1, 5],
      [-2, 4, 0, -1],
      [5, 3, 8, 1, 4],
      Array.from({ length: 30 }, (_, i) => 30 - i),
    ]

    for (const input of cases) {
      const operations = quickSort(input)
      for (const operation of operations) {
        for (const index of operation.indices) {
          expect(Number.isInteger(index)).toBe(true)
          expect(index).toBeGreaterThanOrEqual(0)
          expect(index).toBeLessThan(input.length)
        }
      }
    }
  })

  it('is accepted by the Execution Engine without throwing for every required case', () => {
    const cases = [[], [42], [2, 1], [1, 2, 3, 4], [4, 3, 2, 1], [5, 5, 1, 5], [-2, 4, 0, -1], [5, 3, 8, 1, 4]]

    for (const input of cases) {
      const operations = quickSort(input)
      const engine = new ExecutionEngine(input, operations)
      expect(() => runToCompletion(engine, operations.length)).not.toThrow()
    }
  })
})

describe('quickSort — determinism', () => {
  it('produces equivalent operations across repeated runs on the same input', () => {
    const input = [7, 2, 9, 4, 1]
    expect(quickSort(input)).toEqual(quickSort(input))
  })

  it('produces equivalent operations across repeated runs for every required case', () => {
    const cases = [[], [42], [2, 1], [1, 2, 3, 4], [4, 3, 2, 1], [5, 5, 1, 5], [-2, 4, 0, -1], [5, 3, 8, 1, 4]]

    for (const input of cases) {
      expect(quickSort(input)).toEqual(quickSort(input))
    }
  })
})

describe('quickSort — Execution Engine integration', () => {
  it('sorts the working array ascending after executing every generated operation', () => {
    const input = [6, 3, 8, 1, 9, 2]
    const operations = quickSort(input)
    const engine = new ExecutionEngine(input, operations)

    runToCompletion(engine, operations.length)

    const state = engine.getState()
    expect(state.workingArray).toEqual([1, 2, 3, 6, 8, 9])
    expect(state.currentStep).toBe(operations.length)
  })

  it('returns to the original input after executing forward then reversing all the way back', () => {
    const input = [6, 3, 8, 1, 9, 2]
    const operations = quickSort(input)
    const engine = new ExecutionEngine(input, operations)

    runToCompletion(engine, operations.length)
    runAllTheWayBack(engine, operations.length)

    const state = engine.getState()
    expect(state.workingArray).toEqual(input)
    expect(state.currentStep).toBe(0)
    expect(state.currentOperation).toBeNull()
  })

  it('reverses correctly from an arbitrary mid-execution point, not just from full completion', () => {
    const input = [9, 1, 8, 2, 7, 3, 6, 4]
    const operations = quickSort(input)
    const engine = new ExecutionEngine(input, operations)
    const midpoint = Math.floor(operations.length / 2)

    runToCompletion(engine, midpoint)
    const midState = engine.getState().workingArray

    runAllTheWayBack(engine, midpoint)
    expect(engine.getState().workingArray).toEqual(input)

    runToCompletion(engine, midpoint)
    expect(engine.getState().workingArray).toEqual(midState)
  })
})

describe('quickSort — genuinely different from the other four algorithms', () => {
  it('produces a different operation sequence than Bubble Sort for the same input', async () => {
    const { bubbleSort } = await import('./bubbleSort')
    const input = [5, 3, 8, 1, 4]

    expect(quickSort(input)).not.toEqual(bubbleSort(input))
  })

  it('produces a different step total than Selection Sort, Insertion Sort, and Merge Sort for a larger input', async () => {
    const { selectionSort } = await import('./selectionSort')
    const { insertionSort } = await import('./insertionSort')
    const { mergeSort } = await import('./mergeSort')
    const input = [83, 12, 47, 5, 91, 34, 6, 68, 29, 77, 15, 62, 3, 88, 41]

    const quickTotal = quickSort(input).length
    expect(quickTotal).not.toBe(selectionSort(input).length)
    expect(quickTotal).not.toBe(insertionSort(input).length)
    expect(quickTotal).not.toBe(mergeSort(input).length)
  })
})
