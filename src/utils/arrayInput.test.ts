import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ARRAY_SIZE,
  MAX_ARRAY_SIZE,
  formatArray,
  generateRandomArray,
  parseArrayInput,
} from './arrayInput'

describe('parseArrayInput', () => {
  it('parses a valid comma-separated array', () => {
    const result = parseArrayInput('8, 3, 5, 1, 7, 2, 9, 4, 6, 10')
    expect(result).toEqual({
      ok: true,
      values: [8, 3, 5, 1, 7, 2, 9, 4, 6, 10],
    })
  })

  it('allows negative and decimal numbers', () => {
    const result = parseArrayInput('-3, 2.5, 0')
    expect(result).toEqual({ ok: true, values: [-3, 2.5, 0] })
  })

  it('rejects empty input', () => {
    const result = parseArrayInput('')
    expect(result.ok).toBe(false)
  })

  it('rejects whitespace-only input', () => {
    const result = parseArrayInput('   ')
    expect(result.ok).toBe(false)
  })

  it('rejects non-numeric values', () => {
    const result = parseArrayInput('1, two, 3')
    expect(result.ok).toBe(false)
  })

  it('rejects invalid formatting such as double/trailing commas', () => {
    expect(parseArrayInput('1, 2, , 3').ok).toBe(false)
    expect(parseArrayInput('1, 2, 3,').ok).toBe(false)
  })

  it('rejects arrays larger than the maximum size', () => {
    const tooMany = Array.from({ length: MAX_ARRAY_SIZE + 1 }, (_, i) => i).join(', ')
    const result = parseArrayInput(tooMany)
    expect(result.ok).toBe(false)
  })

  it('accepts an array exactly at the maximum size', () => {
    const maxValues = Array.from({ length: MAX_ARRAY_SIZE }, (_, i) => i).join(', ')
    const result = parseArrayInput(maxValues)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.values).toHaveLength(MAX_ARRAY_SIZE)
    }
  })
})

describe('generateRandomArray', () => {
  it('defaults to DEFAULT_ARRAY_SIZE elements', () => {
    expect(generateRandomArray()).toHaveLength(DEFAULT_ARRAY_SIZE)
  })

  it('never exceeds the maximum size, even if a larger size is requested', () => {
    expect(generateRandomArray(500)).toHaveLength(MAX_ARRAY_SIZE)
  })

  it('generates only finite numbers', () => {
    const values = generateRandomArray(20)
    expect(values.every((value) => Number.isFinite(value))).toBe(true)
  })
})

describe('formatArray', () => {
  it('formats numbers back into the comma-separated input format', () => {
    expect(formatArray([8, 3, 5])).toBe('8, 3, 5')
  })
})
