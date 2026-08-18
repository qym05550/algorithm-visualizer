// Educational Code View task: integration tests verifying CodeView stays
// synchronized with the existing operation playback (Next/Previous/Reset/
// autoplay) and with the Array/Bars view toggle, driven through the real
// VisualizationPlaceholder + VisualizerController + algorithm metadata —
// not through any mocks.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { bubbleSort } from '../algorithms/bubbleSort'
import { selectionSort } from '../algorithms/selectionSort'
import { insertionSort } from '../algorithms/insertionSort'
import { bubbleSortMetadata } from '../algorithms/metadata/bubbleSortMetadata'
import { selectionSortMetadata } from '../algorithms/metadata/selectionSortMetadata'
import { insertionSortMetadata } from '../algorithms/metadata/insertionSortMetadata'
import VisualizationPlaceholder from './VisualizationPlaceholder'

const INPUT = [8, 3, 5, 1]

function getNext(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement
}

function getPrevious(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement
}

function getReset(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Reset' }) as HTMLButtonElement
}

function activeLineNumber(container: HTMLElement): string | null {
  const active = container.querySelectorAll('.code-view__line--active')
  expect(active.length).toBeLessThanOrEqual(1)
  return active[0]?.querySelector('.code-view__line-number')?.textContent ?? null
}

function codeViewText(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('.code-view__line-text')).map(
    (el) => el.textContent ?? '',
  )
}

describe('CodeView integration — 1. Bubble Sort', () => {
  it('shows Bubble Sort pseudocode and no active line before any operation runs', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    expect(codeViewText(container)).toEqual([...bubbleSortMetadata.code])
    expect(activeLineNumber(container)).toBeNull()
  })
})

describe('CodeView integration — 2. Selection Sort', () => {
  it('shows Selection Sort pseudocode and no active line before any operation runs', () => {
    const { container } = render(
      <VisualizationPlaceholder
        array={INPUT}
        algorithm={selectionSort}
        metadata={selectionSortMetadata}
      />,
    )

    expect(codeViewText(container)).toEqual([...selectionSortMetadata.code])
    expect(activeLineNumber(container)).toBeNull()
  })

  it('highlights the minimum-search comparison line, then the final swap line', () => {
    const { container } = render(
      <VisualizationPlaceholder
        array={INPUT}
        algorithm={selectionSort}
        metadata={selectionSortMetadata}
      />,
    )

    fireEvent.click(getNext()) // compare(0, 1)
    expect(activeLineNumber(container)).toBe('4')

    fireEvent.click(getNext()) // compare(1, 2)
    fireEvent.click(getNext()) // compare(1, 3)
    fireEvent.click(getNext()) // swap(0, 3)
    expect(activeLineNumber(container)).toBe('7')
  })
})

describe('CodeView integration — 3. Insertion Sort', () => {
  it('shows Insertion Sort pseudocode and no active line before any operation runs', () => {
    const { container } = render(
      <VisualizationPlaceholder
        array={INPUT}
        algorithm={insertionSort}
        metadata={insertionSortMetadata}
      />,
    )

    expect(codeViewText(container)).toEqual([...insertionSortMetadata.code])
    expect(activeLineNumber(container)).toBeNull()
  })

  it('highlights the comparison-with-previous line, then the shift/move line', () => {
    const { container } = render(
      <VisualizationPlaceholder
        array={INPUT}
        algorithm={insertionSort}
        metadata={insertionSortMetadata}
      />,
    )

    fireEvent.click(getNext()) // compare(0, 1)
    expect(activeLineNumber(container)).toBe('4')

    fireEvent.click(getNext()) // swap(0, 1)
    expect(activeLineNumber(container)).toBe('6')
  })
})

describe('CodeView integration — 4. Next updates code highlighting', () => {
  it('advances the active line to match each operation as Next is pressed, in step with bubbleSort', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    fireEvent.click(getNext()) // compare(0, 1)
    expect(activeLineNumber(container)).toBe('3')

    fireEvent.click(getNext()) // swap(0, 1)
    expect(activeLineNumber(container)).toBe('5')

    fireEvent.click(getNext()) // compare(1, 2)
    expect(activeLineNumber(container)).toBe('3')
  })
})

describe('CodeView integration — 5. Previous updates code highlighting correctly', () => {
  it('undoing a SWAP reverts the active line to the COMPARE that preceded it, matching the array highlight', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    fireEvent.click(getNext()) // compare(0, 1) -> line 3
    fireEvent.click(getNext()) // swap(0, 1)    -> line 5
    expect(activeLineNumber(container)).toBe('5')

    fireEvent.click(getPrevious())
    // Back to the state right after compare(0, 1) ran — the same
    // instant VisualizerController's own currentOperation (and thus the
    // array-cell highlight) already reports.
    expect(activeLineNumber(container)).toBe('3')
  })

  it('undoing back to the very first operation clears the active line entirely', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    fireEvent.click(getNext()) // compare(0, 1)
    fireEvent.click(getPrevious())

    expect(activeLineNumber(container)).toBeNull()
    expect(getPrevious().disabled).toBe(true)
  })
})

describe('CodeView integration — 6. Reset clears the active line', () => {
  it('clears the active line and leaves the pseudocode itself visible', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    fireEvent.click(getNext())
    fireEvent.click(getNext())
    fireEvent.click(getNext())
    expect(activeLineNumber(container)).not.toBeNull()

    fireEvent.click(getReset())

    expect(activeLineNumber(container)).toBeNull()
    expect(codeViewText(container)).toEqual([...bubbleSortMetadata.code])
  })
})

describe('CodeView integration — 8. Switching Array <-> Bars preserves Code View state', () => {
  it('the active line survives toggling between Array View and Bar View', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    fireEvent.click(getNext()) // compare(0, 1) -> line 3
    fireEvent.click(getNext()) // swap(0, 1)    -> line 5
    expect(activeLineNumber(container)).toBe('5')

    fireEvent.click(screen.getByRole('button', { name: 'Bars' }))
    expect(activeLineNumber(container)).toBe('5')
    // CodeView itself is not part of either renderer — it's still there
    // regardless of which one is mounted.
    expect(container.querySelector('.code-view')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Array' }))
    expect(activeLineNumber(container)).toBe('5')
  })
})

describe('CodeView integration — 9. Autoplay keeps Code View synchronized', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('the active line advances on each autoplay tick, matching the step that just ran', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    act(() => {
      vi.advanceTimersByTime(500) // compare(0, 1)
    })
    expect(activeLineNumber(container)).toBe('3')

    act(() => {
      vi.advanceTimersByTime(500) // swap(0, 1)
    })
    expect(activeLineNumber(container)).toBe('5')
  })

  it('Stop leaves the active line exactly where it was, with nothing resetting', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    act(() => {
      vi.advanceTimersByTime(500 * 2) // compare(0,1), swap(0,1)
    })
    const lineWhenStopped = activeLineNumber(container)

    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    act(() => {
      vi.advanceTimersByTime(500 * 5)
    })

    expect(activeLineNumber(container)).toBe(lineWhenStopped)
  })

  it('reaching the end of autoplay leaves the code view on the final operation\'s line, with no further changes', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    act(() => {
      vi.advanceTimersByTime(500 * 20) // comfortably more than 11 operations
    })

    // The real bubbleSort([8, 3, 5, 1]) sequence's final operation is a
    // SWAP (see visualizerController.test.ts's own EXPECTED_OPERATIONS).
    expect(activeLineNumber(container)).toBe('5')

    const lineAfterEnd = activeLineNumber(container)
    act(() => {
      vi.advanceTimersByTime(500 * 5)
    })
    expect(activeLineNumber(container)).toBe(lineAfterEnd)
  })
})

describe('CodeView integration — no metadata supplied', () => {
  it('renders no code view at all when metadata is omitted (backward compatibility)', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    expect(container.querySelector('.code-view')).toBeNull()
  })
})
