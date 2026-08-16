import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import ArrayRenderer from './ArrayRenderer'

function renderedValues(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('.array-renderer__value')).map(
    (element) => element.textContent ?? '',
  )
}

function renderedIndices(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('.array-renderer__index')).map(
    (element) => element.textContent ?? '',
  )
}

/**
 * The array indices whose cell is currently exposed as highlighted, per
 * the item's accessible name — not a CSS class — so this reflects what a
 * screen reader (and a person reading the DOM) would actually perceive.
 */
function highlightedIndices(container: HTMLElement): number[] {
  return Array.from(container.querySelectorAll('.array-renderer__item'))
    .filter((item) => item.getAttribute('aria-label')?.includes('highlighted'))
    .map((item) => Number(item.querySelector('.array-renderer__index')?.textContent))
}

describe('ArrayRenderer — empty array', () => {
  it('does not crash and renders no cells', () => {
    const { container } = render(<ArrayRenderer array={[]} />)

    expect(container.querySelectorAll('.array-renderer__item')).toHaveLength(0)
  })
})

describe('ArrayRenderer — simple array', () => {
  it('renders every value in [8, 3, 5, 1]', () => {
    const { container } = render(<ArrayRenderer array={[8, 3, 5, 1]} />)

    expect(renderedValues(container)).toEqual(['8', '3', '5', '1'])
  })
})

describe('ArrayRenderer — indices', () => {
  it('renders 0, 1, 2 beneath [8, 3, 5]', () => {
    const { container } = render(<ArrayRenderer array={[8, 3, 5]} />)

    expect(renderedIndices(container)).toEqual(['0', '1', '2'])
  })
})

describe('ArrayRenderer — order preservation', () => {
  it('keeps the visual order 8 -> 3 -> 5 -> 1', () => {
    const { container } = render(<ArrayRenderer array={[8, 3, 5, 1]} />)

    expect(renderedValues(container)).toEqual(['8', '3', '5', '1'])
  })
})

describe('ArrayRenderer — duplicate values', () => {
  it('renders all four elements of [5, 5, 2, 2]', () => {
    const { container } = render(<ArrayRenderer array={[5, 5, 2, 2]} />)

    expect(container.querySelectorAll('.array-renderer__item')).toHaveLength(4)
    expect(renderedValues(container)).toEqual(['5', '5', '2', '2'])
  })
})

describe('ArrayRenderer — negative numbers and zero', () => {
  it('renders [-5, 0, 8, -2] correctly', () => {
    const { container } = render(<ArrayRenderer array={[-5, 0, 8, -2]} />)

    expect(renderedValues(container)).toEqual(['-5', '0', '8', '-2'])
  })
})

describe('ArrayRenderer — large arrays', () => {
  it('renders all 100 elements of a maximum-size array', () => {
    const input = Array.from({ length: 100 }, (_, index) => index)
    const { container } = render(<ArrayRenderer array={input} />)

    expect(container.querySelectorAll('.array-renderer__item')).toHaveLength(100)
    expect(renderedValues(container)).toEqual(input.map(String))
    expect(renderedIndices(container)).toEqual(input.map((_, index) => String(index)))
  })
})

describe('ArrayRenderer — input immutability', () => {
  it('does not mutate the array it is given', () => {
    const input = [9, 4, 6, 1, 3]
    const snapshot = [...input]

    render(<ArrayRenderer array={input} />)

    expect(input).toEqual(snapshot)
  })
})

describe('ArrayRenderer — deterministic rendering', () => {
  it('renders the same output for the same input', () => {
    const input = [7, 2, 9, 4, 1]

    const first = render(<ArrayRenderer array={input} />)
    const firstValues = renderedValues(first.container)
    const firstIndices = renderedIndices(first.container)
    first.unmount()

    const second = render(<ArrayRenderer array={input} />)
    expect(renderedValues(second.container)).toEqual(firstValues)
    expect(renderedIndices(second.container)).toEqual(firstIndices)
  })
})

describe('ArrayRenderer — highlighting: no highlightedIndices', () => {
  it('highlights nothing when the prop is omitted', () => {
    const { container } = render(<ArrayRenderer array={[8, 3, 5, 1]} />)

    expect(highlightedIndices(container)).toEqual([])
    // Normal appearance is otherwise unaffected.
    expect(renderedValues(container)).toEqual(['8', '3', '5', '1'])
  })
})

describe('ArrayRenderer — highlighting: empty highlightedIndices', () => {
  it('highlights nothing when the array is empty', () => {
    const { container } = render(<ArrayRenderer array={[8, 3, 5, 1]} highlightedIndices={[]} />)

    expect(highlightedIndices(container)).toEqual([])
    expect(renderedValues(container)).toEqual(['8', '3', '5', '1'])
  })
})

describe('ArrayRenderer — highlighting: one index', () => {
  it('highlights only the specified element', () => {
    const { container } = render(
      <ArrayRenderer array={[8, 3, 5, 1]} highlightedIndices={[2]} />,
    )

    expect(highlightedIndices(container)).toEqual([2])
  })
})

describe('ArrayRenderer — highlighting: two indices', () => {
  it('highlights both specified elements, matching the PROJECT.md example', () => {
    const { container } = render(
      <ArrayRenderer array={[8, 3, 5, 1]} highlightedIndices={[1, 2]} />,
    )

    expect(highlightedIndices(container)).toEqual([1, 2])
  })
})

describe('ArrayRenderer — highlighting: multiple indices', () => {
  it('highlights every valid specified element, not just two', () => {
    const { container } = render(
      <ArrayRenderer array={[8, 3, 5, 1, 9]} highlightedIndices={[0, 2, 4]} />,
    )

    expect(highlightedIndices(container)).toEqual([0, 2, 4])
  })
})

describe('ArrayRenderer — highlighting: invalid indices', () => {
  it('ignores out-of-range indices without crashing or creating phantom elements', () => {
    const { container } = render(
      <ArrayRenderer array={[8, 3, 5]} highlightedIndices={[1, 99, -1]} />,
    )

    expect(container.querySelectorAll('.array-renderer__item')).toHaveLength(3)
    expect(highlightedIndices(container)).toEqual([1])
  })
})

describe('ArrayRenderer — highlighting: negative indices', () => {
  it('safely ignores negative indices', () => {
    const { container } = render(
      <ArrayRenderer array={[1, 2, 3]} highlightedIndices={[-1, -5]} />,
    )

    expect(container.querySelectorAll('.array-renderer__item')).toHaveLength(3)
    expect(highlightedIndices(container)).toEqual([])
  })
})

describe('ArrayRenderer — highlighting: duplicate indices', () => {
  it('highlights the element once and renders no duplicate elements', () => {
    const { container } = render(
      <ArrayRenderer array={[8, 3, 5]} highlightedIndices={[1, 1, 2]} />,
    )

    expect(container.querySelectorAll('.array-renderer__item')).toHaveLength(3)
    expect(highlightedIndices(container)).toEqual([1, 2])
  })
})

describe('ArrayRenderer — highlighting: values and indices stay correct', () => {
  it('renders the same values and indices whether or not elements are highlighted', () => {
    const { container } = render(
      <ArrayRenderer array={[8, 3, 5, 1]} highlightedIndices={[1, 2]} />,
    )

    expect(renderedValues(container)).toEqual(['8', '3', '5', '1'])
    expect(renderedIndices(container)).toEqual(['0', '1', '2', '3'])
  })
})

describe('ArrayRenderer — highlighting: input immutability', () => {
  it('does not mutate the array or the highlightedIndices it is given', () => {
    const array = [8, 3, 5, 1]
    const highlights = [1, 2]
    const arraySnapshot = [...array]
    const highlightsSnapshot = [...highlights]

    render(<ArrayRenderer array={array} highlightedIndices={highlights} />)

    expect(array).toEqual(arraySnapshot)
    expect(highlights).toEqual(highlightsSnapshot)
  })
})
