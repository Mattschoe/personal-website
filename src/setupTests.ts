import '@testing-library/jest-dom';

// jsdom doesn't implement matchMedia. Provide a non-throwing default so
// components that subscribe to media queries (e.g. Header's resize-close
// listener) work in tests; individual tests can override window.matchMedia
// with a controllable mock when they need to drive a change event.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}
