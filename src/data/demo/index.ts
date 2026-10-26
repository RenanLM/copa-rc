import { DEFAULT_TIEBREAK, OFFICIAL_RULES, type Championship } from '@/domain';
import { generateRaceResults } from './generate';
import { pilots, raceSpecs, races, teams, tracks } from './seed';

/**
 * Conjunto de demonstração: campeonato após a 3ª etapa, 4ª etapa agendada.
 * Construído uma única vez; todas as telas leem este mesmo objeto.
 */
export function buildDemoChampionship(): Championship {
  return {
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
}
