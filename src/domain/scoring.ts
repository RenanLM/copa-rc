import type { ChampionshipRules } from './types';

/** Pontos de uma posição de chegada (1 = vencedor) segundo as regras. */
export function pointsForPosition(
  position: number,
  rules: Pick<ChampionshipRules, 'pointsByPosition'>,
): number {
  if (!Number.isInteger(position) || position < 1) return 0;
  return rules.pointsByPosition[position - 1] ?? 0;
}

/** Maior pontuação possível em uma única etapa. */
export function maxPointsPerRace(
  rules: Pick<ChampionshipRules, 'pointsByPosition'>,
): number {
  return Math.max(0, ...rules.pointsByPosition);
}

/** Quantas posições pontuam. */
export function scoringPositions(
  rules: Pick<ChampionshipRules, 'pointsByPosition'>,
): number {
  return rules.pointsByPosition.filter((p) => p > 0).length;
}
