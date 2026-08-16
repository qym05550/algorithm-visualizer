import { useState } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import {
  DEFAULT_ARRAY_SIZE,
  MAX_ARRAY_SIZE,
  formatArray,
  generateRandomArray,
  parseArrayInput,
} from '../utils/arrayInput'

interface ArrayInputProps {
  /** Called with the validated array once the user confirms it via Done / Enter. */
  onArrayConfirmed: (values: number[]) => void
}

function ArrayInput({ onArrayConfirmed }: ArrayInputProps) {
  const [inputValue, setInputValue] = useState(() =>
    formatArray(generateRandomArray()),
  )
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  function confirmArray() {
    const result = parseArrayInput(inputValue)

    if (!result.ok) {
      setError(result.error)
      setStatusMessage(null)
      return
    }

    // Reset UI state: normalize the displayed text and clear any stale error.
    setInputValue(formatArray(result.values))
    setError(null)
    setStatusMessage(
      `Array confirmed (${result.values.length} element${
        result.values.length === 1 ? '' : 's'
      }).`,
    )
    onArrayConfirmed(result.values)
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setInputValue(event.target.value)
    if (error) setError(null)
    if (statusMessage) setStatusMessage(null)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter') {
      // Comma-separated input is conceptually a single line, so Enter
      // submits instead of inserting a newline.
      event.preventDefault()
      confirmArray()
    }
  }

  function handleGenerateRandom() {
    const values = generateRandomArray(DEFAULT_ARRAY_SIZE)
    setInputValue(formatArray(values))
    setError(null)
    setStatusMessage(null)
  }

  return (
    <div className="sidebar-section">
      <label className="sidebar-section__label" htmlFor="array-input">
        Array
      </label>
      <textarea
        id="array-input"
        className="text-control"
        rows={3}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="e.g. 8, 3, 5, 1, 7, 2, 9, 4, 6, 10"
        aria-describedby="array-input-hint"
      />
      <p className="sidebar-section__hint" id="array-input-hint">
        Comma-separated numbers. {DEFAULT_ARRAY_SIZE} by default, up to{' '}
        {MAX_ARRAY_SIZE} max.
      </p>

      <div className="sidebar-section__actions">
        <button
          type="button"
          className="button button--secondary"
          onClick={handleGenerateRandom}
        >
          Generate Random
        </button>
        <button
          type="button"
          className="button button--primary"
          onClick={confirmArray}
        >
          Done
        </button>
      </div>

      {error && (
        <p className="status-message status-message--error" role="alert">
          {error}
        </p>
      )}
      {!error && statusMessage && (
        <p className="status-message status-message--success">
          {statusMessage}
        </p>
      )}
    </div>
  )
}

export default ArrayInput
