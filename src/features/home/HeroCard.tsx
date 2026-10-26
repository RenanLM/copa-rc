import type { CSSProperties } from 'react';
import { ArrowDownToLine, ArrowUpToLine, Crown } from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Card } from '@/components/ui/Card';
import { PilotNumber } from '@/components/ui/PilotNumber';
import { PositionDelta } from '@/components/ui/PositionDelta';
import { SeasonProgress } from '@/components/ui/SeasonProgress';
import type { PilotSeasonSummary } from '@/domain';
import { formatOrdinal } from '@/lib/format';
import styles from './HeroCard.module.css';

function changeText(change: number | null): string {
  if (change === null) return 'Primeira classificação da temporada';
  if (change === 0) return 'Posição mantida desde a etapa anterior';
  const n = Math.abs(change);
  const places = n === 1 ? 'posição' : 'posições';
  return change > 0 ? `Subiu ${n} ${places} na última etapa` : `Caiu ${n} ${places} na última etapa`;
}

export function HeroCard({ summary, pilotNameOf }: {
  summary: PilotSeasonSummary;
  pilotNameOf: (pilotId: string) => string;
}) {
  const { pilot, team, standing, ahead, behind, positionChange } = summary;
  const isLeader = standing.position === 1 && !standing.tied;

  return (
    <Card tone="accent" telemetry aria-label={`Resumo de ${pilot.name}`}>
      <div className={styles.identity}>
        <PilotNumber number={pilot.number} color={team.color} size="large" />
        <div className={styles.who}>
          <h1 className={styles.name}>{pilot.name}</h1>
          <p className={styles.team} style={{ '--team': team.color } as CSSProperties}>
            <span className={styles.dot} aria-hidden="true" />
            {team.name}
          </p>
        </div>
      </div>

      <div className={styles.metrics}>
        <div>
          <p className={styles.label}>Posição</p>
          <p className={`${styles.big} ${styles.position}`}>
            <AnimatedNumber value={standing.position} id={`position-${pilot.id}`} />
            <span className={styles.sup}>º</span>
          </p>
        </div>
        <div>
          <p className={styles.label}>Pontos</p>
          <p className={`${styles.big} ${styles.points}`}>
            <AnimatedNumber value={standing.points} id={`points-${pilot.id}`} />
            <span className={styles.unit}>pts</span>
          </p>
        </div>
      </div>
      <p className={styles.change} style={{ position: 'relative' }}>
        <span aria-hidden="true">
          <PositionDelta change={positionChange} inline />
        </span>
        <span>
          {changeText(positionChange)}
          {standing.tied && ' · Empatado: o regulamento ainda não define o desempate'}
        </span>
      </p>

      <div className={styles.gaps}>
        {isLeader && (
          <p className={styles.gap}>
            <Crown size={16} className={styles.gapIcon} aria-hidden="true" />
            <span>
              <strong>Líder do campeonato.</strong>
            </span>
          </p>
        )}
        {ahead && (
          <p className={styles.gap}>
            <ArrowUpToLine size={16} className={styles.gapIcon} aria-hidden="true" />
            <span>
              <strong>{ahead.pointsDiff} pts</strong> para alcançar o{' '}
              {formatOrdinal(ahead.standing.position)} lugar ({pilotNameOf(ahead.standing.pilotId)})
            </span>
          </p>
        )}
        {behind && (
          <p className={styles.gap}>
            <ArrowDownToLine size={16} className={styles.gapIcon} aria-hidden="true" />
            <span>
              <strong>{behind.pointsDiff} pts</strong> à frente do{' '}
              {formatOrdinal(behind.standing.position)} lugar ({pilotNameOf(behind.standing.pilotId)})
            </span>
          </p>
        )}
      </div>

      <div className={styles.progress}>
        <SeasonProgress completed={summary.racesFinished} total={summary.totalRaces} />
        <p className={styles.progressLabel}>
          {summary.racesFinished} de {summary.totalRaces} etapas concluídas
        </p>
      </div>
    </Card>
  );
}
