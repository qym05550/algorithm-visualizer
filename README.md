# Algorithm Visualizer + Playground

A desktop-focused web app for visualizing algorithm execution step by step. See [PROJECT.md](./PROJECT.md) for the full architecture and requirements this project is built against.

## Current Status

**MVP complete — v0.1.0**

The current MVP supports Bubble Sort visualization with step-by-step execution: you enter or randomly generate an array, confirm it, and then walk forward and backward through every comparison and swap Bubble Sort performs, one step at a time, with the active elements highlighted at each step.

## MVP Features

- Array input and validation
- Random array generation
- Bubble Sort
- COMPARE / SWAP operation system
- Execution Engine
- Forward and backward execution
- Reset
- Visualizer Controller
- Compare/Swap highlighting
- Step counter
- Previous / Next controls
- Support for arrays up to 100 elements
- Edge-case handling (empty, single-element, already-sorted, reversed, duplicate values, negative numbers, and zero)

## Architecture

```text
User Input
    ↓
Algorithm
    ↓
Operations
    ↓
Execution Engine
    ↓
Visualizer Controller
    ↓
React Visualizer
    ↓
Array Renderer + Controls
```

- **User Input** — the array is entered manually or generated randomly and validated before anything downstream runs.
- **Algorithm** — a pure algorithm implementation (currently Bubble Sort) that describes how a given array should be sorted, without touching any UI or execution state directly.
- **Operations** — a typed sequence of discrete steps (`COMPARE`, `SWAP`, ...) produced by the algorithm, representing exactly what happened and in what order.
- **Execution Engine** — owns the array state and knows how to apply and undo individual operations, which is what makes forward/backward stepping possible.
- **Visualizer Controller** — the bridge between the Execution Engine and the UI: exposes the current visualization state (array, highlighted indices, step counters, and which navigation actions are currently valid).
- **React Visualizer** — the container component that wires the controller into React, turning controller state and user interactions (Previous/Next/Reset) into re-renders.
- **Array Renderer + Controls** — the presentational layer: renders the array with the current highlighting, and renders the Previous/Next/Reset controls and step counter.

## Testing

The test suite currently includes **127 tests across 9 test files**, covering:

- Unit tests for the Algorithm, Operations, and Execution Engine layers
- Integration tests for the Visualizer Controller driving the Execution Engine
- UI-level tests for the React components (array input/validation, array rendering and highlighting, and the visualizer controls), including full end-to-end flows through the app

Run the suite with:

```bash
npm test
```

## Current Algorithm

Bubble Sort is currently implemented. Additional algorithms are planned for future milestones.

## Roadmap

```text
✓ MVP
→ Multi-algorithm architecture
→ Selection Sort
→ Insertion Sort
→ Additional algorithms
→ Visualization enhancements
→ Autoplay / controls
→ Bar-based visualization
```

## Screenshots

_Screenshots will be added here in a future update._

## Stack

React, TypeScript, Vite, CSS, Vitest.

## Getting started

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — start the local development server.
- `npm run build` — type-check and build for production.
- `npm run preview` — preview the production build locally.
- `npm test` — run the test suite once with Vitest.

## Project structure

```text
src/
  algorithms/   # Algorithm layer — pure algorithm implementations (e.g. Bubble Sort)
  engine/       # Execution Engine — owns array state, generates/applies/undoes operations
  operations/   # Step / Operation type definitions (compare, swap, ...)
  visualizer/   # Visualizer Controller + Array Renderer — drives and renders execution state
  components/   # Shared UI components (Header, ArrayInput, VisualizerControls, ...)
  App.tsx
  main.tsx
```
