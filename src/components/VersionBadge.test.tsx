// Version Badge task: focused unit tests for the presentational
// VersionBadge component. Expected values are read directly from
// package.json (the canonical source) rather than hardcoded, so these
// tests automatically track the canonical version instead of duplicating
// it as a second maintained string.
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import VersionBadge from './VersionBadge'

const packageJson = JSON.parse(
  readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf-8'),
)
const CANONICAL_VERSION: string = packageJson.version

describe('VersionBadge — renders the canonical version', () => {
  it('displays the version currently in package.json', () => {
    render(<VersionBadge />)
    expect(screen.getByText(`v${CANONICAL_VERSION}`)).toBeTruthy()
  })

  it('prefixes the displayed version with a "v", with the prefix not part of the raw value', () => {
    render(<VersionBadge />)
    const badge = screen.getByText(`v${CANONICAL_VERSION}`)
    expect(badge.textContent).toBe(`v${CANONICAL_VERSION}`)
    // The raw canonical value itself never contains a leading "v" — proves
    // "v" is presentation formatting layered on top, not stored as part of
    // the version value.
    expect(CANONICAL_VERSION.startsWith('v')).toBe(false)
  })
})

describe('VersionBadge — no hardcoded version literal in the component source', () => {
  const source = readFileSync(path.join(__dirname, 'VersionBadge.tsx'), 'utf-8')

  it('does not contain a literal "v0.1.0" (or any other hardcoded vX.Y.Z string)', () => {
    expect(source).not.toMatch(/v0\.1\.0/)
    expect(source).not.toMatch(/['"`]v\d+\.\d+\.\d+['"`]/)
  })

  it('does not contain the raw current version as a quoted string literal', () => {
    const quotedLiteral = new RegExp(`['"\`]${CANONICAL_VERSION.replace(/\./g, '\\.')}['"\`]`)
    expect(source).not.toMatch(quotedLiteral)
  })

  it('reads the version only from the __APP_VERSION__ build-time constant', () => {
    expect(source).toMatch(/__APP_VERSION__/)
  })
})

describe('VersionBadge — tracks the canonical package.json version, not a duplicated constant', () => {
  it('the value rendered is exactly package.json\'s version field, read fresh from disk', () => {
    // Re-reading package.json here (rather than reusing a shared import)
    // proves the test's own expectation is derived from the same file
    // Vite's `define` reads from — if package.json's version changes, this
    // test's expectation changes with it, with no component or test edit
    // required, satisfying "changing the canonical package version should
    // change the displayed version without requiring a component edit."
    const freshPackageJson = JSON.parse(
      readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf-8'),
    )
    render(<VersionBadge />)
    expect(screen.getByText(`v${freshPackageJson.version}`)).toBeTruthy()
  })
})

describe('VersionBadge — accessibility and non-interactivity', () => {
  it('renders as a non-interactive span, not a button or link', () => {
    render(<VersionBadge />)
    const badge = screen.getByText(`v${CANONICAL_VERSION}`)
    expect(badge.tagName).toBe('SPAN')
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('has an accessible label describing it as the application version', () => {
    render(<VersionBadge />)
    const badge = screen.getByText(`v${CANONICAL_VERSION}`)
    expect(badge.getAttribute('aria-label')).toBe(`Application version ${CANONICAL_VERSION}`)
  })
})
