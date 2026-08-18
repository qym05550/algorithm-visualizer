// Educational Code View task: verifies Code View respects the existing
// algorithm-selection session-isolation behavior end-to-end through the
// real App component — changing the dropdown must never affect an
// already-running session's Code View, only a fresh Done confirms a new
// one (mirrors the existing Algorithm Selector isolation tests in
// App.test.tsx, extended to also check Code View).
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

function codeViewText(): string[] {
  return Array.from(document.querySelectorAll('.code-view__line-text')).map(
    (el) => el.textContent ?? '',
  )
}

describe('App — Code View shows the default algorithm on first confirmation', () => {
  it('confirming with the default selector value (Bubble Sort) shows Bubble Sort pseudocode', () => {
    render(<App />)
    confirmArray('8, 3, 5, 1')

    expect(codeViewText()).toEqual([...bubbleSortMetadata.code])
  })
})

describe('App — Code View only changes after Done, never from the dropdown alone', () => {
  it('changing the dropdown mid-session leaves the running Code View exactly as it was', () => {
    render(<App />)
    confirmArray('8, 3, 5, 1')
    expect(codeViewText()).toEqual([...bubbleSortMetadata.code])

    fireEvent.change(getAlgorithmSelect(), { target: { value: 'Selection Sort' } })

    // No Done press yet: the active session's Code View must be
    // completely unaffected, exactly like its array/step session already
    // is (App.test.tsx's own "isolated from later dropdown changes" tests).
    expect(codeViewText()).toEqual([...bubbleSortMetadata.code])
  })

  it('pressing Done again after changing the dropdown swaps in the newly selected algorithm\'s pseudocode', () => {
    render(<App />)
    confirmArray('8, 3, 5, 1')

    fireEvent.change(getAlgorithmSelect(), { target: { value: 'Selection Sort' } })
    confirmArray('8, 3, 5, 1')

    expect(codeViewText()).toEqual([...selectionSortMetadata.code])
  })
})
