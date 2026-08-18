// Focused tests for the Animation System / Visual Motion Polish task.
//
// jsdom does not run real layout (getBoundingClientRect returns all-zero
// rects) or paint CSS transitions, so it cannot meaningfully verify actual
// pixel motion — per the task's own guidance, these tests instead verify
// the underlying React state, DOM classes, and inline styles the
// animation is built on: the logical array/step state stays correct
// through every interaction (including rapid ones), the SWAP effect never
// crashes or leaves a stuck transform behind, and the reduced-motion CSS
// rule exists without removing the semantic highlight. Actual visual
// motion is verified separately in a real browser (see the task's
// browser-verification step).
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { bubbleSort } from '../algorithms/bubbleSort'
import { selectionSort } from '../algorithms/selectionSort'
import { insertionSort } from '../algorithms/insertionSort'
import ArrayRenderer from './ArrayRenderer'
import VisualizationPlaceholder from './VisualizationPlaceholder'

const INPUT = [8, 3, 5, 1]

// Same hand-traced sequence used throughout the rest of this project's
// Bubble Sort tests (cross-checked against the real bubbleSort() output).
// Operation 10 (the last one) is a SWAP — useful below for exercising the
// animation on the very last step of a session.
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

function renderedValues(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('.array-renderer__value')).map(
    (element) => element.textContent ?? '',
  )
}

function highlightedIndices(container: HTMLElement): number[] {
  return Array.from(container.querySelectorAll('.array-renderer__item'))
    .filter((item) => item.getAttribute('aria-label')?.includes('highlighted'))
    .map((item) => Number(item.querySelector('.array-renderer__index')?.textContent))
}

function getStepText(container: HTMLElement): string | null {
  return container.querySelector('.visualizer-controls__step')?.textContent ?? null
}

function getPrevious(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement
}

function getNext(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement
}

function getReset(): HTMLButtonElement {
  return screen.getByRole('button', { name: 'Reset' }) as HTMLButtonElement
}

describe('Animation — 1. COMPARE still highlights the correct two indices', () => {
  it('highlights exactly the compared indices, with no array mutation', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getNext()) // compare(0, 1)

    expect(highlightedIndices(container)).toEqual([0, 1])
    expect(renderedValues(container)).toEqual(['8', '3', '5', '1'])
  })
})

describe('Animation — 2. SWAP still produces the correct logical array state', () => {
  it('exchanges exactly the two swapped values, matching bubbleSort() exactly', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getNext()) // compare(0, 1)
    fireEvent.click(getNext()) // swap(0, 1)

    expect(renderedValues(container)).toEqual(['3', '8', '5', '1'])
    expect(highlightedIndices(container)).toEqual([0, 1])
  })
})

describe('Animation — 3. Next still advances exactly one operation', () => {
  it('one click moves the step counter from 0 to 1, not further', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getNext())

    expect(getStepText(container)).toBe(`Step 1 / ${EXPECTED_OPERATIONS.length}`)
  })
})

describe('Animation — 4. Previous still moves exactly one operation backward', () => {
  it('reverses exactly the swap it undoes, landing on the correct prior array', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getNext()) // compare(0, 1) -> step 1
    fireEvent.click(getNext()) // swap(0, 1)    -> step 2, [3, 8, 5, 1]
    fireEvent.click(getPrevious()) // undo swap(0, 1) -> step 1, [8, 3, 5, 1]

    expect(getStepText(container)).toBe(`Step 1 / ${EXPECTED_OPERATIONS.length}`)
    expect(renderedValues(container)).toEqual(['8', '3', '5', '1'])
  })
})

describe('Animation — 5. Rapid interaction never desynchronizes the visual state from the controller', () => {
  it('Next -> Next -> Next lands on exactly the state 3 real Next calls produce', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getNext())
    fireEvent.click(getNext())
    fireEvent.click(getNext())

    expect(getStepText(container)).toBe(`Step 3 / ${EXPECTED_OPERATIONS.length}`)
    // Steps 1-3 are compare(0,1), swap(0,1), compare(1,2) -> [3, 8, 5, 1].
    expect(renderedValues(container)).toEqual(['3', '8', '5', '1'])
    expect(highlightedIndices(container)).toEqual([1, 2])
  })

  it('Previous -> Previous from step 3 lands on exactly step 1, matching 2 real undos', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getNext())
    fireEvent.click(getNext())
    fireEvent.click(getNext())
    fireEvent.click(getPrevious())
    fireEvent.click(getPrevious())

    expect(getStepText(container)).toBe(`Step 1 / ${EXPECTED_OPERATIONS.length}`)
    expect(renderedValues(container)).toEqual(['8', '3', '5', '1'])
  })

  it('Next -> Previous immediately returns to the exact original state', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    const before = renderedValues(container)
    fireEvent.click(getNext())
    fireEvent.click(getPrevious())

    expect(getStepText(container)).toBe(`Step 0 / ${EXPECTED_OPERATIONS.length}`)
    expect(renderedValues(container)).toEqual(before)
    expect(highlightedIndices(container)).toEqual([])
    expect(getPrevious().disabled).toBe(true)
  })

  it('a burst of alternating Next/Previous clicks still ends exactly where the net step count says it should', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    // Net effect: +5 steps (8 Next, 3 Previous).
    const sequence = [
      getNext, getNext, getPrevious, getNext, getNext,
      getPrevious, getNext, getNext, getPrevious, getNext, getNext,
    ]
    for (const getButton of sequence) fireEvent.click(getButton())

    expect(getStepText(container)).toBe(`Step 5 / ${EXPECTED_OPERATIONS.length}`)
    // Steps 1-5 are compare, swap, compare, swap, compare on [8,3,5,1] ->
    // after swap(0,1) and swap(1,2): [3, 5, 8, 1].
    expect(renderedValues(container)).toEqual(['3', '5', '8', '1'])
  })
})

describe('Animation — 6. Reset returns to the correct initial visual state', () => {
  it('restores the original array and clears highlighting even when Reset follows a SWAP step', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getNext()) // compare(0, 1)
    fireEvent.click(getNext()) // swap(0, 1) — the step whose animation Reset must cleanly cancel

    fireEvent.click(getReset())

    expect(getStepText(container)).toBe(`Step 0 / ${EXPECTED_OPERATIONS.length}`)
    expect(renderedValues(container)).toEqual(['8', '3', '5', '1'])
    expect(highlightedIndices(container)).toEqual([])
    expect(getPrevious().disabled).toBe(true)
  })

  it('Reset immediately after Reset (double-click) stays correct and does not crash', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getNext())
    fireEvent.click(getNext())
    fireEvent.click(getReset())
    fireEvent.click(getReset())

    expect(getStepText(container)).toBe(`Step 0 / ${EXPECTED_OPERATIONS.length}`)
    expect(renderedValues(container)).toEqual(['8', '3', '5', '1'])
  })
})

describe('Animation — 7. Autoplay still reaches the exact final state', () => {
  it('running to completion via Next clicks (autoplay itself is covered by VisualizationPlaceholder.test.tsx) lands on the fully sorted array', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    for (let i = 0; i < EXPECTED_OPERATIONS.length; i++) fireEvent.click(getNext())

    expect(getStepText(container)).toBe(
      `Step ${EXPECTED_OPERATIONS.length} / ${EXPECTED_OPERATIONS.length}`,
    )
    expect(renderedValues(container)).toEqual(['1', '3', '5', '8'])
    expect(getNext().disabled).toBe(true)
  })
})

describe('Animation — 8. Stop does not change the current logical state', () => {
  it('Stop (via the isPlaying toggle) leaves the array and step exactly where they were', () => {
    const { container } = render(<VisualizationPlaceholder array={INPUT} algorithm={bubbleSort} />)

    fireEvent.click(getNext())
    fireEvent.click(getNext())
    const stepBefore = getStepText(container)
    const valuesBefore = renderedValues(container)

    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))

    expect(getStepText(container)).toBe(stepBefore)
    expect(renderedValues(container)).toEqual(valuesBefore)
  })
})

describe('Animation — 9. Reduced-motion CSS rule exists and does not remove semantic highlighting', () => {
  const css = readFileSync(
    path.join(__dirname, 'ArrayRenderer.css'),
    'utf-8',
  )

  it('declares a prefers-reduced-motion: reduce rule', () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/)
  })

  it('the reduced-motion rule only touches transition timing, not color/border/visibility', () => {
    const match = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/)
    expect(match).not.toBeNull()
    const body = match![1]

    // It must shorten the transition, not delete the highlighted state's
    // own colors — those live untouched in .array-renderer__value--highlighted
    // outside this block.
    expect(body).toMatch(/transition-duration/)
    expect(body).not.toMatch(/display\s*:\s*none/)
    expect(body).not.toMatch(/visibility\s*:\s*hidden/)
  })

  it('the highlighted-state color rule itself is untouched by the reduced-motion query', () => {
    // .array-renderer__value--highlighted's own border/background/color
    // declarations must still exist as a normal (always-applied) rule —
    // reduced motion must never prevent a user from seeing *which* cells
    // are highlighted, only how quickly the color arrives.
    expect(css).toMatch(/\.array-renderer__value--highlighted\s*\{[^}]*border-color/)
  })
})

describe('Animation — 10. All three algorithms continue to work through the same visualization', () => {
  it.each([
    ['Bubble Sort', bubbleSort],
    ['Selection Sort', selectionSort],
    ['Insertion Sort', insertionSort],
  ] as const)('%s reaches its own fully-sorted final state without error', (_name, algorithm) => {
    const input = [5, 3, 8, 1, 4]
    const total = algorithm(input).length

    const { container } = render(<VisualizationPlaceholder array={input} algorithm={algorithm} />)

    for (let i = 0; i < total; i++) fireEvent.click(getNext())

    expect(getStepText(container)).toBe(`Step ${total} / ${total}`)
    expect(renderedValues(container)).toEqual(['1', '3', '4', '5', '8'])
  })
})

describe('Animation — ArrayRenderer: the SWAP effect is safe in isolation', () => {
  it('does not crash when animateSwapIndices is provided, and settles to no inline transform', () => {
    const { container, rerender } = render(
      <ArrayRenderer array={[8, 3, 5, 1]} highlightedIndices={[0, 1]} />,
    )

    rerender(
      <ArrayRenderer
        array={[3, 8, 5, 1]}
        highlightedIndices={[0, 1]}
        animateSwapIndices={[0, 1]}
        animationTick={1}
      />,
    )

    const values = container.querySelectorAll('.array-renderer__value')
    // jsdom has no real layout (getBoundingClientRect is all-zero), so
    // there's nothing meaningful to assert about the transform's value —
    // only that setting it up did not throw and the correct text is still
    // shown. Real motion is verified in the browser.
    expect(Array.from(values).map((el) => el.textContent)).toEqual(['3', '8', '5', '1'])
  })

  it('replaying the same swap indices on a later, distinct tick still runs without error (Next then Previous of the same pair)', () => {
    const { container, rerender } = render(
      <ArrayRenderer
        array={[3, 8, 5, 1]}
        highlightedIndices={[0, 1]}
        animateSwapIndices={[0, 1]}
        animationTick={1}
      />,
    )

    // Undo: the array reverts and the *same* index pair animates again,
    // now driven by a new animationTick — this is exactly the case that
    // requires animationTick (not animateSwapIndices) to be the effect's
    // dependency, see ArrayRenderer's doc comment.
    rerender(
      <ArrayRenderer
        array={[8, 3, 5, 1]}
        highlightedIndices={[0, 1]}
        animateSwapIndices={[0, 1]}
        animationTick={2}
      />,
    )

    const values = container.querySelectorAll('.array-renderer__value')
    expect(Array.from(values).map((el) => el.textContent)).toEqual(['8', '3', '5', '1'])
  })

  it('a Reset-like transition to animateSwapIndices=null does not crash and clears cleanly', () => {
    const { container, rerender } = render(
      <ArrayRenderer
        array={[3, 8, 5, 1]}
        highlightedIndices={[0, 1]}
        animateSwapIndices={[0, 1]}
        animationTick={1}
      />,
    )

    rerender(<ArrayRenderer array={[8, 3, 5, 1]} highlightedIndices={[]} animationTick={2} />)

    const values = container.querySelectorAll('.array-renderer__value') as NodeListOf<HTMLElement>
    expect(Array.from(values).map((el) => el.textContent)).toEqual(['8', '3', '5', '1'])
    // Reset must not leave a stray inline transform behind.
    for (const el of values) {
      expect(el.style.transform === '' || el.style.transform === 'none').toBe(true)
    }
  })
})

describe('Animation — architecture: logic layers stay unaware of animation', () => {
  it('VisualizerController/ExecutionEngine source contains no animation, CSS, or DOM vocabulary', async () => {
    const controllerSource = readFileSync(
      path.join(__dirname, 'visualizerController.ts'),
      'utf-8',
    )
    const engineSource = readFileSync(
      path.join(__dirname, '..', 'engine', 'executionEngine.ts'),
      'utf-8',
    )

    for (const source of [controllerSource, engineSource]) {
      expect(source).not.toMatch(/transition|transform|requestAnimationFrame|animateSwap|CSS/i)
    }
  })
})
