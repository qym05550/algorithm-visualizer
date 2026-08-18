import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import App from './App'
import { bubbleSort } from './algorithms/bubbleSort'
import { selectionSort } from './algorithms/selectionSort'
import { insertionSort } from './algorithms/insertionSort'
import { mergeSort } from './algorithms/mergeSort'
import { quickSort } from './algorithms/quickSort'

describe('App', () => {
  it('renders the app shell', () => {
    render(<App />)
    expect(
      screen.getByText('Algorithm Visualizer + Playground'),
    ).toBeTruthy()
  })
})

describe('App — Version Badge appears in the actual rendered application', () => {
  it('renders the version badge showing the canonical package.json version', () => {
    const packageJson = JSON.parse(
      readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8'),
    )
    render(<App />)
    expect(screen.getByText(`v${packageJson.version}`)).toBeTruthy()
  })
})

describe('App — Done still works end-to-end (MVP Polish Pass regression check)', () => {
  it('confirming an array via Done wires ArrayInput through to the Visualizer, including the step indicator', () => {
    render(<App />)

    const textarea = screen.getByLabelText('Array') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: '8, 3, 5, 1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))

    const values = Array.from(document.querySelectorAll('.array-renderer__value')).map(
      (element) => element.textContent,
    )
    expect(values).toEqual(['8', '3', '5', '1'])
    expect(document.querySelector('.visualizer-controls__step')?.textContent).toBe(
      'Step 0 / 11',
    )

    const next = screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement
    expect(next.disabled).toBe(false)

    fireEvent.click(next)
    expect(document.querySelector('.visualizer-controls__step')?.textContent).toBe(
      'Step 1 / 11',
    )
  })
})

function stepText(): string | null {
  return document.querySelector('.visualizer-controls__step')?.textContent ?? null
}

function renderedArrayValues(): (string | null)[] {
  return Array.from(document.querySelectorAll('.array-renderer__value')).map(
    (element) => element.textContent,
  )
}

function getAlgorithmSelect(): HTMLSelectElement {
  return screen.getByLabelText('Algorithm') as HTMLSelectElement
}

function confirmArray(value: string) {
  const textarea = screen.getByLabelText('Array') as HTMLTextAreaElement
  fireEvent.change(textarea, { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: 'Done' }))
}

describe('App — Algorithm Selector: available options and default', () => {
  it('lists exactly Bubble Sort, Selection Sort, Insertion Sort, Merge Sort, and Quick Sort', () => {
    render(<App />)
    const labels = Array.from(getAlgorithmSelect().options).map((option) => option.textContent)
    expect(labels).toEqual(['Bubble Sort', 'Selection Sort', 'Insertion Sort', 'Merge Sort', 'Quick Sort'])
  })

  it('defaults to Bubble Sort, and a fresh Done confirms a Bubble Sort session without touching the selector', () => {
    render(<App />)

    expect(getAlgorithmSelect().value).toBe('Bubble Sort')
    confirmArray('8, 3, 5, 1')

    expect(stepText()).toBe('Step 0 / 11') // bubbleSort([8, 3, 5, 1]) has 11 operations
  })
})

describe('App — Algorithm Selector: selecting Selection Sort', () => {
  it('selecting Selection Sort and pressing Done creates a Selection Sort session with its own (different) step total', () => {
    render(<App />)

    fireEvent.change(getAlgorithmSelect(), { target: { value: 'Selection Sort' } })
    confirmArray('8, 3, 5, 1')

    // selectionSort([8, 3, 5, 1]) has exactly 7 operations, vs Bubble
    // Sort's 11 for the same input (see the default-Bubble-Sort test
    // above) — concrete proof the selector swaps which algorithm actually
    // runs, not merely its displayed label.
    expect(stepText()).toBe('Step 0 / 7')
    expect(renderedArrayValues()).toEqual(['8', '3', '5', '1'])
  })
})

describe('App — Algorithm Selector: selecting Insertion Sort', () => {
  it('selecting Insertion Sort and pressing Done creates an Insertion Sort session with its own step total, distinct from both other algorithms', () => {
    const input = [5, 3, 8, 1, 4]
    const bubbleTotal = bubbleSort(input).length
    const selectionTotal = selectionSort(input).length
    const insertionTotal = insertionSort(input).length
    // All three must genuinely differ on this input for the assertion
    // below to prove anything about which algorithm actually ran.
    expect(new Set([bubbleTotal, selectionTotal, insertionTotal]).size).toBe(3)

    render(<App />)

    fireEvent.change(getAlgorithmSelect(), { target: { value: 'Insertion Sort' } })
    confirmArray('5, 3, 8, 1, 4')

    expect(stepText()).toBe(`Step 0 / ${insertionTotal}`)
    expect(renderedArrayValues()).toEqual(['5', '3', '8', '1', '4'])
  })
})

describe('App — Algorithm Selector: selecting Merge Sort', () => {
  it('selecting Merge Sort and pressing Done creates a Merge Sort session with its own step total, distinct from the other three', () => {
    const input = [5, 3, 8, 1, 4]
    const bubbleTotal = bubbleSort(input).length
    const selectionTotal = selectionSort(input).length
    const insertionTotal = insertionSort(input).length
    const mergeTotal = mergeSort(input).length
    // All four must genuinely differ on this input for the assertion below
    // to prove anything about which algorithm actually ran.
    expect(new Set([bubbleTotal, selectionTotal, insertionTotal, mergeTotal]).size).toBe(4)

    render(<App />)

    fireEvent.change(getAlgorithmSelect(), { target: { value: 'Merge Sort' } })
    confirmArray('5, 3, 8, 1, 4')

    expect(stepText()).toBe(`Step 0 / ${mergeTotal}`)
    expect(renderedArrayValues()).toEqual(['5', '3', '8', '1', '4'])
  })

  it('Next/Previous/Reset all work for a Merge Sort session and eventually reach the sorted array', () => {
    render(<App />)

    fireEvent.change(getAlgorithmSelect(), { target: { value: 'Merge Sort' } })
    confirmArray('5, 3, 8, 1, 2')

    const total = mergeSort([5, 3, 8, 1, 2]).length
    for (let i = 0; i < total; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    }
    expect(stepText()).toBe(`Step ${total} / ${total}`)
    expect(renderedArrayValues()).toEqual(['1', '2', '3', '5', '8'])

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    expect(stepText()).toBe(`Step ${total - 1} / ${total}`)

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(stepText()).toBe(`Step 0 / ${total}`)
    expect(renderedArrayValues()).toEqual(['5', '3', '8', '1', '2'])
  })
})

describe('App — Algorithm Selector: selecting Quick Sort', () => {
  it('selecting Quick Sort and pressing Done creates a Quick Sort session with its own step total, distinct from the other four', () => {
    const input = [5, 3, 8, 1, 4]
    const bubbleTotal = bubbleSort(input).length
    const selectionTotal = selectionSort(input).length
    const insertionTotal = insertionSort(input).length
    const mergeTotal = mergeSort(input).length
    const quickTotal = quickSort(input).length
    // All five must genuinely differ on this input for the assertion below
    // to prove anything about which algorithm actually ran.
    expect(new Set([bubbleTotal, selectionTotal, insertionTotal, mergeTotal, quickTotal]).size).toBe(5)

    render(<App />)

    fireEvent.change(getAlgorithmSelect(), { target: { value: 'Quick Sort' } })
    confirmArray('5, 3, 8, 1, 4')

    expect(stepText()).toBe(`Step 0 / ${quickTotal}`)
    expect(renderedArrayValues()).toEqual(['5', '3', '8', '1', '4'])
  })

  it('Next/Previous/Reset all work for a Quick Sort session and eventually reach the sorted array', () => {
    render(<App />)

    fireEvent.change(getAlgorithmSelect(), { target: { value: 'Quick Sort' } })
    confirmArray('5, 3, 8, 1, 4')

    const total = quickSort([5, 3, 8, 1, 4]).length
    for (let i = 0; i < total; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    }
    expect(stepText()).toBe(`Step ${total} / ${total}`)
    expect(renderedArrayValues()).toEqual(['1', '3', '4', '5', '8'])

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    expect(stepText()).toBe(`Step ${total - 1} / ${total}`)

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(stepText()).toBe(`Step 0 / ${total}`)
    expect(renderedArrayValues()).toEqual(['5', '3', '8', '1', '4'])
  })

  it('switching from Merge Sort to Quick Sort in the dropdown, then pressing Done, starts a genuine Quick Sort session', () => {
    render(<App />)

    // Start on Merge Sort first, to prove switching *from* another
    // non-default algorithm (not just from the Bubble Sort default) works.
    fireEvent.change(getAlgorithmSelect(), { target: { value: 'Merge Sort' } })
    confirmArray('5, 3, 8, 1, 4')
    const mergeTotal = mergeSort([5, 3, 8, 1, 4]).length
    expect(stepText()).toBe(`Step 0 / ${mergeTotal}`)

    fireEvent.change(getAlgorithmSelect(), { target: { value: 'Quick Sort' } })
    confirmArray('5, 3, 8, 1, 4')
    const quickTotal = quickSort([5, 3, 8, 1, 4]).length

    expect(stepText()).toBe(`Step 0 / ${quickTotal}`)
    expect(quickTotal).not.toBe(mergeTotal)
    expect(renderedArrayValues()).toEqual(['5', '3', '8', '1', '4'])
  })
})

describe('App — Quick Sort: Play/Stop/Speed, Array/Bars, Statistics, and Code View all work end to end', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('autoplay advances a Quick Sort session, Stop halts it, Speed changes the rate, view switching preserves state, and Statistics/Code View reflect the real operation stream', async () => {
    const { quickSortMetadata } = await import('./algorithms/metadata/quickSortMetadata')

    render(<App />)
    fireEvent.change(screen.getByLabelText('Algorithm') as HTMLSelectElement, {
      target: { value: 'Quick Sort' },
    })
    fireEvent.change(screen.getByLabelText('Array') as HTMLTextAreaElement, {
      target: { value: '5, 3, 8, 1, 4' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))

    const total = quickSort([5, 3, 8, 1, 4]).length
    expect(stepText()).toBe(`Step 0 / ${total}`)

    // Code View shows Quick Sort's own pseudocode, not some other
    // algorithm's — proof the selector genuinely wired Quick Sort in.
    const codeLines = Array.from(document.querySelectorAll('.code-view__line-text')).map(
      (el) => el.textContent ?? '',
    )
    expect(codeLines).toEqual([...quickSortMetadata.code])

    // Play (autoplay) advances the step counter.
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    act(() => {
      vi.advanceTimersByTime(500 * 2)
    })
    const stepDuringPlay = stepText()
    expect(stepDuringPlay).not.toBe(`Step 0 / ${total}`)

    // Statistics counters reflect the real operations executed so far —
    // never zero once at least one COMPARE/SWAP has actually run.
    const counterValues = () =>
      Array.from(document.querySelectorAll('.statistics-panel__counter dd')).map((el) =>
        Number(el.textContent),
      )
    const [comparisons, , operations] = counterValues()
    expect(operations).toBeGreaterThan(0)
    expect(comparisons).toBeGreaterThan(0)

    // Code View is highlighting a real Quick Sort line (COMPARE or SWAP),
    // not stuck on "nothing highlighted".
    const activeLine = document.querySelector('.code-view__line--active .code-view__line-text')
      ?.textContent
    expect([
      quickSortMetadata.code[9], // COMPARE_LINE (1-based line 10)
      quickSortMetadata.code[12], // SWAP_LINE (1-based line 13)
    ]).toContain(activeLine)

    // Speed changes the autoplay rate: switching to Fast and advancing a
    // Fast-sized interval moves the step counter further than the same
    // wall-clock time did at Normal speed above.
    fireEvent.change(screen.getByLabelText('Speed', { exact: true }), {
      target: { value: 'Fast' },
    })
    act(() => {
      vi.advanceTimersByTime(200 * 3)
    })
    const stepAfterFast = stepText()
    expect(stepAfterFast).not.toBe(stepDuringPlay)

    // Stop halts autoplay — no further advancement once time passes.
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    const stepAfterStop = stepText()
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(stepText()).toBe(stepAfterStop)

    // Array <-> Bars view switching preserves the exact same session state.
    fireEvent.click(screen.getByRole('button', { name: 'Bars' }))
    expect(stepText()).toBe(stepAfterStop)
    const barCount = document.querySelectorAll('.bar-renderer__item').length
    expect(barCount).toBe(5)

    fireEvent.click(screen.getByRole('button', { name: 'Array' }))
    expect(stepText()).toBe(stepAfterStop)
    expect(document.querySelectorAll('.array-renderer__value')).toHaveLength(5)
  })
})

describe('App — Algorithm Selector: an active session is isolated from later dropdown changes', () => {
  it('changing the dropdown while Bubble Sort is running does not alter the current visualization', () => {
    render(<App />)

    confirmArray('8, 3, 5, 1')
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    const stepBefore = stepText()
    const valuesBefore = renderedArrayValues()
    expect(stepBefore).toBe('Step 1 / 11')

    fireEvent.change(getAlgorithmSelect(), { target: { value: 'Selection Sort' } })

    expect(stepText()).toBe(stepBefore)
    expect(renderedArrayValues()).toEqual(valuesBefore)
  })

  it('changing the dropdown to Merge Sort while Bubble Sort is running does not alter the current visualization', () => {
    render(<App />)

    confirmArray('8, 3, 5, 1')
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    const stepBefore = stepText()
    const valuesBefore = renderedArrayValues()
    expect(stepBefore).toBe('Step 1 / 11')

    fireEvent.change(getAlgorithmSelect(), { target: { value: 'Merge Sort' } })

    expect(stepText()).toBe(stepBefore)
    expect(renderedArrayValues()).toEqual(valuesBefore)

    // Only takes effect after Done is pressed again.
    confirmArray('8, 3, 5, 1')
    const mergeTotal = mergeSort([8, 3, 5, 1]).length
    expect(stepText()).toBe(`Step 0 / ${mergeTotal}`)
  })

  it('changing the dropdown to Quick Sort while Bubble Sort is running does not alter the current visualization', () => {
    render(<App />)

    confirmArray('8, 3, 5, 1')
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    const stepBefore = stepText()
    const valuesBefore = renderedArrayValues()
    expect(stepBefore).toBe('Step 1 / 11')

    fireEvent.change(getAlgorithmSelect(), { target: { value: 'Quick Sort' } })

    expect(stepText()).toBe(stepBefore)
    expect(renderedArrayValues()).toEqual(valuesBefore)

    // Only takes effect after Done is pressed again.
    confirmArray('8, 3, 5, 1')
    const quickTotal = quickSort([8, 3, 5, 1]).length
    expect(stepText()).toBe(`Step 0 / ${quickTotal}`)
  })

  it('pressing Done again after changing the selection discards the old session and starts a new one with the newly selected algorithm, reset to step 0', () => {
    render(<App />)

    confirmArray('8, 3, 5, 1')
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(stepText()).toBe('Step 2 / 11')

    fireEvent.change(getAlgorithmSelect(), { target: { value: 'Selection Sort' } })
    confirmArray('8, 3, 5, 1')

    expect(stepText()).toBe('Step 0 / 7')
    expect(renderedArrayValues()).toEqual(['8', '3', '5', '1'])
    const previous = screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement
    expect(previous.disabled).toBe(true)
  })

  it('reproduces the full documented scenario: Bubble Sort runs, dropdown changes mid-session, Done starts a fresh Selection Sort session', () => {
    const input = [5, 3, 8, 1]
    const bubbleTotal = bubbleSort(input).length
    const selectionTotal = selectionSort(input).length
    // The two algorithms must actually differ on this input for the
    // scenario to prove anything.
    expect(bubbleTotal).not.toBe(selectionTotal)

    render(<App />)

    // 1-3: Bubble Sort selected (default), array entered, Done pressed.
    expect(getAlgorithmSelect().value).toBe('Bubble Sort')
    confirmArray('5, 3, 8, 1')

    // 4: Bubble Sort visualization starts.
    expect(stepText()).toBe(`Step 0 / ${bubbleTotal}`)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(stepText()).toBe(`Step 1 / ${bubbleTotal}`)

    // 5: change the dropdown to Selection Sort while it's running.
    fireEvent.change(getAlgorithmSelect(), { target: { value: 'Selection Sort' } })

    // 6: the current Bubble Sort visualization remains completely unchanged.
    expect(stepText()).toBe(`Step 1 / ${bubbleTotal}`)

    // 7-8: press Done again — a NEW session starts using Selection Sort.
    confirmArray('5, 3, 8, 1')

    // 9: step counter resets to 0 / totalSteps, using Selection Sort's
    // total, not Bubble Sort's.
    expect(stepText()).toBe(`Step 0 / ${selectionTotal}`)
  })
})

describe('App — existing input validation still works', () => {
  it('rejects empty input with a visible error and no visualization', () => {
    render(<App />)

    confirmArray('')

    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
    expect(screen.getByText('Visualization area')).toBeTruthy()
  })
})

describe('App — existing Next/Previous/Reset behavior is unchanged', () => {
  it('Next, Previous, and Reset still work exactly as before through the wrapped Done handler', () => {
    render(<App />)
    confirmArray('8, 3, 5, 1')

    const next = screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement
    const previous = screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement
    const reset = screen.getByRole('button', { name: 'Reset' }) as HTMLButtonElement

    expect(previous.disabled).toBe(true)
    fireEvent.click(next)
    fireEvent.click(next)
    expect(stepText()).toBe('Step 2 / 11')
    expect(previous.disabled).toBe(false)

    fireEvent.click(previous)
    expect(stepText()).toBe('Step 1 / 11')

    fireEvent.click(reset)
    expect(stepText()).toBe('Step 0 / 11')
    expect(previous.disabled).toBe(true)
    expect(renderedArrayValues()).toEqual(['8', '3', '5', '1'])
  })
})
