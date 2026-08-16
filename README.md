# Algorithm Visualizer + Playground

A desktop-focused web app for visualizing algorithm execution step by step. See [PROJECT.md](./PROJECT.md) for the full architecture and requirements this project is built against.

**Status:** the core logic is implemented and tested — Bubble Sort generates its operation sequence (`src/algorithms/bubbleSort.ts`), the Execution Engine applies/reverses those operations and tracks state (`src/engine/executionEngine.ts`), and array input is validated (`src/utils/arrayInput.ts`), each with unit tests. The visualization itself is still a placeholder (`src/visualizer/VisualizationPlaceholder.tsx`) — rendering the array and animating each step is the next piece of work.

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
  operations/   # Step / Operation type definitions (compare, swap, insert, remove, ...)
  visualizer/   # Visualizer — renders the current execution state
  components/   # Shared UI components (Header, AlgorithmSelector, ArrayInput, Controls, StepInfo, ...)
  App.tsx
  main.tsx
```

`algorithms/`, `engine/`, and `operations/` are implemented and unit-tested; `visualizer/` and `components/` currently hold the UI shell (placeholder + array input), with the actual step-by-step visualization still to be built.
