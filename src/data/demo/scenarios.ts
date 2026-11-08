import type { Championship } from '@/domain';

/**
 * "Momento do campeonato" da demonstração. Os três momentos compartilham os
 * MESMOS dados: o que muda é até onde a temporada já aconteceu. Assim, piloto e
 * espectadora enxergam a mesma classificação, e a simulação da etapa 4 termina
 * exatamente no resultado que depois alimenta a classificação.
 */
export type DemoScenario = 'after-race-3' | 'race-4-live' | 'after-race-4';

export interface DemoScenarioInfo {
  id: DemoScenario;
  label: string;
  description: string;
}

export const DEMO_SCENARIOS: readonly DemoScenarioInfo[] = [
  {
    id: 'after-race-3',
    label: 'Após a etapa 3',
    description: 'Três etapas disputadas. A etapa 4 ainda vai acontecer.',
  },
  {
    id: 'race-4-live',
    label: 'Etapa 4 em andamento',
    description: 'A etapa 4 está acontecendo (simulação) e ainda não tem resultado.',
  },
  {
    id: 'after-race-4',
    label: 'Após a etapa 4',
    description: 'Etapa 4 finalizada, com resultado, pódio e classificação atualizada.',
  },
];

/** Quantas etapas já foram disputadas em cada momento. */
const FINISHED_ROUNDS: Record<DemoScenario, number> = {
  'after-race-3': 3,
  'race-4-live': 3,
  'after-race-4': 4,
};

/** "Hoje" da demonstração em cada momento (usado em contagens regressivas). */
const REFERENCE_DATE: Record<DemoScenario, string> = {
  'after-race-3': '2026-10-21',
  'race-4-live': '2026-10-25',
  'after-race-4': '2026-10-26',
};

export function isDemoScenario(value: unknown): value is DemoScenario {
  return DEMO_SCENARIOS.some((s) => s.id === value);
}

/**
 * Recorta o campeonato "completo" (com o resultado da etapa 4) no momento pedido:
 * etapas ainda não disputadas perdem o resultado, e a etapa em andamento fica
 * "ao vivo" apenas como estado da demonstração.
 */
export function applyDemoScenario(full: Championship, scenario: DemoScenario): Championship {
  const finishedRounds = FINISHED_ROUNDS[scenario];
  const races = full.races.map((race) => {
    if (race.round <= finishedRounds) return { ...race, status: 'finished' as const };
    if (scenario === 'race-4-live' && race.round === 4) return { ...race, status: 'live' as const };
    return { ...race, status: 'scheduled' as const };
  });
  const finishedIds = new Set(races.filter((r) => r.status === 'finished').map((r) => r.id));
  return {
    ...full,
    referenceDate: REFERENCE_DATE[scenario],
    races,
    results: full.results.filter((r) => finishedIds.has(r.raceId)),
  };
}

/**
 * Momento em que a etapa `round` está em andamento ou acabou de terminar.
 * Só a etapa 4 tem simulação preparada; para as demais devolve null.
 */
export function demoScenarioFor(round: number, state: 'live' | 'finished'): DemoScenario | null {
  if (round !== 4) return null;
  return state === 'live' ? 'race-4-live' : 'after-race-4';
}
