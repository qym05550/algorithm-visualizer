import './ViewToggle.css'

/** The two visualization presentations Bar View adds a way to switch
 *  between. Intentionally not a generic string — this control is scoped
 *  to exactly these two views (Bar View task section 14: no new view
 *  types are in scope here). */
export type VisualizationView = 'array' | 'bars'

interface ViewToggleProps {
  /** Which view is currently selected. */
  view: VisualizationView
  /** Called with the newly selected view when the user picks the other one. */
  onViewChange: (view: VisualizationView) => void
}

/**
 * A small, purely presentational control for switching between the Array
 * View and Bar View presentations of the current visualization (Bar View
 * task section 6). It has no idea what either view actually renders, no
 * idea about the current step, array, or session — it only reports which
 * label the user picked. VisualizationPlaceholder owns the actual `view`
 * state and decides which renderer to mount; switching it is purely a
 * presentation change; the controller/session are never touched here.
 *
 * Built from the same shared .button/.button--secondary classes the rest
 * of the app's controls use (VisualizerControls, ArrayInput's actions)
 * rather than introducing new button styling, and marks the active
 * option with aria-pressed so it's clear to assistive technology which
 * view is currently showing.
 */
function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="view-toggle" role="group" aria-label="Visualization view">
      <button
        type="button"
        className={
          view === 'array'
            ? 'button button--secondary view-toggle__button view-toggle__button--active'
            : 'button button--secondary view-toggle__button'
        }
        aria-pressed={view === 'array'}
        onClick={() => onViewChange('array')}
      >
        Array
      </button>
      <button
        type="button"
        className={
          view === 'bars'
            ? 'button button--secondary view-toggle__button view-toggle__button--active'
            : 'button button--secondary view-toggle__button'
        }
        aria-pressed={view === 'bars'}
        onClick={() => onViewChange('bars')}
      >
        Bars
      </button>
    </div>
  )
}

export default ViewToggle
