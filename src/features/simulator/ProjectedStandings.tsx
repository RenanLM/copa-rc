import { motion } from 'motion/react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { PilotLine } from '@/components/PilotLine';
import { PositionDelta } from '@/components/ui/PositionDelta';
import type { ChampionshipModel, PilotId, Predictor, ProjectedStanding } from '@/domain';
import { formatOrdinal } from '@/lib/format';
import { horizonWhere } from './verdict';
import styles from './ProjectedStandings.module.css';

interface ProjectedStandingsProps {
  model: ChampionshipModel;
  predictor: Predictor;
  standings: readonly ProjectedStanding[];
  focusPilotId: PilotId;
  /** Descrição do cenário exibido (ex.: "Mais favorável a você"). */
  scenarioLabel: string;
}

const SPRING = { type: 'spring', stiffness: 520, damping: 42 } as const;

/**
 * Classificação projetada. As linhas se reordenam com animação quando o cenário
 * muda. O cabeçalho diferencia "projeção após a próxima etapa" de "classificação
 * final", para ninguém confundir hipótese com resultado.
 */
export function ProjectedStandings({ model, predictor, standings, focusPilotId, scenarioLabel }: ProjectedStandingsProps) {
  const isFinal = predictor.horizon === 'final';
  const mine = standings.find((s) => s.pilotId === focusPilotId);
  const lastRound = predictor.races[predictor.races.length - 1]?.round;

  return (
    <Card flush aria-labelledby="projected-title" role="region">
      <div className={styles.head}>
        <div className={styles.headRow}>
          <h2 className={styles.title} id="projected-title">
            {isFinal ? 'Classificação final projetada' : 'Classificação projetada'}
          </h2>
          <Badge tone={isFinal ? 'accent' : 'data'}>{isFinal ? 'Final' : 'Projeção'}</Badge>
        </div>
        <p className={styles.note}>
          {isFinal
            ? `Como ficaria o campeonato depois da etapa ${lastRound}, a última.`
            : `Como ficaria a classificação logo após a etapa ${lastRound}. Ainda restará${predictor.racesAfterHorizon === 1 ? '' : 'm'} ${predictor.racesAfterHorizon} ${predictor.racesAfterHorizon === 1 ? 'etapa' : 'etapas'}: isto não é a classificação final.`}
        </p>
        <p className={styles.note}>
          Cenário: <strong style={{ color: 'var(--text)' }}>{scenarioLabel}</strong>
        </p>
      </div>

      {mine && (
        <p className={styles.result} aria-live="polite">
          {horizonWhere(predictor) === 'ao final do campeonato' ? 'Ao final' : 'Após a etapa ' + lastRound}, neste cenário, você
          termina em <strong>{formatOrdinal(mine.position)}</strong>
          {mine.tied ? ' (empatado: o desempate é indefinido)' : ''} com <strong>{mine.points} pts</strong>
          {mine.change !== 0 && (
            <>
              {' '}
              ({mine.change > 0 ? 'subiu' : 'caiu'} {Math.abs(mine.change)} {Math.abs(mine.change) === 1 ? 'posição' : 'posições'})
            </>
          )}
          .
        </p>
      )}

      <ol className={styles.list} aria-label={isFinal ? 'Classificação final projetada' : 'Classificação projetada'}>
        {standings.map((s) => {
          const pilot = model.pilotsById.get(s.pilotId);
          const team = pilot && model.teamsById.get(pilot.teamId);
          if (!pilot || !team) return null;
          const focus = s.pilotId === focusPilotId;
          return (
            <motion.li
              key={s.pilotId}
              layout="position"
              transition={SPRING}
              className={`${styles.item} ${focus ? styles.highlight : ''}`}
            >
              <div className={styles.row}>
                <span className={`${styles.position} num`} aria-label={`Posição ${s.position}${s.tied ? ', empatado' : ''}`}>
                  <span aria-hidden="true">{s.position}</span>
                  {s.tied && (
                    <span className={styles.tie} aria-hidden="true">
                      =
                    </span>
                  )}
                </span>
                <PilotLine pilot={pilot} team={team} sub={focus ? `${team.name} · você` : undefined} />
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  <PositionDelta change={s.change} />
                  {s.gained > 0 && (
                    <span className={`${styles.gain} num`}>
                      +{s.gained}
                      <span className="sr-only"> pontos neste cenário</span>
                    </span>
                  )}
                </span>
                <span className={styles.points}>
                  <span className={`${styles.pointsValue} num`}>
                    <AnimatedNumber value={s.points} duration={0.5} />
                  </span>
                  <span className={styles.pointsUnit}>pts</span>
                </span>
              </div>
            </motion.li>
          );
        })}
      </ol>
      <p className={styles.legend}>
        As setas comparam com a classificação de hoje. "=" indica empate em pontos: o regulamento ainda não define o desempate.
      </p>
    </Card>
  );
}
