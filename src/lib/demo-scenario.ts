import { useSyncExternalStore } from 'react';
import { isDemoScenario, type DemoScenario } from '@/data/demo/scenarios';

/**
 * Escolha do "momento do campeonato" na demonstração. `auto` = o padrão do perfil
 * (o piloto começa após a etapa 3; a espectadora, com a etapa 4 em andamento).
 *
 * Guardada só na SESSÃO (fechar a aba volta ao padrão), para um avaliador nunca
 * herdar o estado em que outra pessoa deixou a demonstração. Também pode ser
 * definida pela URL: `?momento=apos-etapa-3 | etapa-4-em-andamento | apos-etapa-4`.
 */
export type ScenarioChoice = 'auto' | DemoScenario;

const STORAGE_KEY = 'rcc:scenario';

const URL_ALIASES: Record<string, DemoScenario> = {
  'apos-etapa-3': 'after-race-3',
  'etapa-4-em-andamento': 'race-4-live',
  'apos-etapa-4': 'after-race-4',
};

function readInitial(): ScenarioChoice {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('momento');
    const alias = fromUrl ? URL_ALIASES[fromUrl] : undefined;
    if (alias) return alias;
  } catch {
    /* sem URL: segue para o armazenamento */
  }
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === 'auto' || isDemoScenario(stored)) return stored;
  } catch {
    /* armazenamento indisponível: o padrão do perfil vale */
  }
  return 'auto';
}

let choice: ScenarioChoice = readInitial();
const listeners = new Set<() => void>();

export function getScenarioChoice(): ScenarioChoice {
  return choice;
}

export function setScenarioChoice(next: ScenarioChoice) {
  choice = next;
  try {
    sessionStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* sem armazenamento: vale só nesta carga da página */
  }
  listeners.forEach((listener) => listener());
}

export function useScenarioChoice(): ScenarioChoice {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => choice,
  );
}
