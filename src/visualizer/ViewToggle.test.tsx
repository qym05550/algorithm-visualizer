import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ViewToggle from './ViewToggle'

describe('ViewToggle — rendering', () => {
  it('renders exactly an Array button and a Bars button', () => {
    render(<ViewToggle view="array" onViewChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Array' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Bars' })).toBeTruthy()
  })

  it('is grouped with an accessible group label', () => {
    render(<ViewToggle view="array" onViewChange={() => {}} />)
    expect(screen.getByRole('group', { name: 'Visualization view' })).toBeTruthy()
  })
})

describe('ViewToggle — active state indication', () => {
  it('marks Array as pressed and Bars as not pressed when view is "array"', () => {
    render(<ViewToggle view="array" onViewChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Array' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Bars' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('marks Bars as pressed and Array as not pressed when view is "bars"', () => {
    render(<ViewToggle view="bars" onViewChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Bars' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Array' }).getAttribute('aria-pressed')).toBe('false')
  })
})

describe('ViewToggle — reporting changes', () => {
  it('calls onViewChange("bars") when Bars is clicked', () => {
    const onViewChange = vi.fn()
    render(<ViewToggle view="array" onViewChange={onViewChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Bars' }))

    expect(onViewChange).toHaveBeenCalledTimes(1)
    expect(onViewChange).toHaveBeenCalledWith('bars')
  })

  it('calls onViewChange("array") when Array is clicked', () => {
    const onViewChange = vi.fn()
    render(<ViewToggle view="bars" onViewChange={onViewChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Array' }))

    expect(onViewChange).toHaveBeenCalledTimes(1)
    expect(onViewChange).toHaveBeenCalledWith('array')
  })

  it('still reports the click even when the already-active view is clicked again (the parent decides whether that is a no-op)', () => {
    const onViewChange = vi.fn()
    render(<ViewToggle view="array" onViewChange={onViewChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Array' }))

    expect(onViewChange).toHaveBeenCalledTimes(1)
    expect(onViewChange).toHaveBeenCalledWith('array')
  })
})
