// Statistics & Complexity Panel task: integration tests verifying the
// live counters stay synchronized with the real operation playback
// (Next/Previous/Reset/autoplay) and with the Array/Bars view toggle,
// driven through the real VisualizationPlaceholder + VisualizerController
// + algorithm metadata — not through any mocks. Mirrors
// codeView.integration.test.tsx's own structure and INPUT fixture.
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

// Cross-checked against bubbleSort([8, 3, 5, 1]) in visualizerController.test.ts:
// compare, swap, compare, swap, compare, swap, compare, compare, swap, compare, swap
// -> cumulative (comparisons, swaps) after each step:
// 1:(1,0) 2:(1,1) 3:(2,1) 4:(2,2) 5:(3,2) 6:(3,3) 7:(4,3) 8:(5,3) 9:(5,4) 10:(6,4) 11:(6,5)

function getNext(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement
}

function getPrevious(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement
}

function getReset(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Reset' }) as HTMLButtonElement
}

function counters(container: HTMLElement): { comparisons: number; swaps: number; operations: number } {
  const values = Array.from(container.querySelectorAll('.statistics-panel__counter dd')).map(
    (el) => Number(el.textContent),
  )
  return { comparisons: values[0], swaps: values[1], operations: values[2] }
}

function stepText(container: HTMLElement): string | null {
  return container.querySelector('.statistics-panel__step')?.textContent ?? null
}

describe('StatisticsPanel integration — initial state', () => {
  it('shows Step 0 / total and all-zero counters before any operation runs', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    expect(stepText(container)).toBe('Step 0 / 11')
    expect(counters(container)).toEqual({ comparisons: 0, swaps: 0, operations: 0 })
  })
})

describe('StatisticsPanel integration — Next updates counters correctly', () => {
  it('a COMPARE increments comparisons and operations, not swaps', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    fireEvent.click(getNext()) // compare(0, 1)
    expect(counters(container)).toEqual({ comparisons: 1, swaps: 0, operations: 1 })
  })

  it('a SWAP increments swaps and operations, not comparisons', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    fireEvent.click(getNext()) // compare(0, 1)
    fireEvent.click(getNext()) // swap(0, 1)
    expect(counters(container)).toEqual({ comparisons: 1, swaps: 1, operations: 2 })
  })

  it('tracks the full mixed sequence exactly, matching the real bubbleSort trace', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    const expected = [
      [1, 0, 1],
      [1, 1, 2],
      [2, 1, 3],
      [2, 2, 4],
      [3, 2, 5],
      [3, 3, 6],
      [4, 3, 7],
      [5, 3, 8],
      [5, 4, 9],
      [6, 4, 10],
      [6, 5, 11],
    ]

    for (const [comparisons, swaps, operations] of expected) {
      fireEvent.click(getNext())
      expect(counters(container)).toEqual({ comparisons, swaps, operations })
    }

    expect(stepText(container)).toBe('Step 11 / 11')
  })
})

describe('StatisticsPanel integration — Previous decreases counters correctly', () => {
  it('reverses to the exact statistics of the earlier step, not an independent decrement', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    fireEvent.click(getNext()) // compare(0,1) -> (1,0,1)
    fireEvent.click(getNext()) // swap(0,1)    -> (1,1,2)
    fireEvent.click(getNext()) // compare(1,2) -> (2,1,3)
    expect(counters(container)).toEqual({ comparisons: 2, swaps: 1, operations: 3 })

    fireEvent.click(getPrevious())
    expect(counters(container)).toEqual({ comparisons: 1, swaps: 1, operations: 2 })
    expect(stepText(container)).toBe('Step 2 / 11')
  })

  it('a full forward walk then full reverse walk returns exactly to zero', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    for (let i = 0; i < 11; i++) fireEvent.click(getNext())
    for (let i = 0; i < 11; i++) fireEvent.click(getPrevious())

    expect(counters(container)).toEqual({ comparisons: 0, swaps: 0, operations: 0 })
    expect(stepText(container)).toBe('Step 0 / 11')
    expect(getPrevious().disabled).toBe(true)
  })
})

describe('StatisticsPanel integration — Reset clears counters but keeps complexity visible', () => {
  it('returns to Step 0 / N with all-zero counters, and the complexity section remains rendered', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    fireEvent.click(getNext())
    fireEvent.click(getNext())
    fireEvent.click(getNext())
    expect(counters(container)).not.toEqual({ comparisons: 0, swaps: 0, operations: 0 })

    fireEvent.click(getReset())

    expect(counters(container)).toEqual({ comparisons: 0, swaps: 0, operations: 0 })
    expect(stepText(container)).toBe('Step 0 / 11')
    expect(container.querySelector('.statistics-panel__complexity')).not.toBeNull()
    expect(container.querySelectorAll('.statistics-panel__complexity-row').length).toBeGreaterThan(0)
  })
})

describe('StatisticsPanel integration — Array <-> Bars preserves statistics exactly', () => {
  it('counters and step are unaffected by switching the visualization mode', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    fireEvent.click(getNext())
    fireEvent.click(getNext())
    const before = counters(container)
    const stepBefore = stepText(container)

    fireEvent.click(screen.getByRole('button', { name: 'Bars' }))
    expect(counters(container)).toEqual(before)
    expect(stepText(container)).toBe(stepBefore)

    fireEvent.click(screen.getByRole('button', { name: 'Array' }))
    expect(counters(container)).toEqual(before)
    expect(stepText(container)).toBe(stepBefore)
  })
})

describe('StatisticsPanel integration — Selection Sort and Insertion Sort also track correctly', () => {
  it('Selection Sort: two comparisons before its first swap', () => {
    const { container } = render(
      <VisualizationPlaceholder
        array={INPUT}
        algorithm={selectionSort}
        metadata={selectionSortMetadata}
      />,
    )

    fireEvent.click(getNext()) // compare(0, 1)
    fireEvent.click(getNext()) // compare(1, 2)
    expect(counters(container)).toEqual({ comparisons: 2, swaps: 0, operations: 2 })
  })

  it('Insertion Sort: one comparison then a shift/swap', () => {
    const { container } = render(
      <VisualizationPlaceholder
        array={INPUT}
        algorithm={insertionSort}
        metadata={insertionSortMetadata}
      />,
    )

    fireEvent.click(getNext()) // compare(0, 1)
    fireEvent.click(getNext()) // swap(0, 1)
    expect(counters(container)).toEqual({ comparisons: 1, swaps: 1, operations: 2 })
  })
})

describe('StatisticsPanel integration — autoplay keeps counters synchronized', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('counters advance on each autoplay tick', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    act(() => {
      vi.advanceTimersByTime(500) // compare(0, 1)
    })
    expect(counters(container)).toEqual({ comparisons: 1, swaps: 0, operations: 1 })

    act(() => {
      vi.advanceTimersByTime(500) // swap(0, 1)
    })
    expect(counters(container)).toEqual({ comparisons: 1, swaps: 1, operations: 2 })
  })

  it('Stop freezes the statistics exactly where the session stopped', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    act(() => {
      vi.advanceTimersByTime(500 * 3)
    })
    const frozen = counters(container)

    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    act(() => {
      vi.advanceTimersByTime(500 * 5)
    })

    expect(counters(container)).toEqual(frozen)
  })

  it('at autoplay completion, Step N / N and counters equal the total executed operations', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    act(() => {
      vi.advanceTimersByTime(500 * 20) // comfortably more than 11 operations
    })

    expect(stepText(container)).toBe('Step 11 / 11')
    const final = counters(container)
    expect(final.operations).toBe(11)
    expect(final.comparisons + final.swaps).toBe(final.operations)
    // Matches the real bubbleSort([8, 3, 5, 1]) trace exactly (see the
    // shared trace comment at the top of this file).
    expect(final).toEqual({ comparisons: 6, swaps: 5, operations: 11 })
  })
})

describe('StatisticsPanel integration — no metadata supplied', () => {
  it('renders no statistics panel at all when metadata is omitted (backward compatibility)', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    expect(container.querySelector('.statistics-panel')).toBeNull()
  })
})

describe('StatisticsPanel integration — no session yet', () => {
  it('renders no statistics panel before an array is confirmed', () => {
    const { container } = render(
      <VisualizationPlaceholder array={null} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    expect(container.querySelector('.statistics-panel')).toBeNull()
    expect(screen.getByText('Visualization area')).toBeTruthy()
  })
})
