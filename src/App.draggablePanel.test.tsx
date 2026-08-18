// Draggable Statistics/Code View Panels task: verifies, through the real
// App component, that a dragged panel position is genuine UI preference
// state, independent of the visualization session — it must survive a new
// array confirmation and an algorithm change followed by Done (task
// requirement 9: "Panel positions should not reset just because the
// algorithm changes, the array changes, Reset is pressed, or autoplay
// starts/stops"). Mirrors the existing App.codeView.test.tsx / App.test.tsx
// pattern of driving everything through the real Done/AlgorithmSelector
// flow rather than mocking.
import { describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import App from './App'
import { bubbleSortMetadata } from './algorithms/metadata/bubbleSortMetadata'
import { selectionSortMetadata } from './algorithms/metadata/selectionSortMetadata'

// See DraggablePanel.test.tsx's own file-level doc comment: this jsdom has
// no native PointerEvent constructor, so a MouseEvent typed as a pointer
// event is used instead.
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

function confirmArray(value: string) {
  const textarea = screen.getByLabelText('Array', { exact: true }) as HTMLTextAreaElement
  fireEvent.change(textarea, { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: 'Done' }))
}

function getAlgorithmSelect(): HTMLSelectElement {
  return screen.getByLabelText('Algorithm', { exact: true }) as HTMLSelectElement
}

function dragStatisticsPanel(): { left: string; top: string } {
  const mainArea = document.querySelector('.main-area') as HTMLElement
  const stats = document.querySelector('.statistics-panel-overlay') as HTMLElement
  stubRect(mainArea, { left: 100, top: 50, width: 900, height: 700 })
  stubRect(stats, { left: 132, top: 82, width: 260, height: 200 })

  const handle = stats.querySelector('.draggable-panel__handle') as HTMLElement
  firePointer(handle, 'pointerdown', { clientX: 150, clientY: 100 })
  firePointer(window, 'pointermove', { clientX: 500, clientY: 400 })
  firePointer(window, 'pointerup', { clientX: 500, clientY: 400 })

  return { left: stats.style.left, top: stats.style.top }
}

function statisticsOverlayStyle(): { left: string; top: string } {
  const stats = document.querySelector('.statistics-panel-overlay') as HTMLElement
  return { left: stats.style.left, top: stats.style.top }
}

function codeViewText(): string[] {
  return Array.from(document.querySelectorAll('.code-view__line-text')).map(
    (el) => el.textContent ?? '',
  )
}

describe('App — dragged panel position survives a new array confirmation', () => {
  it('re-confirming Done with a different array keeps Statistics exactly where it was dragged to', () => {
    render(<App />)
    confirmArray('8, 3, 5, 1')

    const dragged = dragStatisticsPanel()
    expect(dragged.left).not.toBe('')

    confirmArray('2, 9, 4, 7, 1')

    expect(statisticsOverlayStyle()).toEqual(dragged)
  })
})

describe('App — dragged panel position survives an algorithm change', () => {
  it('switching the algorithm and pressing Done again (a brand-new session) keeps Statistics in place', () => {
    render(<App />)
    confirmArray('8, 3, 5, 1')
    expect(codeViewText()).toEqual([...bubbleSortMetadata.code])

    const dragged = dragStatisticsPanel()

    fireEvent.change(getAlgorithmSelect(), { target: { value: 'Selection Sort' } })
    confirmArray('8, 3, 5, 1')

    // Confirms a genuinely new session was created (the algorithm really
    // did change)...
    expect(codeViewText()).toEqual([...selectionSortMetadata.code])
    // ...while the panel position — pure UI preference, not session state
    // — was completely unaffected by that new session.
    expect(statisticsOverlayStyle()).toEqual(dragged)
  })
})
