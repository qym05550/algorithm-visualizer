import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { bubbleSort } from '../algorithms/bubbleSort'
import VisualizationPlaceholder from './VisualizationPlaceholder'

const INPUT = [8, 3, 5, 1]

// Same hand-traced sequence used for VisualizerController's own tests —
// cross-checked below against the real bubbleSort() output for INPUT.
const EXPECTED_OPERATIONS = [
  { type: 'compare', indices: [0, 1] },
  { type: 'swap', indices: [0, 1] },
  { type: 'compare', indices: [1, 2] },
  { type: 'swap', indices: [1, 2] },
  { type: 'compare', indices: [2, 3] },
  { type: 'swap', indices: [2, 3] },
  { type: 'compare', indices: [0, 1] },
  { type: 'compare', indices: [1, 2] },
  { type: 'swap', indices: [1, 2] },
  { type: 'compare', indices: [0, 1] },
  { type: 'swap', indices: [0, 1] },
]

const EXPECTED_ARRAYS = [
  ['8', '3', '5', '1'],
  ['3', '8', '5', '1'],
  ['3', '8', '5', '1'],
  ['3', '5', '8', '1'],
  ['3', '5', '8', '1'],
  ['3', '5', '1', '8'],
  ['3', '5', '1', '8'],
  ['3', '5', '1', '8'],
  ['3', '1', '5', '8'],
  ['3', '1', '5', '8'],
  ['1', '3', '5', '8'],
]

function renderedValues(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('.array-renderer__value')).map(
    (element) => element.textContent ?? '',
  )
}

function highlightedIndices(container: HTMLElement): number[] {
  return Array.from(container.querySelectorAll('.array-renderer__item'))
    .filter((item) => item.getAttribute('aria-label')?.includes('highlighted'))
    .map((item) => Number(item.querySelector('.array-renderer__index')?.textContent))
}

function getPrevious(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement
}

function getNext(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement
}

function getReset(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Reset' }) as HTMLButtonElement
}

function getStepText(container: HTMLElement): string | null {
  return container.querySelector('.visualizer-controls__step')?.textContent ?? null
}

describe('VisualizationPlaceholder — matches the real bubbleSort() output', () => {
  it('cross-checks the hand-traced operations against bubbleSort([8, 3, 5, 1])', () => {
    expect(bubbleSort(INPUT)).toEqual(EXPECTED_OPERATIONS)
  })
})

describe('VisualizationPlaceholder — before an array is confirmed', () => {
  it('shows the existing placeholder and no execution controls', () => {
    render(<VisualizationPlaceholder array={null} />)

    expect(screen.getByText('Visualization area')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Previous' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull()
  })
})

describe('VisualizationPlaceholder — after Done (array confirmed)', () => {
  it('shows the confirmed array and controls, with Previous disabled and Next enabled', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} />)

    expect(renderedValues(container)).toEqual(['8', '3', '5', '1'])
    expect(highlightedIndices(container)).toEqual([])
    expect(getPrevious().disabled).toBe(true)
    expect(getNext().disabled).toBe(false)
  })
})

describe('VisualizationPlaceholder — step indicator: initial state', () => {
  it('shows "Step 0 / N" before any operation has run', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} />)

    expect(getStepText(container)).toBe(`Step 0 / ${EXPECTED_OPERATIONS.length}`)
  })
})

describe('VisualizationPlaceholder — step indicator: after Next', () => {
  it('shows "Step 1 / N" after a single Next click', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} />)

    fireEvent.click(getNext())

    expect(getStepText(container)).toBe(`Step 1 / ${EXPECTED_OPERATIONS.length}`)
  })
})

describe('VisualizationPlaceholder — step indicator: at the final step', () => {
  it('shows "Step N / N" once every operation has executed', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} />)

    for (let i = 0; i < EXPECTED_OPERATIONS.length; i++) fireEvent.click(getNext())

    expect(getStepText(container)).toBe(
      `Step ${EXPECTED_OPERATIONS.length} / ${EXPECTED_OPERATIONS.length}`,
    )
  })
})

describe('VisualizationPlaceholder — step indicator: zero-operation input', () => {
  it('shows "Step 0 / 0" for a single-element array, with both buttons disabled', () => {
    const { container } = render(<VisualizationPlaceholder array={[42]} />)

    expect(getStepText(container)).toBe('Step 0 / 0')
    expect(getPrevious().disabled).toBe(true)
    expect(getNext().disabled).toBe(true)
  })
})

describe('VisualizationPlaceholder — clicking Next', () => {
  it('advances exactly one operation', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} />)

    fireEvent.click(getNext())

    expect(renderedValues(container)).toEqual(EXPECTED_ARRAYS[0])
    expect(highlightedIndices(container)).toEqual(EXPECTED_OPERATIONS[0].indices)
  })
})

describe('VisualizationPlaceholder — COMPARE step', () => {
  it('highlights the compared indices and leaves the array values unchanged', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} />)

    fireEvent.click(getNext()) // compare(0, 1)

    expect(highlightedIndices(container)).toEqual([0, 1])
    expect(renderedValues(container)).toEqual(['8', '3', '5', '1'])
  })
})

describe('VisualizationPlaceholder — SWAP step', () => {
  it('highlights the swapped indices and reflects the swap in the array', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} />)

    fireEvent.click(getNext()) // compare(0, 1)
    fireEvent.click(getNext()) // swap(0, 1)

    expect(highlightedIndices(container)).toEqual([0, 1])
    expect(renderedValues(container)).toEqual(['3', '8', '5', '1'])
  })
})

describe('VisualizationPlaceholder — clicking Previous', () => {
  it('returns exactly one operation backward with the correct array and highlight', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} />)

    fireEvent.click(getNext()) // compare(0, 1) -> step 1
    fireEvent.click(getNext()) // swap(0, 1)    -> step 2, [3, 8, 5, 1]

    fireEvent.click(getPrevious()) // back to step 1

    expect(renderedValues(container)).toEqual(['8', '3', '5', '1'])
    expect(highlightedIndices(container)).toEqual([0, 1])
    expect(getPrevious().disabled).toBe(false)
  })
})

describe('VisualizationPlaceholder — returning to step 0', () => {
  it('restores the original array, clears highlights, and disables Previous', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} />)

    fireEvent.click(getNext())
    fireEvent.click(getPrevious())

    expect(renderedValues(container)).toEqual(['8', '3', '5', '1'])
    expect(highlightedIndices(container)).toEqual([])
    expect(getPrevious().disabled).toBe(true)
  })
})

describe('VisualizationPlaceholder — clicking Reset', () => {
  it('restores the original array, clears highlights, disables Previous, and re-enables Next', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} />)

    fireEvent.click(getNext())
    fireEvent.click(getNext())
    fireEvent.click(getNext())

    fireEvent.click(getReset())

    expect(renderedValues(container)).toEqual(['8', '3', '5', '1'])
    expect(highlightedIndices(container)).toEqual([])
    expect(getPrevious().disabled).toBe(true)
    expect(getNext().disabled).toBe(false)
  })
})

describe('VisualizationPlaceholder — clicking Next at the final step', () => {
  it('leaves the UI unchanged and does not crash', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} />)

    for (let i = 0; i < EXPECTED_OPERATIONS.length; i++) fireEvent.click(getNext())

    const valuesBefore = renderedValues(container)
    const highlightsBefore = highlightedIndices(container)

    fireEvent.click(getNext())
    fireEvent.click(getNext())

    expect(renderedValues(container)).toEqual(valuesBefore)
    expect(highlightedIndices(container)).toEqual(highlightsBefore)
    expect(getNext().disabled).toBe(true)
  })
})

describe('VisualizationPlaceholder — clicking Previous at the first step', () => {
  it('leaves the UI unchanged and does not crash', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} />)

    const valuesBefore = renderedValues(container)

    fireEvent.click(getPrevious())
    fireEvent.click(getPrevious())

    expect(renderedValues(container)).toEqual(valuesBefore)
    expect(highlightedIndices(container)).toEqual([])
    expect(getPrevious().disabled).toBe(true)
  })
})

describe('VisualizationPlaceholder — large arrays', () => {
  it('keeps the existing ArrayRenderer wrapping behavior intact for 100 elements', () => {
    const input = Array.from({ length: 100 }, (_, index) => index)
    const { container } = render(<VisualizationPlaceholder array={input} />)

    expect(container.querySelectorAll('.array-renderer__item')).toHaveLength(100)
    expect(getPrevious().disabled).toBe(true)
    // A fully sorted 100-element array still has 99 * 100 / 2 comparisons.
    expect(getNext().disabled).toBe(false)
  })
})

describe('VisualizationPlaceholder — existing button behavior remains correct (MVP Polish Pass regression check)', () => {
  it('Previous/Next/Reset still enable, disable, and advance/reverse exactly as before the polish pass', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} />)

    // Initial boundary state.
    expect(getPrevious().disabled).toBe(true)
    expect(getNext().disabled).toBe(false)

    // Next still advances exactly one operation and updates the step text.
    fireEvent.click(getNext())
    expect(renderedValues(container)).toEqual(EXPECTED_ARRAYS[0])
    expect(getStepText(container)).toBe(`Step 1 / ${EXPECTED_OPERATIONS.length}`)
    expect(getPrevious().disabled).toBe(false)

    // Previous still reverses exactly one operation.
    fireEvent.click(getPrevious())
    expect(renderedValues(container)).toEqual(['8', '3', '5', '1'])
    expect(getStepText(container)).toBe(`Step 0 / ${EXPECTED_OPERATIONS.length}`)
    expect(getPrevious().disabled).toBe(true)

    // Reset still restores the original array and step 0 from mid-session.
    fireEvent.click(getNext())
    fireEvent.click(getNext())
    fireEvent.click(getReset())
    expect(renderedValues(container)).toEqual(['8', '3', '5', '1'])
    expect(getStepText(container)).toBe(`Step 0 / ${EXPECTED_OPERATIONS.length}`)
    expect(getPrevious().disabled).toBe(true)
    expect(getNext().disabled).toBe(false)
  })
})

describe('VisualizationPlaceholder — a complete Bubble Sort session', () => {
  it('reaches the sorted array via repeated Next, then walks all the way back via Previous', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} />)

    for (let i = 0; i < EXPECTED_OPERATIONS.length; i++) fireEvent.click(getNext())
    expect(renderedValues(container)).toEqual(['1', '3', '5', '8'])
    expect(getNext().disabled).toBe(true)

    for (let i = 0; i < EXPECTED_OPERATIONS.length; i++) fireEvent.click(getPrevious())
    expect(renderedValues(container)).toEqual(['8', '3', '5', '1'])
    expect(getPrevious().disabled).toBe(true)
  })
})
