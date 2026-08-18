// Statistics & Complexity Panel task: focused unit tests for the
// presentational StatisticsPanel. It only ever receives already-derived
// numbers and a complexity description through props — no Operation, no
// algorithm, no controller/engine — so every test drives it purely
// through props, exactly like CodeView.test.tsx does for CodeView.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatisticsPanel from './StatisticsPanel'
import type { AlgorithmComplexity } from '../algorithms/metadata/algorithmMetadata'

const COMPLEXITY: AlgorithmComplexity = {
  time: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
  space: 'O(1)',
}

function renderPanel(overrides: Partial<Parameters<typeof StatisticsPanel>[0]> = {}) {
  return render(
    <StatisticsPanel
      currentStep={0}
      totalSteps={0}
      statistics={{ comparisons: 0, swaps: 0, totalOperations: 0 }}
      complexity={COMPLEXITY}
      {...overrides}
    />,
  )
}

describe('StatisticsPanel — step / progress', () => {
  it('renders the current and total step counts', () => {
    renderPanel({ currentStep: 5, totalSteps: 14 })
    expect(screen.getByText('Step 5 / 14')).toBeTruthy()
  })
})

describe('StatisticsPanel — live counters', () => {
  it('renders comparisons, swaps, and total operations', () => {
    const { container } = renderPanel({
      statistics: { comparisons: 3, swaps: 2, totalOperations: 5 },
    })

    const counters = Array.from(container.querySelectorAll('.statistics-panel__counter')).map(
      (el) => el.textContent,
    )
    expect(counters).toEqual(['Comparisons3', 'Swaps2', 'Operations5'])
  })

  it('renders all-zero counters for the initial state', () => {
    const { container } = renderPanel()

    const counters = Array.from(container.querySelectorAll('.statistics-panel__counter')).map(
      (el) => el.textContent,
    )
    expect(counters).toEqual(['Comparisons0', 'Swaps0', 'Operations0'])
  })
})

describe('StatisticsPanel — complexity', () => {
  it('renders the given time complexity for all three cases', () => {
    renderPanel({
      complexity: {
        time: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)' },
        space: 'O(1)',
      },
    })

    const rows = Array.from(document.querySelectorAll('.statistics-panel__complexity-row')).map(
      (el) => el.textContent,
    )
    expect(rows).toEqual(['BestO(n²)', 'AverageO(n²)', 'WorstO(n²)', 'O(1)'])
  })

  it('renders a different algorithm\'s complexity when given different data, not a fixed default', () => {
    renderPanel({
      complexity: {
        time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)' },
        space: 'O(log n)',
      },
    })

    expect(screen.getAllByText('O(n log n)')).toHaveLength(2)
    expect(screen.getByText('O(log n)')).toBeTruthy()
  })
})

describe('StatisticsPanel — architecture: no algorithm/controller/engine knowledge', () => {
  it('never imports an algorithm, VisualizerController, or the Execution Engine', () => {
    const source = readFileSync(path.join(__dirname, 'StatisticsPanel.tsx'), 'utf-8')
    const importLines = source.split('\n').filter((line) => line.trim().startsWith('import '))

    expect(importLines.length).toBeGreaterThan(0)
    for (const line of importLines) {
      expect(line).not.toMatch(/\/algorithms\/bubbleSort|\/algorithms\/selectionSort|\/algorithms\/insertionSort/)
      expect(line).not.toMatch(/ExecutionEngine|VisualizerController/)
    }

    expect(source).not.toMatch(/new ExecutionEngine\(|new VisualizerController\(/)
    expect(source).not.toMatch(/bubbleSort\(|selectionSort\(|insertionSort\(/)
    // No counting logic of its own — it only ever displays numbers it
    // was given.
    expect(source).not.toMatch(/operation\.type|'compare'|'swap'/)
  })
})
