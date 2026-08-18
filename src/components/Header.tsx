import './Header.css'

interface HeaderProps {
  /** Whether the control panel (Sidebar) is currently visible. Purely
   *  reflects App's own layout state — Header has no idea what's inside
   *  the sidebar or that it contains algorithm/array controls, only
   *  whether to show it as expanded or collapsed. */
  isSidebarOpen: boolean
  /** Called when the toggle button is activated. App owns the actual
   *  show/hide state; this component only ever reports the click. */
  onToggleSidebar: () => void
}

/**
 * Sidebar Show/Hide Toggle task: the toggle button lives in the header
 * rather than inside the Sidebar itself specifically so it stays reachable
 * even while the Sidebar is fully collapsed (width/height: 0, per
 * RightSidebar.css) — the header is the one piece of chrome that's always
 * on screen regardless of sidebar state or viewport width.
 */
function Header({ isSidebarOpen, onToggleSidebar }: HeaderProps) {
  return (
    <header className="header">
      <h1 className="header__title">Algorithm Visualizer + Playground</h1>
      <button
        type="button"
        className="header__sidebar-toggle"
        onClick={onToggleSidebar}
        aria-expanded={isSidebarOpen}
        aria-controls="sidebar-panel"
        aria-label={isSidebarOpen ? 'Hide control panel' : 'Show control panel'}
      >
        <span aria-hidden="true" className="header__sidebar-toggle-icon">
          {isSidebarOpen ? '»' : '«'}
        </span>
      </button>
    </header>
  )
}

export default Header
