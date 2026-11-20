import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// The PWA virtual module only exists in Vite builds.
vi.mock('virtual:pwa-register', () => ({ registerSW: () => () => {} }))

afterEach(() => {
  cleanup()
  localStorage.clear()
})
