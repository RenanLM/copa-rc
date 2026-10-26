import { useSyncExternalStore } from 'react';
import type { DemoSimulation } from '@/data/repository';

/**
 * Opções de demonstração para avaliação de estados de carregamento e de erro.
 * A simulação vale para o PRÓXIMO carregamento e é consumida em seguida.
 * Também pode ser ativada pela URL: `?sim=error` ou `?sim=slow`.
 */

let pending: DemoSimulation = readFromUrl();
const listeners = new Set<() => void>();

function readFromUrl(): DemoSimulation {
  try {
    const value = new URLSearchParams(window.location.search).get('sim');
    return value === 'error' || value === 'slow' ? value : 'none';
  } catch {
    return 'none';
  }
}

export function setPendingSimulation(next: DemoSimulation) {
  pending = next;
  listeners.forEach((l) => l());
}

export function takePendingSimulation(): DemoSimulation {
  const current = pending;
  if (current !== 'none') setPendingSimulation('none');
  return current;
}

export function usePendingSimulation(): DemoSimulation {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => pending,
  );
}
