import { useMemo } from 'react';
import { Gauge, Repeat } from 'lucide-react';
import { useProfile } from '@/app/providers/ProfileProvider';
import { useModel } from '@/app/providers/ChampionshipProvider';
import { profilePath } from '@/app/profiles';
import { StatTile } from '@/components/ui/StatTile';
import { EmptyState } from '@/components/ui/StateViews';
import { getPilotSeasonSummary, maxPointsPerRace } from '@/domain';
import { formatLapTime } from '@/lib/format';
import { EvolutionCard } from './EvolutionCard';
import { HeatsCard } from './HeatsCard';
import { HeroCard } from './HeroCard';
import { LastRaceCard } from './LastRaceCard';
import { NextRaceCard } from './NextRaceCard';
import styles from './cards.module.css';

/** Painel do piloto: o essencial primeiro, o detalhe logo abaixo. */
export function PilotHomePage() {
  const model = useModel();
  const profile = useProfile();
  const { championship } = model;
  const pilotId = profile.persona.pilotId;

  const summary = useMemo(
    () => (pilotId ? getPilotSeasonSummary(championship, pilotId) : null),
    [championship, pilotId],
  );

  if (!summary) {
    return (
      <EmptyState
        heading="h1"
        title="Piloto não encontrado"
        message="Não encontramos os dados deste piloto no campeonato."
      />
    );
  }

  const pilotNameOf = (id: string) => model.pilotsById.get(id)?.name ?? 'Piloto';
  const nextTrack = summary.nextRace && model.tracksById.get(summary.nextRace.trackId);
  const lastTrack = summary.lastRace && model.tracksById.get(summary.lastRace.race.trackId);
  const bestLapRace = summary.bestLap && model.racesById.get(summary.bestLap.raceId);

  return (
    <>
      <HeroCard summary={summary} pilotNameOf={pilotNameOf} />

      {summary.lastRace && (
        <LastRaceCard
          lastRace={summary.lastRace}
          trackName={lastTrack?.name ?? ''}
          detailPath={profilePath(profile, `corridas/${summary.lastRace.race.id}`)}
        />
      )}

      <div className={styles.tiles}>
        <StatTile
          label="Melhor volta"
          icon={<Gauge size={14} aria-hidden="true" />}
          tone="data"
          value={
            <span className="num">
              {summary.bestLap ? formatLapTime(summary.bestLap.timeMs) : '—'}
            </span>
          }
          caption={
            summary.bestLap && bestLapRace
              ? `Etapa ${bestLapRace.round} · ${
                  summary.bestLap.session.type === 'final'
                    ? 'prova final'
                    : `bateria ${summary.bestLap.session.index}`
                }`
              : 'Sem voltas registradas'
          }
        />
        <StatTile
          label="Voltas"
          icon={<Repeat size={14} aria-hidden="true" />}
          value={<span className="num">{summary.totalLaps}</span>}
          caption={`em ${summary.racesFinished} etapas, somando baterias e provas`}
        />
      </div>

      {summary.nextRace && nextTrack && (
        <NextRaceCard
          race={summary.nextRace}
          track={nextTrack}
          referenceDate={championship.referenceDate}
          calendarPath={profilePath(profile, 'corridas')}
        />
      )}

      {summary.lastRace && (
        <HeatsCard round={summary.lastRace.race.round} heats={summary.lastRaceHeats} />
      )}

      <EvolutionCard
        evolution={summary.evolution}
        maxRacePoints={maxPointsPerRace(championship.rules)}
        detailPath={profilePath(profile, 'desempenho')}
      />
    </>
  );
}
