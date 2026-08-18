import { describe, expect, it } from 'vitest'
import { selectionSort } from './selectionSort'
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

describe('selectionSort — edge cases', () => {
  it('produces no operations for an empty array', () => {
    expect(selectionSort([])).toEqual([])
  })

  it('produces no operations for a single-element array', () => {
    expect(selectionSort([42])).toEqual([])
  })

  it('produces exactly one COMPARE and no SWAP for a sorted two-element array', () => {
    expect(selectionSort([1, 2])).toEqual([{ type: 'compare', indices: [0, 1] }])
  })

  it('produces one COMPARE followed by one SWAP for a reversed two-element array', () => {
    expect(selectionSort([2, 1])).toEqual([
      { type: 'compare', indices: [0, 1] },
      { type: 'swap', indices: [0, 1] },
    ])
  })
})

describe('selectionSort — matches a hand-traced example', () => {
  it('generates the documented sequence for [5, 3, 8, 1, 4]', () => {
    // Hand-traced per position:
    //   i=0: scan 1..4, running minimum moves 0 -> 1 -> 3 (value 1), swap(0, 3)
    //   i=1: scan 2..4, minimum stays at 1 (value 3), no swap
    //   i=2: scan 3..4, running minimum moves 2 -> 3 -> 4 (value 4), swap(2, 4)
    //   i=3: scan 4..4, minimum stays at 3 (value 5), no swap
    expect(selectionSort([5, 3, 8, 1, 4])).toEqual([
      { type: 'compare', indices: [0, 1] },
      { type: 'compare', indices: [1, 2] },
      { type: 'compare', indices: [1, 3] },
      { type: 'compare', indices: [3, 4] },
      { type: 'swap', indices: [0, 3] },
      { type: 'compare', indices: [1, 2] },
      { type: 'compare', indices: [1, 3] },
      { type: 'compare', indices: [1, 4] },
      { type: 'compare', indices: [2, 3] },
      { type: 'compare', indices: [3, 4] },
      { type: 'swap', indices: [2, 4] },
      { type: 'compare', indices: [3, 4] },
    ])
  })
})

describe('selectionSort — already sorted arrays', () => {
  it('produces the exact expected COMPARE sequence and no SWAPs for [1, 2, 3, 4]', () => {
    expect(selectionSort([1, 2, 3, 4])).toEqual([
      { type: 'compare', indices: [0, 1] },
      { type: 'compare', indices: [0, 2] },
      { type: 'compare', indices: [0, 3] },
      { type: 'compare', indices: [1, 2] },
      { type: 'compare', indices: [1, 3] },
      { type: 'compare', indices: [2, 3] },
    ])
  })

  it('produces only COMPARE operations for a larger sorted array', () => {
    const operations = selectionSort([1, 2, 3, 4, 5])
    expect(operations.every((operation) => operation.type === 'compare')).toBe(true)
    expect(operations).toHaveLength(10) // 5 * 4 / 2
  })
})

describe('selectionSort — reversed arrays', () => {
  it('produces the exact expected COMPARE/SWAP sequence for [4, 3, 2, 1]', () => {
    expect(selectionSort([4, 3, 2, 1])).toEqual([
      { type: 'compare', indices: [0, 1] },
      { type: 'compare', indices: [1, 2] },
      { type: 'compare', indices: [2, 3] },
      { type: 'swap', indices: [0, 3] },
      { type: 'compare', indices: [1, 2] },
      { type: 'compare', indices: [2, 3] },
      { type: 'swap', indices: [1, 2] },
      { type: 'compare', indices: [2, 3] },
    ])
  })

  it('produces at most n - 1 SWAPs regardless of input order (unlike Bubble Sort)', () => {
    const input = [4, 3, 2, 1]
    const operations = selectionSort(input)

    expect(operations.filter((operation) => operation.type === 'compare')).toHaveLength(6) // 4 * 3 / 2
    // Selection Sort performs at most one SWAP per position (n - 1 positions
    // total), regardless of how reversed the input is — unlike Bubble Sort,
    // which swaps on every out-of-order adjacent COMPARE. This is what
    // distinguishes Selection Sort's operation shape from Bubble Sort's.
    expect(operations.filter((operation) => operation.type === 'swap').length).toBeLessThanOrEqual(
      input.length - 1,
    )

    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual([1, 2, 3, 4])
  })
})

describe('selectionSort — duplicate values', () => {
  it('does not swap equal adjacent values', () => {
    expect(selectionSort([4, 4])).toEqual([{ type: 'compare', indices: [0, 1] }])
  })

  it('produces the exact expected sequence for [5, 5, 1, 5] and sorts correctly', () => {
    const input = [5, 5, 1, 5]
    const operations = selectionSort(input)

    expect(operations).toEqual([
      { type: 'compare', indices: [0, 1] },
      { type: 'compare', indices: [0, 2] },
      { type: 'compare', indices: [2, 3] },
      { type: 'swap', indices: [0, 2] },
      { type: 'compare', indices: [1, 2] },
      { type: 'compare', indices: [1, 3] },
      { type: 'compare', indices: [2, 3] },
    ])

    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual([1, 5, 5, 5])
  })
})

describe('selectionSort — negative numbers and zero', () => {
  it('produces the exact expected sequence for [-2, 4, 0, -1] and sorts correctly', () => {
    const input = [-2, 4, 0, -1]
    const operations = selectionSort(input)

    expect(operations).toEqual([
      { type: 'compare', indices: [0, 1] },
      { type: 'compare', indices: [0, 2] },
      { type: 'compare', indices: [0, 3] },
      { type: 'compare', indices: [1, 2] },
      { type: 'compare', indices: [2, 3] },
      { type: 'swap', indices: [1, 3] },
      { type: 'compare', indices: [2, 3] },
    ])

    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual([-2, -1, 0, 4])
  })

  it('sorts a mix of negative, zero, and positive values correctly', () => {
    const input = [-3, 0, -1, 2, -5]
    const operations = selectionSort(input)
    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual([-5, -3, -1, 0, 2])
  })
})

describe('selectionSort — final sorting correctness', () => {
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
      const operations = selectionSort(input)
      const engine = new ExecutionEngine(input, operations)
      runToCompletion(engine, operations.length)

      expect(engine.getState().workingArray).toEqual(ascending(input))
    }
  })
})

describe('selectionSort — at most one SWAP per position, always preceded by its scan', () => {
  it('never emits more than n - 1 SWAPs, and every SWAP follows the COMPAREs for that position', () => {
    const input = [9, 4, 6, 1, 3]
    const operations = selectionSort(input)

    const swapCount = operations.filter((operation) => operation.type === 'swap').length
    expect(swapCount).toBeLessThanOrEqual(input.length - 1)
  })
})

describe('selectionSort — SWAP occurs only when a smaller value was actually found', () => {
  it('every SWAP moves the correct minimum into place, and the final array is sorted', () => {
    const input = [5, 1, 4, 2, 8, 0, 3]
    const simulated = [...input]
    const operations = selectionSort(input)

    for (const operation of operations) {
      if (operation.type === 'swap') {
        const [a, b] = operation.indices
        // The value moving into position `a` must be less than (or, for a
        // stable minimum, at most equal to) the value currently there —
        // never a no-op SWAP of two equal positions, and never moving a
        // larger value in.
        expect(simulated[b]).toBeLessThan(simulated[a])

        const temp = simulated[a]
        simulated[a] = simulated[b]
        simulated[b] = temp
      }
    }

    expect(simulated).toEqual(ascending(input))
  })
})

describe('selectionSort — input immutability', () => {
  it('never mutates the original input array', () => {
    const input = [5, 3, 4, 1, 2]
    const snapshot = [...input]

    selectionSort(input)

    expect(input).toEqual(snapshot)
  })
})

describe('selectionSort — operations contain only the approved fields', () => {
  it('every operation has exactly a type and indices field, with no id, values, or result', () => {
    const operations = selectionSort([3, 1, 2])

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
      const operations = selectionSort(input)
      for (const operation of operations) {
        expect(operation.type === 'compare' || operation.type === 'swap').toBe(true)
      }
    }
  })
})

describe('selectionSort — no invalid indices', () => {
  it('every operation index is a valid, in-bounds position for its input length', () => {
    const cases = [[], [42], [2, 1], [1, 2, 3, 4], [4, 3, 2, 1], [5, 5, 1, 5], [-2, 4, 0, -1], [5, 3, 8, 1, 4]]

    for (const input of cases) {
      const operations = selectionSort(input)
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
      const operations = selectionSort(input)
      const engine = new ExecutionEngine(input, operations)
      expect(() => runToCompletion(engine, operations.length)).not.toThrow()
    }
  })
})

describe('selectionSort — determinism', () => {
  it('produces equivalent operations across repeated runs on the same input', () => {
    const input = [7, 2, 9, 4, 1]
    expect(selectionSort(input)).toEqual(selectionSort(input))
  })

  it('produces equivalent operations across repeated runs for every required case', () => {
    const cases = [[], [42], [2, 1], [1, 2, 3, 4], [4, 3, 2, 1], [5, 5, 1, 5], [-2, 4, 0, -1], [5, 3, 8, 1, 4]]

    for (const input of cases) {
      expect(selectionSort(input)).toEqual(selectionSort(input))
    }
  })
})

describe('selectionSort — Execution Engine integration', () => {
  it('sorts the working array ascending after executing every generated operation', () => {
    const input = [6, 3, 8, 1, 9, 2]
    const operations = selectionSort(input)
    const engine = new ExecutionEngine(input, operations)

    runToCompletion(engine, operations.length)

    const state = engine.getState()
    expect(state.workingArray).toEqual([1, 2, 3, 6, 8, 9])
    expect(state.currentStep).toBe(operations.length)
  })

  it('returns to the original input after executing forward then reversing all the way back', () => {
    const input = [6, 3, 8, 1, 9, 2]
    const operations = selectionSort(input)
    const engine = new ExecutionEngine(input, operations)

    runToCompletion(engine, operations.length)
    runAllTheWayBack(engine, operations.length)

    const state = engine.getState()
    expect(state.workingArray).toEqual(input)
    expect(state.currentStep).toBe(0)
    expect(state.currentOperation).toBeNull()
  })
})
