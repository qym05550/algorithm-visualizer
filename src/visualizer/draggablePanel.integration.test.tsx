// Draggable Statistics/Code View Panels task: integration tests verifying
// a dragged panel position survives every interaction the task's own
// "Persistence" checklist calls out (Next/Previous/Reset/Play+Stop/
// Array<->Bars), and that dragging never disturbs the real Statistics
// counters or Code View highlighting — driven through the real
// VisualizationPlaceholder + VisualizerController + algorithm metadata,
// not through any mocks. Algorithm-confirmation persistence (a new
// session via the Done button) is covered separately in
// src/App.draggablePanel.test.tsx, since VisualizationPlaceholder alone
// has no Done button — App owns that.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { bubbleSort } from '../algorithms/bubbleSort'
import { bubbleSortMetadata } from '../algorithms/metadata/bubbleSortMetadata'
import VisualizationPlaceholder from './VisualizationPlaceholder'

const INPUT = [8, 3, 5, 1]

// See DraggablePanel.test.tsx's own file-level doc comment: this jsdom has
// no native PointerEvent constructor, so a MouseEvent typed as a pointer
// event is used instead — both DOM listener matching and React's event
// delegation match by event *type string*, and nothing here reads a
// PointerEvent-only field.
function firePointer(
  target: EventTarget,
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  opts: { clientX: number; clientY: number },
) {
  const event = new MouseEvent(type, {
    clientX: opts.clientX,
    clientY: opts.clientY,
    button: 0,
    bubbles: true,
    cancelable: true,
  })
  act(() => {
    target.dispatchEvent(event)
  })
}

interface Rect {
  left: number
  top: number
  width: number
  height: number
}

function stubRect(el: HTMLElement, rect: Rect) {
  el.getBoundingClientRect = () => ({
    left: rect.left,
    top: rect.top,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    width: rect.width,
    height: rect.height,
    x: rect.left,
    y: rect.top,
    toJSON() {
      return this
    },
  })
  for (const prop of ['offsetWidth', 'clientWidth'] as const) {
    Object.defineProperty(el, prop, { configurable: true, value: rect.width })
  }
  for (const prop of ['offsetHeight', 'clientHeight'] as const) {
    Object.defineProperty(el, prop, { configurable: true, value: rect.height })
  }
}

/** Drags the Statistics panel from its (stubbed) default corner to a new,
 *  distinct spot, then returns the resulting inline left/top so the
 *  caller can assert it survives whatever happens next. */
function dragStatisticsPanel(container: HTMLElement): { left: string; top: string } {
  const mainArea = container.querySelector('.main-area') as HTMLElement
  const stats = container.querySelector('.statistics-panel-overlay') as HTMLElement
  stubRect(mainArea, { left: 100, top: 50, width: 900, height: 700 })
  stubRect(stats, { left: 132, top: 82, width: 260, height: 200 })

  const handle = stats.querySelector('.draggable-panel__handle') as HTMLElement
  firePointer(handle, 'pointerdown', { clientX: 150, clientY: 100 })
  firePointer(window, 'pointermove', { clientX: 500, clientY: 400 })
  firePointer(window, 'pointerup', { clientX: 500, clientY: 400 })

  return { left: stats.style.left, top: stats.style.top }
}

function statsOverlayStyle(container: HTMLElement): { left: string; top: string } {
  const stats = container.querySelector('.statistics-panel-overlay') as HTMLElement
  return { left: stats.style.left, top: stats.style.top }
}

function stepText(container: HTMLElement): string | null {
  return container.querySelector('.statistics-panel__step')?.textContent ?? null
}

function counters(container: HTMLElement): { comparisons: number; swaps: number; operations: number } {
  const values = Array.from(container.querySelectorAll('.statistics-panel__counter dd')).map((el) =>
    Number(el.textContent),
  )
  return { comparisons: values[0], swaps: values[1], operations: values[2] }
}

describe('DraggablePanel integration — dragging does not disturb Statistics content', () => {
  it('the live counters keep updating correctly after Statistics has been dragged', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    const dragged = dragStatisticsPanel(container)
    expect(dragged.left).not.toBe('')

    fireEvent.click(screen.getByRole('button', { name: 'Next' })) // compare(0, 1)
    fireEvent.click(screen.getByRole('button', { name: 'Next' })) // swap(0, 1)

    expect(counters(container)).toEqual({ comparisons: 1, swaps: 1, operations: 2 })
    // Still exactly where it was dragged to — Next never touches panel
    // position, only execution state.
    expect(statsOverlayStyle(container)).toEqual(dragged)
  })
})

describe('DraggablePanel integration — position survives Next/Previous', () => {
  it('stays put across a Next followed by a Previous', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    const dragged = dragStatisticsPanel(container)

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(statsOverlayStyle(container)).toEqual(dragged)

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    expect(statsOverlayStyle(container)).toEqual(dragged)
  })
})

describe('DraggablePanel integration — position survives Reset', () => {
  it('stays put, and the session itself still correctly resets to step 0', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    const dragged = dragStatisticsPanel(container)

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))

    expect(stepText(container)).toBe('Step 0 / 11')
    expect(statsOverlayStyle(container)).toEqual(dragged)
  })
})

describe('DraggablePanel integration — position survives Play/Stop (autoplay)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stays put through a run of autoplay ticks and after Stop', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    const dragged = dragStatisticsPanel(container)

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    act(() => {
      vi.advanceTimersByTime(500 * 3)
    })
    expect(statsOverlayStyle(container)).toEqual(dragged)

    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    expect(statsOverlayStyle(container)).toEqual(dragged)
  })
})

describe('DraggablePanel integration — position survives Array <-> Bars switching', () => {
  it('stays put after switching to Bar View and back to Array View', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    const dragged = dragStatisticsPanel(container)

    fireEvent.click(screen.getByRole('button', { name: 'Bars' }))
    expect(statsOverlayStyle(container)).toEqual(dragged)
    expect(container.querySelector('.bar-renderer')).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Array' }))
    expect(statsOverlayStyle(container)).toEqual(dragged)
    expect(container.querySelector('.array-renderer')).not.toBeNull()
  })
})

describe('DraggablePanel integration — dragging does not disturb Code View highlighting', () => {
  it('the active pseudocode line keeps updating correctly after Code View has been dragged', () => {
    const { container } = render(
      <VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} metadata={bubbleSortMetadata} />,
    )

    const mainArea = container.querySelector('.main-area') as HTMLElement
    const code = container.querySelector('.code-view-overlay') as HTMLElement
    stubRect(mainArea, { left: 100, top: 50, width: 900, height: 700 })
    stubRect(code, { left: 608, top: 82, width: 260, height: 200 })

    const handle = code.querySelector('.draggable-panel__handle') as HTMLElement
    firePointer(handle, 'pointerdown', { clientX: 620, clientY: 100 })
    firePointer(window, 'pointermove', { clientX: 300, clientY: 400 })
    firePointer(window, 'pointerup', { clientX: 300, clientY: 400 })

    expect(code.style.left).not.toBe('')

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    const active = container.querySelector('.code-view__line--active .code-view__line-number')
    expect(active?.textContent).toBe(String(bubbleSortMetadata.getHighlightedLine({ type: 'compare', indices: [0, 1] })))
  })
})
