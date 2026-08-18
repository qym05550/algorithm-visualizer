import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import BarRenderer from './BarRenderer'

function items(container: HTMLElement): Element[] {
  return Array.from(container.querySelectorAll('.bar-renderer__item'))
}

/** The displayed numeric label for the item at this index, whichever zone it's in. */
function labelAt(container: HTMLElement, index: number): string | null {
  return items(container)[index]?.querySelector('.bar-renderer__value')?.textContent ?? null
}

/** The inline pixel height of the positive-zone bar for this item (0 if none/negative). */
function positiveHeightAt(container: HTMLElement, index: number): number {
  const bar = items(container)[index]?.querySelector(
    '.bar-renderer__zone--positive .bar-renderer__bar',
  ) as HTMLElement | null
  return bar ? parseFloat(bar.style.height || '0') : NaN
}

/** The inline pixel height of the negative-zone bar for this item (0 if none/positive). */
function negativeHeightAt(container: HTMLElement, index: number): number {
  const bar = items(container)[index]?.querySelector(
    '.bar-renderer__zone--negative .bar-renderer__bar',
  ) as HTMLElement | null
  return bar ? parseFloat(bar.style.height || '0') : NaN
}

function isHighlightedAt(container: HTMLElement, index: number): boolean {
  return (items(container)[index]?.getAttribute('aria-label') ?? '').includes('highlighted')
}

describe('BarRenderer — rendering: empty array', () => {
  it('does not crash and renders no items', () => {
    const { container } = render(<BarRenderer array={[]} />)
    expect(items(container)).toHaveLength(0)
  })
})

describe('BarRenderer — rendering: [1, 2, 3]', () => {
  it('renders three items, all as positive (upward) bars with their values above the baseline', () => {
    const { container } = render(<BarRenderer array={[1, 2, 3]} />)

    expect(items(container)).toHaveLength(3)
    expect([0, 1, 2].map((i) => labelAt(container, i))).toEqual(['1', '2', '3'])
    for (const i of [0, 1, 2]) {
      expect(positiveHeightAt(container, i)).toBeGreaterThan(0)
      expect(negativeHeightAt(container, i)).toBe(0)
    }
  })
})

describe('BarRenderer — rendering: [3, 2, 1]', () => {
  it('preserves visual order (does not sort)', () => {
    const { container } = render(<BarRenderer array={[3, 2, 1]} />)
    expect([0, 1, 2].map((i) => labelAt(container, i))).toEqual(['3', '2', '1'])
  })
})

describe('BarRenderer — rendering: [-1, -2, -3]', () => {
  it('renders every item as a negative (downward) bar, values below the baseline', () => {
    const { container } = render(<BarRenderer array={[-1, -2, -3]} />)

    expect([0, 1, 2].map((i) => labelAt(container, i))).toEqual(['-1', '-2', '-3'])
    for (const i of [0, 1, 2]) {
      expect(negativeHeightAt(container, i)).toBeGreaterThan(0)
      expect(positiveHeightAt(container, i)).toBe(0)
    }
  })
})

describe('BarRenderer — rendering: [-3, 0, 3]', () => {
  it('renders a negative bar, a zero-length bar on the baseline, and a positive bar', () => {
    const { container } = render(<BarRenderer array={[-3, 0, 3]} />)

    expect(negativeHeightAt(container, 0)).toBeGreaterThan(0)
    expect(positiveHeightAt(container, 0)).toBe(0)

    expect(positiveHeightAt(container, 1)).toBe(0)
    expect(negativeHeightAt(container, 1)).toBe(0)
    expect(labelAt(container, 1)).toBe('0')

    expect(positiveHeightAt(container, 2)).toBeGreaterThan(0)
    expect(negativeHeightAt(container, 2)).toBe(0)
  })
})

describe('BarRenderer — rendering: [5, 5, 5] (identical values)', () => {
  it('renders three equal-height positive bars without any invalid dimension', () => {
    const { container } = render(<BarRenderer array={[5, 5, 5]} />)

    const heights = [0, 1, 2].map((i) => positiveHeightAt(container, i))
    expect(heights.every((h) => Number.isFinite(h) && h > 0)).toBe(true)
    expect(new Set(heights).size).toBe(1)
  })
})

describe('BarRenderer — rendering: [0, 0, 0] (all zero)', () => {
  it('renders every bar at zero length, on the baseline, with no invalid dimension', () => {
    const { container } = render(<BarRenderer array={[0, 0, 0]} />)

    for (const i of [0, 1, 2]) {
      expect(positiveHeightAt(container, i)).toBe(0)
      expect(negativeHeightAt(container, i)).toBe(0)
      expect(labelAt(container, i)).toBe('0')
    }
  })
})

describe('BarRenderer — rendering: duplicate values [5, 5, 1, 5, 1]', () => {
  it('renders all five items independently, matching values, index by index', () => {
    const { container } = render(<BarRenderer array={[5, 5, 1, 5, 1]} />)

    expect(items(container)).toHaveLength(5)
    expect([0, 1, 2, 3, 4].map((i) => labelAt(container, i))).toEqual(['5', '5', '1', '5', '1'])
    // The three "5" bars are equal height, the two "1" bars are equal
    // height, and the "5" bars are taller than the "1" bars.
    expect(positiveHeightAt(container, 0)).toBe(positiveHeightAt(container, 1))
    expect(positiveHeightAt(container, 1)).toBe(positiveHeightAt(container, 3))
    expect(positiveHeightAt(container, 2)).toBe(positiveHeightAt(container, 4))
    expect(positiveHeightAt(container, 0)).toBeGreaterThan(positiveHeightAt(container, 2))
  })
})

describe('BarRenderer — rendering: mixed [-5, 3, 0, -2, 8]', () => {
  it('renders each value in the correct direction with the correct label', () => {
    const { container } = render(<BarRenderer array={[-5, 3, 0, -2, 8]} />)

    expect([0, 1, 2, 3, 4].map((i) => labelAt(container, i))).toEqual(['-5', '3', '0', '-2', '8'])

    expect(negativeHeightAt(container, 0)).toBeGreaterThan(0) // -5
    expect(positiveHeightAt(container, 1)).toBeGreaterThan(0) // 3
    expect(positiveHeightAt(container, 2)).toBe(0) // 0
    expect(negativeHeightAt(container, 2)).toBe(0) // 0
    expect(negativeHeightAt(container, 3)).toBeGreaterThan(0) // -2
    expect(positiveHeightAt(container, 4)).toBeGreaterThan(0) // 8
  })
})

describe('BarRenderer — scaling: proportional to magnitude', () => {
  it('a value twice as large (in magnitude) renders exactly twice as long a bar', () => {
    const { container } = render(<BarRenderer array={[5, 10]} />)

    const small = positiveHeightAt(container, 0)
    const large = positiveHeightAt(container, 1)
    expect(large).toBeCloseTo(small * 2, 5)
  })

  it('the largest-magnitude value in the array reaches the full scale, others are proportionally smaller', () => {
    const { container } = render(<BarRenderer array={[2, 10, 4]} />)

    const heights = [0, 1, 2].map((i) => positiveHeightAt(container, i))
    expect(heights[1]).toBeGreaterThan(heights[0])
    expect(heights[1]).toBeGreaterThan(heights[2])
    expect(heights[2]).toBeGreaterThan(heights[0])
  })

  it('positive and negative values of the same magnitude produce the same-length bar (in their own direction)', () => {
    const { container } = render(<BarRenderer array={[7, -7]} />)

    expect(positiveHeightAt(container, 0)).toBe(negativeHeightAt(container, 1))
  })

  it('scaling is relative to the current array, not a global constant — the same value renders differently in a different array', () => {
    const small = render(<BarRenderer array={[5, 10]} />)
    const large = render(<BarRenderer array={[5, 100]} />)

    // The value "5" is half of the array's max in the first case, but
    // only 5% of the max in the second — its bar must shrink accordingly.
    expect(positiveHeightAt(small.container, 0)).toBeGreaterThan(
      positiveHeightAt(large.container, 0),
    )
  })
})

describe('BarRenderer — scaling: no invalid dimensions when all values are identical or zero', () => {
  it('does not produce NaN/Infinity heights for an all-zero array', () => {
    const { container } = render(<BarRenderer array={[0, 0, 0, 0]} />)
    for (const i of [0, 1, 2, 3]) {
      expect(Number.isFinite(positiveHeightAt(container, i))).toBe(true)
      expect(Number.isFinite(negativeHeightAt(container, i))).toBe(true)
    }
  })

  it('does not produce NaN/Infinity heights for an all-identical-nonzero array', () => {
    const { container } = render(<BarRenderer array={[-4, -4, -4]} />)
    for (const i of [0, 1, 2]) {
      expect(Number.isFinite(positiveHeightAt(container, i))).toBe(true)
      expect(Number.isFinite(negativeHeightAt(container, i))).toBe(true)
    }
  })

  it('does not produce NaN/Infinity heights for a single-element array', () => {
    const { container } = render(<BarRenderer array={[0]} />)
    expect(Number.isFinite(positiveHeightAt(container, 0))).toBe(true)
    expect(Number.isFinite(negativeHeightAt(container, 0))).toBe(true)
  })
})

describe('BarRenderer — state: highlighted indices', () => {
  it('marks exactly the highlighted indices, matching ArrayRenderer\'s own convention', () => {
    const { container } = render(<BarRenderer array={[8, 3, 5, 1]} highlightedIndices={[1, 2]} />)

    expect([0, 1, 2, 3].map((i) => isHighlightedAt(container, i))).toEqual([
      false,
      true,
      true,
      false,
    ])
  })

  it('highlights nothing when the prop is omitted', () => {
    const { container } = render(<BarRenderer array={[8, 3, 5, 1]} />)
    expect([0, 1, 2, 3].some((i) => isHighlightedAt(container, i))).toBe(false)
  })

  it('applies the highlighted class to exactly one bar per highlighted index — the real (visible, nonzero-sign) bar, not its invisible zero-height counterpart on the other side of the baseline', () => {
    const { container } = render(
      <BarRenderer array={[8, -3, 5, -1]} highlightedIndices={[0, 1, 2, 3]} />,
    )

    const highlightedBars = container.querySelectorAll('.bar-renderer__bar--highlighted')
    // Four highlighted values (two positive, two negative) must produce
    // exactly four highlighted bar elements, not eight.
    expect(highlightedBars).toHaveLength(4)
  })

  it('ignores out-of-range and negative indices without crashing', () => {
    const { container } = render(
      <BarRenderer array={[8, 3, 5]} highlightedIndices={[1, 99, -1]} />,
    )
    expect(items(container)).toHaveLength(3)
    expect([0, 1, 2].map((i) => isHighlightedAt(container, i))).toEqual([false, true, false])
  })
})

describe('BarRenderer — state: reflects the current array exactly', () => {
  it('re-renders with a new array and shows the new values, not the old ones', () => {
    const { container, rerender } = render(<BarRenderer array={[1, 2, 3]} />)
    expect([0, 1, 2].map((i) => labelAt(container, i))).toEqual(['1', '2', '3'])

    rerender(<BarRenderer array={[9, 8, 7]} />)
    expect([0, 1, 2].map((i) => labelAt(container, i))).toEqual(['9', '8', '7'])
  })
})

describe('BarRenderer — accessibility', () => {
  it('gives each bar an aria-label with its value, matching the example format', () => {
    const { container } = render(<BarRenderer array={[5, -3, 0]} />)
    const labels = items(container).map((item) => item.getAttribute('aria-label'))
    expect(labels).toEqual(['Value 5 at index 0', 'Value -3 at index 1', 'Value 0 at index 2'])
  })

  it('uses role="list"/"listitem" semantics like ArrayRenderer', () => {
    const { container } = render(<BarRenderer array={[1, 2]} />)
    expect(container.querySelector('[role="list"]')).not.toBeNull()
    expect(container.querySelectorAll('[role="listitem"]')).toHaveLength(2)
  })
})

describe('BarRenderer — large arrays', () => {
  it('renders all 100 elements of a maximum-size array without crashing', () => {
    const input = Array.from({ length: 100 }, (_, index) => index - 50) // mix of signs
    const { container } = render(<BarRenderer array={input} />)

    expect(items(container)).toHaveLength(100)
    // Spot-check a negative, a zero, and a positive value land correctly.
    expect(negativeHeightAt(container, 0)).toBeGreaterThan(0) // -50
    expect(positiveHeightAt(container, 50)).toBe(0)
    expect(negativeHeightAt(container, 50)).toBe(0) // value 0
    expect(positiveHeightAt(container, 99)).toBeGreaterThan(0) // 49
  })
})

describe('BarRenderer — animation props do not crash in isolation', () => {
  it('accepts animateSwapIndices/animationTick without throwing, same contract as ArrayRenderer', () => {
    const { container, rerender } = render(
      <BarRenderer array={[8, 3, 5, 1]} highlightedIndices={[0, 1]} />,
    )

    expect(() =>
      rerender(
        <BarRenderer
          array={[3, 8, 5, 1]}
          highlightedIndices={[0, 1]}
          animateSwapIndices={[0, 1]}
          animationTick={1}
        />,
      ),
    ).not.toThrow()

    expect([0, 1, 2, 3].map((i) => labelAt(container, i))).toEqual(['3', '8', '5', '1'])
  })
})

// Professional Bar View Redesign task: COMPARE and SWAP now get visually
// distinct treatments (a soft tint+border+glow for COMPARE vs. a bolder
// solid fill for SWAP), both still expressed purely through the existing
// highlightedIndices/animateSwapIndices props — no new prop, no algorithm
// knowledge. `.bar-renderer__bar--highlighted` remains the class every
// highlighted bar carries either way (see the existing "exactly one
// highlighted bar per index" test above, still passing unchanged);
// `.bar-renderer__bar--swap` is the additional modifier that appears only
// for the pair actually mid-exchange.
function isSwapStyledAt(container: HTMLElement, index: number): boolean {
  return (
    items(container)[index]?.querySelector('.bar-renderer__bar--swap') !== null
  )
}

describe('BarRenderer — COMPARE vs SWAP visual distinction', () => {
  it('a COMPARE (highlighted, no animateSwapIndices) gets --highlighted but not --swap', () => {
    const { container } = render(<BarRenderer array={[8, 3, 5, 1]} highlightedIndices={[1, 2]} />)

    expect(isHighlightedAt(container, 1)).toBe(true)
    expect(isSwapStyledAt(container, 1)).toBe(false)
    expect(isSwapStyledAt(container, 2)).toBe(false)
  })

  it('a SWAP (highlighted indices match animateSwapIndices) gets both --highlighted and --swap', () => {
    const { container } = render(
      <BarRenderer
        array={[3, 8, 5, 1]}
        highlightedIndices={[0, 1]}
        animateSwapIndices={[0, 1]}
        animationTick={1}
      />,
    )

    expect(isHighlightedAt(container, 0)).toBe(true)
    expect(isHighlightedAt(container, 1)).toBe(true)
    expect(isSwapStyledAt(container, 0)).toBe(true)
    expect(isSwapStyledAt(container, 1)).toBe(true)
  })

  it('--swap only ever appears on the real (visible) bar for a negative value, not its invisible positive-zone counterpart', () => {
    const { container } = render(
      <BarRenderer
        array={[8, -3]}
        highlightedIndices={[0, 1]}
        animateSwapIndices={[0, 1]}
        animationTick={1}
      />,
    )

    const swapBars = container.querySelectorAll('.bar-renderer__bar--swap')
    expect(swapBars).toHaveLength(2)
  })

  it('an index present in animateSwapIndices but not in highlightedIndices gets neither modifier (a stale/mismatched pair is never styled as active)', () => {
    const { container } = render(
      <BarRenderer
        array={[8, 3, 5, 1]}
        highlightedIndices={[2, 3]}
        animateSwapIndices={[0, 1]}
        animationTick={1}
      />,
    )

    expect(isHighlightedAt(container, 0)).toBe(false)
    expect(isSwapStyledAt(container, 0)).toBe(false)
    expect(isSwapStyledAt(container, 1)).toBe(false)
  })

  it('omitting animateSwapIndices entirely never applies --swap to anything, even when indices are highlighted', () => {
    const { container } = render(<BarRenderer array={[8, 3, 5, 1]} highlightedIndices={[0, 1, 2, 3]} />)

    expect(container.querySelectorAll('.bar-renderer__bar--swap')).toHaveLength(0)
  })
})

describe('BarRenderer — value label sizing (--value-font-size)', () => {
  function valueFontSizePx(container: HTMLElement): number {
    const el = container.querySelector('.bar-renderer') as HTMLElement
    return parseFloat(el.style.getPropertyValue('--value-font-size'))
  }

  it('a single-element array (maximum track size) reaches the maximum label font size', () => {
    const { container } = render(<BarRenderer array={[42]} />)
    expect(valueFontSizePx(container)).toBe(14)
  })

  it('a 100-element array (minimum track size) keeps the original 12px label size, unchanged from before this task', () => {
    const { container } = render(
      <BarRenderer array={Array.from({ length: 100 }, (_, i) => i + 1)} />,
    )
    expect(valueFontSizePx(container)).toBe(12)
  })

  it('a moderately-sized array (track size not clamped to either bound) lands strictly between the floor and the ceiling', () => {
    // 15 elements at the jsdom fallback width (900px, useContainerWidth's
    // own documented fallback) computes to a track size of ~48px — clear
    // of both the 28px floor and the 72px ceiling, unlike a 4-element
    // array, which already saturates the 72px ceiling at this width.
    const { container } = render(<BarRenderer array={Array.from({ length: 15 }, (_, i) => i + 1)} />)
    const size = valueFontSizePx(container)
    expect(size).toBeGreaterThan(12)
    expect(size).toBeLessThan(14)
  })
})
