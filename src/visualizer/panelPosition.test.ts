// Draggable Statistics/Code View Panels task: focused, DOM-free unit tests
// for the pure boundary-clamping formula, following the same pattern
// itemSizing.test.ts already established for computeItemSize — jsdom does
// not compute real layout, so the underlying math is verified directly
// here, independent of any component/pointer-event wiring.
import { describe, expect, it } from 'vitest'
import { clampPanelPosition } from './panelPosition'

const BOUNDS = { containerWidth: 800, containerHeight: 600, panelWidth: 260, panelHeight: 200 }

describe('clampPanelPosition — inside bounds is left untouched', () => {
  it('a position that already fits entirely within the container is unchanged', () => {
    expect(clampPanelPosition({ x: 100, y: 50 }, BOUNDS)).toEqual({ x: 100, y: 50 })
  })

  it('the origin (0, 0) is always valid', () => {
    expect(clampPanelPosition({ x: 0, y: 0 }, BOUNDS)).toEqual({ x: 0, y: 0 })
  })

  it('the exact bottom-right resting position (flush against both edges) is unchanged', () => {
    expect(clampPanelPosition({ x: 540, y: 400 }, BOUNDS)).toEqual({ x: 540, y: 400 })
  })
})

describe('clampPanelPosition — clamps the left/top edges', () => {
  it('a negative x is clamped to 0', () => {
    expect(clampPanelPosition({ x: -50, y: 50 }, BOUNDS)).toEqual({ x: 0, y: 50 })
  })

  it('a negative y is clamped to 0', () => {
    expect(clampPanelPosition({ x: 50, y: -200 }, BOUNDS)).toEqual({ x: 50, y: 0 })
  })

  it('a wildly negative position is clamped to the origin on both axes', () => {
    expect(clampPanelPosition({ x: -9999, y: -9999 }, BOUNDS)).toEqual({ x: 0, y: 0 })
  })
})

describe('clampPanelPosition — clamps the right/bottom edges, accounting for panel size', () => {
  it('x is clamped so the panel’s right edge never passes the container’s right edge', () => {
    // containerWidth (800) - panelWidth (260) = 540 is the maximum valid x.
    expect(clampPanelPosition({ x: 700, y: 50 }, BOUNDS)).toEqual({ x: 540, y: 50 })
  })

  it('y is clamped so the panel’s bottom edge never passes the container’s bottom edge', () => {
    // containerHeight (600) - panelHeight (200) = 400 is the maximum valid y.
    expect(clampPanelPosition({ x: 50, y: 550 }, BOUNDS)).toEqual({ x: 50, y: 400 })
  })

  it('a wildly large position is clamped to the bottom-right resting position on both axes', () => {
    expect(clampPanelPosition({ x: 999999, y: 999999 }, BOUNDS)).toEqual({ x: 540, y: 400 })
  })
})

describe('clampPanelPosition — takes the panel’s own dimensions into account', () => {
  it('a larger panel has a smaller valid range than a smaller panel, for the same container', () => {
    const smallPanel = clampPanelPosition(
      { x: 999, y: 999 },
      { containerWidth: 800, containerHeight: 600, panelWidth: 100, panelHeight: 100 },
    )
    const largePanel = clampPanelPosition(
      { x: 999, y: 999 },
      { containerWidth: 800, containerHeight: 600, panelWidth: 400, panelHeight: 400 },
    )

    expect(smallPanel).toEqual({ x: 700, y: 500 })
    expect(largePanel).toEqual({ x: 400, y: 200 })
  })
})

describe('clampPanelPosition — degenerate/unmeasured containers', () => {
  it('a container smaller than the panel (e.g. not yet measured, both 0) pins to the origin rather than a negative range', () => {
    expect(
      clampPanelPosition(
        { x: 50, y: 50 },
        { containerWidth: 0, containerHeight: 0, panelWidth: 260, panelHeight: 200 },
      ),
    ).toEqual({ x: 0, y: 0 })
  })

  it('a container only slightly smaller than the panel still pins to the origin, not a negative value', () => {
    expect(
      clampPanelPosition(
        { x: 50, y: 50 },
        { containerWidth: 100, containerHeight: 100, panelWidth: 260, panelHeight: 200 },
      ),
    ).toEqual({ x: 0, y: 0 })
  })
})
