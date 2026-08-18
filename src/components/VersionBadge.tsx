import './VersionBadge.css'

/**
 * Displays the application's current version, sourced entirely from
 * package.json's "version" field via the __APP_VERSION__ build-time
 * constant (see vite.config.ts and src/vite-env.d.ts) — never hardcoded
 * here. Purely presentational: no application state, no algorithm or
 * GitHub knowledge, not interactive (Version Badge task).
 *
 * The "v" prefix is presentation formatting only; it is not part of the
 * canonical version value itself.
 */
function VersionBadge() {
  return (
    <span className="version-badge" aria-label={`Application version ${__APP_VERSION__}`}>
      v{__APP_VERSION__}
    </span>
  )
}

export default VersionBadge
