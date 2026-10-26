import { CalendarDays, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { LinkButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Race, Track } from '@/domain';
import { daysBetween, formatCountdown, formatLongDate } from '@/lib/format';
import styles from './cards.module.css';

interface NextRaceCardProps {
  race: Race;
  track: Track;
  referenceDate: string;
  calendarPath: string;
}

export function NextRaceCard({ race, track, referenceDate, calendarPath }: NextRaceCardProps) {
  const live = race.status === 'live';
  return (
    <Card tone="data" aria-labelledby="next-race-title">
      <div className={styles.kicker}>
        <h2 className={styles.kickerTitle} id="next-race-title">
          {live ? 'Corrida em andamento' : 'Próxima corrida'}
        </h2>
        <Badge tone={live ? 'alert' : 'data'}>
          {live ? 'Ao vivo' : formatCountdown(daysBetween(referenceDate, race.date))}
        </Badge>
      </div>
      <p className={styles.heading}>
        Etapa {race.round} · {race.name}
      </p>
      <div className={styles.nextInfo}>
        <p>
          <MapPin size={16} aria-hidden="true" />
          {track.name} · {track.city}
        </p>
        <p>
          <CalendarDays size={16} aria-hidden="true" />
          {formatLongDate(race.date)} · {race.startTime}
        </p>
      </div>
      <LinkButton to={calendarPath} size="small" className={styles.cta}>
        Ver calendário
      </LinkButton>
    </Card>
  );
}
