// Educational Code View task: focused unit tests for the presentational
// CodeView component. It only ever receives plain data (code lines + a
// line number) — no Operation, no algorithm, no controller — so every
// test here drives it purely through props.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import CodeView from './CodeView'

const CODE = [
  'for i = 0 to n - 2',
  '    minIndex = i',
  '    for j = i + 1 to n - 1',
  '        compare array[j] with array[minIndex]',
]

function getLines(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('.code-view__line'))
}

function activeLines(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('.code-view__line--active'))
}

describe('CodeView — renders all lines', () => {
  it('renders exactly one line element per entry in `code`, in order', () => {
    const { container } = render(<CodeView code={CODE} activeLine={null} />)

    const lines = getLines(container)
    expect(lines).toHaveLength(CODE.length)
  })
})

describe('CodeView — renders line numbers', () => {
  it('shows 1-based line numbers matching each line\'s position', () => {
    const { container } = render(<CodeView code={CODE} activeLine={null} />)

    const numbers = Array.from(container.querySelectorAll('.code-view__line-number')).map(
      (el) => el.textContent,
    )
    expect(numbers).toEqual(['1', '2', '3', '4'])
  })
})

describe('CodeView — renders code text', () => {
  it('renders each line\'s text exactly as given, including its leading-space indentation', () => {
    const { container } = render(<CodeView code={CODE} activeLine={null} />)

    // getByText normalizes (trims/collapses) whitespace by default, which
    // would hide a real indentation bug — reading textContent directly
    // instead proves the leading spaces actually made it into the DOM
    // unmodified.
    const texts = Array.from(container.querySelectorAll('.code-view__line-text')).map(
      (el) => el.textContent,
    )
    expect(texts).toEqual(CODE)
  })
})

describe('CodeView — highlights the requested line', () => {
  it('applies the active class to exactly the line at the given 1-based number', () => {
    const { container } = render(<CodeView code={CODE} activeLine={3} />)

    const active = activeLines(container)
    expect(active).toHaveLength(1)
    expect(active[0].querySelector('.code-view__line-number')?.textContent).toBe('3')
    expect(active[0].querySelector('.code-view__line-text')?.textContent).toBe(
      '    for j = i + 1 to n - 1',
    )
  })

  it('highlights a different line when given a different number', () => {
    const { container } = render(<CodeView code={CODE} activeLine={1} />)

    const active = activeLines(container)
    expect(active).toHaveLength(1)
    expect(active[0].querySelector('.code-view__line-number')?.textContent).toBe('1')
  })
})

describe('CodeView — renders no active line when null', () => {
  it('applies the active class to nothing when activeLine is null', () => {
    const { container } = render(<CodeView code={CODE} activeLine={null} />)

    expect(activeLines(container)).toHaveLength(0)
  })
})

describe('CodeView — does not highlight multiple lines accidentally', () => {
  it('highlights exactly one line even when re-rendered with a new activeLine', () => {
    const { container, rerender } = render(<CodeView code={CODE} activeLine={2} />)
    expect(activeLines(container)).toHaveLength(1)

    rerender(<CodeView code={CODE} activeLine={4} />)
    const active = activeLines(container)
    expect(active).toHaveLength(1)
    expect(active[0].querySelector('.code-view__line-number')?.textContent).toBe('4')
  })

  it('an out-of-range activeLine (no matching line number) highlights nothing', () => {
    const { container } = render(<CodeView code={CODE} activeLine={99} />)
    expect(activeLines(container)).toHaveLength(0)
  })
})

describe('CodeView — optional algorithm name label', () => {
  it('includes the given name in the label when provided', () => {
    render(<CodeView code={CODE} activeLine={null} algorithmName="Selection Sort" />)
    expect(screen.getByText(/Pseudocode/)).toBeTruthy()
    expect(screen.getByText(/Selection Sort/)).toBeTruthy()
  })

  it('still renders a label when no algorithm name is given', () => {
    render(<CodeView code={CODE} activeLine={null} />)
    expect(screen.getByText(/Pseudocode/)).toBeTruthy()
  })
})

describe('CodeView — architecture: algorithm-agnostic, no controller/engine knowledge', () => {
  it('never imports an algorithm, VisualizerController, or the Execution Engine', () => {
    const source = readFileSync(path.join(__dirname, 'CodeView.tsx'), 'utf-8')
    const importLines = source.split('\n').filter((line) => line.trim().startsWith('import '))

    expect(importLines.length).toBeGreaterThan(0)
    for (const line of importLines) {
      expect(line).not.toMatch(/\/algorithms\//)
      expect(line).not.toMatch(/ExecutionEngine|VisualizerController/)
    }

    // No actual usage of the algorithm/controller/engine layers anywhere
    // in the file — not just absent from imports (doc comments are free
    // to mention them by name to explain *why* this component avoids
    // them, which is why this checks constructor/call usage specifically
    // rather than a blanket word match).
    expect(source).not.toMatch(/new ExecutionEngine\(|new VisualizerController\(/)
    expect(source).not.toMatch(/bubbleSort\(|selectionSort\(|insertionSort\(/)
    // No autoplay/navigation logic of its own.
    expect(source).not.toMatch(/\.next\(\)|\.previous\(\)|setInterval/)
  })

  it('contains no algorithm-name conditionals (e.g. `if (algorithm === ...)`)', () => {
    const source = readFileSync(path.join(__dirname, 'CodeView.tsx'), 'utf-8')

    expect(source).not.toMatch(/algorithm\s*===/)
  })
})
