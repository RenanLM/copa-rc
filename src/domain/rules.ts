import type { ChampionshipRules, TiebreakConfig } from './types';

/**
 * Regras oficiais do campeonato. Esta é a ÚNICA fonte desses valores:
 * a interface e os simuladores sempre as leem daqui (via `Championship.rules`).
 */
export const OFFICIAL_RULES: ChampionshipRules = Object.freeze({
  totalRaces: 5,
  pilotsPerTeam: 2,
  maxPostsPerTeamPerRace: 4,
  // 1º, 2º, 3º, 4º, 5º. Demais posições: 0 ponto.
  pointsByPosition: Object.freeze([10, 6, 3, 2, 1]),
});

/**
 * O regulamento não define critério de desempate. Lista vazia = empates são
 * exibidos como empates, com a indicação "critério indefinido".
 */
export const DEFAULT_TIEBREAK: TiebreakConfig = Object.freeze({
  criteria: Object.freeze([]),
});
