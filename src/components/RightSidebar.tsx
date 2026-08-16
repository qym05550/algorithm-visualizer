import AlgorithmSelector from './AlgorithmSelector'
import ArrayInput from './ArrayInput'
import './RightSidebar.css'

interface RightSidebarProps {
  onArrayConfirmed: (values: number[]) => void
}

/**
 * The control panel. Vertically stacks the sidebar sections in order:
 * Algorithm, then Array (input, actions, and validation/status messages
 * live together inside ArrayInput since they share state).
 *
 * Future playback controls (Play/Pause/Next/Previous/Reset/Speed) and
 * step info will be added here as additional sections later.
 */
function RightSidebar({ onArrayConfirmed }: RightSidebarProps) {
  return (
    <aside className="sidebar" aria-label="Control panel">
      <AlgorithmSelector />
      <ArrayInput onArrayConfirmed={onArrayConfirmed} />
    </aside>
  )
}

export default RightSidebar
