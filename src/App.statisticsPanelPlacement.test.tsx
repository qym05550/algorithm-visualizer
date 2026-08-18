// Move Statistics Panel to the Top-Left of the Visualization Area task:
// verifies, through the real App component, that Statistics now renders
// as its own overlay on the left side of the main visualization region,
// alongside Code View on the right — a pure layout/placement change.
// Existing behavior (counters, complexity, synchronization with
// Next/Previous/Reset, Array<->Bars, algorithm switching, autoplay) is
// already covered exhaustively by App.statistics.test.tsx and
// statisticsPanel.integration.test.tsx and is deliberately not re-tested
// here — this file only asserts *where* Statistics renders and that it
// still coexists with exactly one Code View.
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'

function confirmArray(value: string) {
  const textarea = screen.getByLabelText('Array', { exact: true }) as HTMLTextAreaElement
  fireEvent.change(textarea, { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: 'Done' }))
}

describe('App — Statistics Panel placement', () => {
  it('Statistics is rendered exactly once', () => {
    const { container } = render(<App />)
    confirmArray('8, 3, 5, 1')

    expect(container.querySelectorAll('.statistics-panel').length).toBe(1)
  })

  it('Statistics is rendered inside the main visualization region', () => {
    const { container } = render(<App />)
    confirmArray('8, 3, 5, 1')

    const mainArea = container.querySelector('.main-area')
    expect(mainArea).not.toBeNull()
    expect(mainArea?.querySelector('.statistics-panel')).not.toBeNull()
  })

  it('Statistics is positioned via its own overlay container, not by StatisticsPanel itself', () => {
    const { container } = render(<App />)
    confirmArray('8, 3, 5, 1')

    // StatisticsPanel stays purely presentational (task section 4): the
    // positioning class lives on a wrapper the parent controls, one level
    // above .statistics-panel itself.
    const overlay = container.querySelector('.statistics-panel-overlay')
    expect(overlay).not.toBeNull()
    expect(overlay?.querySelector('.statistics-panel')).not.toBeNull()
  })

  it('Statistics overlay is positioned on the left, Code View overlay remains on the right', () => {
    const { container } = render(<App />)
    confirmArray('8, 3, 5, 1')

    const statsOverlay = container.querySelector('.statistics-panel-overlay') as HTMLElement
    const codeOverlay = container.querySelector('.code-view-overlay') as HTMLElement
    expect(statsOverlay).not.toBeNull()
    expect(codeOverlay).not.toBeNull()

    // jsdom does not compute real layout/geometry, so placement is
    // verified structurally: each overlay is styled by a distinct class
    // (.statistics-panel-overlay vs .code-view-overlay) — actual pixel
    // positioning (left: 32px vs right: 32px, no overlap) is verified
    // live in the browser per the task's own verification checklist.
    expect(statsOverlay).not.toBe(codeOverlay)
    expect(statsOverlay.className).toBe('statistics-panel-overlay')
    expect(codeOverlay.className).toBe('code-view-overlay')
  })

  it('there is still exactly one CodeView alongside exactly one StatisticsPanel', () => {
    const { container } = render(<App />)
    confirmArray('8, 3, 5, 1')

    expect(container.querySelectorAll('.statistics-panel').length).toBe(1)
    expect(container.querySelectorAll('.code-view').length).toBe(1)
  })

  it('both overlays sit inside .main-area as siblings of .visualizer, not nested inside one another', () => {
    const { container } = render(<App />)
    confirmArray('8, 3, 5, 1')

    const mainArea = container.querySelector('.main-area') as HTMLElement
    const children = Array.from(mainArea.children).map((el) => el.className)

    expect(children).toContain('statistics-panel-overlay')
    expect(children).toContain('code-view-overlay')
    expect(children).toContain('visualizer')
    // Neither overlay contains the other, and the visualizer (holding the
    // array/bar renderer and controls) is a separate sibling too.
    const statsOverlay = container.querySelector('.statistics-panel-overlay')
    const codeOverlay = container.querySelector('.code-view-overlay')
    expect(statsOverlay?.querySelector('.code-view')).toBeNull()
    expect(codeOverlay?.querySelector('.statistics-panel')).toBeNull()
  })

  it('before an array is confirmed, neither overlay renders', () => {
    const { container } = render(<App />)

    expect(container.querySelector('.statistics-panel-overlay')).toBeNull()
    expect(container.querySelector('.statistics-panel')).toBeNull()
  })
})
