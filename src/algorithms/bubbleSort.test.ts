import { describe, expect, it } from 'vitest'
import { bubbleSort } from './bubbleSort'
import { ExecutionEngine } from '../engine/executionEngine'

function runToCompletion(engine: ExecutionEngine, steps: number) {
  for (let i = 0; i < steps; i++) engine.next()
}

function runAllTheWayBack(engine: ExecutionEngine, steps: number) {
  for (let i = 0; i < steps; i++) engine.previous()
}

describe('bubbleSort — edge cases', () => {
  it('produces no operations for an empty array', () => {
    expect(bubbleSort([])).toEqual([])
  })

  it('produces no operations for a single-element array', () => {
    expect(bubbleSort([42])).toEqual([])
  })

  it('produces exactly one COMPARE and no SWAP for a sorted two-element array', () => {
    expect(bubbleSort([1, 2])).toEqual([{ type: 'compare', indices: [0, 1] }])
  })

  it('produces one COMPARE followed by one SWAP for a reversed two-element array', () => {
    expect(bubbleSort([2, 1])).toEqual([
      { type: 'compare', indices: [0, 1] },
      { type: 'swap', indices: [0, 1] },
    ])
  })
})

describe('bubbleSort — matches the PROJECT.md worked example', () => {
  it('generates the documented sequence for [2, 5, 1]', () => {
    expect(bubbleSort([2, 5, 1])).toEqual([
      { type: 'compare', indices: [0, 1] }, // 2 < 5, no swap
      { type: 'compare', indices: [1, 2] }, // 5 > 1
      { type: 'swap', indices: [1, 2] },
      { type: 'compare', indices: [0, 1] }, // 2 > 1
      { type: 'swap', indices: [0, 1] },
    ])
  })
})

describe('bubbleSort — already sorted arrays', () => {
  it('produces the exact expected COMPARE sequence and no SWAPs for [1, 2, 3]', () => {
    expect(bubbleSort([1, 2, 3])).toEqual([
      { type: 'compare', indices: [0, 1] },
      { type: 'compare', indices: [1, 2] },
      { type: 'compare', indices: [0, 1] },
    ])
  })

  it('produces only COMPARE operations for a larger sorted array', () => {
    const operations = bubbleSort([1, 2, 3, 4, 5])
    expect(operations.every((operation) => operation.type === 'compare')).toBe(true)
    expect(operations).toHaveLength(10) // 5 * 4 / 2
  })
})

describe('bubbleSort — reversed arrays', () => {
  it('produces the expected number of COMPARE and SWAP operations, and sorts correctly through the Execution Engine', () => {
    const input = [4, 3, 2, 1]
    const operations = bubbleSort(input)

    expect(operations.filter((operation) => operation.type === 'compare')).toHaveLength(6) // 4 * 3 / 2
    expect(operations.filter((operation) => operation.type === 'swap')).toHaveLength(6) // fully reversed: every comparison swaps

    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual([1, 2, 3, 4])
  })
})

describe('bubbleSort — duplicate values', () => {
  it('does not swap equal adjacent values', () => {
    expect(bubbleSort([4, 4])).toEqual([{ type: 'compare', indices: [0, 1] }])
  })

  it('sorts arrays containing duplicates correctly', () => {
    const input = [3, 1, 3, 2, 1]
    const operations = bubbleSort(input)
    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual([1, 1, 2, 3, 3])
  })
})

describe('bubbleSort — negative numbers and zero', () => {
  it('sorts a mix of negative, zero, and positive values correctly', () => {
    const input = [-3, 0, -1, 2, -5]
    const operations = bubbleSort(input)
    const engine = new ExecutionEngine(input, operations)
    runToCompletion(engine, operations.length)
    expect(engine.getState().workingArray).toEqual([-5, -3, -1, 0, 2])
  })
})

describe('bubbleSort — every comparison is recorded', () => {
  it('records exactly n * (n - 1) / 2 COMPARE operations, matching the standard pass structure', () => {
    const inputs = [[5], [5, 1], [5, 1, 4], [5, 1, 4, 2, 8], [1, 2, 3, 4, 5, 6]]

    for (const input of inputs) {
      const expectedCompares = (input.length * (input.length - 1)) / 2
      const compareCount = bubbleSort(input).filter(
        (operation) => operation.type === 'compare',
      ).length
      expect(compareCount).toBe(expectedCompares)
    }
  })
})

describe('bubbleSort — SWAP occurs only when the left value is greater than the right value', () => {
  it('every SWAP is justified by the values at the time of its COMPARE, and the final array is sorted', () => {
    const input = [5, 1, 4, 2, 8, 0, 3]
    const simulated = [...input]
    const operations = bubbleSort(input)

    let pending: { left: number; right: number } | null = null

    for (const operation of operations) {
      if (operation.type === 'compare') {
        const [a, b] = operation.indices
        pending = { left: simulated[a], right: simulated[b] }
      } else {
        expect(pending).not.toBeNull()
        expect(pending!.left).toBeGreaterThan(pending!.right)

        const [a, b] = operation.indices
        const left = simulated[a]
        simulated[a] = simulated[b]
        simulated[b] = left
        pending = null
      }
    }

    expect(simulated).toEqual([...input].sort((x, y) => x - y))
  })
})

describe('bubbleSort — input immutability', () => {
  it('never mutates the original input array', () => {
    const input = [5, 3, 4, 1, 2]
    const snapshot = [...input]

    bubbleSort(input)

    expect(input).toEqual(snapshot)
  })
})

describe('bubbleSort — operations contain only the approved fields', () => {
  it('every operation has exactly a type and indices field, with no id, values, or result', () => {
    const operations = bubbleSort([3, 1, 2])

    expect(operations.length).toBeGreaterThan(0)
    for (const operation of operations) {
      expect(Object.keys(operation).sort()).toEqual(['indices', 'type'])
      expect(['compare', 'swap']).toContain(operation.type)
      expect(operation.indices).toHaveLength(2)
    }
  })
})

describe('bubbleSort — operation ordering', () => {
  it('always emits the COMPARE for a pair immediately before any SWAP of that same pair', () => {
    const operations = bubbleSort([9, 4, 6, 1, 3])

    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i]
      if (operation.type === 'swap') {
        expect(operations[i - 1]).toEqual({ type: 'compare', indices: operation.indices })
      }
    }
  })
})

describe('bubbleSort — determinism', () => {
  it('produces equivalent operations across repeated runs on the same input', () => {
    const input = [7, 2, 9, 4, 1]
    expect(bubbleSort(input)).toEqual(bubbleSort(input))
  })
})

describe('bubbleSort — Execution Engine integration', () => {
  it('sorts the working array ascending after executing every generated operation', () => {
    const input = [6, 3, 8, 1, 9, 2]
    const operations = bubbleSort(input)
    const engine = new ExecutionEngine(input, operations)

    runToCompletion(engine, operations.length)

    const state = engine.getState()
    expect(state.workingArray).toEqual([1, 2, 3, 6, 8, 9])
    expect(state.currentStep).toBe(operations.length)
  })

  it('returns to the original input after executing forward then reversing all the way back', () => {
    const input = [6, 3, 8, 1, 9, 2]
    const operations = bubbleSort(input)
    const engine = new ExecutionEngine(input, operations)

    runToCompletion(engine, operations.length)
    runAllTheWayBack(engine, operations.length)

    const state = engine.getState()
    expect(state.workingArray).toEqual(input)
    expect(state.currentStep).toBe(0)
    expect(state.currentOperation).toBeNull()
  })
})
