# Algorithm Visualizer + Playground

A desktop-focused web app for visualizing algorithm execution step by step. See [PROJECT.md](./PROJECT.md) for the full architecture and requirements this project is built against.

## Current Status

**Version 2 — v0.2.0**

Version 2 expands the original Bubble Sort MVP into a small algorithm playground: five sorting algorithms, two visualization modes, step-by-step and autoplay execution, live statistics and complexity information, an educational Code View, and a customizable, responsive control layout.

## Features

### Algorithms

- Bubble Sort
- Selection Sort
- Insertion Sort
- Merge Sort
- Quick Sort

Each algorithm is a pure function that produces a typed sequence of Operations (`COMPARE`, `SWAP`) from an input array, decoupled from execution and rendering.

### Visualization

- Array View and Bar View, switchable at any time
- Dynamic visualization sizing that adapts to array length and container width
- Comparison and swap highlighting synced to the current step
- Animated swap transitions
- Reduced-motion support (`prefers-reduced-motion`) for animation-sensitive users

### Controls

- Previous / Next step navigation
- Play (autoplay) / Stop
- Speed control
- Reset

### Analysis

- Statistics panel (comparisons, swaps, and step counts)
- Complexity information (best / average / worst time, and space) per algorithm
- Code View: educational pseudocode with the active line highlighted as execution proceeds

### Interface

- Draggable Statistics and Code View panels
- Collapsible sidebar (show/hide the control panel)
- Responsive layout across desktop widths
- Algorithm switching mid-session without losing sidebar state

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
Array/Bar Renderer + Controls + Statistics + Code View
```

- **User Input** — the array is entered manually or generated randomly and validated before anything downstream runs.
- **Algorithm** — a pure algorithm implementation (Bubble, Selection, Insertion, Merge, or Quick Sort) that describes how a given array should be sorted, without touching any UI or execution state directly. `VisualizerController` depends only on the shared `Algorithm` shape, not on any specific implementation, so algorithms are interchangeable.
- **Operations** — a typed sequence of discrete steps (`COMPARE`, `SWAP`, ...) produced by the algorithm, representing exactly what happened and in what order.
- **Execution Engine** — owns the array state and knows how to apply and undo individual operations, which is what makes forward/backward stepping (and autoplay) possible.
- **Visualizer Controller** — the bridge between the Execution Engine and the UI: exposes the current visualization state (array, highlighted indices, step counters, and which navigation actions are currently valid).
- **React Visualizer** — the container component that wires the controller into React, turning controller state and user interactions (Play/Stop/Previous/Next/Reset, algorithm and view selection) into re-renders.
- **Array/Bar Renderer + Controls + Statistics + Code View** — the presentational layer: renders the array as a list or as bars with current highlighting and swap animation, and renders playback controls, live statistics, and the algorithm's pseudocode with the active line highlighted.

## Testing

The test suite currently includes **598 tests across 38 test files**, covering:

- Unit tests for every Algorithm, Operations, and Execution Engine layer
- Metadata tests validating each algorithm's pseudocode, highlighted-line mapping, and documented complexity
- Integration tests for the Visualizer Controller driving the Execution Engine across all five algorithms
- UI-level tests for the React components (array input/validation, array/bar rendering and highlighting, visualizer controls, statistics panel, code view, draggable panels, sidebar toggle, and responsive sizing), including full end-to-end flows through the app

Run the suite with:

```bash
npm test
```

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
  algorithms/   # Algorithm layer — pure algorithm implementations (Bubble, Selection, Insertion, Merge, Quick Sort)
    metadata/   # Per-algorithm pseudocode, highlighted-line mapping, and complexity (Code View / Analysis)
  engine/       # Execution Engine — owns array state, generates/applies/undoes operations
  operations/   # Step / Operation type definitions (compare, swap, ...)
  statistics/   # Execution statistics (comparisons, swaps, steps)
  visualizer/   # Visualizer Controller, Array/Bar Renderer, View Toggle, Draggable Panel, sizing and animation logic
  components/   # Shared UI components (Header, ArrayInput, RightSidebar, VisualizerControls, StatisticsPanel, CodeView, VersionBadge, ...)
  App.tsx
  main.tsx
```

## Changelog

### v0.2.0

**Algorithms**

- Added Selection Sort, Insertion Sort, Merge Sort, and Quick Sort alongside the existing Bubble Sort
- Generalized `VisualizerController` to accept any algorithm matching the shared `Algorithm` shape, instead of a hardcoded Bubble Sort dependency

**Visualization**

- Added Bar View as an alternative to Array View, with a toggle to switch between them
- Added dynamic visualization sizing that adapts to array length and container width
- Added animated swap transitions and reduced-motion support

**Analysis**

- Added a Statistics panel (comparisons, swaps, steps)
- Added per-algorithm complexity metadata (best / average / worst time, space)
- Added Code View: educational pseudocode with the active line highlighted during execution

**Interface**

- Added draggable Statistics and Code View panels
- Added a collapsible sidebar (show/hide the control panel)
- Added Play (autoplay) / Stop and speed control to the existing Previous / Next / Reset controls
- Added responsive layout support and a version badge
- Verified algorithm switching mid-session preserves sidebar and session state

**Verification**

- 598 tests passing across 38 test files
- TypeScript strict build clean
- Production build successful

### v0.1.0

- Initial MVP: Bubble Sort visualization with step-by-step forward/backward execution, array input and validation, and compare/swap highlighting
