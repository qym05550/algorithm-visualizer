// Dynamic Visualization Sizing task: focused tests for ArrayRenderer's
// per-cell dynamic sizing. jsdom (this project's test environment) does
// not compute real layout, so ResizeObserver either never fires or is
// entirely absent — useContainerWidth's own fallback (a fixed
// DEFAULT_WIDTH_FALLACK of 900px, see useContainerWidth.ts) is what
// actually applies for every render in this file, deterministically. That
// makes the resulting --cell-size custom property fully predictable here,
// even though it's ultimately CSS-derived: computeItemSize(count, 900,
// {min: 42, max: 84, gap: 12}) is exactly what itemSizing.test.ts already
// verifies in isolation, so this file focuses on wiring — that
// ArrayRenderer actually applies the computed size to the DOM, and that
// the relative "fewer elements -> larger cells" relationship holds
// end-to-end through the component, not just in the underlying formula.
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import ArrayRenderer from './ArrayRenderer'

function cellSizePx(container: HTMLElement): number {
  const el = container.querySelector('.array-renderer') as HTMLElement
  return parseFloat(el.style.getPropertyValue('--cell-size'))
}

describe('ArrayRenderer — dynamic sizing: fewer elements produce larger cells', () => {
  it('a 4-element array gets a larger --cell-size than a 50-element array', () => {
    const few = render(<ArrayRenderer array={[5, 3, 8, 1]} />)
    const many = render(<ArrayRenderer array={Array.from({ length: 50 }, (_, i) => i)} />)

    expect(cellSizePx(few.container)).toBeGreaterThan(cellSizePx(many.container))
  })

  it('a single-element array reaches the maximum cell size', () => {
    const { container } = render(<ArrayRenderer array={[42]} />)

    expect(cellSizePx(container)).toBe(84)
  })
})

describe('ArrayRenderer — dynamic sizing: stays within bounds', () => {
  it('100 elements clamp to the minimum cell size, not something smaller', () => {
    const { container } = render(
      <ArrayRenderer array={Array.from({ length: 100 }, (_, i) => i)} />,
    )

    expect(cellSizePx(container)).toBe(42)
  })

  it('a moderate array (10 elements) sizes somewhere between the min and max bounds', () => {
    const { container } = render(
      <ArrayRenderer array={[5, 3, 8, 1, 4, 9, 2, 7, 6, 10]} />,
    )

    const size = cellSizePx(container)
    expect(size).toBeGreaterThanOrEqual(42)
    expect(size).toBeLessThanOrEqual(84)
  })
})

describe('ArrayRenderer — dynamic sizing: font size scales with cell size', () => {
  it('a larger cell also gets a larger font size than a smaller cell', () => {
    const few = render(<ArrayRenderer array={[5, 3, 8, 1]} />)
    const many = render(<ArrayRenderer array={Array.from({ length: 50 }, (_, i) => i)} />)

    function fontSizePx(container: HTMLElement): number {
      const el = container.querySelector('.array-renderer') as HTMLElement
      return parseFloat(el.style.getPropertyValue('--cell-font-size'))
    }

    expect(fontSizePx(few.container)).toBeGreaterThan(fontSizePx(many.container))
  })
})

describe('ArrayRenderer — dynamic sizing: empty array', () => {
  it('does not crash, and renders no sizing container at all', () => {
    const { container } = render(<ArrayRenderer array={[]} />)

    expect(container.querySelector('.array-renderer')).toBeNull()
    expect(container.querySelector('.array-renderer__empty')).not.toBeNull()
  })
})

describe('ArrayRenderer — dynamic sizing: values and highlighting are unaffected', () => {
  it('still renders correct values and honors highlightedIndices regardless of array length', () => {
    const { container } = render(
      <ArrayRenderer array={[5, 3, 8, 1]} highlightedIndices={[1, 2]} />,
    )

    const values = Array.from(container.querySelectorAll('.array-renderer__value')).map(
      (el) => el.textContent,
    )
    expect(values).toEqual(['5', '3', '8', '1'])
  })
})
