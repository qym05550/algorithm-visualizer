// Runs once for the test environment. Ensures each component test starts
// from a clean DOM instead of accumulating renders from previous tests.
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
