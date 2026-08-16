import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the app shell', () => {
    render(<App />)
    expect(
      screen.getByText('Algorithm Visualizer + Playground'),
    ).toBeTruthy()
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
