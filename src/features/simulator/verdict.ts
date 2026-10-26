import { summarizeTarget, type OutcomeStatus, type Predictor, type TargetSummary } from '@/domain';
import { formatOrdinal } from '@/lib/format';

export interface Verdict {
  status: OutcomeStatus;
  summary: string;
  details: string[];
  stats: TargetSummary;
  /** "após a etapa 4" ou "ao final do campeonato". */
  where: string;
}

/** Quando a pergunta é sobre o horizonte. */
export function horizonWhere(predictor: Predictor): string {
  return predictor.horizon === 'next'
    ? `após a etapa ${predictor.races[0]?.round}`
    : 'ao final do campeonato';
}

/** Texto do veredito para uma posição desejada. Só afirma o que a análise exata prova. */
export function buildVerdict(predictor: Predictor, target: number): Verdict {
  const stats = summarizeTarget(predictor.combos, target);
  const where = horizonWhere(predictor);
  const ord = formatOrdinal;
  const nextRound = predictor.races[0]?.round;
  const projectionNote =
    predictor.horizon === 'next' && predictor.racesAfterHorizon > 0
      ? `Isto vale só para a classificação projetada após a etapa ${nextRound}: ainda restará${
          predictor.racesAfterHorizon === 1 ? '' : 'm'
        } ${predictor.racesAfterHorizon} ${predictor.racesAfterHorizon === 1 ? 'etapa' : 'etapas'}.`
      : null;

  const details: string[] = [];
  let summary: string;

  switch (stats.status) {
    case 'guaranteed':
      summary = `Garantida: ${where} você termina em ${ord(target)} ou melhor, aconteça o que acontecer.`;
      details.push(
        'Comprovado: analisamos todos os resultados possíveis das etapas restantes, inclusive o pior caso e perdendo todos os desempates.',
      );
      break;
    case 'possible':
      summary = `Possível, mas depende dos resultados: ${where}, sua melhor posição é ${ord(stats.bestRank)} e a pior, ${ord(stats.worstRank)}.`;
      if (stats.minPointsPossible !== null) {
        details.push(
          stats.minPointsPossible === 0
            ? 'Mesmo sem pontuar ainda é possível, se os adversários ajudarem.'
            : `Você precisa somar pelo menos ${stats.minPointsPossible} pts nas etapas restantes e contar com resultados favoráveis dos adversários.`,
        );
      }
      details.push(
        stats.minPointsGuaranteed !== null
          ? `Somando ${stats.minPointsGuaranteed} pts ou mais, a posição fica garantida, qualquer que seja o resultado dos adversários.`
          : 'Nenhum resultado seu garante esta posição: ela sempre depende dos adversários.',
      );
      break;
    case 'tie-only':
      summary = `Só é possível com empate em pontos: ${where}, a melhor posição sem depender de empate é pior que ${ord(target)}.`;
      details.push('O regulamento ainda não define o desempate, por isso o empate não é contado como conquista.');
      break;
    case 'impossible':
      summary = `Matematicamente impossível ${where}.`;
      details.push(
        `Mesmo vencendo todas as etapas restantes, com os adversários pontuando o mínimo possível, sua melhor posição é ${ord(stats.bestRank)}.`,
      );
      break;
  }
  if (projectionNote) details.push(projectionNote);

  return { status: stats.status, summary, details, stats, where };
}
