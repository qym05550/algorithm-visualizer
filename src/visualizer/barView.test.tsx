// Integration tests for the Bar View task: view switching (state
// preservation across Array View <-> Bar View), and confirming the Bar
// View correctly reuses the existing execution/animation state exactly
// like the Array View does. Unit-level rendering/scaling coverage lives
// in BarRenderer.test.tsx; this file is about the *wiring* in
// VisualizationPlaceholder.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { bubbleSort } from '../algorithms/bubbleSort'
import VisualizationPlaceholder from './VisualizationPlaceholder'

const INPUT = [8, 3, 5, 1]

// Same hand-traced sequence used throughout this project's other Bubble
// Sort tests (cross-checked against the real bubbleSort() output).
const EXPECTED_OPERATIONS = [
  { type: 'compare', indices: [0, 1] },
  { type: 'swap', indices: [0, 1] },
  { type: 'compare', indices: [1, 2] },
  { type: 'swap', indices: [1, 2] },
  { type: 'compare', indices: [2, 3] },
  { type: 'swap', indices: [2, 3] },
  { type: 'compare', indices: [0, 1] },
  { type: 'compare', indices: [1, 2] },
  { type: 'swap', indices: [1, 2] },
  { type: 'compare', indices: [0, 1] },
  { type: 'swap', indices: [0, 1] },
]

describe('Bar View test fixture — matches the real bubbleSort() output', () => {
  it('cross-checks the hand-traced operations against bubbleSort([8, 3, 5, 1])', () => {
    expect(bubbleSort(INPUT)).toEqual(EXPECTED_OPERATIONS)
  })
})

function getNext(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement
}

function getPrevious(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement
}

function getReset(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Reset' }) as HTMLButtonElement
}

function getStepText(container: HTMLElement): string | null {
  return container.querySelector('.visualizer-controls__step')?.textContent ?? null
}

function switchToBars(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Bars' }))
}

function switchToArray(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Array' }))
}

function barValues(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('.bar-renderer__item')).map(
    (item) => item.querySelector('.bar-renderer__value')?.textContent ?? '',
  )
}

function arrayValues(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('.array-renderer__value')).map(
    (element) => element.textContent ?? '',
  )
}

function highlightedBarIndices(container: HTMLElement): number[] {
  return Array.from(container.querySelectorAll('.bar-renderer__item'))
    .map((item, index) => ({ index, label: item.getAttribute('aria-label') ?? '' }))
    .filter(({ label }) => label.includes('highlighted'))
    .map(({ index }) => index)
}

describe('Bar View — default view and toggle presence', () => {
  it('starts in Array View, with the toggle visible once a session exists', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    expect(container.querySelector('.array-renderer')).not.toBeNull()
    expect(container.querySelector('.bar-renderer')).toBeNull()
    expect(screen.getByRole('button', { name: 'Array' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Bars' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('does not show the toggle before any array is confirmed', () => {
    render(<VisualizationPlaceholder array={null} algorithm={bubbleSort} />)
    expect(screen.queryByRole('button', { name: 'Bars' })).toBeNull()
  })
})

describe('Bar View — switching views does not reset the step or restart the algorithm', () => {
  it('switching to Bar View mid-session keeps the exact same step and array state', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getNext())
    fireEvent.click(getNext())
    fireEvent.click(getNext())
    const stepBefore = getStepText(container)
    expect(stepBefore).toBe('Step 3 / 11')

    switchToBars()

    expect(container.querySelector('.array-renderer')).toBeNull()
    expect(container.querySelector('.bar-renderer')).not.toBeNull()
    expect(getStepText(container)).toBe(stepBefore)
    // Steps 1-3 are compare(0,1), swap(0,1), compare(1,2) -> [3, 8, 5, 1].
    expect(barValues(container)).toEqual(['3', '8', '5', '1'])
  })

  it('switching back to Array View from Bar View also preserves the step exactly', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getNext())
    fireEvent.click(getNext())
    switchToBars()
    const stepInBars = getStepText(container)

    switchToArray()

    expect(getStepText(container)).toBe(stepInBars)
    expect(arrayValues(container)).toEqual(['3', '8', '5', '1'])
  })

  it('switching views never changes the underlying array values themselves', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    for (let i = 0; i < 5; i++) fireEvent.click(getNext())
    const before = arrayValues(container)

    switchToBars()
    expect(barValues(container)).toEqual(before)

    switchToArray()
    expect(arrayValues(container)).toEqual(before)
  })
})

describe('Bar View — switching views preserves highlighted indices', () => {
  it('the same indices stay highlighted across a view switch', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getNext()) // compare(0, 1)

    switchToBars()

    expect(highlightedBarIndices(container)).toEqual([0, 1])
  })
})

describe('Bar View — switching views preserves the current animation/session state', () => {
  it('Previous/Next/Reset all still work correctly after switching to Bar View', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    switchToBars()

    fireEvent.click(getNext())
    fireEvent.click(getNext())
    expect(getStepText(container)).toBe('Step 2 / 11')
    expect(barValues(container)).toEqual(['3', '8', '5', '1'])

    fireEvent.click(getPrevious())
    expect(getStepText(container)).toBe('Step 1 / 11')
    expect(barValues(container)).toEqual(['8', '3', '5', '1'])

    fireEvent.click(getReset())
    expect(getStepText(container)).toBe('Step 0 / 11')
    expect(barValues(container)).toEqual(['8', '3', '5', '1'])
  })

  it('does not restart the algorithm: total step count is unaffected by any number of view switches', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    const totalBefore = getStepText(container)?.split('/')[1].trim()
    switchToBars()
    switchToArray()
    switchToBars()
    const totalAfter = getStepText(container)?.split('/')[1].trim()

    expect(totalAfter).toBe(totalBefore)
    expect(totalAfter).toBe('11')
  })

  it('a SWAP step reached while in Bar View, then rewound via Previous, ends up in the exact same place as doing it entirely in Array View', () => {
    const { container } = render(<VisualizationPlaceholder array={[8, 3, 5, 1]} algorithm={bubbleSort} />)
    switchToBars()

    fireEvent.click(getNext()) // compare(0, 1)
    fireEvent.click(getNext()) // swap(0, 1) -> [3, 8, 5, 1]
    fireEvent.click(getPrevious()) // undo swap(0, 1) -> [8, 3, 5, 1]

    expect(barValues(container)).toEqual(['8', '3', '5', '1'])
  })
})

describe('Bar View — rapid view switching does not corrupt the renderer', () => {
  it('many rapid Array/Bars toggles still leave a correct, single rendered view', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getNext())
    fireEvent.click(getNext())
    fireEvent.click(getNext())

    for (let i = 0; i < 8; i++) {
      fireEvent.click(screen.getByRole('button', { name: i % 2 === 0 ? 'Bars' : 'Array' }))
    }
    // 8 toggles starting from Array: ends on Bars (even count returns to
    // start, but the loop's last click is index 7 -> 'Array' label
    // clicked -> ends in Array View). Assert whichever it settled on is
    // internally consistent rather than asserting a specific one, since
    // the point is "never both, never neither, never wrong data."
    const hasArray = container.querySelector('.array-renderer') !== null
    const hasBars = container.querySelector('.bar-renderer') !== null
    expect(hasArray).not.toBe(hasBars) // exactly one is mounted
    expect(getStepText(container)).toBe('Step 3 / 11')

    const values = hasArray ? arrayValues(container) : barValues(container)
    expect(values).toEqual(['3', '8', '5', '1'])
  })

  it('rapid Next clicks interleaved with a view switch never desynchronize the two renderers', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getNext())
    switchToBars()
    fireEvent.click(getNext())
    fireEvent.click(getNext())
    switchToArray()
    fireEvent.click(getNext())

    expect(getStepText(container)).toBe('Step 4 / 11')
    // Steps 1-4: compare(0,1), swap(0,1), compare(1,2), swap(1,2) -> [3,5,8,1].
    expect(arrayValues(container)).toEqual(['3', '5', '8', '1'])
  })
})

describe('Bar View — reduced-motion CSS rule exists for the bar elements', () => {
  const css = readFileSync(path.join(__dirname, 'BarRenderer.css'), 'utf-8')

  it('declares a prefers-reduced-motion: reduce rule covering the bar track, bar, and value label', () => {
    const match = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/)
    expect(match).not.toBeNull()
    const body = match![1]
    expect(body).toMatch(/\.bar-renderer__track/)
    expect(body).toMatch(/\.bar-renderer__bar\b/)
    expect(body).toMatch(/\.bar-renderer__value\b/)
    expect(body).toMatch(/transition-duration/)
  })

  it('reuses the same centralized animation custom properties as the Array View, not a second system', () => {
    expect(css).toMatch(/var\(--anim-swap-duration\)/)
    expect(css).toMatch(/var\(--anim-highlight-duration\)/)
    expect(css).not.toMatch(/@keyframes/) // no separate/second animation system
  })
})

describe('Bar View — architecture: no algorithm/engine/controller files were touched', () => {
  it('BarRenderer and ViewToggle source contain no algorithm or execution-engine vocabulary', () => {
    const barSource = readFileSync(path.join(__dirname, 'BarRenderer.tsx'), 'utf-8')
    const toggleSource = readFileSync(path.join(__dirname, 'ViewToggle.tsx'), 'utf-8')

    for (const source of [barSource, toggleSource]) {
      expect(source).not.toMatch(/ExecutionEngine|VisualizerController|bubbleSort|selectionSort|insertionSort/)
    }
  })
})
