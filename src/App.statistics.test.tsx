// Statistics & Complexity Panel task: verifies the Statistics panel
// respects the existing algorithm-selection session-isolation behavior
// end-to-end through the real App component — changing the dropdown must
// never affect an already-running session's statistics/complexity, only a
// fresh Done confirms a new session and resets the counters (mirrors
// App.codeView.test.tsx's own structure and the existing Algorithm
// Selector isolation tests in App.test.tsx).
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'
import { bubbleSortMetadata } from './algorithms/metadata/bubbleSortMetadata'
import { selectionSortMetadata } from './algorithms/metadata/selectionSortMetadata'

function getAlgorithmSelect(): HTMLSelectElement {
  return screen.getByLabelText('Algorithm') as HTMLSelectElement
}

function confirmArray(value: string) {
  const textarea = screen.getByLabelText('Array') as HTMLTextAreaElement
  fireEvent.change(textarea, { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: 'Done' }))
}

function getNext(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement
}

function counters(): { comparisons: number; swaps: number; operations: number } {
  const values = Array.from(document.querySelectorAll('.statistics-panel__counter dd')).map(
    (el) => Number(el.textContent),
  )
  return { comparisons: values[0], swaps: values[1], operations: values[2] }
}

function stepText(): string | null {
  return document.querySelector('.statistics-panel__step')?.textContent ?? null
}

function complexityRows(): string[] {
  return Array.from(document.querySelectorAll('.statistics-panel__complexity-row')).map(
    (el) => el.textContent ?? '',
  )
}

describe('App — Statistics panel shows the default algorithm complexity on first confirmation', () => {
  it('confirming with the default selector value (Bubble Sort) shows Bubble Sort complexity and zeroed counters', () => {
    render(<App />)
    confirmArray('8, 3, 5, 1')

    expect(counters()).toEqual({ comparisons: 0, swaps: 0, operations: 0 })
    expect(complexityRows()).toEqual([
      `Best${bubbleSortMetadata.complexity.time.best}`,
      `Average${bubbleSortMetadata.complexity.time.average}`,
      `Worst${bubbleSortMetadata.complexity.time.worst}`,
      bubbleSortMetadata.complexity.space,
    ])
  })
})

describe('App — Statistics panel only changes after Done, never from the dropdown alone', () => {
  it('changing the dropdown mid-session leaves the running statistics and complexity exactly as they were', () => {
    render(<App />)
    confirmArray('8, 3, 5, 1')
    fireEvent.click(getNext())
    fireEvent.click(getNext())
    const before = counters()
    const stepBefore = stepText()
    const complexityBefore = complexityRows()

    fireEvent.change(getAlgorithmSelect(), { target: { value: 'Selection Sort' } })

    // No Done press yet: the active session's statistics/complexity must
    // be completely unaffected, exactly like its array/step session and
    // Code View already are.
    expect(counters()).toEqual(before)
    expect(stepText()).toBe(stepBefore)
    expect(complexityRows()).toEqual(complexityBefore)
  })

  it('pressing Done again after changing the dropdown creates a new session: complexity swaps in and counters reset to zero', () => {
    render(<App />)
    confirmArray('8, 3, 5, 1')
    fireEvent.click(getNext())
    fireEvent.click(getNext())
    expect(counters()).not.toEqual({ comparisons: 0, swaps: 0, operations: 0 })

    fireEvent.change(getAlgorithmSelect(), { target: { value: 'Selection Sort' } })
    confirmArray('8, 3, 5, 1')

    expect(counters()).toEqual({ comparisons: 0, swaps: 0, operations: 0 })
    // selectionSort([8, 3, 5, 1]) has exactly 7 operations, vs Bubble
    // Sort's 11 for the same input (see App.test.tsx's own selector
    // isolation tests) — proof this is genuinely a new Selection Sort
    // session, not a relabeled Bubble Sort one.
    expect(stepText()).toBe('Step 0 / 7')
    expect(complexityRows()).toEqual([
      `Best${selectionSortMetadata.complexity.time.best}`,
      `Average${selectionSortMetadata.complexity.time.average}`,
      `Worst${selectionSortMetadata.complexity.time.worst}`,
      selectionSortMetadata.complexity.space,
    ])
  })
})
