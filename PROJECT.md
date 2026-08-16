# Architecture Decisions

## 1. Platform

The MVP will be developed as a desktop-focused web application.

Mobile and tablet support are intentionally excluded from the MVP to keep the initial scope focused.

Responsive support may be considered in a later phase.

---

## 2. Technology Stack

### React

React will be used to build the user interface and reusable UI components.

### TypeScript

TypeScript will be used for application logic and type safety.

### Vite

Vite will be used as the development and build tool.

### CSS

CSS will be used for styling, layout, spacing, and visual design.

### SVG

SVG may be used for interactive visualizations, especially for future trees and graphs.

The MVP may use simpler HTML/CSS-based visualization for the array where appropriate.

### Git

Git will be used for version control.

### GitHub

GitHub will be used to host the project repository and document its development.

### Vitest

Vitest will be used to test core algorithm and execution logic.

---

## 3. Architecture Overview

The project will separate algorithm logic, execution logic, and visualization.

The core architecture is:

```text
Algorithm
    ↓
Execution Engine
    ↓
Operations / Steps
    ↓
Visualizer
    ↓
User Interface
```

The algorithm must not directly control the visual interface.

---

## 4. Algorithm Layer

The algorithm layer contains the actual algorithm implementation.

For the MVP, this will contain:

- Bubble Sort

The algorithm is responsible for determining what operations occur during execution.

It should not be responsible for:

- UI updates
- Animations
- Button behavior
- Visual styling

---

## 5. Execution Engine

The Execution Engine is responsible for managing the execution state.

It will:

- Own the current array state.
- Generate the complete sequence of operations before playback begins.
- Apply operations to the current state.
- Undo operations when moving backward.
- Track the current step.
- Reset the execution when necessary.

The Visualizer will not directly modify the array state.

---

## 6. Step / Operation System

The system will store operations/events rather than complete snapshots of the array state.

For example:

```json
{
  "type": "compare",
  "indices": [0, 1]
}
```

or:

```json
{
  "type": "swap",
  "indices": [0, 1]
}
```

The exact TypeScript structure may evolve as the project develops.

Operations should contain enough information to be executed and, where necessary, reversed.

Examples:

- COMPARE → no state change
- SWAP → can be reversed by performing the same swap
- INSERT → can be reversed by removing the inserted element
- REMOVE → should retain enough information to restore the removed element

This system is intended to support navigation through the execution history.

---

## 7. Step Generation

For the MVP, the complete sequence of operations will be generated before playback begins.

Example:

```text
Bubble Sort
    ↓
Generate all operations
    ↓
Store operations
    ↓
Start at Step 0
    ↓
User controls playback
```

This approach is intentionally chosen for simplicity and predictability in the MVP.

A future version may use lazy generation or chunked generation if very large executions require it.

---

## 8. Execution Navigation

The execution will maintain a current step index.

Example: `currentStep = 0`

**Next** — the next operation is applied and the current step advances.

```text
Next
    ↓
Apply Operation
    ↓
currentStep + 1
```

**Previous** — the current operation is reversed and the current step moves backward.

```text
Previous
    ↓
Undo Operation
    ↓
currentStep - 1
```

**Reset** — the execution returns to its initial state.

---

## 9. Playback Controls

The MVP will include:

- Play
- Pause
- Next
- Previous
- Reset
- Speed Control

The speed control will initially support:

- 0.5x
- 1x
- 2x
- 4x

Playback will automatically advance through the generated operations until the final step is reached or the user pauses the execution.

---

## 10. Array Input

Users will be able to provide their own array.

The default generated array size will be: 10 elements

The maximum allowed array size will be: 100 elements

Users can confirm an edited array by:

- Clicking the Done button.
- Pressing Enter while editing the input.

After a new array is confirmed:

```text
New Array
    ↓
Reset Execution
    ↓
Generate New Operations
    ↓
currentStep = 0
```

The application should not regenerate the algorithm on every keystroke.

---

## 11. Error Handling

The application should validate user input before execution.

Invalid input should produce a clear user-facing error instead of causing the application to fail.

Examples include:

- Invalid array values.
- Empty input.
- Array exceeding the maximum size.
- Invalid formatting.

The application should remain stable when invalid input is provided.

---

## 12. Visualizer

The Visualizer is responsible for displaying the current execution state.

It will receive information from the Execution Engine and represent it visually.

The Visualizer may indicate:

- Current array values.
- Elements being compared.
- Elements being swapped.
- Current execution state.
- Current step.

The Visualizer should not directly modify the underlying algorithm state.

---

## 13. MVP Components

The initial component structure is expected to be approximately:

```text
App
│
├── Header
├── AlgorithmSelector
├── ArrayInput
├── Visualizer
│   └── ArrayBars
├── Controls
└── StepInfo
```

The exact component structure may change if a better organization is discovered during implementation.

---

## 14. MVP Data Flow

The main data flow is:

```text
User Input
    ↓
Array
    ↓
Bubble Sort
    ↓
Operation Generation
    ↓
Execution Engine
    ↓
Current Array State
    ↓
Visualizer
    ↓
User
```

Controls interact with the Execution Engine:

```text
Controls
    ↓
Execution Engine
    ↓
Apply / Undo Operations
    ↓
Updated State
    ↓
Visualizer
```

---

## 15. Backend

The MVP will not require a backend.

There will be:

- No database.
- No authentication.
- No user accounts.
- No server-side algorithm execution.

The MVP will run entirely in the browser.

A backend may be introduced in later phases if future features require it.

---

## 16. Testing

Core algorithm and execution logic will have automated tests.

Tests should cover:

- Bubble Sort correctness.
- Operation generation.
- Operation application.
- Operation reversal.
- Execution navigation.
- Reset behavior.
- Input validation.

The visual interface does not need comprehensive automated testing during the initial MVP unless specific cases require it.

---

## 17. Architecture Principles

**Separation of Concerns** — Each system should have a clear responsibility.

**Algorithm Independence** — Algorithms should not directly depend on the visual interface.

**Reusable Execution System** — The Execution Engine should be designed so that future algorithms can use the same system.

**Reversible Operations** — Operations should contain enough information to support backward navigation where possible.

**Simplicity First** — The MVP should use the simplest architecture that satisfies its requirements.

**Extensibility** — The architecture should allow future support for:

- Sorting algorithms
- Searching algorithms
- Trees
- Graphs
- Pathfinding
- Dynamic Programming
- User-written code
- Execution inspection

without unnecessarily complicating the MVP.

**Learning-Oriented Development** — The architecture should remain understandable to the developer and should not hide important concepts behind unnecessary abstractions.

---

## 18. Execution Architecture (Detailed)

This section refines sections 4-12 above with the exact responsibility boundaries, data shapes, and control behavior agreed for the MVP. Where it goes into more detail than an earlier section, the earlier section still stands — this is the precise version of the same decisions.

### 18.1 Responsibility Flow

```text
Input
  ↓
Algorithm
  ↓
Operations
  ↓
Execution Engine
  ↓
Visualizer
```

Each layer has a clearly separated responsibility.

### 18.2 Algorithm Responsibility

The algorithm is responsible for determining what operations should happen.

For the MVP, Bubble Sort will generate a sequence of Operations.

The algorithm must NOT:

- Directly manipulate the UI or Visualizer.
- Be responsible for rendering or animations.

### 18.3 Operations

The MVP currently supports only two Operation types:

1. COMPARE
2. SWAP

Do NOT introduce MARK, INSERT, REMOVE, MOVE, VISIT, or other Operation types at this stage.

Additional Operation types may be introduced in future phases if required by other algorithms.

### 18.4 COMPARE

A COMPARE operation contains only the indices being compared.

Example:

```json
{
  "type": "compare",
  "indices": [2, 3]
}
```

COMPARE:

- Does not modify the Working Array.
- Represents a comparison between two array positions.
- Allows the Visualizer to identify which elements should be highlighted.
- Does not store the comparison result.
- Does not store the values being compared.

The comparison result is intentionally not stored inside the Operation.

### 18.5 SWAP

A SWAP operation contains only the indices that should be exchanged.

Example:

```json
{
  "type": "swap",
  "indices": [2, 3]
}
```

SWAP:

- Modifies the Working Array by exchanging the two specified positions.
- Can be undone by performing the same swap again.
- Does not store the previous values, because the indices are sufficient for reversing the swap.
- Does not contain UI or visualization information.

### 18.6 Operation ID

Operations do NOT have their own ID.

The position of an Operation inside the Operations array is sufficient to identify its location in the execution sequence.

Do not add unnecessary IDs or metadata to Operations.

### 18.7 Operation Immutability

Once generated by the Algorithm, the Operations sequence should be treated as immutable.

The Execution Engine executes and reverses Operations but does not modify the Operations themselves.

### 18.8 Execution Engine

The Execution Engine is responsible for controlling the execution state.

It is responsible for:

- Maintaining the Initial Array.
- Maintaining a mutable Working Array.
- Maintaining the Operations sequence.
- Tracking `currentStep`.
- Executing the next Operation.
- Reversing the previous Operation.
- Resetting the execution state.

The Execution Engine must NOT:

- Generate algorithm Operations.
- Control UI styling.
- Decide colors.
- Render the visualization.
- Implement animations.
- Contain presentation logic.

### 18.9 Initial Array

The Initial Array is preserved as the original state. It must not be modified during execution.

The Execution Engine creates/maintains a separate Working Array for execution.

Example:

```text
Initial Array:
[8, 3, 5, 1]

Working Array:
[8, 3, 5, 1]

After SWAP(0, 1):

Initial Array:
[8, 3, 5, 1]

Working Array:
[3, 8, 5, 1]
```

The Initial Array remains unchanged.

### 18.10 Working Array

The Working Array is the mutable state used by the Execution Engine.

Operations are applied to the Working Array.

The Working Array is what the Visualizer displays as the current array state.

### 18.11 Snapshots

The MVP does NOT store a full Array snapshot for every Operation.

The project uses:

- Initial Array
- Operations
- Current Step
- Working Array

to reconstruct and control execution.

### 18.12 Current Step

`currentStep` tracks the current position in the Operations sequence.

The execution model should treat the initial state as being before any Operation has been executed. At the initial state:

```text
currentStep = 0
```

The next Operation to execute is `Operations[currentStep]`.

After executing it, `currentStep` advances by one.

Previous reverses the most recently executed Operation and decreases `currentStep` accordingly.

### 18.13 Execution Controls

The Execution Engine exposes these core actions:

- `next()`
- `previous()`
- `reset()`

**`next()`:**

- Executes the next Operation if one is available.
- Updates the Working Array when necessary.
- Advances `currentStep`.
- Makes the resulting execution state available to the Visualizer.

**`previous()`:**

- Reverses the most recently executed Operation if one exists.
- Restores the previous Working Array state.
- Decreases `currentStep`.
- Makes the resulting execution state available to the Visualizer.

**`reset()`:**

- Restores the Working Array to a copy of the Initial Array.
- Resets `currentStep` to 0.
- Keeps the Operations sequence intact.

### 18.14 Boundary Behavior

When the execution is at the initial state:

- Previous must be disabled.

When the execution reaches the end of the Operations sequence:

- Next must be disabled.

Disabled controls should have a visibly muted/gray appearance so the user can immediately understand that the action is unavailable.

### 18.15 Visualizer Responsibility

The Visualizer is responsible for presentation.

The Visualizer receives the current execution state, including:

- `currentArray`
- `currentOperation`
- `currentStep`

The Visualizer is responsible for:

- Rendering the current array.
- Highlighting elements involved in the current Operation.
- Displaying visual feedback.
- Handling visual animations in future implementation.

The Visualizer must NOT:

- Generate algorithm Operations.
- Decide what the algorithm should do.
- Mutate the Initial Array.
- Implement the Execution Engine.
- Contain algorithm logic.

### 18.16 COMPARE Visualization

When the current Operation is COMPARE, the Visualizer uses the Operation's indices to identify and highlight the two elements being compared.

The highlighting is a visualization concern. Do not introduce a separate MARK Operation solely for highlighting.

### 18.17 SWAP Visualization

When the current Operation is SWAP:

- The Execution Engine updates the Working Array.
- The Visualizer displays the resulting Working Array.
- A visual swap animation may be implemented later.

The Operation itself should remain independent of animation details.

### 18.18 Architecture Summary

The intended MVP architecture is:

```text
Input
  ↓
Algorithm
  ↓
Operations
  ↓
Execution Engine
  ↓
Visualizer
```

More specifically:

```text
Algorithm
  → generates immutable Operations

Execution Engine
  → applies/reverses Operations
  → maintains execution state

Visualizer
  → renders the current execution state
```

Keep these responsibilities strictly separated.
