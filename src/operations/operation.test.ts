import { describe, expect, it } from 'vitest'
import type { CompareOperation, Operation, SwapOperation } from './operation'

describe('CompareOperation', () => {
  it('accepts exactly a type and indices field', () => {
    const operation: CompareOperation = { type: 'compare', indices: [0, 1] }
    expect(operation).toEqual({ type: 'compare', indices: [0, 1] })
  })

  it('does not require or accept extra fields such as an id, values, or a result', () => {
    // @ts-expect-error CompareOperation must not accept an id field.
    const withId: CompareOperation = { type: 'compare', indices: [0, 1], id: 1 }
    // @ts-expect-error CompareOperation must not store the compared values.
    const withValues: CompareOperation = { type: 'compare', indices: [0, 1], values: [3, 5] }
    // @ts-expect-error CompareOperation must not store the comparison result.
    const withResult: CompareOperation = { type: 'compare', indices: [0, 1], result: true }

    expect([withId, withValues, withResult]).toHaveLength(3)
  })
})

describe('SwapOperation', () => {
  it('accepts exactly a type and indices field', () => {
    const operation: SwapOperation = { type: 'swap', indices: [2, 3] }
    expect(operation).toEqual({ type: 'swap', indices: [2, 3] })
  })

  it('does not require or accept extra fields such as an id or previous values', () => {
    // @ts-expect-error SwapOperation must not accept an id field.
    const withId: SwapOperation = { type: 'swap', indices: [0, 1], id: 1 }
    // @ts-expect-error SwapOperation must not store the previous values.
    const withPreviousValues: SwapOperation = { type: 'swap', indices: [0, 1], previousValues: [3, 5] }

    expect([withId, withPreviousValues]).toHaveLength(2)
  })
})

describe('Operation union', () => {
  it('accepts both CompareOperation and SwapOperation values', () => {
    const operations: Operation[] = [
      { type: 'compare', indices: [0, 1] },
      { type: 'swap', indices: [1, 2] },
    ]

    expect(operations).toHaveLength(2)
    expect(operations[0].type).toBe('compare')
    expect(operations[1].type).toBe('swap')
  })

  it('narrows by the type discriminant so indices stay accessible either way', () => {
    const operations: Operation[] = [
      { type: 'compare', indices: [4, 5] },
      { type: 'swap', indices: [6, 7] },
    ]

    for (const operation of operations) {
      // No cast needed here — the discriminated union narrows `operation`
      // by its `type` field alone.
      expect(operation.indices).toHaveLength(2)
    }
  })

  it('rejects operation types other than "compare" and "swap"', () => {
    // @ts-expect-error "mark" is not a supported Operation type.
    const invalid: Operation = { type: 'mark', indices: [0, 1] }
    expect(invalid.type).toBe('mark')
  })
})
