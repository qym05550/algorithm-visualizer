import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import AlgorithmSelector from './AlgorithmSelector'

const OPTIONS = ['Bubble Sort', 'Selection Sort']

describe('AlgorithmSelector — available options', () => {
  it('lists Bubble Sort and Selection Sort, and no other option', () => {
    render(<AlgorithmSelector options={OPTIONS} value="Bubble Sort" onChange={() => {}} />)

    const select = screen.getByLabelText('Algorithm') as HTMLSelectElement
    const optionLabels = Array.from(select.options).map((option) => option.textContent)

    expect(optionLabels).toEqual(['Bubble Sort', 'Selection Sort'])
  })
})

describe('AlgorithmSelector — default selection', () => {
  it('shows Bubble Sort as selected when value="Bubble Sort"', () => {
    render(<AlgorithmSelector options={OPTIONS} value="Bubble Sort" onChange={() => {}} />)

    const select = screen.getByLabelText('Algorithm') as HTMLSelectElement
    expect(select.value).toBe('Bubble Sort')
  })
})

describe('AlgorithmSelector — controlled value', () => {
  it('reflects whatever value prop it is given, not just its first option', () => {
    render(<AlgorithmSelector options={OPTIONS} value="Selection Sort" onChange={() => {}} />)

    const select = screen.getByLabelText('Algorithm') as HTMLSelectElement
    expect(select.value).toBe('Selection Sort')
  })
})

describe('AlgorithmSelector — changing the selection', () => {
  it('calls onChange with the newly selected value when the user picks a different option', () => {
    const onChange = vi.fn()
    render(<AlgorithmSelector options={OPTIONS} value="Bubble Sort" onChange={onChange} />)

    const select = screen.getByLabelText('Algorithm') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'Selection Sort' } })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('Selection Sort')
  })

  it('does not change its displayed value on its own — it stays controlled by its value prop', () => {
    // AlgorithmSelector is presentational: it reports the change upward and
    // waits to be re-rendered with a new `value`, exactly like ArrayInput's
    // relationship to its parent. Without a parent updating `value`, the
    // select's displayed value must not drift on its own.
    const { rerender } = render(
      <AlgorithmSelector options={OPTIONS} value="Bubble Sort" onChange={() => {}} />,
    )

    const select = screen.getByLabelText('Algorithm') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'Selection Sort' } })

    rerender(<AlgorithmSelector options={OPTIONS} value="Bubble Sort" onChange={() => {}} />)
    expect(select.value).toBe('Bubble Sort')
  })
})
