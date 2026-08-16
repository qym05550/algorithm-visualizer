import { describe, expect, it } from 'vitest'
import type { Operation } from '../operations/operation'
import { ExecutionEngine } from './executionEngine'

const INITIAL_ARRAY = [8, 3, 5, 1]

// A realistic sequence mixing both Operation types, equivalent to the
// first two comparisons/swaps of a Bubble Sort pass over [8, 3, 5, 1]:
//   compare(0,1) -> swap(0,1) => [3, 8, 5, 1]
//   compare(1,2) -> swap(1,2) => [3, 5, 8, 1]
const OPERATIONS: Operation[] = [
  { type: 'compare', indices: [0, 1] },
  { type: 'swap', indices: [0, 1] },
  { type: 'compare', indices: [1, 2] },
  { type: 'swap', indices: [1, 2] },
]

function createEngine() {
  return new ExecutionEngine(INITIAL_ARRAY, OPERATIONS)
}

describe('ExecutionEngine — initial state', () => {
  it('preserves the initial array, starts workingArray as a copy, and starts at step 0 with no current operation', () => {
    const engine = createEngine()
    const state = engine.getState()

    expect(state.initialArray).toEqual([8, 3, 5, 1])
    expect(state.workingArray).toEqual([8, 3, 5, 1])
    expect(state.workingArray).not.toBe(INITIAL_ARRAY)
    expect(state.currentStep).toBe(0)
    expect(state.currentOperation).toBeNull()
  })
})

describe('ExecutionEngine — next() with COMPARE', () => {
  it('advances currentStep, leaves workingArray unchanged, and sets currentOperation to the COMPARE', () => {
    const engine = createEngine()
    engine.next()
    const state = engine.getState()

    expect(state.currentStep).toBe(1)
    expect(state.workingArray).toEqual([8, 3, 5, 1])
    expect(state.currentOperation).toEqual({ type: 'compare', indices: [0, 1] })
  })
})

describe('ExecutionEngine — next() with SWAP', () => {
  it('updates workingArray, advances currentStep, and sets currentOperation to the SWAP', () => {
    const engine = createEngine()
    engine.next() // compare(0, 1)
    engine.next() // swap(0, 1)
    const state = engine.getState()

    expect(state.workingArray).toEqual([3, 8, 5, 1])
    expect(state.currentStep).toBe(2)
    expect(state.currentOperation).toEqual({ type: 'swap', indices: [0, 1] })
  })
})

describe('ExecutionEngine — multiple next() calls', () => {
  it('executes operations in order', () => {
    const engine = createEngine()

    engine.next() // compare(0, 1)
    expect(engine.getState().workingArray).toEqual([8, 3, 5, 1])

    engine.next() // swap(0, 1)
    expect(engine.getState().workingArray).toEqual([3, 8, 5, 1])

    engine.next() // compare(1, 2)
    expect(engine.getState().workingArray).toEqual([3, 8, 5, 1])

    engine.next() // swap(1, 2)
    const state = engine.getState()
    expect(state.workingArray).toEqual([3, 5, 8, 1])
    expect(state.currentStep).toBe(4)
  })
})

describe('ExecutionEngine — previous() after SWAP', () => {
  it('restores the previous workingArray, decreases currentStep, and updates currentOperation', () => {
    const engine = createEngine()
    engine.next() // compare(0, 1) -> step 1
    engine.next() // swap(0, 1)    -> step 2, [3, 8, 5, 1]

    engine.previous()
    const state = engine.getState()

    expect(state.workingArray).toEqual([8, 3, 5, 1])
    expect(state.currentStep).toBe(1)
    expect(state.currentOperation).toEqual({ type: 'compare', indices: [0, 1] })
  })
})

describe('ExecutionEngine — previous() after COMPARE', () => {
  it('leaves workingArray unchanged, decreases currentStep, and updates currentOperation to null', () => {
    const engine = createEngine()
    engine.next() // compare(0, 1) -> step 1

    engine.previous()
    const state = engine.getState()

    expect(state.workingArray).toEqual([8, 3, 5, 1])
    expect(state.currentStep).toBe(0)
    expect(state.currentOperation).toBeNull()
  })
})

describe('ExecutionEngine — multiple previous() calls', () => {
  it('can return all the way to the initial state', () => {
    const engine = createEngine()
    engine.next()
    engine.next()
    engine.next()
    engine.next()

    engine.previous()
    engine.previous()
    engine.previous()
    engine.previous()

    const state = engine.getState()
    expect(state.workingArray).toEqual([8, 3, 5, 1])
    expect(state.currentStep).toBe(0)
    expect(state.currentOperation).toBeNull()
  })
})

describe('ExecutionEngine — next() at the end', () => {
  it('does nothing once every operation has executed', () => {
    const engine = createEngine()
    engine.next()
    engine.next()
    engine.next()
    engine.next()

    const before = engine.getState()
    engine.next()
    const after = engine.getState()

    expect(after).toEqual(before)
    expect(after.workingArray).toBe(before.workingArray)
    expect(after.currentStep).toBe(OPERATIONS.length)
  })
})

describe('ExecutionEngine — previous() at the beginning', () => {
  it('does nothing at the initial state', () => {
    const engine = createEngine()

    const before = engine.getState()
    engine.previous()
    const after = engine.getState()

    expect(after).toEqual(before)
    expect(after.workingArray).toBe(before.workingArray)
    expect(after.currentStep).toBe(0)
  })
})

describe('ExecutionEngine — reset()', () => {
  it('restores workingArray, resets currentStep and currentOperation, and keeps operations available', () => {
    const engine = createEngine()
    engine.next()
    engine.next()
    engine.next()

    engine.reset()
    const state = engine.getState()

    expect(state.workingArray).toEqual([8, 3, 5, 1])
    expect(state.currentStep).toBe(0)
    expect(state.currentOperation).toBeNull()
    expect(state.operations).toEqual(OPERATIONS)
  })
})

describe('ExecutionEngine — initial array immutability', () => {
  it('never changes initialArray, even after swaps', () => {
    const engine = createEngine()
    engine.next()
    engine.next()
    engine.next()
    engine.next()

    expect(engine.getState().initialArray).toEqual([8, 3, 5, 1])
  })
})

describe('ExecutionEngine — working array immutability', () => {
  it('does not mutate a previously returned workingArray reference when a SWAP occurs', () => {
    const engine = createEngine()
    engine.next() // compare(0, 1)
    const beforeSwap = engine.getState().workingArray

    engine.next() // swap(0, 1)
    const afterSwap = engine.getState().workingArray

    expect(beforeSwap).toEqual([8, 3, 5, 1])
    expect(afterSwap).toEqual([3, 8, 5, 1])
    expect(afterSwap).not.toBe(beforeSwap)
  })
})

describe('ExecutionEngine — operations immutability', () => {
  it('keeps the operations sequence unchanged after execution', () => {
    const engine = createEngine()
    const operationsBefore = engine.getState().operations

    engine.next()
    engine.next()
    engine.previous()
    engine.reset()

    const operationsAfter = engine.getState().operations
    expect(operationsAfter).toBe(operationsBefore)
    expect(operationsAfter).toEqual(OPERATIONS)
  })
})

describe('ExecutionEngine — invalid indices', () => {
  it('fails clearly on an out-of-range COMPARE index and does not advance state', () => {
    const engine = new ExecutionEngine(INITIAL_ARRAY, [
      { type: 'compare', indices: [0, 99] },
    ])

    expect(() => engine.next()).toThrow(RangeError)

    const state = engine.getState()
    expect(state.currentStep).toBe(0)
    expect(state.workingArray).toEqual([8, 3, 5, 1])
  })

  it('fails clearly on an out-of-range SWAP index and does not mutate workingArray or advance', () => {
    const engine = new ExecutionEngine(INITIAL_ARRAY, [
      { type: 'swap', indices: [-1, 0] },
    ])
    const before = engine.getState().workingArray

    expect(() => engine.next()).toThrow(RangeError)

    const state = engine.getState()
    expect(state.currentStep).toBe(0)
    expect(state.workingArray).toBe(before)
    expect(state.workingArray).toEqual([8, 3, 5, 1])
  })

  it('fails clearly on a non-integer index', () => {
    const engine = new ExecutionEngine(INITIAL_ARRAY, [
      { type: 'swap', indices: [0, 1.5] },
    ])

    expect(() => engine.next()).toThrow(RangeError)
    expect(engine.getState().currentStep).toBe(0)
  })
})

describe('ExecutionEngine — boundary state integrity', () => {
  it('leaves state fully unchanged when next() is called at the end', () => {
    const engine = createEngine()
    engine.next()
    engine.next()
    engine.next()
    engine.next()

    const before = engine.getState()
    engine.next()
    engine.next()
    expect(engine.getState()).toEqual(before)
  })

  it('leaves state fully unchanged when previous() is called at the beginning', () => {
    const engine = createEngine()

    const before = engine.getState()
    engine.previous()
    engine.previous()
    expect(engine.getState()).toEqual(before)
  })
})
