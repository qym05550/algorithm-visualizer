import { describe, expect, it } from 'vitest'
import { insertionSort } from './insertionSort'
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

describe('insertionSort — edge cases', () => {
  it('produces no operations for an empty array', () => {
    expect(insertionSort([])).toEqual([])
  })

  it('produces no operations for a single-element array', () => {
    expect(insertionSort([42])).toEqual([])
  })

  it('produces exactly one COMPARE and no SWAP for a sorted two-element array', () => {
    expect(insertionSort([1, 2])).toEqual([{ type: 'compare', indices: [0, 1] }])
  })

  it('produces one COMPARE followed by one SWAP for a reversed two-element array', () => {
    expect(insertionSort([2, 1])).toEqual([
      { type: 'compare', indices: [0, 1] },
      { type: 'swap', indices: [0, 1] },
    ])
  })
})

describe('insertionSort — matches a hand-traced (and independently verified) example', () => {
  it('generates the documented sequence for [5, 3, 8, 1, 4]', () => {
    // Per position i (the element being inserted), walking it leftward one
    // adjacent swap at a time until a COMPARE finds it's no longer out of
    // order with its left neighbor:
    //   i=1 (3): compare(0,1) 5>3 -> swap(0,1)                    => [3,5,8,1,4]
    //   i=2 (8): compare(1,2) 5>8? no -> stop                     => [3,5,8,1,4]
    //   i=3 (1): compare(2,3) 8>1 -> swap(2,3)                    => [3,5,1,8,4]
    //            compare(1,2) 5>1 -> swap(1,2)                    => [3,1,5,8,4]
    //            compare(0,1) 3>1 -> swap(0,1)                    => [1,3,5,8,4]
    //   i=4 (4): compare(3,4) 8>4 -> swap(3,4)                    => [1,3,5,4,8]
    //            compare(2,3) 5>4 -> swap(2,3)                    => [1,3,4,5,8]
    //            compare(1,2) 3>4? no -> stop
    expect(insertionSort([5, 3, 8, 1, 4])).toEqual([
      { type: 'compare', indices: [0, 1] },
      { type: 'swap', indices: [0, 1] },
      { type: 'compare', indices: [1, 2] },
      { type: 'compare', indices: [2, 3] },
      { type: 'swap', indices: [2, 3] },
      { type: 'compare', indices: [1, 2] },
      { type: 'swap', indices: [1, 2] },
      { type: 'compare', indices: [0, 1] },
      { type: 'swap', indices: [0, 1] },
      { type: 'compare', indices: [3, 4] },
      { type: 'swap', indices: [3, 4] },
      { type: 'compare', indices: [2, 3] },
      { type: 'swap', indices: [2, 3] },
      { type: 'compare', indices: [1, 2] },
    ])
  })
})

describe('insertionSort — already sorted arrays', () => {
  it('produces the exact expected COMPARE sequence and no SWAPs for [1, 2, 3, 4]', () => {
    expect(insertionSort([1, 2, 3, 4])).toEqual([
      { type: 'compare', indices: [0, 1] },
      { type: 'compare', indices: [1, 2] },
      { type: 'compare', indices: [2, 3] },
    ])
  })

  it('produces only COMPARE operations for a larger sorted array', () => {
    const operations = insertionSort([1, 2, 3, 4, 5])
    expect(operations.every((operation) => operation.type === 'compare')).toBe(true)
    expect(operations).toHaveLength(4) // length - 1: one COMPARE per position, already in place
  })
})

describe('insertionSort — reversed arrays', () => {
  it('produces the exact expected COMPARE/SWAP sequence for [4, 3, 2, 1]', () => {
    expect(insertionSort([4, 3, 2, 1])).toEqual([
      { type: 'compare', indices: [0, 1] },
      { type: 'swap', indices: [0, 1] },
      { type: 'compare', indices: [1, 2] },
      { type: 'swap', indices: [1, 2] },
      { type: 'compare', indices: [0, 1] },
      { type: 'swap', indices: [0, 1] },
      { type: 'compare', indices: [2, 3] },
      { type: 'swap', indices: [2, 3] },
      { type: 'compare', indices: [1, 2] },
      { type: 'swap', indices: [1, 2] },
      { type: 'compare', indices: [0, 1] },
      { type: 'swap', indices: [0, 1] },
    ])
  })

  it('swaps on every COMPARE in the fully-reversed worst case, and sorts correctly through the Execution Engine', () => {
    const input = [4, 3, 2, 1]
    const operations = insertionSort(input)

    expect(operations.filter((operation) => operation.type === 'compare')).toHaveLength(6) // 4 * 3 / 2
    expect(operations.filter((operation) => operation.type === 'swap')).toHaveLength(6)

    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual([1, 2, 3, 4])
  })
})

describe('insertionSort — duplicate values', () => {
  it('does not swap equal adjacent values', () => {
    expect(insertionSort([4, 4])).toEqual([{ type: 'compare', indices: [0, 1] }])
  })

  it('produces the exact expected sequence for [5, 5, 1, 5] and sorts correctly', () => {
    const input = [5, 5, 1, 5]
    const operations = insertionSort(input)

    expect(operations).toEqual([
      { type: 'compare', indices: [0, 1] },
      { type: 'compare', indices: [1, 2] },
      { type: 'swap', indices: [1, 2] },
      { type: 'compare', indices: [0, 1] },
      { type: 'swap', indices: [0, 1] },
      { type: 'compare', indices: [2, 3] },
    ])

    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual([1, 5, 5, 5])
  })
})

describe('insertionSort — negative numbers and zero', () => {
  it('produces the exact expected sequence for [-2, 4, 0, -1] and sorts correctly', () => {
    const input = [-2, 4, 0, -1]
    const operations = insertionSort(input)

    expect(operations).toEqual([
      { type: 'compare', indices: [0, 1] },
      { type: 'compare', indices: [1, 2] },
      { type: 'swap', indices: [1, 2] },
      { type: 'compare', indices: [0, 1] },
      { type: 'compare', indices: [2, 3] },
      { type: 'swap', indices: [2, 3] },
      { type: 'compare', indices: [1, 2] },
      { type: 'swap', indices: [1, 2] },
      { type: 'compare', indices: [0, 1] },
    ])

    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual([-2, -1, 0, 4])
  })

  it('sorts a mix of negative, zero, and positive values correctly', () => {
    const input = [-3, 0, -1, 2, -5]
    const operations = insertionSort(input)
    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual([-5, -3, -1, 0, 2])
  })
})

describe('insertionSort — final sorting correctness', () => {
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
    ]

    for (const input of cases) {
      const operations = insertionSort(input)
      const engine = new ExecutionEngine(input, operations)
      runToCompletion(engine, operations.length)

      expect(engine.getState().workingArray).toEqual(ascending(input))
    }
  })
})

describe('insertionSort — every SWAP is adjacent and justified by its preceding COMPARE', () => {
  it('every SWAP is between adjacent indices, immediately preceded by the COMPARE that justified it, and the final array is sorted', () => {
    const input = [5, 1, 4, 2, 8, 0, 3]
    const simulated = [...input]
    const operations = insertionSort(input)

    let pending: { left: number; right: number; indices: readonly [number, number] } | null = null

    for (const operation of operations) {
      if (operation.type === 'compare') {
        const [a, b] = operation.indices
        expect(b - a).toBe(1) // insertion sort only ever compares adjacent positions
        pending = { left: simulated[a], right: simulated[b], indices: operation.indices }
      } else {
        expect(pending).not.toBeNull()
        expect(pending!.left).toBeGreaterThan(pending!.right)
        expect(operation.indices).toEqual(pending!.indices)

        const [a, b] = operation.indices
        const left = simulated[a]
        simulated[a] = simulated[b]
        simulated[b] = left
        pending = null
      }
    }

    expect(simulated).toEqual(ascending(input))
  })
})

describe('insertionSort — input immutability', () => {
  it('never mutates the original input array', () => {
    const input = [5, 3, 4, 1, 2]
    const snapshot = [...input]

    insertionSort(input)

    expect(input).toEqual(snapshot)
  })
})

describe('insertionSort — operations contain only the approved fields', () => {
  it('every operation has exactly a type and indices field, with no id, values, or result', () => {
    const operations = insertionSort([3, 1, 2])

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
      const operations = insertionSort(input)
      for (const operation of operations) {
        expect(operation.type === 'compare' || operation.type === 'swap').toBe(true)
      }
    }
  })
})

describe('insertionSort — no invalid indices', () => {
  it('every operation index is a valid, in-bounds position for its input length', () => {
    const cases = [[], [42], [2, 1], [1, 2, 3, 4], [4, 3, 2, 1], [5, 5, 1, 5], [-2, 4, 0, -1], [5, 3, 8, 1, 4]]

    for (const input of cases) {
      const operations = insertionSort(input)
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
      const operations = insertionSort(input)
      const engine = new ExecutionEngine(input, operations)
      expect(() => runToCompletion(engine, operations.length)).not.toThrow()
    }
  })
})

describe('insertionSort — determinism', () => {
  it('produces equivalent operations across repeated runs on the same input', () => {
    const input = [7, 2, 9, 4, 1]
    expect(insertionSort(input)).toEqual(insertionSort(input))
  })

  it('produces equivalent operations across repeated runs for every required case', () => {
    const cases = [[], [42], [2, 1], [1, 2, 3, 4], [4, 3, 2, 1], [5, 5, 1, 5], [-2, 4, 0, -1], [5, 3, 8, 1, 4]]

    for (const input of cases) {
      expect(insertionSort(input)).toEqual(insertionSort(input))
    }
  })
})

describe('insertionSort — Execution Engine integration', () => {
  it('sorts the working array ascending after executing every generated operation', () => {
    const input = [6, 3, 8, 1, 9, 2]
    const operations = insertionSort(input)
    const engine = new ExecutionEngine(input, operations)

    runToCompletion(engine, operations.length)

    const state = engine.getState()
    expect(state.workingArray).toEqual([1, 2, 3, 6, 8, 9])
    expect(state.currentStep).toBe(operations.length)
  })

  it('returns to the original input after executing forward then reversing all the way back', () => {
    const input = [6, 3, 8, 1, 9, 2]
    const operations = insertionSort(input)
    const engine = new ExecutionEngine(input, operations)

    runToCompletion(engine, operations.length)
    runAllTheWayBack(engine, operations.length)

    const state = engine.getState()
    expect(state.workingArray).toEqual(input)
    expect(state.currentStep).toBe(0)
    expect(state.currentOperation).toBeNull()
  })
})

describe('insertionSort — genuinely different from Bubble Sort and Selection Sort', () => {
  it('produces a different operation sequence than Bubble Sort for the same reversed input, despite matching totals', async () => {
    const { bubbleSort } = await import('./bubbleSort')
    const input = [4, 3, 2, 1]

    const insertionOps = insertionSort(input)
    const bubbleOps = bubbleSort(input)

    // Same totals for this worst-case input (every comparison swaps for
    // both algorithms here) — but the actual sequence of indices differs,
    // proving Insertion Sort is not just Bubble Sort under another name.
    expect(insertionOps.length).toBe(bubbleOps.length)
    expect(insertionOps).not.toEqual(bubbleOps)
  })

  it('produces a different step total than Selection Sort for the same input', async () => {
    const { selectionSort } = await import('./selectionSort')
    const input = [5, 3, 8, 1, 4]

    expect(insertionSort(input).length).not.toBe(selectionSort(input).length)
  })
})
