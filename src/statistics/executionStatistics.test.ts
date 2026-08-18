// Statistics & Complexity Panel task: unit tests for the pure statistics
// derivation function. No React, no VisualizerController, no algorithm —
// just Operation[] + a step number in, ExecutionStatistics out.
import { describe, expect, it } from 'vitest'
import type { Operation } from '../operations/operation'
import { ZERO_STATISTICS, computeExecutionStatistics } from './executionStatistics'

const COMPARE = (a: number, b: number): Operation => ({ type: 'compare', indices: [a, b] })
const SWAP = (a: number, b: number): Operation => ({ type: 'swap', indices: [a, b] })

describe('computeExecutionStatistics — initial state', () => {
  it('is all zeros at step 0, regardless of how many operations exist', () => {
    const operations = [COMPARE(0, 1), SWAP(0, 1), COMPARE(1, 2)]

    expect(computeExecutionStatistics(operations, 0)).toEqual({
      comparisons: 0,
      swaps: 0,
      totalOperations: 0,
    })
  })

  it('is all zeros for an empty operations list', () => {
    expect(computeExecutionStatistics([], 0)).toEqual(ZERO_STATISTICS)
  })
})

describe('computeExecutionStatistics — a single COMPARE', () => {
  it('increments comparisons and totalOperations, leaves swaps unchanged', () => {
    const operations = [COMPARE(0, 1)]

    expect(computeExecutionStatistics(operations, 1)).toEqual({
      comparisons: 1,
      swaps: 0,
      totalOperations: 1,
    })
  })
})

describe('computeExecutionStatistics — a single SWAP', () => {
  it('increments swaps and totalOperations, leaves comparisons unchanged', () => {
    const operations = [SWAP(0, 1)]

    expect(computeExecutionStatistics(operations, 1)).toEqual({
      comparisons: 0,
      swaps: 1,
      totalOperations: 1,
    })
  })
})

describe('computeExecutionStatistics — mixed operations', () => {
  it('COMPARE, COMPARE, SWAP, COMPARE, SWAP -> 3 comparisons, 2 swaps, 5 total', () => {
    const operations = [
      COMPARE(0, 1),
      COMPARE(1, 2),
      SWAP(1, 2),
      COMPARE(2, 3),
      SWAP(2, 3),
    ]

    expect(computeExecutionStatistics(operations, operations.length)).toEqual({
      comparisons: 3,
      swaps: 2,
      totalOperations: 5,
    })
  })

  it('counts only operations up to currentStep, not the full sequence', () => {
    const operations = [COMPARE(0, 1), COMPARE(1, 2), SWAP(1, 2), COMPARE(2, 3), SWAP(2, 3)]

    // Same sequence as above, but only the first 3 operations have
    // "executed" so far.
    expect(computeExecutionStatistics(operations, 3)).toEqual({
      comparisons: 2,
      swaps: 1,
      totalOperations: 3,
    })
  })
})

describe('computeExecutionStatistics — decreasing currentStep (Previous) naturally decreases counts', () => {
  it('matches the task\'s own worked example: step 3 then step 2 of the same sequence', () => {
    const operations = [COMPARE(0, 1), COMPARE(1, 2), SWAP(1, 2)]

    expect(computeExecutionStatistics(operations, 3)).toEqual({
      comparisons: 2,
      swaps: 1,
      totalOperations: 3,
    })
    expect(computeExecutionStatistics(operations, 2)).toEqual({
      comparisons: 2,
      swaps: 0,
      totalOperations: 2,
    })
  })

  it('a full forward walk then full reverse walk passes back through the exact same statistics at each step', () => {
    const operations = [COMPARE(0, 1), SWAP(0, 1), COMPARE(1, 2), COMPARE(0, 1), SWAP(0, 1)]
    const forward = operations.map((_, index) =>
      computeExecutionStatistics(operations, index + 1),
    )

    const reverse = [...forward].reverse()
    for (let step = operations.length; step >= 1; step--) {
      expect(computeExecutionStatistics(operations, step)).toEqual(
        reverse[operations.length - step],
      )
    }
  })
})

describe('computeExecutionStatistics — out-of-range currentStep is handled defensively', () => {
  const operations = [COMPARE(0, 1), SWAP(0, 1)]

  it('clamps a currentStep beyond the operations length to the full sequence', () => {
    expect(computeExecutionStatistics(operations, 99)).toEqual(
      computeExecutionStatistics(operations, operations.length),
    )
  })

  it('clamps a negative currentStep to zero', () => {
    expect(computeExecutionStatistics(operations, -3)).toEqual(ZERO_STATISTICS)
  })
})
