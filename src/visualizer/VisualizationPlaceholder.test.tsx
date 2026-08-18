import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { bubbleSort } from '../algorithms/bubbleSort'
import { selectionSort } from '../algorithms/selectionSort'
import { insertionSort } from '../algorithms/insertionSort'
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
    render(<VisualizationPlaceholder array={null} algorithm={bubbleSort} />)

    expect(screen.getByText('Visualization area')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Previous' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull()
  })
})

describe('VisualizationPlaceholder — after Done (array confirmed)', () => {
  it('shows the confirmed array and controls, with Previous disabled and Next enabled', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    expect(renderedValues(container)).toEqual(['8', '3', '5', '1'])
    expect(highlightedIndices(container)).toEqual([])
    expect(getPrevious().disabled).toBe(true)
    expect(getNext().disabled).toBe(false)
  })
})

describe('VisualizationPlaceholder — step indicator: initial state', () => {
  it('shows "Step 0 / N" before any operation has run', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    expect(getStepText(container)).toBe(`Step 0 / ${EXPECTED_OPERATIONS.length}`)
  })
})

describe('VisualizationPlaceholder — step indicator: after Next', () => {
  it('shows "Step 1 / N" after a single Next click', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getNext())

    expect(getStepText(container)).toBe(`Step 1 / ${EXPECTED_OPERATIONS.length}`)
  })
})

describe('VisualizationPlaceholder — step indicator: at the final step', () => {
  it('shows "Step N / N" once every operation has executed', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    for (let i = 0; i < EXPECTED_OPERATIONS.length; i++) fireEvent.click(getNext())

    expect(getStepText(container)).toBe(
      `Step ${EXPECTED_OPERATIONS.length} / ${EXPECTED_OPERATIONS.length}`,
    )
  })
})

describe('VisualizationPlaceholder — step indicator: zero-operation input', () => {
  it('shows "Step 0 / 0" for a single-element array, with both buttons disabled', () => {
    const { container } = render(<VisualizationPlaceholder array={[42]} algorithm={bubbleSort} />)

    expect(getStepText(container)).toBe('Step 0 / 0')
    expect(getPrevious().disabled).toBe(true)
    expect(getNext().disabled).toBe(true)
  })
})

describe('VisualizationPlaceholder — clicking Next', () => {
  it('advances exactly one operation', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getNext())

    expect(renderedValues(container)).toEqual(EXPECTED_ARRAYS[0])
    expect(highlightedIndices(container)).toEqual(EXPECTED_OPERATIONS[0].indices)
  })
})

describe('VisualizationPlaceholder — COMPARE step', () => {
  it('highlights the compared indices and leaves the array values unchanged', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getNext()) // compare(0, 1)

    expect(highlightedIndices(container)).toEqual([0, 1])
    expect(renderedValues(container)).toEqual(['8', '3', '5', '1'])
  })
})

describe('VisualizationPlaceholder — SWAP step', () => {
  it('highlights the swapped indices and reflects the swap in the array', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getNext()) // compare(0, 1)
    fireEvent.click(getNext()) // swap(0, 1)

    expect(highlightedIndices(container)).toEqual([0, 1])
    expect(renderedValues(container)).toEqual(['3', '8', '5', '1'])
  })
})

describe('VisualizationPlaceholder — clicking Previous', () => {
  it('returns exactly one operation backward with the correct array and highlight', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

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
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getNext())
    fireEvent.click(getPrevious())

    expect(renderedValues(container)).toEqual(['8', '3', '5', '1'])
    expect(highlightedIndices(container)).toEqual([])
    expect(getPrevious().disabled).toBe(true)
  })
})

describe('VisualizationPlaceholder — clicking Reset', () => {
  it('restores the original array, clears highlights, disables Previous, and re-enables Next', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

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
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

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
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

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
    const { container } = render(<VisualizationPlaceholder array={input} algorithm={bubbleSort} />)

    expect(container.querySelectorAll('.array-renderer__item')).toHaveLength(100)
    expect(getPrevious().disabled).toBe(true)
    // A fully sorted 100-element array still has 99 * 100 / 2 comparisons.
    expect(getNext().disabled).toBe(false)
  })
})

describe('VisualizationPlaceholder — existing button behavior remains correct (MVP Polish Pass regression check)', () => {
  it('Previous/Next/Reset still enable, disable, and advance/reverse exactly as before the polish pass', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

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
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    for (let i = 0; i < EXPECTED_OPERATIONS.length; i++) fireEvent.click(getNext())
    expect(renderedValues(container)).toEqual(['1', '3', '5', '8'])
    expect(getNext().disabled).toBe(true)

    for (let i = 0; i < EXPECTED_OPERATIONS.length; i++) fireEvent.click(getPrevious())
    expect(renderedValues(container)).toEqual(['8', '3', '5', '1'])
    expect(getPrevious().disabled).toBe(true)
  })
})

describe('VisualizationPlaceholder — algorithm prop', () => {
  it('uses the supplied algorithm to build the session, producing a different step total than Bubble Sort for the same array', () => {
    const { container: bubbleContainer } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />,
    )
    const { container: selectionContainer } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={selectionSort} />,
    )

    const bubbleSteps = getStepText(bubbleContainer)
    const selectionSteps = getStepText(selectionContainer)

    expect(bubbleSteps).toBe(`Step 0 / ${bubbleSort(INPUT).length}`)
    expect(selectionSteps).toBe(`Step 0 / ${selectionSort(INPUT).length}`)
    // For this specific input the two algorithms genuinely produce a
    // different number of operations — proof the algorithm prop actually
    // drives the session, not just cosmetic text.
    expect(bubbleSteps).not.toBe(selectionSteps)
  })

  it('a running session is unaffected by the algorithm prop changing alone (only a new array reference starts a new session)', () => {
    const { container, rerender } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />,
    )

    fireEvent.click(getNext()) // compare(0, 1), Bubble Sort step 1
    const valuesBefore = renderedValues(container)
    const stepBefore = getStepText(container)

    // Re-rendering with the SAME array reference but a different algorithm
    // must not rebuild the session — this is the component-level version
    // of "changing the dropdown must not affect an active visualization."
    rerender(<VisualizationPlaceholder array={INPUT} algorithm={selectionSort} />)

    expect(renderedValues(container)).toEqual(valuesBefore)
    expect(getStepText(container)).toBe(stepBefore)
    expect(getStepText(container)).toBe(`Step 1 / ${bubbleSort(INPUT).length}`)
  })

  it('a genuinely new array reference starts a new session with the newly supplied algorithm, reset to step 0', () => {
    const { container, rerender } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />,
    )

    fireEvent.click(getNext())
    fireEvent.click(getNext())

    const newArray = [8, 3, 5, 1] // same values, but a genuinely new reference
    rerender(<VisualizationPlaceholder array={newArray} algorithm={selectionSort} />)

    expect(getStepText(container)).toBe(`Step 0 / ${selectionSort(newArray).length}`)
    expect(renderedValues(container)).toEqual(['8', '3', '5', '1'])
    expect(getPrevious().disabled).toBe(true)
  })
})

describe('VisualizationPlaceholder — Autoplay (Play/Stop) + Speed Control', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  function getPlay(): HTMLButtonElement {
    return screen.getByRole('button', { name: 'Play' }) as HTMLButtonElement
  }

  function getSpeedSelect(): HTMLSelectElement {
    return screen.getByLabelText('Speed') as HTMLSelectElement
  }

  it('1. Play starts autoplay: the step advances once the first interval elapses', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getPlay())
    act(() => {
      vi.advanceTimersByTime(500) // Normal speed, the default
    })

    expect(getStepText(container)).toBe(`Step 1 / ${EXPECTED_OPERATIONS.length}`)
  })

  it('2. Play advances multiple steps automatically over multiple intervals', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getPlay())
    act(() => {
      vi.advanceTimersByTime(500 * 3)
    })

    expect(getStepText(container)).toBe(`Step 3 / ${EXPECTED_OPERATIONS.length}`)
  })

  it('3. Stop pauses immediately without resetting the current step', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getPlay())
    act(() => {
      vi.advanceTimersByTime(500 * 2)
    })
    expect(getStepText(container)).toBe(`Step 2 / ${EXPECTED_OPERATIONS.length}`)

    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    act(() => {
      vi.advanceTimersByTime(500 * 5)
    })

    // No further advancement after Stop, and the step is exactly where it
    // was — not reset.
    expect(getStepText(container)).toBe(`Step 2 / ${EXPECTED_OPERATIONS.length}`)
    // The button reverted from Stop back to Play, ready to resume.
    expect(getPlay()).toBeTruthy()
  })

  it('4. Play at the final step does nothing: it is disabled, and no timer is ever scheduled', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    for (let i = 0; i < EXPECTED_OPERATIONS.length; i++) fireEvent.click(getNext())
    expect(getStepText(container)).toBe(
      `Step ${EXPECTED_OPERATIONS.length} / ${EXPECTED_OPERATIONS.length}`,
    )

    expect(getPlay().disabled).toBe(true)
    // Disabled buttons don't dispatch click events at all (in real browsers
    // and in jsdom), so this click is a no-op the same way a user's click
    // would be.
    fireEvent.click(getPlay())
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(getStepText(container)).toBe(
      `Step ${EXPECTED_OPERATIONS.length} / ${EXPECTED_OPERATIONS.length}`,
    )
    expect(vi.getTimerCount()).toBe(0)
  })

  it('5. Autoplay stops itself automatically once the final step is reached', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getPlay())
    act(() => {
      // Comfortably more ticks than there are operations, so autoplay must
      // have stopped itself well before this finishes elapsing.
      vi.advanceTimersByTime(500 * (EXPECTED_OPERATIONS.length + 5))
    })

    expect(getStepText(container)).toBe(
      `Step ${EXPECTED_OPERATIONS.length} / ${EXPECTED_OPERATIONS.length}`,
    )
    // isPlaying flipped back to false on its own: the button reads Play
    // again (disabled, since canGoNext is now false), not Stop.
    expect(getPlay().disabled).toBe(true)
    expect(screen.queryByRole('button', { name: 'Stop' })).toBeNull()

    // The very last operation this session executes is itself a SWAP, so
    // it schedules one final (self-clearing) animation frame for the
    // Motion Polish slide — a single large advanceTimersByTime call can
    // land partway through that one short-lived frame, same as a real
    // browser mid-paint. One more small, explicit advance lets it settle
    // before asserting no timer of any kind is left running.
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(vi.getTimerCount()).toBe(0)
  })

  it('6. Reset stops autoplay and returns to step 0, race-safe against an already-scheduled tick', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getPlay())
    act(() => {
      vi.advanceTimersByTime(500 * 2)
    })
    expect(getStepText(container)).toBe(`Step 2 / ${EXPECTED_OPERATIONS.length}`)

    fireEvent.click(getReset())
    expect(getStepText(container)).toBe(`Step 0 / ${EXPECTED_OPERATIONS.length}`)

    // A tick was already in flight (partway into its 500ms interval) at the
    // moment Reset was clicked. Advancing well past when it would have
    // fired must not move the freshly-reset visualization off step 0 — the
    // old timer must have been torn down synchronously with Reset.
    act(() => {
      vi.advanceTimersByTime(500 * 5)
    })

    expect(getStepText(container)).toBe(`Step 0 / ${EXPECTED_OPERATIONS.length}`)
    expect(screen.queryByRole('button', { name: 'Stop' })).toBeNull()
  })

  it('7. Starting a new session stops any autoplay still running from the previous one', () => {
    const { container, rerender } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />,
    )

    fireEvent.click(getPlay())
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(getStepText(container)).toBe(`Step 1 / ${EXPECTED_OPERATIONS.length}`)

    const newArray = [2, 1]
    rerender(<VisualizationPlaceholder array={newArray} algorithm={selectionSort} />)

    expect(getStepText(container)).toBe(`Step 0 / ${selectionSort(newArray).length}`)
    expect(screen.queryByRole('button', { name: 'Stop' })).toBeNull()

    // The old timer must not still be alive and ticking against the new
    // session.
    act(() => {
      vi.advanceTimersByTime(500 * 5)
    })
    expect(getStepText(container)).toBe(`Step 0 / ${selectionSort(newArray).length}`)
  })

  it('8. Changing speed while playing changes subsequent tick timing without requiring a reset', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getPlay())
    fireEvent.change(getSpeedSelect(), { target: { value: 'Fast' } })

    // Fast = 200ms. 200ms alone would not have been enough to tick at the
    // old Normal speed (500ms), so a tick here proves the new speed took
    // effect on the very next tick, with no reset in between.
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(getStepText(container)).toBe(`Step 1 / ${EXPECTED_OPERATIONS.length}`)

    act(() => {
      vi.advanceTimersByTime(200 * 2)
    })
    expect(getStepText(container)).toBe(`Step 3 / ${EXPECTED_OPERATIONS.length}`)
  })

  it('9. No duplicate timers accumulate as autoplay ticks and re-renders repeatedly', () => {
    render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getPlay())
    expect(vi.getTimerCount()).toBe(1)

    act(() => {
      vi.advanceTimersByTime(500 * 3)
    })

    // Each tick re-renders the component (via the tick state refresh()
    // bumps), but isPlaying/speed/array never changed across those
    // re-renders, so the autoplay effect must not have torn down and
    // recreated the interval each time — exactly one interval should still
    // be running.
    expect(vi.getTimerCount()).toBe(1)
  })

  it('10. Unmounting the component cleans up the autoplay timer', () => {
    const { unmount } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getPlay())
    expect(vi.getTimerCount()).toBe(1)

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })

  it('11. Existing manual Previous/Next behavior is unaffected by the autoplay machinery', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getNext())
    fireEvent.click(getNext())
    expect(getStepText(container)).toBe(`Step 2 / ${EXPECTED_OPERATIONS.length}`)

    fireEvent.click(getPrevious())
    expect(getStepText(container)).toBe(`Step 1 / ${EXPECTED_OPERATIONS.length}`)

    // Manual stepping alone never schedules an autoplay interval. It does
    // still schedule the Motion Polish SWAP animation's own short-lived,
    // self-clearing animation frame (compare(0,1) then swap(0,1) were
    // just clicked through above) — let that settle first, the same way
    // it would in a real browser within one frame, before confirming
    // nothing is left running afterward.
    act(() => {
      vi.advanceTimersByTime(50)
    })
    expect(vi.getTimerCount()).toBe(0)
  })

  it('12. Bubble Sort, Selection Sort, and Insertion Sort sessions all still play to completion correctly', () => {
    const input = [5, 3, 8, 1, 4]
    const bubbleTotal = bubbleSort(input).length
    const selectionTotal = selectionSort(input).length
    const insertionTotal = insertionSort(input).length
    // All three must genuinely differ on this input for this to prove
    // anything about which algorithm actually ran under autoplay.
    expect(new Set([bubbleTotal, selectionTotal, insertionTotal]).size).toBe(3)

    const cases = [
      [bubbleSort, bubbleTotal] as const,
      [selectionSort, selectionTotal] as const,
      [insertionSort, insertionTotal] as const,
    ]

    for (const [algorithm, total] of cases) {
      const { container, unmount } = render(
        <VisualizationPlaceholder array={input} algorithm={algorithm} />,
      )
      expect(getStepText(container)).toBe(`Step 0 / ${total}`)

      fireEvent.click(getPlay())
      act(() => {
        vi.advanceTimersByTime(500 * (total + 2))
      })
      expect(getStepText(container)).toBe(`Step ${total} / ${total}`)

      unmount()
    }
  })

  it('13. Autoplay advances the step identically while Bar View is active, not just Array View', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(screen.getByRole('button', { name: 'Bars' }))
    expect(container.querySelector('.bar-renderer')).not.toBeNull()

    fireEvent.click(getPlay())
    act(() => {
      vi.advanceTimersByTime(500 * 3)
    })

    // Bar View's own renderer is still mounted (the view never silently
    // reverted to Array View), and the step advanced exactly as it does
    // under Array View (test 2 above uses the same input/timing).
    expect(container.querySelector('.bar-renderer')).not.toBeNull()
    expect(getStepText(container)).toBe(`Step 3 / ${EXPECTED_OPERATIONS.length}`)
  })

  it('14. Switching Array <-> Bars mid-autoplay neither resets the step nor stops playback', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getPlay())
    act(() => {
      vi.advanceTimersByTime(500 * 2)
    })
    expect(getStepText(container)).toBe(`Step 2 / ${EXPECTED_OPERATIONS.length}`)

    // Switching views mid-flight must not stop autoplay (Stop must still
    // be showing, not Play) or touch the step it's already reached.
    fireEvent.click(screen.getByRole('button', { name: 'Bars' }))
    expect(getStepText(container)).toBe(`Step 2 / ${EXPECTED_OPERATIONS.length}`)
    expect(screen.getByRole('button', { name: 'Stop' })).toBeTruthy()

    // Autoplay keeps ticking uninterrupted after the switch, still against
    // the same single timer (no reset, no re-scheduling from zero).
    act(() => {
      vi.advanceTimersByTime(500 * 2)
    })
    expect(getStepText(container)).toBe(`Step 4 / ${EXPECTED_OPERATIONS.length}`)

    fireEvent.click(screen.getByRole('button', { name: 'Array' }))
    expect(getStepText(container)).toBe(`Step 4 / ${EXPECTED_OPERATIONS.length}`)
    expect(screen.getByRole('button', { name: 'Stop' })).toBeTruthy()
  })
})
