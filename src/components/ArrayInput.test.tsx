import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ArrayInput from './ArrayInput'
import { MAX_ARRAY_SIZE } from '../utils/arrayInput'

function getTextarea() {
  return screen.getByLabelText('Array') as HTMLTextAreaElement
}

describe('ArrayInput', () => {
  it('starts with a randomly generated array already filled in', () => {
    render(<ArrayInput onArrayConfirmed={vi.fn()} />)
    expect(getTextarea().value.split(',')).toHaveLength(10)
  })

  it('confirms a valid array when Done is clicked', () => {
    const onArrayConfirmed = vi.fn()
    render(<ArrayInput onArrayConfirmed={onArrayConfirmed} />)

    fireEvent.change(getTextarea(), { target: { value: '8, 3, 5, 1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))

    expect(onArrayConfirmed).toHaveBeenCalledWith([8, 3, 5, 1])
    expect(screen.getByText(/array confirmed/i)).toBeTruthy()
  })

  it('confirms a valid array when Enter is pressed', () => {
    const onArrayConfirmed = vi.fn()
    render(<ArrayInput onArrayConfirmed={onArrayConfirmed} />)

    fireEvent.change(getTextarea(), { target: { value: '4, 2, 9' } })
    fireEvent.keyDown(getTextarea(), { key: 'Enter' })

    expect(onArrayConfirmed).toHaveBeenCalledWith([4, 2, 9])
  })

  it('shows a validation message and does not confirm on empty input', () => {
    const onArrayConfirmed = vi.fn()
    render(<ArrayInput onArrayConfirmed={onArrayConfirmed} />)

    fireEvent.change(getTextarea(), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))

    expect(onArrayConfirmed).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeTruthy()
  })

  it('shows a validation message and does not confirm on non-numeric input', () => {
    const onArrayConfirmed = vi.fn()
    render(<ArrayInput onArrayConfirmed={onArrayConfirmed} />)

    fireEvent.change(getTextarea(), { target: { value: '1, two, 3' } })
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))

    expect(onArrayConfirmed).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeTruthy()
  })

  it('shows a validation message and does not confirm when over the max size', () => {
    const onArrayConfirmed = vi.fn()
    render(<ArrayInput onArrayConfirmed={onArrayConfirmed} />)

    const tooMany = Array.from({ length: MAX_ARRAY_SIZE + 1 }, (_, i) => i).join(', ')
    fireEvent.change(getTextarea(), { target: { value: tooMany } })
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))

    expect(onArrayConfirmed).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeTruthy()
  })

  it('fills the input with a new random array on Generate Random, without confirming it', () => {
    const onArrayConfirmed = vi.fn()
    render(<ArrayInput onArrayConfirmed={onArrayConfirmed} />)

    fireEvent.change(getTextarea(), { target: { value: '1, 2, 3' } })
    fireEvent.click(screen.getByRole('button', { name: 'Generate Random' }))

    expect(getTextarea().value.split(',')).toHaveLength(10)
    expect(onArrayConfirmed).not.toHaveBeenCalled()
  })
})
