// Dynamic Visualization Sizing task: unit tests for computeItemSize, the
// pure formula ArrayRenderer/BarRenderer both use to size their per-index
// elements. Deliberately DOM-free — jsdom (this project's test
// environment) does not compute real layout, so clientWidth/
// getBoundingClientRect always read as 0 regardless of what CSS actually
// does in a real browser. Testing the pure math directly, rather than
// through a rendered component's measured pixels, is exactly what the
// task itself asks for ("prefer testing stable... computed layout
// behavior rather than brittle pixel snapshots"). Real-browser pixel
// behavior is covered by live Playwright verification instead (see the
// task's final report).
import { describe, expect, it } from 'vitest'
import { computeItemSize } from './itemSizing'

const OPTIONS = { min: 42, max: 84, gap: 12 }

describe('computeItemSize — few elements produce larger items than many elements', () => {
  it('3 items sharing 900px are sized larger than 50 items sharing the same 900px', () => {
    const few = computeItemSize(3, 900, OPTIONS)
    const many = computeItemSize(50, 900, OPTIONS)

    expect(few).toBeGreaterThan(many)
  })

  it('a single item is sized larger than 10 items sharing the same width', () => {
    const one = computeItemSize(1, 900, OPTIONS)
    const ten = computeItemSize(10, 900, OPTIONS)

    expect(one).toBeGreaterThan(ten)
  })
})

describe('computeItemSize — stays within [min, max] bounds', () => {
  it('never returns less than min, however many items are packed into a narrow width', () => {
    const size = computeItemSize(100, 375, OPTIONS)

    expect(size).toBeGreaterThanOrEqual(OPTIONS.min)
  })

  it('never returns more than max, however few items share a very wide space', () => {
    const size = computeItemSize(1, 5000, OPTIONS)

    expect(size).toBeLessThanOrEqual(OPTIONS.max)
  })

  it('a single element in a generous but ordinary container hits the max, not something larger', () => {
    const size = computeItemSize(1, 900, OPTIONS)

    expect(size).toBe(OPTIONS.max)
  })
})

describe('computeItemSize — 100 elements do not overflow', () => {
  it('100 items clamp to min, and 100 * min-plus-gap safely exceeds a typical container (relying on wrap, not shrinking below min)', () => {
    const size = computeItemSize(100, 900, OPTIONS)

    expect(size).toBe(OPTIONS.min)
    // The formula itself never tries to shrink below min to "make it
    // fit" in one row — overflow is instead avoided by the caller's own
    // flex-wrap layout, which is a CSS concern verified live in the
    // browser rather than here.
  })

  it('100 items still clamp to min even in a very narrow (375px-class) container', () => {
    const size = computeItemSize(100, 343, OPTIONS)

    expect(size).toBe(OPTIONS.min)
  })
})

describe('computeItemSize — edge cases', () => {
  it('zero items falls back to min rather than dividing by zero', () => {
    expect(computeItemSize(0, 900, OPTIONS)).toBe(OPTIONS.min)
  })

  it('a negative or zero available width falls back to min rather than a negative size', () => {
    expect(computeItemSize(10, 0, OPTIONS)).toBe(OPTIONS.min)
    expect(computeItemSize(10, -100, OPTIONS)).toBe(OPTIONS.min)
  })

  it('never returns NaN or Infinity for any of the tested counts', () => {
    for (const count of [0, 1, 3, 10, 50, 100]) {
      const size = computeItemSize(count, 900, OPTIONS)
      expect(Number.isFinite(size)).toBe(true)
    }
  })
})

describe('computeItemSize — monotonic: more elements never means a larger item', () => {
  it('size is non-increasing as count grows, for a fixed available width', () => {
    const counts = [1, 2, 3, 5, 10, 20, 50, 100]
    const sizes = counts.map((count) => computeItemSize(count, 900, OPTIONS))

    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]).toBeLessThanOrEqual(sizes[i - 1])
    }
  })
})

describe('computeItemSize — respects the gap between items', () => {
  it('a larger gap leaves less room per item, so the computed size is smaller', () => {
    const tightGap = computeItemSize(10, 500, { min: 10, max: 200, gap: 4 })
    const wideGap = computeItemSize(10, 500, { min: 10, max: 200, gap: 40 })

    expect(wideGap).toBeLessThan(tightGap)
  })
})
