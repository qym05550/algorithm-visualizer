import { describe, expect, it } from 'vitest'
import { mergeSort } from './mergeSort'
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

describe('mergeSort — edge cases', () => {
  it('produces no operations for an empty array', () => {
    expect(mergeSort([])).toEqual([])
  })

  it('produces no operations for a single-element array', () => {
    expect(mergeSort([42])).toEqual([])
  })

  it('produces exactly one COMPARE and no SWAP for a sorted two-element array', () => {
    expect(mergeSort([1, 2])).toEqual([{ type: 'compare', indices: [0, 1] }])
  })

  it('produces one COMPARE followed by one SWAP for a reversed two-element array', () => {
    expect(mergeSort([2, 1])).toEqual([
      { type: 'compare', indices: [0, 1] },
      { type: 'swap', indices: [0, 1] },
    ])
  })
})

describe('mergeSort — matches a hand-traced example', () => {
  it('generates the documented sequence for [5, 3, 8, 1, 2]', () => {
    // Hand-traced (see mergeSort.ts's own doc comment for the general
    // technique). Splits into [5,3] [8] [1,2], sorts each recursively,
    // then merges bottom-up:
    //   sort [5,3]  -> compare(0,1) 5>3 -> swap(0,1)          => [3,5,8,1,2]
    //   sort [8]    -> (single element, no operations)
    //   merge [3,5] with [8] -> compare(0,2) 3<=8 -> compare(1,2) 5<=8
    //                                                          => [3,5,8,1,2]
    //   sort [1,2]  -> compare(3,4) 1<=2 -> no swap            => [3,5,8,1,2]
    //   merge [3,5,8] with [1,2] (left=0,mid=2,right=4):
    //     compare(0,3) 3>1 -> rotate 1 into position 0 via swap(2,3),
    //       swap(1,2), swap(0,1)                                => [1,3,5,8,2]
    //     compare(1,4) 3>2 -> rotate 2 into position 1 via swap(3,4),
    //       swap(2,3), swap(1,2)                                => [1,2,3,5,8]
    expect(mergeSort([5, 3, 8, 1, 2])).toEqual([
      { type: 'compare', indices: [0, 1] },
      { type: 'swap', indices: [0, 1] },
      { type: 'compare', indices: [0, 2] },
      { type: 'compare', indices: [1, 2] },
      { type: 'compare', indices: [3, 4] },
      { type: 'compare', indices: [0, 3] },
      { type: 'swap', indices: [2, 3] },
      { type: 'swap', indices: [1, 2] },
      { type: 'swap', indices: [0, 1] },
      { type: 'compare', indices: [1, 4] },
      { type: 'swap', indices: [3, 4] },
      { type: 'swap', indices: [2, 3] },
      { type: 'swap', indices: [1, 2] },
    ])

    const input = [5, 3, 8, 1, 2]
    const operations = mergeSort(input)
    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual([1, 2, 3, 5, 8])
  })
})

describe('mergeSort — already sorted arrays', () => {
  it('produces the exact expected COMPARE sequence and no SWAPs for [1, 2, 3, 4]', () => {
    // sortRange(0,1) merges [1] with [2] -> compare(0,1)
    // sortRange(2,3) merges [3] with [4] -> compare(2,3)
    // final merge of [1,2] with [3,4] -> compare(0,2), compare(1,2)
    // (start2 exhausts before start ever reaches position 2, so no
    // compare(1,3) is needed — the last unconsumed left-run element is
    // already known to be in place once the right run is used up)
    expect(mergeSort([1, 2, 3, 4])).toEqual([
      { type: 'compare', indices: [0, 1] },
      { type: 'compare', indices: [2, 3] },
      { type: 'compare', indices: [0, 2] },
      { type: 'compare', indices: [1, 2] },
    ])
  })

  it('produces only COMPARE operations for a larger sorted array', () => {
    const operations = mergeSort([1, 2, 3, 4, 5, 6, 7, 8])
    expect(operations.every((operation) => operation.type === 'compare')).toBe(true)
    expect(operations.length).toBeGreaterThan(0)
  })
})

describe('mergeSort — reversed arrays', () => {
  it('sorts a fully reversed array correctly, using both COMPARE and SWAP', () => {
    const input = [4, 3, 2, 1]
    const operations = mergeSort(input)

    expect(operations.some((operation) => operation.type === 'compare')).toBe(true)
    expect(operations.some((operation) => operation.type === 'swap')).toBe(true)

    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual([1, 2, 3, 4])
  })
})

describe('mergeSort — duplicate values', () => {
  it('does not swap equal adjacent values', () => {
    expect(mergeSort([4, 4])).toEqual([{ type: 'compare', indices: [0, 1] }])
  })

  it('sorts an array of many duplicates correctly, keeping equal runs stable via <=', () => {
    const input = [5, 5, 1, 5]
    const operations = mergeSort(input)
    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual([1, 5, 5, 5])
  })
})

describe('mergeSort — negative numbers and zero', () => {
  it('sorts a mix of negatives, zero, and positives correctly', () => {
    const input = [-2, 4, 0, -1]
    const operations = mergeSort(input)
    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual([-2, -1, 0, 4])
  })

  it('sorts an all-negative array correctly', () => {
    const input = [-5, -1, -3, -2, -4]
    const operations = mergeSort(input)
    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual([-5, -4, -3, -2, -1])
  })

  it('sorts an all-zero array correctly, producing no swaps', () => {
    const input = [0, 0, 0, 0]
    const operations = mergeSort(input)
    expect(operations.every((operation) => operation.type === 'compare')).toBe(true)

    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual([0, 0, 0, 0])
  })
})

describe('mergeSort — final sorting correctness', () => {
  it('produces an ascending sort through the Execution Engine for every required case', () => {
    const cases: number[][] = [
      [],
      [42],
      [2, 1],
      [1, 2, 3, 4],
      [4, 3, 2, 1],
      [5, 5, 1, 5],
      [-2, 4, 0, -1],
      [5, 3, 8, 1, 4],
      [5, 3, 8, 1, 2],
      [0, 0, 0, 0],
      [-5, -1, -3, -2, -4],
    ]

    for (const input of cases) {
      const operations = mergeSort(input)
      const engine = new ExecutionEngine(input, operations)
      runToCompletion(engine, operations.length)

      expect(engine.getState().workingArray).toEqual(ascending(input))
    }
  })

  it('sorts a larger (30-element) reverse-sorted array correctly', () => {
    const input = Array.from({ length: 30 }, (_, i) => 30 - i)
    const operations = mergeSort(input)
    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual(ascending(input))
  })

  it('sorts a larger (50-element) array of mixed positive and negative values correctly', () => {
    const input = [
      12, -7, 33, 0, -19, 5, 8, -3, 21, 14, -1, 9, 17, -25, 6, 2, -11, 30, 4, -8, 15, 1, -2, 28, 3, -14, 10, 7, -6,
      19, 22, -9, 18, 0, -4, 13, 26, -17, 11, 24, -20, 16, 27, -5, 20, 25, -10, 29, 23, -12,
    ]
    const operations = mergeSort(input)
    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual(ascending(input))
  })
})

describe('mergeSort — every SWAP is adjacent, valid, and moves a smaller value left', () => {
  it('every SWAP is between adjacent indices and, when replayed, produces the correctly sorted array', () => {
    const input = [5, 1, 4, 2, 8, 0, 3]
    const simulated = [...input]
    const operations = mergeSort(input)

    for (const operation of operations) {
      if (operation.type === 'swap') {
        const [a, b] = operation.indices
        expect(b - a).toBe(1) // the rotation step only ever swaps adjacent positions

        const temp = simulated[a]
        simulated[a] = simulated[b]
        simulated[b] = temp
      }
    }

    expect(simulated).toEqual(ascending(input))
  })
})

describe('mergeSort — input immutability', () => {
  it('never mutates the original input array', () => {
    const input = [5, 3, 4, 1, 2]
    const snapshot = [...input]

    mergeSort(input)

    expect(input).toEqual(snapshot)
  })
})

describe('mergeSort — operations contain only the approved fields', () => {
  it('every operation has exactly a type and indices field, with no id, values, or result', () => {
    const operations = mergeSort([3, 1, 2])

    expect(operations.length).toBeGreaterThan(0)
    for (const operation of operations) {
      expect(Object.keys(operation).sort()).toEqual(['indices', 'type'])
      expect(['compare', 'swap']).toContain(operation.type)
      expect(operation.indices).toHaveLength(2)
    }
  })

  it('produces only COMPARE and SWAP operations, never any other type', () => {
    const cases = [[], [42], [2, 1], [1, 2, 3, 4], [4, 3, 2, 1], [5, 5, 1, 5], [-2, 4, 0, -1], [5, 3, 8, 1, 2]]

    for (const input of cases) {
      const operations = mergeSort(input)
      for (const operation of operations) {
        expect(operation.type === 'compare' || operation.type === 'swap').toBe(true)
      }
    }
  })
})

describe('mergeSort — no invalid indices', () => {
  it('every operation index is a valid, in-bounds position for its input length', () => {
    const cases = [
      [],
      [42],
      [2, 1],
      [1, 2, 3, 4],
      [4, 3, 2, 1],
      [5, 5, 1, 5],
      [-2, 4, 0, -1],
      [5, 3, 8, 1, 2],
      Array.from({ length: 30 }, (_, i) => 30 - i),
    ]

    for (const input of cases) {
      const operations = mergeSort(input)
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
    const cases = [[], [42], [2, 1], [1, 2, 3, 4], [4, 3, 2, 1], [5, 5, 1, 5], [-2, 4, 0, -1], [5, 3, 8, 1, 2]]

    for (const input of cases) {
      const operations = mergeSort(input)
      const engine = new ExecutionEngine(input, operations)
      expect(() => runToCompletion(engine, operations.length)).not.toThrow()
    }
  })
})

describe('mergeSort — determinism', () => {
  it('produces equivalent operations across repeated runs on the same input', () => {
    const input = [7, 2, 9, 4, 1]
    expect(mergeSort(input)).toEqual(mergeSort(input))
  })

  it('produces equivalent operations across repeated runs for every required case', () => {
    const cases = [[], [42], [2, 1], [1, 2, 3, 4], [4, 3, 2, 1], [5, 5, 1, 5], [-2, 4, 0, -1], [5, 3, 8, 1, 2]]

    for (const input of cases) {
      expect(mergeSort(input)).toEqual(mergeSort(input))
    }
  })
})

describe('mergeSort — Execution Engine integration', () => {
  it('sorts the working array ascending after executing every generated operation', () => {
    const input = [6, 3, 8, 1, 9, 2]
    const operations = mergeSort(input)
    const engine = new ExecutionEngine(input, operations)

    runToCompletion(engine, operations.length)

    const state = engine.getState()
    expect(state.workingArray).toEqual([1, 2, 3, 6, 8, 9])
    expect(state.currentStep).toBe(operations.length)
  })

  it('returns to the original input after executing forward then reversing all the way back', () => {
    const input = [6, 3, 8, 1, 9, 2]
    const operations = mergeSort(input)
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
    const operations = mergeSort(input)
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

describe('mergeSort — genuinely different from the other three algorithms', () => {
  it('produces a different operation sequence than Bubble Sort for the same input', async () => {
    const { bubbleSort } = await import('./bubbleSort')
    const input = [5, 3, 8, 1, 2]

    expect(mergeSort(input)).not.toEqual(bubbleSort(input))
  })

  it('produces a different step total than Selection Sort and Insertion Sort for a larger input', async () => {
    const { selectionSort } = await import('./selectionSort')
    const { insertionSort } = await import('./insertionSort')
    const input = Array.from({ length: 20 }, (_, i) => 20 - i)

    const mergeOps = mergeSort(input).length
    expect(mergeOps).not.toBe(selectionSort(input).length)
    expect(mergeOps).not.toBe(insertionSort(input).length)
  })
})
