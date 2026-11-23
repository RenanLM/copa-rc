import { useSyncExternalStore } from 'react';

/**
 * Pilotos que a espectadora escolheu acompanhar na tela "Ao Vivo".
 *
 * Ficam guardados só neste aparelho (sem cadastro, sem conta), para ela não
 * precisar escolher de novo a cada visita. O limite existe para o destaque
 * continuar sendo destaque: com muitos preferidos, nenhum se destaca.
 */
export const MAX_FAVORITE_PILOTS = 3;

const STORAGE_KEY = 'rcc:favorite-pilots';
const EMPTY: readonly string[] = Object.freeze([]);

export type FavoriteResult = 'added' | 'removed' | 'full';

// Se o armazenamento do navegador estiver indisponível (janela privativa, por
// exemplo), a escolha vale enquanto a página estiver aberta.
let memory: readonly string[] = EMPTY;
let storageOk = true;

let cachedRaw: string | null | undefined;
let cached: readonly string[] = EMPTY;
const listeners = new Set<() => void>();

function parse(raw: string | null): readonly string[] {
  if (!raw) return EMPTY;
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return EMPTY;
    const ids = value.filter((v): v is string => typeof v === 'string' && v.length > 0);
    return [...new Set(ids)].slice(0, MAX_FAVORITE_PILOTS);
  } catch {
    return EMPTY;
  }
}

/** Pilotos preferidos, na ordem em que foram escolhidos. O resultado é estável entre chamadas. */
export function getFavoritePilots(): readonly string[] {
  if (!storageOk) return memory;
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    storageOk = false;
    return memory;
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = parse(raw);
  }
  return cached;
}

function write(next: readonly string[]) {
  memory = next;
  if (storageOk) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      storageOk = false;
    }
  }
  listeners.forEach((listener) => listener());
}

/** Escolhe ou tira um piloto. Devolve `full` (e não muda nada) quando já há o máximo de preferidos. */
export function toggleFavoritePilot(pilotId: string): FavoriteResult {
  const current = getFavoritePilots();
  if (current.includes(pilotId)) {
    write(current.filter((id) => id !== pilotId));
    return 'removed';
  }
  if (current.length >= MAX_FAVORITE_PILOTS) return 'full';
  write([...current, pilotId]);
  return 'added';
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useFavoritePilots(): readonly string[] {
  return useSyncExternalStore(subscribe, getFavoritePilots, () => EMPTY);
}
