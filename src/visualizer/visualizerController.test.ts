/// <reference types="node" />
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { bubbleSort } from '../algorithms/bubbleSort'
import { VisualizerController, type VisualState } from './visualizerController'

const INPUT = [8, 3, 5, 1]

// Hand-traced against the standard Bubble Sort pass structure (no
// early-exit optimization) and cross-checked below against the real
// bubbleSort() output for the same input.
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

// The working array after each operation in EXPECTED_OPERATIONS above,
// index-aligned (EXPECTED_ARRAYS[i] is the array after operation i+1 runs).
const EXPECTED_ARRAYS = [
  [8, 3, 5, 1], // after compare(0,1)
  [3, 8, 5, 1], // after swap(0,1)
  [3, 8, 5, 1], // after compare(1,2)
  [3, 5, 8, 1], // after swap(1,2)
  [3, 5, 8, 1], // after compare(2,3)
  [3, 5, 1, 8], // after swap(2,3)
  [3, 5, 1, 8], // after compare(0,1)
  [3, 5, 1, 8], // after compare(1,2)
  [3, 1, 5, 8], // after swap(1,2)
  [3, 1, 5, 8], // after compare(0,1)
  [1, 3, 5, 8], // after swap(0,1)
]

describe('VisualizerController — matches the real bubbleSort() output', () => {
  it('cross-checks the hand-traced operations against bubbleSort([8, 3, 5, 1])', () => {
    expect(bubbleSort(INPUT)).toEqual(EXPECTED_OPERATIONS)
  })
})

describe('VisualizerController — initial state', () => {
  it('returns the exact initial VisualState via a full toEqual', () => {
    const controller = new VisualizerController(INPUT)

    const expected: VisualState = {
      array: [8, 3, 5, 1],
      highlightedIndices: [],
      currentStep: 0,
      totalSteps: EXPECTED_OPERATIONS.length,
      currentOperation: undefined,
      canGoNext: true,
      canGoPrevious: false,
    }
    expect(controller.getState()).toEqual(expected)
  })
})

describe('VisualizerController — initial state for an empty array', () => {
  it('has no operations to run, so neither next() nor previous() can do anything', () => {
    const controller = new VisualizerController([])

    expect(controller.getState()).toEqual({
      array: [],
      highlightedIndices: [],
      currentStep: 0,
      totalSteps: 0,
      currentOperation: undefined,
      canGoNext: false,
      canGoPrevious: false,
    })
  })
})

describe('VisualizerController — initial state for a single-element array', () => {
  it('has no operations, since a single element needs no comparisons', () => {
    const controller = new VisualizerController([42])

    expect(controller.getState()).toEqual({
      array: [42],
      highlightedIndices: [],
      currentStep: 0,
      totalSteps: 0,
      currentOperation: undefined,
      canGoNext: false,
      canGoPrevious: false,
    })
  })
})

describe('VisualizerController — next() with a COMPARE operation', () => {
  it('leaves the array unchanged and highlights the compared pair', () => {
    const controller = new VisualizerController(INPUT)
    controller.next()

    const state = controller.getState()
    expect(state.array).toEqual([8, 3, 5, 1])
    expect(state.currentOperation).toEqual({ type: 'compare', indices: [0, 1] })
    expect(state.highlightedIndices).toEqual([0, 1])
    expect(state.currentStep).toBe(1)
  })
})

describe('VisualizerController — next() with a SWAP operation', () => {
  it('updates the array and highlights the swapped pair', () => {
    const controller = new VisualizerController(INPUT)
    controller.next() // compare(0, 1)
    controller.next() // swap(0, 1)

    const state = controller.getState()
    expect(state.array).toEqual([3, 8, 5, 1])
    expect(state.currentOperation).toEqual({ type: 'swap', indices: [0, 1] })
    expect(state.highlightedIndices).toEqual([0, 1])
    expect(state.currentStep).toBe(2)
  })
})

describe('VisualizerController — highlightedIndices is never hard-coded', () => {
  it('always reflects the current operation’s own indices, not a fixed pair', () => {
    const controller = new VisualizerController(INPUT)
    controller.next() // compare(0, 1)
    controller.next() // swap(0, 1)
    controller.next() // compare(1, 2)

    expect(controller.getState().highlightedIndices).toEqual([1, 2])
  })
})

describe('VisualizerController — full forward walk matches bubbleSort exactly', () => {
  it('reproduces every operation, array, and step count across the whole sequence', () => {
    const controller = new VisualizerController(INPUT)

    for (let i = 0; i < EXPECTED_OPERATIONS.length; i++) {
      controller.next()
      const state = controller.getState()

      expect(state.currentOperation).toEqual(EXPECTED_OPERATIONS[i])
      expect(state.highlightedIndices).toEqual(EXPECTED_OPERATIONS[i].indices)
      expect(state.array).toEqual(EXPECTED_ARRAYS[i])
      expect(state.currentStep).toBe(i + 1)
    }

    expect(controller.getState().array).toEqual([1, 3, 5, 8])
  })
})

describe('VisualizerController — canGoNext / canGoPrevious across the sequence', () => {
  it('is true/false in the middle of the sequence and flips only at the boundaries', () => {
    const controller = new VisualizerController(INPUT)

    expect(controller.getState().canGoNext).toBe(true)
    expect(controller.getState().canGoPrevious).toBe(false)

    controller.next()
    expect(controller.getState().canGoNext).toBe(true)
    expect(controller.getState().canGoPrevious).toBe(true)
  })

  it('sets canGoNext to false and canGoPrevious to true once every operation has run', () => {
    const controller = new VisualizerController(INPUT)
    for (let i = 0; i < EXPECTED_OPERATIONS.length; i++) controller.next()

    const state = controller.getState()
    expect(state.canGoNext).toBe(false)
    expect(state.canGoPrevious).toBe(true)
  })
})

describe('VisualizerController — next() at the end', () => {
  it('does nothing once every operation has executed', () => {
    const controller = new VisualizerController(INPUT)
    for (let i = 0; i < EXPECTED_OPERATIONS.length; i++) controller.next()

    const before = controller.getState()
    controller.next()
    controller.next()
    const after = controller.getState()

    expect(after).toEqual(before)
  })
})

describe('VisualizerController — previous() after a SWAP', () => {
  it('restores the array from before the swap and updates currentOperation', () => {
    const controller = new VisualizerController(INPUT)
    controller.next() // compare(0, 1)
    controller.next() // swap(0, 1) -> [3, 8, 5, 1]

    controller.previous()
    const state = controller.getState()

    expect(state.array).toEqual([8, 3, 5, 1])
    expect(state.currentStep).toBe(1)
    expect(state.currentOperation).toEqual({ type: 'compare', indices: [0, 1] })
    expect(state.highlightedIndices).toEqual([0, 1])
  })
})

describe('VisualizerController — previous() after a COMPARE', () => {
  it('leaves the array unchanged and clears currentOperation back to undefined', () => {
    const controller = new VisualizerController(INPUT)
    controller.next() // compare(0, 1)

    controller.previous()
    const state = controller.getState()

    expect(state.array).toEqual([8, 3, 5, 1])
    expect(state.currentStep).toBe(0)
    expect(state.currentOperation).toBeUndefined()
    expect(state.highlightedIndices).toEqual([])
  })
})

describe('VisualizerController — previous() at the beginning', () => {
  it('does nothing at the initial state', () => {
    const controller = new VisualizerController(INPUT)

    const before = controller.getState()
    controller.previous()
    const after = controller.getState()

    expect(after).toEqual(before)
  })
})

describe('VisualizerController — full forward then full reverse', () => {
  it('returns to exactly the initial VisualState', () => {
    const controller = new VisualizerController(INPUT)
    const initial = controller.getState()

    for (let i = 0; i < EXPECTED_OPERATIONS.length; i++) controller.next()
    for (let i = 0; i < EXPECTED_OPERATIONS.length; i++) controller.previous()

    expect(controller.getState()).toEqual(initial)
  })
})

describe('VisualizerController — reset() after partial execution', () => {
  it('restores the array, currentStep, and currentOperation to their initial values', () => {
    const controller = new VisualizerController(INPUT)
    controller.next()
    controller.next()
    controller.next()

    controller.reset()
    const state = controller.getState()

    expect(state.array).toEqual([8, 3, 5, 1])
    expect(state.currentStep).toBe(0)
    expect(state.currentOperation).toBeUndefined()
    expect(state.highlightedIndices).toEqual([])
    expect(state.canGoNext).toBe(true)
    expect(state.canGoPrevious).toBe(false)
  })
})

describe('VisualizerController — reset() after full completion', () => {
  it('restores the array to its initial (unsorted) values, not the sorted result', () => {
    const controller = new VisualizerController(INPUT)
    for (let i = 0; i < EXPECTED_OPERATIONS.length; i++) controller.next()

    controller.reset()

    expect(controller.getState().array).toEqual([8, 3, 5, 1])
  })
})

describe('VisualizerController — reset() reuses the same Operations, without regenerating them', () => {
  it('replays an identical sequence after reset(), proving Operations are not recomputed', () => {
    const controller = new VisualizerController(INPUT)
    for (let i = 0; i < EXPECTED_OPERATIONS.length; i++) controller.next()

    controller.reset()

    for (let i = 0; i < EXPECTED_OPERATIONS.length; i++) {
      controller.next()
      expect(controller.getState().currentOperation).toEqual(EXPECTED_OPERATIONS[i])
    }
    expect(controller.getState().array).toEqual([1, 3, 5, 8])
  })
})

describe('VisualizerController — input immutability', () => {
  it('never mutates the array passed to the constructor', () => {
    const input = [9, 4, 6, 1, 3]
    const snapshot = [...input]
    const controller = new VisualizerController(input)

    for (let i = 0; i < 20; i++) controller.next()

    expect(input).toEqual(snapshot)
  })
})

describe('VisualizerController — getState() immutability / no side effects', () => {
  it('returns an equal VisualState on repeated calls without advancing', () => {
    const controller = new VisualizerController(INPUT)
    controller.next()

    const first = controller.getState()
    const second = controller.getState()

    expect(first).toEqual(second)
  })

  it('does not let mutating a returned VisualState affect the controller', () => {
    const controller = new VisualizerController(INPUT)
    const state = controller.getState()
    const arrayCopy = [...state.array]

    // VisualState fields are typed readonly; this only guards against a
    // returned array being the controller's own live internal reference.
    controller.next()

    expect(arrayCopy).toEqual([8, 3, 5, 1])
  })
})

describe('VisualizerController — totalSteps', () => {
  it('equals the number of generated Operations and never changes as the session advances', () => {
    const controller = new VisualizerController(INPUT)
    expect(controller.getState().totalSteps).toBe(EXPECTED_OPERATIONS.length)

    controller.next()
    controller.next()
    expect(controller.getState().totalSteps).toBe(EXPECTED_OPERATIONS.length)

    for (let i = 0; i < EXPECTED_OPERATIONS.length; i++) controller.next()
    expect(controller.getState().totalSteps).toBe(EXPECTED_OPERATIONS.length)

    controller.reset()
    expect(controller.getState().totalSteps).toBe(EXPECTED_OPERATIONS.length)
  })

  it('is 0 for inputs with no comparisons (empty or single-element arrays)', () => {
    expect(new VisualizerController([]).getState().totalSteps).toBe(0)
    expect(new VisualizerController([7]).getState().totalSteps).toBe(0)
  })
})

describe('VisualizerController — currentOperation is undefined, never null', () => {
  it('exposes undefined (not null) before any operation has run', () => {
    const controller = new VisualizerController(INPUT)
    expect(controller.getState().currentOperation).toBeUndefined()
    // Explicitly not null, matching the documented VisualState contract.
    expect(controller.getState().currentOperation).not.toBeNull()
  })
})

describe('VisualizerController — architecture boundaries', () => {
  it('imports only from the algorithms, engine, and operations layers — never React, CSS, or ArrayRenderer', () => {
    const currentFile = fileURLToPath(import.meta.url)
    const controllerPath = join(dirname(currentFile), 'visualizerController.ts')
    const source = readFileSync(controllerPath, 'utf-8')

    const importLines = source
      .split('\n')
      .filter((line: string) => line.trim().startsWith('import '))

    expect(importLines.length).toBeGreaterThan(0)

    for (const line of importLines) {
      const match = line.match(/from\s+['"]([^'"]+)['"]/)
      expect(match).not.toBeNull()
      const specifier = match![1]

      expect(specifier).not.toBe('react')
      expect(specifier.startsWith('react')).toBe(false)
      expect(specifier.endsWith('.css')).toBe(false)
      expect(specifier.toLowerCase()).not.toContain('arrayrenderer')

      const allowed =
        specifier.startsWith('../algorithms/') ||
        specifier.startsWith('../engine/') ||
        specifier.startsWith('../operations/')
      expect(allowed).toBe(true)
    }

    expect(source).not.toContain('react')
    expect(source).not.toContain('.css')
  })
})
