import { useMemo } from 'react';
import { ArrowRight, CalendarDays, ChartNoAxesCombined, Flag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProfile } from '@/app/providers/ProfileProvider';
import { useModel } from '@/app/providers/ChampionshipProvider';
import { profilePath } from '@/app/profiles';
import { StatTile } from '@/components/ui/StatTile';
import { EmptyState } from '@/components/ui/StateViews';
import { getPilotSeasonSummary, maxPointsPerRace } from '@/domain';
import { formatLapTime, formatOrdinal } from '@/lib/format';
import { PilotHeatTelemetry } from '@/features/performance/PilotHeatTelemetry';
import { EvolutionCard } from './EvolutionCard';
import { HeroCard } from './HeroCard';
import { LastRaceCard } from './LastRaceCard';
import { NextRaceCard } from './NextRaceCard';
import styles from './PilotHomePage.module.css';

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

  if (!pilotId || !summary) {
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
  const racePath = summary.lastRace
    ? profilePath(profile, `corridas/${summary.lastRace.race.id}`)
    : profilePath(profile, 'corridas');

  return (
    <>
      <section className={styles.block} aria-labelledby="pilot-status-title">
        <header className={styles.blockHeading}>
          <span className={styles.blockIndex}>01</span>
          <h2 id="pilot-status-title">Status no Campeonato</h2>
        </header>
        <HeroCard summary={summary} pilotNameOf={pilotNameOf} />
        {summary.lastRace && (
          <div className={styles.trackStatus}>
            <span className={styles.trackIcon} aria-hidden="true">
              <Flag size={19} />
            </span>
            <span className={styles.trackCopy}>
              <small>Última prova oficial · Etapa {summary.lastRace.race.round}</small>
              <strong>
                {summary.lastRace.status === 'dnf' ? 'Abandono' : formatOrdinal(summary.lastRace.position)}
                {' · '}
                {summary.lastRace.race.name}
              </strong>
            </span>
            <strong className={`${styles.trackPoints} num`}>
              +{summary.lastRace.points} pts
            </strong>
          </div>
        )}
      </section>

      <section className={styles.block} aria-labelledby="pilot-session-title">
        <header className={styles.blockHeading}>
          <span className={`${styles.blockIndex} ${styles.telemetryIndex}`}>02</span>
          <h2 id="pilot-session-title">Sua última entrada na pista</h2>
        </header>
        <PilotHeatTelemetry model={model} pilotId={pilotId} />
      </section>

      <section className={styles.block} aria-labelledby="pilot-more-title">
        <header className={styles.blockHeading}>
          <span className={`${styles.blockIndex} ${styles.moreIndex}`}>03</span>
          <h2 id="pilot-more-title">Acesso rápido e evolução</h2>
        </header>

        <nav className={styles.quickLinks} aria-label="Acesso rápido do piloto">
          {summary.lastRace && (
            <Link
              className={styles.quickLink}
              to={racePath}
            >
              <Flag size={19} aria-hidden="true" />
              <span>
                <strong>Abrir resultado completo</strong>
                <small>Etapa {summary.lastRace.race.round} · {summary.lastRace.race.name}</small>
              </span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          )}
          {summary.nextRace && (
            <Link className={styles.quickLink} to={profilePath(profile, 'corridas')}>
              <CalendarDays size={19} aria-hidden="true" />
              <span>
                <strong>Próxima corrida</strong>
                <small>{summary.nextRace.name} · detalhes no calendário</small>
              </span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          )}
          <Link className={styles.quickLink} to={profilePath(profile, 'desempenho')}>
            <ChartNoAxesCombined size={19} aria-hidden="true" />
            <span>
              <strong>Análise de desempenho</strong>
              <small>Comparativos e evolução detalhados</small>
            </span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </nav>

        {summary.lastRace && lastTrack && (
          <details className={styles.disclosure}>
            <summary>
              <span>Ver detalhes do último resultado</span>
              <ArrowRight size={17} aria-hidden="true" />
            </summary>
            <LastRaceCard
              lastRace={summary.lastRace}
              trackName={lastTrack.name}
              detailPath={racePath}
              embedded
            />
          </details>
        )}

        <details className={styles.disclosure}>
          <summary>
            <span>Números acumulados da temporada</span>
            <ArrowRight size={17} aria-hidden="true" />
          </summary>
          <div className={styles.tiles}>
            <StatTile
              label="Melhor volta"
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
              tone="data"
            />
            <StatTile
              label="Voltas"
              value={<span className="num">{summary.totalLaps}</span>}
              caption={`em ${summary.racesFinished} etapas, somando baterias e provas`}
            />
          </div>
        </details>

        {summary.nextRace && nextTrack && (
          <details className={styles.disclosure}>
            <summary>
              <span>Agenda: {summary.nextRace.name}</span>
              <ArrowRight size={17} aria-hidden="true" />
            </summary>
            <NextRaceCard
              race={summary.nextRace}
              track={nextTrack}
              referenceDate={championship.referenceDate}
              calendarPath={profilePath(profile, 'corridas')}
            />
          </details>
        )}

        <details className={styles.disclosure}>
          <summary>
            <span>Ver evolução nas etapas</span>
            <ArrowRight size={17} aria-hidden="true" />
          </summary>
          <EvolutionCard
            evolution={summary.evolution}
            maxRacePoints={maxPointsPerRace(championship.rules)}
            detailPath={profilePath(profile, 'desempenho')}
          />
        </details>
      </section>
    </>
  );
}
