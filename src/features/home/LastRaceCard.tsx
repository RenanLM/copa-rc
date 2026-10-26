import { Play } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LinkButton } from '@/components/ui/Button';
import type { LastRaceSummary } from '@/domain';
import { formatGap, formatLapTime, formatOrdinal, formatShortDate } from '@/lib/format';
import styles from './cards.module.css';

interface LastRaceCardProps {
  lastRace: LastRaceSummary;
  trackName: string;
  detailPath: string;
}

export function LastRaceCard({ lastRace, trackName, detailPath }: LastRaceCardProps) {
  const { race, status } = lastRace;
  const abandoned = status === 'dnf';

  return (
    <Card aria-labelledby="last-race-title">
      <div className={styles.kicker}>
        <h2 className={styles.kickerTitle} id="last-race-title">
          Última etapa
        </h2>
        <Badge>Finalizada</Badge>
      </div>
      <p className={styles.heading}>
        Etapa {race.round} · {race.name}
      </p>
      <p className={styles.meta}>
        {trackName} · {formatShortDate(race.date)}
      </p>

      <div className={styles.lastResult}>
        <span className={`${styles.lastPosition} num`}>
          {abandoned ? 'DNF' : formatOrdinal(lastRace.position)}
        </span>
        <span className={`${styles.lastPoints} num`}>
          +{lastRace.points} {lastRace.points === 1 ? 'pt' : 'pts'}
        </span>
      </div>

      <p className={styles.facts}>
        <span>
          <strong>{formatGap(lastRace.gap)}</strong>
          {lastRace.gap.kind === 'time' && ' do vencedor'}
        </span>
        <span>
          <strong>{lastRace.laps}</strong> voltas
        </span>
        {lastRace.bestLapMs !== null && (
          <span>
            Melhor volta <strong className="num">{formatLapTime(lastRace.bestLapMs)}</strong>
          </span>
        )}
      </p>

      <div className={styles.actions}>
        <LinkButton to={detailPath} size="small">
          Ver resultado completo
        </LinkButton>
        <LinkButton to={`${detailPath}/replay`} size="small" icon={<Play size={16} fill="currentColor" aria-hidden="true" />}>
          Rever a corrida
        </LinkButton>
      </div>
    </Card>
  );
}
