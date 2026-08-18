// Dynamic Visualization Sizing task: focused tests for BarRenderer's
// per-track dynamic sizing. See ArrayRenderer.sizing.test.tsx's own doc
// comment for why useContainerWidth's fixed jsdom fallback (900px) makes
// the resulting --track-size fully deterministic here — this file
// verifies BarRenderer actually wires the computed value onto the DOM and
// that the height/value-magnitude scaling this project already had
// (BarRenderer.test.tsx) remains completely untouched by this task, since
// width and height are deliberately separate concerns (task section 5).
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import BarRenderer from './BarRenderer'

function trackSizePx(container: HTMLElement): number {
  const el = container.querySelector('.bar-renderer') as HTMLElement
  return parseFloat(el.style.getPropertyValue('--track-size'))
}

function positiveHeightAt(container: HTMLElement, index: number): number {
  const items = Array.from(container.querySelectorAll('.bar-renderer__item'))
  const bar = items[index]?.querySelector(
    '.bar-renderer__zone--positive .bar-renderer__bar',
  ) as HTMLElement | null
  return bar ? parseFloat(bar.style.height || '0') : NaN
}

function negativeHeightAt(container: HTMLElement, index: number): number {
  const items = Array.from(container.querySelectorAll('.bar-renderer__item'))
  const bar = items[index]?.querySelector(
    '.bar-renderer__zone--negative .bar-renderer__bar',
  ) as HTMLElement | null
  return bar ? parseFloat(bar.style.height || '0') : NaN
}

describe('BarRenderer — dynamic sizing: fewer elements produce wider tracks', () => {
  it('a 4-element array gets a larger --track-size than a 50-element array', () => {
    const few = render(<BarRenderer array={[5, 3, 8, 1]} />)
    const many = render(<BarRenderer array={Array.from({ length: 50 }, (_, i) => i + 1)} />)

    expect(trackSizePx(few.container)).toBeGreaterThan(trackSizePx(many.container))
  })

  it('a single-element array reaches the maximum track size', () => {
    const { container } = render(<BarRenderer array={[42]} />)

    expect(trackSizePx(container)).toBe(72)
  })
})

describe('BarRenderer — dynamic sizing: stays within bounds', () => {
  it('100 elements clamp to the minimum track size, not something smaller', () => {
    const { container } = render(
      <BarRenderer array={Array.from({ length: 100 }, (_, i) => i + 1)} />,
    )

    expect(trackSizePx(container)).toBe(28)
  })
})

describe('BarRenderer — dynamic sizing: width and height scaling stay independent', () => {
  it('[2, 100, 5]: bar heights differ by value magnitude while every track shares the same width', () => {
    const { container } = render(<BarRenderer array={[2, 100, 5]} />)

    const heights = [0, 1, 2].map((i) => positiveHeightAt(container, i))
    // Height still tracks magnitude relative to the array's max, exactly
    // as before this task (BarRenderer.test.tsx's own "scaling:
    // proportional to magnitude" tests cover this in more depth) — this
    // is a targeted check that raising MAX_BAR_LENGTH_PX didn't disturb
    // the proportionality itself.
    expect(heights[1]).toBeGreaterThan(heights[0])
    expect(heights[1]).toBeGreaterThan(heights[2])
    expect(heights[2]).toBeGreaterThan(heights[0])

    // But all three items share one single --track-size (this is a
    // per-container property, not computed per item), so their tracks
    // are identically wide regardless of how tall their bars are.
    const items = Array.from(container.querySelectorAll('.bar-renderer__track'))
    expect(items).toHaveLength(3)
  })

  it('the tallest bar in [2, 100, 5] reaches the new, taller MAX_BAR_LENGTH_PX ceiling', () => {
    const { container } = render(<BarRenderer array={[2, 100, 5]} />)

    // 100 is the array's max magnitude, so its bar reaches the full
    // scale — confirms the height ceiling was actually raised for the
    // "meaningful minimum/target height" requirement (task section 4),
    // not just the width.
    expect(positiveHeightAt(container, 1)).toBe(180)
  })
})

describe('BarRenderer — dynamic sizing: negative values still scale symmetrically', () => {
  it('positive and negative values of equal magnitude still produce equal-length bars after the height increase', () => {
    const { container } = render(<BarRenderer array={[7, -7]} />)

    expect(positiveHeightAt(container, 0)).toBe(negativeHeightAt(container, 1))
    expect(positiveHeightAt(container, 0)).toBe(180)
  })
})

describe('BarRenderer — dynamic sizing: empty array', () => {
  it('does not crash, and renders no sizing container at all', () => {
    const { container } = render(<BarRenderer array={[]} />)

    expect(container.querySelector('.bar-renderer')).toBeNull()
    expect(container.querySelector('.bar-renderer__empty')).not.toBeNull()
  })
})
