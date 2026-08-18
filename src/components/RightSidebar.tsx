import { useState } from 'react'
import AlgorithmSelector from './AlgorithmSelector'
import ArrayInput from './ArrayInput'
import { bubbleSort } from '../algorithms/bubbleSort'
import { selectionSort } from '../algorithms/selectionSort'
import { insertionSort } from '../algorithms/insertionSort'
import { mergeSort } from '../algorithms/mergeSort'
import { quickSort } from '../algorithms/quickSort'
import { bubbleSortMetadata } from '../algorithms/metadata/bubbleSortMetadata'
import { selectionSortMetadata } from '../algorithms/metadata/selectionSortMetadata'
import { insertionSortMetadata } from '../algorithms/metadata/insertionSortMetadata'
import { mergeSortMetadata } from '../algorithms/metadata/mergeSortMetadata'
import { quickSortMetadata } from '../algorithms/metadata/quickSortMetadata'
import type { AlgorithmMetadata } from '../algorithms/metadata/algorithmMetadata'
import type { Algorithm } from '../visualizer/visualizerController'
import './RightSidebar.css'

/** One selectable algorithm: the Operation-generating function itself,
 *  paired with its Code View metadata (Educational Code View task). Both
 *  halves are looked up together by the same display name, so they can
 *  never drift out of sync with each other. */
interface AlgorithmOption {
  readonly algorithm: Algorithm
  readonly metadata: AlgorithmMetadata
}

/**
 * The simplest mapping that works for a handful of algorithms: a plain
 * lookup by display name. This is deliberately not a registry/factory —
 * the Post-MVP Architecture Review's own guidance was to avoid that until
 * the project has several algorithms. Add a new entry here (and update
 * DEFAULT_ALGORITHM_NAME if it should become the new default) when another
 * algorithm is implemented.
 */
const ALGORITHMS: Record<string, AlgorithmOption> = {
  'Bubble Sort': { algorithm: bubbleSort, metadata: bubbleSortMetadata },
  'Selection Sort': { algorithm: selectionSort, metadata: selectionSortMetadata },
  'Insertion Sort': { algorithm: insertionSort, metadata: insertionSortMetadata },
  'Merge Sort': { algorithm: mergeSort, metadata: mergeSortMetadata },
  'Quick Sort': { algorithm: quickSort, metadata: quickSortMetadata },
}

const DEFAULT_ALGORITHM_NAME = 'Bubble Sort'

interface RightSidebarProps {
  /** Called when Done is confirmed, with the validated array and whichever
   *  algorithm (and its Code View metadata) was selected at that exact
   *  moment. */
  onArrayConfirmed: (values: number[], algorithm: Algorithm, metadata: AlgorithmMetadata) => void
  /** Sidebar Show/Hide Toggle task: whether the panel should currently be
   *  shown. RightSidebar always stays mounted regardless of this value —
   *  only a CSS modifier class (RightSidebar.css's `.sidebar--collapsed`)
   *  responds to it — specifically so hiding the panel can never reset
   *  selectedAlgorithmName below, or ArrayInput's own in-progress typed
   *  text/error/status state: all of that would be lost if this component
   *  were conditionally unmounted instead. */
  isOpen: boolean
}

/**
 * The control panel. Vertically stacks the sidebar sections in order:
 * Algorithm, then Array (input, actions, and validation/status messages
 * live together inside ArrayInput since they share state).
 *
 * Owns the *live* algorithm selection — which algorithm the dropdown
 * currently shows, i.e. what the *next* confirmed session will use. This
 * is deliberately separate from any already-running visualization: changing
 * the dropdown only updates this local state and re-renders this sidebar,
 * never the parent App or VisualizationPlaceholder, so an active session
 * is completely unaffected until Done is pressed again.
 *
 * Future playback controls (Play/Pause/Next/Previous/Reset/Speed) and
 * step info will be added here as additional sections later.
 */
function RightSidebar({ onArrayConfirmed, isOpen }: RightSidebarProps) {
  const [selectedAlgorithmName, setSelectedAlgorithmName] = useState(DEFAULT_ALGORITHM_NAME)

  function handleArrayConfirmed(values: number[]) {
    const { algorithm, metadata } = ALGORITHMS[selectedAlgorithmName]
    onArrayConfirmed(values, algorithm, metadata)
  }

  return (
    <aside
      id="sidebar-panel"
      className={isOpen ? 'sidebar' : 'sidebar sidebar--collapsed'}
      aria-label="Control panel"
      // Sidebar Show/Hide Toggle task: while collapsed, the panel's own
      // controls (the algorithm select, the array textarea, Generate
      // Random/Done) are visually clipped to zero size but would otherwise
      // still be real, focusable, screen-reader-reachable elements —
      // `inert` removes them from both the tab order and the accessibility
      // tree for as long as the panel stays hidden, without unmounting
      // anything (React 19 supports `inert` as a plain boolean prop).
      inert={isOpen ? undefined : true}
    >
      {/* Sidebar Polish task: a small, restrained panel title — the aside
          already carries "Control panel" as its accessible name via
          aria-label, so this is purely a *visible* echo of that for
          sighted users, giving the panel a clear top-level identity above
          its Algorithm/Array sections (task's own "section hierarchy"
          suggestion) rather than starting directly on the first section's
          own label. Not a new section itself, so it's deliberately outside
          .sidebar-section and untouched by that class's divider rule. */}
      <p className="sidebar__heading">Control Panel</p>
      <AlgorithmSelector
        options={Object.keys(ALGORITHMS)}
        value={selectedAlgorithmName}
        onChange={setSelectedAlgorithmName}
      />
      <ArrayInput onArrayConfirmed={handleArrayConfirmed} />
    </aside>
  )
}

export default RightSidebar
