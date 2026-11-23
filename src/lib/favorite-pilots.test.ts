import { afterEach, beforeEach, vi } from 'vitest';
import { getFavoritePilots, MAX_FAVORITE_PILOTS, toggleFavoritePilot } from './favorite-pilots';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('pilotos preferidos', () => {
  it('começa sem nenhum e devolve sempre a mesma lista enquanto nada muda', () => {
    expect(getFavoritePilots()).toEqual([]);
    expect(getFavoritePilots()).toBe(getFavoritePilots());
  });

  it('escolhe e tira um piloto, na ordem em que foram escolhidos', () => {
    expect(toggleFavoritePilot('rafael-nunes')).toBe('added');
    expect(toggleFavoritePilot('lucas-ferreira')).toBe('added');
    expect(getFavoritePilots()).toEqual(['rafael-nunes', 'lucas-ferreira']);
    expect(toggleFavoritePilot('rafael-nunes')).toBe('removed');
    expect(getFavoritePilots()).toEqual(['lucas-ferreira']);
  });

  it('não passa de 3 preferidos e não muda nada ao recusar', () => {
    expect(MAX_FAVORITE_PILOTS).toBe(3);
    ['a', 'b', 'c'].forEach((id) => toggleFavoritePilot(id));
    expect(toggleFavoritePilot('d')).toBe('full');
    expect(getFavoritePilots()).toEqual(['a', 'b', 'c']);
    // tirar um libera a vaga
    expect(toggleFavoritePilot('b')).toBe('removed');
    expect(toggleFavoritePilot('d')).toBe('added');
    expect(getFavoritePilots()).toEqual(['a', 'c', 'd']);
  });

  it('fica guardado só no aparelho (localStorage) e é lido de volta', () => {
    toggleFavoritePilot('helena-duarte');
    expect(JSON.parse(localStorage.getItem('rcc:favorite-pilots')!)).toEqual(['helena-duarte']);
    // outra aba ou outra visita: o que está guardado vale
    localStorage.setItem('rcc:favorite-pilots', JSON.stringify(['diego-martins']));
    expect(getFavoritePilots()).toEqual(['diego-martins']);
  });

  it('ignora dados guardados inválidos, repetidos ou em excesso', () => {
    localStorage.setItem('rcc:favorite-pilots', 'não é JSON');
    expect(getFavoritePilots()).toEqual([]);
    localStorage.setItem('rcc:favorite-pilots', JSON.stringify({ a: 1 }));
    expect(getFavoritePilots()).toEqual([]);
    localStorage.setItem('rcc:favorite-pilots', JSON.stringify(['a', 'a', 7, '', 'b', 'c', 'd']));
    expect(getFavoritePilots()).toEqual(['a', 'b', 'c']);
  });

  it('sem armazenamento disponível, a escolha vale enquanto a página estiver aberta', async () => {
    // módulo novo: o estado em memória dos testes anteriores não entra na conta
    vi.resetModules();
    const fresh = await import('./favorite-pilots');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    expect(fresh.toggleFavoritePilot('rafael-nunes')).toBe('added');
    expect(fresh.getFavoritePilots()).toEqual(['rafael-nunes']);
    expect(fresh.toggleFavoritePilot('rafael-nunes')).toBe('removed');
    expect(fresh.getFavoritePilots()).toEqual([]);
  });
});
