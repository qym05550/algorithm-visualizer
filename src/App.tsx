import { useState } from 'react'
import Header from './components/Header'
import RightSidebar from './components/RightSidebar'
import VersionBadge from './components/VersionBadge'
import VisualizationPlaceholder from './visualizer/VisualizationPlaceholder'
import { bubbleSort } from './algorithms/bubbleSort'
import { bubbleSortMetadata } from './algorithms/metadata/bubbleSortMetadata'
import type { Algorithm } from './visualizer/visualizerController'
import type { AlgorithmMetadata } from './algorithms/metadata/algorithmMetadata'
import './App.css'

function App() {
  // The confirmed session: the array and algorithm Done was last pressed
  // with. Both are set together inside handleArrayConfirmed, in the same
  // event handler, so React batches them into one re-render —
  // VisualizationPlaceholder never sees an array from one confirmation
  // paired with the algorithm of another. confirmedAlgorithm defaults to
  // Bubble Sort, matching the dropdown's own default, even though it's
  // only ever read once an array has also been confirmed.
  const [confirmedArray, setConfirmedArray] = useState<number[] | null>(null)
  // Algorithm is itself a function, and both useState's initial value and
  // its setter treat a bare function argument as a lazy
  // initializer/updater rather than a value to store — so both uses below
  // are wrapped in `() => ...` to store the function itself, not call it.
  const [confirmedAlgorithm, setConfirmedAlgorithm] = useState<Algorithm>(() => bubbleSort)
  // The Code View metadata for the confirmed algorithm (Educational Code
  // View task) — set together with confirmedAlgorithm in the same handler
  // below, so the two can never disagree about which algorithm is active.
  // Unlike confirmedAlgorithm, metadata is a plain data object, not a
  // function, so it needs no lazy-initializer wrapping.
  const [confirmedMetadata, setConfirmedMetadata] = useState<AlgorithmMetadata>(bubbleSortMetadata)
  // Sidebar Show/Hide Toggle task: purely a layout preference, owned here
  // (the smallest parent that actually controls the .app__body layout)
  // rather than inside RightSidebar — RightSidebar keeps rendering
  // unconditionally regardless of this value (see RightSidebar's own
  // `isOpen` prop doc comment for why it stays mounted rather than being
  // conditionally rendered), so toggling this can never reset the sidebar's
  // own in-progress form state, and never touches confirmedArray/
  // confirmedAlgorithm/confirmedMetadata or anything inside
  // VisualizationPlaceholder (autoplay state, step, statistics, code
  // highlight) — this is a completely separate piece of state from the
  // visualization session above. Visible by default, matching the task's
  // own requirement.
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  function handleArrayConfirmed(array: number[], algorithm: Algorithm, metadata: AlgorithmMetadata) {
    setConfirmedArray(array)
    setConfirmedAlgorithm(() => algorithm)
    setConfirmedMetadata(metadata)
  }

  function handleToggleSidebar() {
    setIsSidebarOpen((open) => !open)
  }

  return (
    <div className="app">
      <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={handleToggleSidebar} />
      <div className="app__body">
        <VisualizationPlaceholder
          array={confirmedArray}
          algorithm={confirmedAlgorithm}
          metadata={confirmedMetadata}
        />
        <RightSidebar onArrayConfirmed={handleArrayConfirmed} isOpen={isSidebarOpen} />
      </div>
      <VersionBadge />
    </div>
  )
}

export default App
