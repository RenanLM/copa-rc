import '@testing-library/jest-dom/vitest';

// jsdom não implementa estas APIs, usadas pelo `motion` e pelo shell.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
Element.prototype.scrollTo = Element.prototype.scrollTo ?? (() => {});
window.scrollTo = (() => {}) as typeof window.scrollTo;
