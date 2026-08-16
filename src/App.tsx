import { useState } from 'react'
import Header from './components/Header'
import RightSidebar from './components/RightSidebar'
import VisualizationPlaceholder from './visualizer/VisualizationPlaceholder'
import './App.css'

function App() {
  // Purely UI state at this stage — the confirmed array. No Execution
  // Engine, no algorithm run. This is here so the main area can react to
  // "Done" without a layout rewrite once real execution is added.
  const [confirmedArray, setConfirmedArray] = useState<number[] | null>(null)

  return (
    <div className="app">
      <Header />
      <div className="app__body">
        <VisualizationPlaceholder array={confirmedArray} />
        <RightSidebar onArrayConfirmed={setConfirmedArray} />
      </div>
    </div>
  )
}

export default App
