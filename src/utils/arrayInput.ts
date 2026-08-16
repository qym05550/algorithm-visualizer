/**
 * Pure helpers for the Array Input UI: parsing/validating the user's
 * comma-separated text and generating a random array for the input.
 *
 * This is UI-input logic only — it has nothing to do with the algorithm
 * layer, the Execution Engine, or the Step/Operation system described in
 * PROJECT.md. It just turns text into a validated `number[]`, or explains
 * why it can't.
 */

export const DEFAULT_ARRAY_SIZE = 10
export const MAX_ARRAY_SIZE = 100

// Range used only for the "Generate Random" button. PROJECT.md does not
// specify a value range, so 1-100 was chosen as a reasonable default for
// a readable bar-style visualization later on.
const RANDOM_MIN_VALUE = 1
const RANDOM_MAX_VALUE = 100

export type ParseArrayResult =
  | { ok: true; values: number[] }
  | { ok: false; error: string }

/**
 * Parses and validates a comma-separated string of numbers.
 * Handles: empty input, invalid formatting (e.g. trailing/double commas),
 * non-numeric values, and arrays exceeding MAX_ARRAY_SIZE.
 */
export function parseArrayInput(raw: string): ParseArrayResult {
  const trimmed = raw.trim()

  if (trimmed.length === 0) {
    return { ok: false, error: 'Please enter at least one number.' }
  }

  const tokens = trimmed.split(',').map((token) => token.trim())

  if (tokens.some((token) => token.length === 0)) {
    return {
      ok: false,
      error: 'Invalid formatting. Use comma-separated numbers, e.g. 8, 3, 5.',
    }
  }

  const values: number[] = []
  for (const token of tokens) {
    const value = Number(token)
    if (!Number.isFinite(value)) {
      return { ok: false, error: `"${token}" is not a valid number.` }
    }
    values.push(value)
  }

  if (values.length > MAX_ARRAY_SIZE) {
    return {
      ok: false,
      error: `Array can contain at most ${MAX_ARRAY_SIZE} elements (found ${values.length}).`,
    }
  }

  return { ok: true, values }
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generates a random numeric array for the input field. Defaults to
 * DEFAULT_ARRAY_SIZE elements and is always clamped to MAX_ARRAY_SIZE.
 */
export function generateRandomArray(size: number = DEFAULT_ARRAY_SIZE): number[] {
  const clampedSize = Math.min(Math.max(Math.trunc(size), 1), MAX_ARRAY_SIZE)
  return Array.from({ length: clampedSize }, () =>
    randomInt(RANDOM_MIN_VALUE, RANDOM_MAX_VALUE),
  )
}

/** Formats a numeric array back into the comma-separated input format. */
export function formatArray(values: number[]): string {
  return values.join(', ')
}
