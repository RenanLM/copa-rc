import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useModel } from '@/app/providers/ChampionshipProvider';
import { useProfile } from '@/app/providers/ProfileProvider';
import { profilePath } from '@/app/profiles';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  nextRace,
  pointsForPosition,
  type ChampionshipModel,
  type PilotId,
  type Race,
} from '@/domain';
import { daysBetween, formatCountdown, formatOrdinal } from '@/lib/format';
import styles from './RacesPage.module.css';

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function RaceStatus({ race, isNext, referenceDate }: { race: Race; isNext: boolean; referenceDate: string }) {
  if (race.status === 'finished') {
    return (
      <Badge>
        <Check size={11} aria-hidden="true" /> Finalizada
      </Badge>
    );
  }
  if (race.status === 'live') return <Badge tone="data">Em andamento</Badge>;
  return isNext ? (
    <Badge tone="accent">{formatCountdown(daysBetween(referenceDate, race.date))}</Badge>
  ) : (
    <Badge>Agendada</Badge>
  );
}

/** O que mostrar à direita: o resultado do piloto em foco ou, sem foco, o vencedor. */
function RaceOutcome({
  model,
  race,
  focusPilotId,
}: {
  model: ChampionshipModel;
  race: Race;
  focusPilotId?: PilotId;
}) {
  const results = model.resultsByRace.get(race.id);
  if (race.status !== 'finished' || !results) return null;

  const mine = focusPilotId && results.final.find((e) => e.pilotId === focusPilotId);
  if (mine) {
    const points = pointsForPosition(mine.position, model.championship.rules);
    return (
      <>
        <span className={`${styles.result} num`}>{formatOrdinal(mine.position)}</span>
        <span className={`${styles.resultPoints} num`}>
          +{points} {points === 1 ? 'pt' : 'pts'}
        </span>
      </>
    );
  }
  const winner = results.final.find((e) => e.position === 1);
  const name = winner && model.pilotsById.get(winner.pilotId)?.name;
  return name ? <span className={styles.resultLabel}>Vencedor: {name}</span> : null;
}

/** Calendário das cinco etapas. Compartilhado: o resultado destacado depende do perfil. */
export function RacesPage() {
  const model = useModel();
  const profile = useProfile();
  const { championship } = model;
  const upcoming = nextRace(championship);
  const finished = championship.races.filter((r) => r.status === 'finished').length;
  const races = [...championship.races].sort((a, b) => a.round - b.round);

  return (
    <>
      <PageHeader
        eyebrow={`Temporada ${championship.season}`}
        title="Calendário"
        subtitle={`${championship.rules.totalRaces} etapas · ${finished} concluídas`}
      />
      <ul className={styles.list}>
        {races.map((race, index) => {
          const track = model.tracksById.get(race.trackId);
          const isNext = upcoming?.id === race.id;
          const [, month, day] = race.date.split('-');
          return (
            <motion.li
              key={race.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: index * 0.05, ease: [0.2, 0.7, 0.2, 1] }}
            >
              <Link
                to={profilePath(profile, `corridas/${race.id}`)}
                className={`${styles.card} ${isNext ? styles.next : ''}`}
              >
                <span className={styles.date} aria-hidden="true">
                  <span className={`${styles.day} num`}>{Number(day)}</span>
                  <span className={styles.month}>{MONTHS[Number(month) - 1]}</span>
                </span>
                <span className={styles.info}>
                  <span className={styles.round}>Etapa {race.round}</span>
                  <span className={styles.name} style={{ display: 'block' }}>
                    {race.name}
                  </span>
                  <span className={styles.track} style={{ display: 'block' }}>
                    {track ? `${track.name} · ${track.city}` : ''}
                  </span>
                </span>
                <span className={styles.side}>
                  <RaceOutcome model={model} race={race} focusPilotId={profile.persona.pilotId} />
                  <RaceStatus race={race} isNext={isNext} referenceDate={championship.referenceDate} />
                </span>
              </Link>
            </motion.li>
          );
        })}
      </ul>
    </>
  );
}
