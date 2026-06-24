import '@testing-library/jest-dom/vitest'
import * as matchers from 'vitest-axe/matchers'
import { expect } from 'vitest'
import type { AxeMatchers } from 'vitest-axe/matchers'

expect.extend(matchers)

declare module 'vitest' {
  export interface Assertion<T = any> extends AxeMatchers {}
  export interface AsymmetricMatchersContaining extends AxeMatchers {}
}


class ResizeObserverMock {
  observe = () => {}
  unobserve = () => {}
  disconnect = () => {}
}

window.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver

// matchMedia is not implemented in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
