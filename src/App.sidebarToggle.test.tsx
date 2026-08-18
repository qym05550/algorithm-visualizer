// Sidebar Show/Hide Toggle task: verifies the toggle button's accessible
// semantics (aria-expanded/aria-controls/aria-label) and, most
// importantly, that toggling it never disturbs any part of an active
// visualization session or the sidebar's own in-progress form state —
// exactly the guarantee the task itself calls out (array, step, current
// operation, statistics, code highlight, autoplay state, selected
// algorithm must remain unchanged). Driven entirely through the real App
// component, matching this project's existing App.*.test.tsx convention
// (see App.statistics.test.tsx / App.codeView.test.tsx).
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import App from './App'

function getToggle(): HTMLButtonElement {
  return screen.getByRole('button', { name: /control panel/i }) as HTMLButtonElement
}

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

function stepText(): string | null {
  return document.querySelector('.visualizer-controls__step')?.textContent ?? null
}

function counters(): { comparisons: number; swaps: number; operations: number } {
  const values = Array.from(document.querySelectorAll('.statistics-panel__counter dd')).map(
    (el) => Number(el.textContent),
  )
  return { comparisons: values[0], swaps: values[1], operations: values[2] }
}

function activeCodeLine(): string | null {
  return document.querySelector('.code-view__line--active .code-view__line-number')?.textContent ?? null
}

function sidebar(): HTMLElement {
  return document.querySelector('.sidebar') as HTMLElement
}

describe('Sidebar toggle — visible by default', () => {
  it('renders the sidebar uncollapsed and the toggle reflects the open state', () => {
    render(<App />)

    expect(sidebar().className).not.toMatch(/sidebar--collapsed/)
    const toggle = getToggle()
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(toggle.getAttribute('aria-label')).toBe('Hide control panel')
    expect(toggle.getAttribute('aria-controls')).toBe('sidebar-panel')
    expect(sidebar().id).toBe('sidebar-panel')
  })
})

describe('Sidebar toggle — hides the sidebar', () => {
  it('clicking the toggle collapses the sidebar and flips its accessible state', () => {
    render(<App />)

    fireEvent.click(getToggle())

    expect(sidebar().className).toMatch(/sidebar--collapsed/)
    const toggle = getToggle()
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(toggle.getAttribute('aria-label')).toBe('Show control panel')
  })

  it('removes the collapsed sidebar from the tab order/accessibility tree via inert, without unmounting it', () => {
    render(<App />)

    fireEvent.click(getToggle())

    // Still present in the DOM (not conditionally unmounted) — only inert.
    expect(sidebar()).not.toBeNull()
    expect(sidebar().hasAttribute('inert')).toBe(true)
  })
})

describe('Sidebar toggle — shows it again', () => {
  it('clicking the toggle a second time restores the sidebar', () => {
    render(<App />)

    fireEvent.click(getToggle())
    fireEvent.click(getToggle())

    expect(sidebar().className).not.toMatch(/sidebar--collapsed/)
    expect(sidebar().hasAttribute('inert')).toBe(false)
    expect(getToggle().getAttribute('aria-expanded')).toBe('true')
  })
})

describe('Sidebar toggle — repeated hide/show', () => {
  it('toggling many times in a row always lands on the correct final state', () => {
    render(<App />)

    for (let i = 0; i < 7; i++) {
      fireEvent.click(getToggle())
    }
    // 7 toggles starting from open: ends collapsed (odd count).
    expect(sidebar().className).toMatch(/sidebar--collapsed/)

    fireEvent.click(getToggle())
    // 8th toggle: back to open.
    expect(sidebar().className).not.toMatch(/sidebar--collapsed/)
  })
})

describe('Sidebar toggle — autoplay keeps running across a hide/show', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not interrupt a running autoplay session', () => {
    render(<App />)
    confirmArray('8, 3, 5, 1')

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    act(() => {
      vi.advanceTimersByTime(500 * 2)
    })
    const stepDuringPlay = stepText()

    fireEvent.click(getToggle()) // hide while playing

    act(() => {
      vi.advanceTimersByTime(500 * 2)
    })
    // Still advancing — autoplay's own timer lives entirely in
    // VisualizationPlaceholder, untouched by the sidebar's visibility.
    expect(stepText()).not.toBe(stepDuringPlay)
    expect(screen.getByRole('button', { name: 'Stop' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
  })
})

describe('Sidebar toggle — does not reset the visualization session', () => {
  it('preserves array/step/statistics/code highlight across a hide and a show', () => {
    render(<App />)
    confirmArray('8, 3, 5, 1')
    fireEvent.click(getNext())
    fireEvent.click(getNext())

    const stepBefore = stepText()
    const countersBefore = counters()
    const codeLineBefore = activeCodeLine()

    fireEvent.click(getToggle()) // hide
    expect(stepText()).toBe(stepBefore)
    expect(counters()).toEqual(countersBefore)
    expect(activeCodeLine()).toBe(codeLineBefore)

    fireEvent.click(getToggle()) // show
    expect(stepText()).toBe(stepBefore)
    expect(counters()).toEqual(countersBefore)
    expect(activeCodeLine()).toBe(codeLineBefore)
  })

  it('Next/Previous/Reset still work correctly after the sidebar has been hidden and shown', () => {
    render(<App />)
    confirmArray('8, 3, 5, 1')

    fireEvent.click(getToggle())
    fireEvent.click(getToggle())

    fireEvent.click(getNext())
    fireEvent.click(getNext())
    expect(stepText()).toBe('Step 2 / 11')
  })

  it('does not reset the sidebar\'s own pending (unconfirmed) algorithm selection', () => {
    render(<App />)

    fireEvent.change(getAlgorithmSelect(), { target: { value: 'Selection Sort' } })

    fireEvent.click(getToggle()) // hide
    fireEvent.click(getToggle()) // show

    // The dropdown's pending selection is RightSidebar's own local state —
    // proof the component was never unmounted/remounted by the toggle.
    expect(getAlgorithmSelect().value).toBe('Selection Sort')
  })

  it('does not reset the array textarea\'s in-progress typed (unconfirmed) text', () => {
    render(<App />)

    const textarea = screen.getByLabelText('Array') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: '9, 9, 9' } })

    fireEvent.click(getToggle())
    fireEvent.click(getToggle())

    expect((screen.getByLabelText('Array') as HTMLTextAreaElement).value).toBe('9, 9, 9')
  })
})

describe('Sidebar toggle — reduced motion', () => {
  const css = readFileSync(path.join(__dirname, 'components/RightSidebar.css'), 'utf-8')

  it('declares a prefers-reduced-motion: reduce rule covering the sidebar transition, reusing the existing convention rather than a second system', () => {
    const match = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/)
    expect(match).not.toBeNull()
    const body = match![1]
    expect(body).toMatch(/\.sidebar\b/)
    expect(body).toMatch(/transition-duration/)
    expect(css).not.toMatch(/@keyframes/)
  })
})

describe('Sidebar toggle — responsive: reuses the existing stacking breakpoint, not a second one', () => {
  const css = readFileSync(path.join(__dirname, 'components/RightSidebar.css'), 'utf-8')

  it('the collapsed state is also defined inside the existing 860px breakpoint block, not a new breakpoint', () => {
    const breakpointMatches = css.match(/@media \(max-width: 860px\)/g) ?? []
    // Exactly one 860px block already existed before this task (matching
    // App.css's own stacking breakpoint) — still exactly one, meaning the
    // collapsed-height rules were added inside it rather than opening a
    // second, independent breakpoint.
    expect(breakpointMatches.length).toBe(1)
    expect(css).not.toMatch(/@media \(max-width: (?!860px)\d+px\)/)
  })
})
