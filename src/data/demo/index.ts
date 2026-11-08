import { DEFAULT_TIEBREAK, OFFICIAL_RULES, type Championship } from '@/domain';
import { generateRaceResults } from './generate';
import { applyDemoScenario, type DemoScenario } from './scenarios';
import { pilots, raceSpecs, races, teams, tracks } from './seed';

export * from './scenarios';

/**
 * Conjunto de demonstração no momento escolhido (padrão: após a 3ª etapa, com a
 * 4ª agendada). Todas as telas leem o mesmo objeto; só o momento muda.
 */
export function buildDemoChampionship(scenario: DemoScenario = 'after-race-3'): Championship {
  const full: Championship = {
    id: 'rc-championship-2026',
    name: 'RC Championship 2026',
    season: '2026',
    source: 'demo',
    referenceDate: '2026-10-21',
    rules: OFFICIAL_RULES,
    tiebreak: DEFAULT_TIEBREAK,
    teams,
    pilots,
    tracks,
    races,
    results: raceSpecs.map(generateRaceResults),
  };
  return applyDemoScenario(full, scenario);
}

/** Campeonato com todos os resultados disponíveis (etapas 1 a 4): fonte dos momentos. */
export function buildFullDemoChampionship(): Championship {
  return buildDemoChampionship('after-race-4');
}
