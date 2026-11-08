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

// jsdom ainda não implementa o elemento <dialog> modal, usado pela folha de perfil.
HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
  this.setAttribute('open', '');
};
HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
  this.removeAttribute('open');
  this.dispatchEvent(new Event('close'));
};
