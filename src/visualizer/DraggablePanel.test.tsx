// Draggable Statistics/Code View Panels task: focused component tests for
// the reusable DraggablePanel wrapper (and the useDraggablePanel hook it
// wires up).
//
// Two jsdom limitations shaped how these tests are written:
//
// 1. jsdom does not compute real layout (getBoundingClientRect /
//    offsetWidth / offsetHeight / clientWidth / clientHeight all read 0 by
//    default — the same limitation itemSizing.test.ts and
//    ArrayRenderer.sizing.test.tsx already worked around for the Dynamic
//    Visualization Sizing task), so each test stubs concrete rects on the
//    container and panel elements after render, giving the pointer-drag
//    math real, deterministic numbers to work with.
// 2. This project's jsdom has no native `PointerEvent` constructor at all
//    (confirmed directly: `'PointerEvent' in window` is false), so
//    `@testing-library`'s `fireEvent.pointerDown`/`pointerMove`/etc. fall
//    back to a bare `Event` that silently drops every init property —
//    `clientX`, `clientY`, and even `button` all come through as
//    `undefined`, which would make every assertion below meaningless. A
//    real `MouseEvent` (which jsdom *does* implement, with working
//    clientX/clientY/button) dispatched with its `type` set to
//    `'pointerdown'`/`'pointermove'`/etc. sidesteps this: both the DOM's
//    own addEventListener matching and React's event delegation match by
//    event *type string*, not constructor identity, and the hook under
//    test never reads a PointerEvent-only field (no `pointerId`/
//    `pointerType`), so a MouseEvent standing in for one is functionally
//    equivalent here. Real pointer/touch behavior is verified live in the
//    browser per the task's own verification checklist.
import { useRef } from 'react'
import { describe, expect, it } from 'vitest'
import { act, render } from '@testing-library/react'
import DraggablePanel from './DraggablePanel'

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

/** See the file-level doc comment above for why this uses `MouseEvent`
 *  rather than `fireEvent.pointerDown`/etc. */
function firePointer(
  target: EventTarget,
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  opts: { clientX: number; clientY: number; button?: number },
) {
  const event = new MouseEvent(type, {
    clientX: opts.clientX,
    clientY: opts.clientY,
    button: opts.button ?? 0,
    bubbles: true,
    cancelable: true,
  })
  act(() => {
    target.dispatchEvent(event)
  })
}

// Mirrors how VisualizationPlaceholder actually renders both panels: two
// independent DraggablePanel instances sharing one `.main-area` container
// ref, each with its own real overlay class. Deliberately not the full
// StatisticsPanel/CodeView content — those components' own behavior is
// covered by their own test files; this harness only needs *some* content
// to prove dragging never disturbs it (task requirement 3).
function Harness() {
  const containerRef = useRef<HTMLDivElement>(null)
  return (
    <div className="main-area" ref={containerRef}>
      <DraggablePanel containerRef={containerRef} overlayClassName="statistics-panel-overlay" label="Statistics">
        <div data-testid="stats-content">Comparisons: 3</div>
      </DraggablePanel>
      <DraggablePanel containerRef={containerRef} overlayClassName="code-view-overlay" label="Code View">
        <div data-testid="code-content">for i = 0 to n</div>
      </DraggablePanel>
    </div>
  )
}

// Container: 800x600, offset at (100, 50) in "viewport" coordinates.
// Statistics panel: its default CSS corner would be top-left (32, 32) —
// simulated here as an absolute rect of (132, 82), 260x200.
// Code View panel: its default CSS corner would be top-right — simulated
// as an absolute rect of (608, 82), 260x200 (arbitrary but distinct from
// Statistics, so the two are never confusable in assertions).
function setUpRects(container: HTMLElement) {
  const mainArea = container.querySelector('.main-area') as HTMLElement
  const stats = container.querySelector('.statistics-panel-overlay') as HTMLElement
  const code = container.querySelector('.code-view-overlay') as HTMLElement

  stubRect(mainArea, { left: 100, top: 50, width: 800, height: 600 })
  stubRect(stats, { left: 132, top: 82, width: 260, height: 200 })
  stubRect(code, { left: 608, top: 82, width: 260, height: 200 })

  return { mainArea, stats, code }
}

function handleOf(panel: HTMLElement): HTMLElement {
  return panel.querySelector('.draggable-panel__handle') as HTMLElement
}

describe('DraggablePanel — default position', () => {
  it('renders with no inline left/top before any drag — the default CSS corner governs', () => {
    const { container } = render(<Harness />)
    setUpRects(container)

    const stats = container.querySelector('.statistics-panel-overlay') as HTMLElement
    const code = container.querySelector('.code-view-overlay') as HTMLElement

    expect(stats.style.left).toBe('')
    expect(stats.style.top).toBe('')
    expect(code.style.left).toBe('')
    expect(code.style.top).toBe('')
  })

  it('is not marked as dragging before any interaction', () => {
    const { container } = render(<Harness />)
    setUpRects(container)

    const stats = container.querySelector('.statistics-panel-overlay') as HTMLElement
    expect(stats.getAttribute('data-dragging')).toBeNull()
  })
})

describe('DraggablePanel — accessible drag handle', () => {
  it('exposes an appropriately labeled, cursor-communicating handle for each panel', () => {
    const { container } = render(<Harness />)
    setUpRects(container)

    const statsHandle = handleOf(container.querySelector('.statistics-panel-overlay') as HTMLElement)
    const codeHandle = handleOf(container.querySelector('.code-view-overlay') as HTMLElement)

    expect(statsHandle.getAttribute('aria-label')).toBe('Drag Statistics panel')
    expect(statsHandle.getAttribute('role')).toBe('button')
    expect(codeHandle.getAttribute('aria-label')).toBe('Drag Code View panel')
    expect(codeHandle.getAttribute('role')).toBe('button')
  })
})

describe('DraggablePanel — begins dragging on handle pointerdown', () => {
  it('marks the panel as dragging and seeds its position from its current on-screen corner', () => {
    const { container } = render(<Harness />)
    const { stats } = setUpRects(container)

    firePointer(handleOf(stats), 'pointerdown', { clientX: 150, clientY: 100 })

    expect(stats.getAttribute('data-dragging')).toBe('true')
    // Seeded from the panel's stubbed rect (132, 82) relative to the
    // container's stubbed rect (100, 50) => (32, 32) — the same numbers
    // the default CSS corner already uses (top: 32px; left: 32px), so
    // starting a drag never visibly jumps the panel.
    expect(stats.style.left).toBe('32px')
    expect(stats.style.top).toBe('32px')
  })

  it('a non-primary button (e.g. right-click) does not start a drag', () => {
    const { container } = render(<Harness />)
    const { stats } = setUpRects(container)

    firePointer(handleOf(stats), 'pointerdown', { clientX: 150, clientY: 100, button: 2 })

    expect(stats.getAttribute('data-dragging')).toBeNull()
    expect(stats.style.left).toBe('')
  })
})

describe('DraggablePanel — follows pointer movement', () => {
  it('updates position as the pointer moves, preserving the original grab offset', () => {
    const { container } = render(<Harness />)
    const { stats } = setUpRects(container)

    // Grabbed at (150, 100): 18px right of and below the panel's own
    // top-left corner (132, 82) — that 18/18 offset must be preserved
    // through every subsequent move.
    firePointer(handleOf(stats), 'pointerdown', { clientX: 150, clientY: 100 })
    firePointer(window, 'pointermove', { clientX: 400, clientY: 300 })

    // x = 400 - containerLeft(100) - grabOffsetX(18) = 282
    // y = 300 - containerTop(50) - grabOffsetY(18) = 232
    expect(stats.style.left).toBe('282px')
    expect(stats.style.top).toBe('232px')

    // A second, independent move proves it keeps tracking continuously
    // rather than only reacting once.
    firePointer(window, 'pointermove', { clientX: 500, clientY: 350 })
    expect(stats.style.left).toBe('382px')
    expect(stats.style.top).toBe('282px')
  })

  it('raises the panel above the rest of the visualization while dragging (task requirement 14)', () => {
    const { container } = render(<Harness />)
    const { stats } = setUpRects(container)

    firePointer(handleOf(stats), 'pointerdown', { clientX: 150, clientY: 100 })
    firePointer(window, 'pointermove', { clientX: 200, clientY: 150 })

    expect(Number(stats.style.zIndex)).toBeGreaterThan(0)
  })
})

describe('DraggablePanel — stops dragging on pointerup', () => {
  it('freezes the position and clears the dragging flag', () => {
    const { container } = render(<Harness />)
    const { stats } = setUpRects(container)

    firePointer(handleOf(stats), 'pointerdown', { clientX: 150, clientY: 100 })
    firePointer(window, 'pointermove', { clientX: 400, clientY: 300 })
    firePointer(window, 'pointerup', { clientX: 400, clientY: 300 })

    expect(stats.getAttribute('data-dragging')).toBeNull()
    expect(stats.style.left).toBe('282px')
    expect(stats.style.top).toBe('232px')

    // A move after release must not still be tracked — the window
    // listeners are only active during an actual drag (task requirement
    // 11) and must have been cleaned up by pointerup.
    firePointer(window, 'pointermove', { clientX: 700, clientY: 550 })
    expect(stats.style.left).toBe('282px')
    expect(stats.style.top).toBe('232px')
  })

  it('also stops on pointercancel', () => {
    const { container } = render(<Harness />)
    const { stats } = setUpRects(container)

    firePointer(handleOf(stats), 'pointerdown', { clientX: 150, clientY: 100 })
    firePointer(window, 'pointermove', { clientX: 400, clientY: 300 })
    firePointer(window, 'pointercancel', { clientX: 400, clientY: 300 })

    expect(stats.getAttribute('data-dragging')).toBeNull()

    firePointer(window, 'pointermove', { clientX: 700, clientY: 550 })
    expect(stats.style.left).toBe('282px')
  })
})

describe('DraggablePanel — clamps to container boundaries', () => {
  it('never lets the panel’s left/top corner go negative', () => {
    const { container } = render(<Harness />)
    const { stats } = setUpRects(container)

    firePointer(handleOf(stats), 'pointerdown', { clientX: 150, clientY: 100 })
    firePointer(window, 'pointermove', { clientX: -5000, clientY: -5000 })

    expect(stats.style.left).toBe('0px')
    expect(stats.style.top).toBe('0px')
  })

  it('never lets the panel’s far edge pass the container’s far edge, accounting for the panel’s own size', () => {
    const { container } = render(<Harness />)
    const { stats } = setUpRects(container)

    firePointer(handleOf(stats), 'pointerdown', { clientX: 150, clientY: 100 })
    firePointer(window, 'pointermove', { clientX: 9000, clientY: 9000 })

    // containerWidth(800) - panelWidth(260) = 540; containerHeight(600) -
    // panelHeight(200) = 400.
    expect(stats.style.left).toBe('540px')
    expect(stats.style.top).toBe('400px')
  })
})

describe('DraggablePanel — dragging does not affect panel content', () => {
  it('leaves the wrapped content exactly as rendered throughout a drag', () => {
    const { container, getByTestId } = render(<Harness />)
    const { stats } = setUpRects(container)

    expect(getByTestId('stats-content').textContent).toBe('Comparisons: 3')

    firePointer(handleOf(stats), 'pointerdown', { clientX: 150, clientY: 100 })
    firePointer(window, 'pointermove', { clientX: 400, clientY: 300 })
    firePointer(window, 'pointerup', { clientX: 400, clientY: 300 })

    expect(getByTestId('stats-content').textContent).toBe('Comparisons: 3')
  })

  it('pressing down inside the content itself never starts a drag (only the handle does)', () => {
    const { container, getByTestId } = render(<Harness />)
    const { stats } = setUpRects(container)

    firePointer(getByTestId('stats-content'), 'pointerdown', { clientX: 200, clientY: 150 })

    expect(stats.getAttribute('data-dragging')).toBeNull()
    expect(stats.style.left).toBe('')
  })
})

describe('DraggablePanel — Statistics and Code View remain fully independent', () => {
  it('dragging Statistics never moves Code View', () => {
    const { container } = render(<Harness />)
    const { stats, code } = setUpRects(container)

    firePointer(handleOf(stats), 'pointerdown', { clientX: 150, clientY: 100 })
    firePointer(window, 'pointermove', { clientX: 400, clientY: 300 })
    firePointer(window, 'pointerup', { clientX: 400, clientY: 300 })

    expect(stats.style.left).toBe('282px')
    // Code View was never touched — still has no inline position at all.
    expect(code.style.left).toBe('')
    expect(code.style.top).toBe('')
    expect(code.getAttribute('data-dragging')).toBeNull()
  })

  it('dragging Code View never moves Statistics', () => {
    const { container } = render(<Harness />)
    const { stats, code } = setUpRects(container)

    // Grabbed at (650, 120): 42px right of and 38px below Code View's own
    // stubbed corner (608, 82).
    firePointer(handleOf(code), 'pointerdown', { clientX: 650, clientY: 120 })
    firePointer(window, 'pointermove', { clientX: 300, clientY: 200 })

    // x = 300 - containerLeft(100) - grabOffsetX(42) = 158
    // y = 200 - containerTop(50) - grabOffsetY(38) = 112
    expect(code.style.left).toBe('158px')
    expect(code.style.top).toBe('112px')

    expect(stats.style.left).toBe('')
    expect(stats.style.top).toBe('')
    expect(stats.getAttribute('data-dragging')).toBeNull()
  })

  it('both panels can be dragged independently to different positions in the same session', () => {
    const { container } = render(<Harness />)
    const { stats, code } = setUpRects(container)

    firePointer(handleOf(stats), 'pointerdown', { clientX: 150, clientY: 100 })
    firePointer(window, 'pointermove', { clientX: 200, clientY: 150 })
    firePointer(window, 'pointerup', { clientX: 200, clientY: 150 })

    firePointer(handleOf(code), 'pointerdown', { clientX: 650, clientY: 120 })
    firePointer(window, 'pointermove', { clientX: 650, clientY: 450 })
    firePointer(window, 'pointerup', { clientX: 650, clientY: 450 })

    // Statistics: x = 200-100-18=82, y = 150-50-18=82.
    expect(stats.style.left).toBe('82px')
    expect(stats.style.top).toBe('82px')
    // Code View: x = 650-100-42=508, y = 450-50-38=362 (both comfortably
    // inside the [0,540]x[0,400] valid range, so nothing clamps here —
    // clamping itself is covered separately above).
    expect(code.style.left).toBe('508px')
    expect(code.style.top).toBe('362px')
  })
})
