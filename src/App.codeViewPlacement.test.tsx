// Move Code View into the Main Visualization Area task: verifies, through
// the real App component, that Code View no longer lives in the sidebar
// and instead renders inside the main visualization region — a pure
// layout/placement change. Existing behavior (pseudocode content,
// highlighted-line sync, Previous/Reset, algorithm switching, Array<->Bars
// synchronization, autoplay) is already covered exhaustively by
// App.codeView.test.tsx and codeView.integration.test.tsx and is
// deliberately not re-tested here — this file only asserts *where* Code
// View renders.
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'

function confirmArray(value: string) {
  const textarea = screen.getByLabelText('Array', { exact: true }) as HTMLTextAreaElement
  fireEvent.change(textarea, { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: 'Done' }))
}

describe('App — Code View placement', () => {
  it('Code View is not rendered inside the sidebar', () => {
    const { container } = render(<App />)
    confirmArray('8, 3, 5, 1')

    const sidebar = container.querySelector('.sidebar')
    expect(sidebar).not.toBeNull()
    expect(sidebar?.querySelector('.code-view')).toBeNull()
  })

  it('Code View is rendered inside the main visualization region', () => {
    const { container } = render(<App />)
    confirmArray('8, 3, 5, 1')

    const mainArea = container.querySelector('.main-area')
    expect(mainArea).not.toBeNull()
    expect(mainArea?.querySelector('.code-view')).not.toBeNull()
  })

  it('Code View is positioned via its own overlay container, not by CodeView itself', () => {
    const { container } = render(<App />)
    confirmArray('8, 3, 5, 1')

    // CodeView stays purely presentational (task section 4): the
    // positioning class lives on a wrapper the parent controls, one level
    // above .code-view itself.
    const overlay = container.querySelector('.code-view-overlay')
    expect(overlay).not.toBeNull()
    expect(overlay?.querySelector('.code-view')).not.toBeNull()
  })

  it('Statistics remains in the main visualization region alongside Code View, unmodified in behavior', () => {
    const { container } = render(<App />)
    confirmArray('8, 3, 5, 1')

    const mainArea = container.querySelector('.main-area')
    expect(mainArea?.querySelector('.statistics-panel')).not.toBeNull()
    expect(mainArea?.querySelector('.code-view')).not.toBeNull()
  })

  it('before an array is confirmed, neither the overlay nor Code View render', () => {
    const { container } = render(<App />)

    expect(container.querySelector('.code-view-overlay')).toBeNull()
    expect(container.querySelector('.code-view')).toBeNull()
  })
})
