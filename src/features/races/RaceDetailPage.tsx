import { useState } from 'react';
import { CalendarDays, Clock, Flag, MapPin, Play, Repeat } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useModel } from '@/app/providers/ChampionshipProvider';
import { useProfile } from '@/app/providers/ProfileProvider';
import { profilePath } from '@/app/profiles';
import { Badge } from '@/components/ui/Badge';
import { LinkButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState } from '@/components/ui/StateViews';
import { raceFastestLap, totalTimeOf } from '@/domain';
import { daysBetween, formatCountdown, formatLapTime, formatLongDate } from '@/lib/format';
import { PilotHeatTelemetry } from '@/features/performance/PilotHeatTelemetry';
import { HeatTable } from './HeatTable';
import { RaceResultList } from './RaceResultList';
import styles from './RaceDetailPage.module.css';

type View = 'final' | 'heats';

export function RaceDetailPage() {
  const { raceId } = useParams();
  const model = useModel();
  const profile = useProfile();
  const [view, setView] = useState<View>('final');
  const calendar = profilePath(profile, 'corridas');

  const race = raceId ? model.racesById.get(raceId) : undefined;
  if (!race) {
    return (
      <EmptyState
        heading="h1"
        title="Etapa não encontrada"
        message="Não existe uma etapa com este endereço. Volte ao calendário para escolher uma."
        action={<LinkButton to={calendar} variant="primary">Ver calendário</LinkButton>}
      />
    );
  }

  const { championship } = model;
  const track = model.tracksById.get(race.trackId);
  const results = model.resultsByRace.get(race.id);
  const finished = race.status === 'finished' && results;

  const winnerEntry = results?.final.find((e) => e.position === 1);
  const winner = winnerEntry && model.pilotsById.get(winnerEntry.pilotId);
  const fastest = finished ? raceFastestLap(championship, race.id) : null;
  const fastestPilot = fastest && model.pilotsById.get(fastest.pilotId);

  return (
    <>
      <PageHeader
        back={{ to: calendar, label: 'Calendário' }}
        eyebrow={`Etapa ${race.round} de ${championship.rules.totalRaces}`}
        title={race.name}
        subtitle={track ? `${track.name} · ${track.city}` : undefined}
      />

      <div className={styles.chips} style={{ marginTop: -8 }}>
        <Badge tone="soft">
          <CalendarDays size={12} aria-hidden="true" /> {formatLongDate(race.date)}
        </Badge>
        <Badge tone="soft">
          <Clock size={12} aria-hidden="true" /> {race.startTime}
        </Badge>
        <Badge tone="soft">
          <Repeat size={12} aria-hidden="true" /> {race.finalLaps} voltas
        </Badge>
      </div>

      {profile.persona.pilotId && (
        <PilotHeatTelemetry model={model} pilotId={profile.persona.pilotId} raceId={race.id} />
      )}

      {!finished && (
        <Card>
          <div className={styles.pending}>
            <Badge tone={race.status === 'live' ? 'data' : 'accent'}>
              {race.status === 'live'
                ? 'Em andamento'
                : formatCountdown(daysBetween(championship.referenceDate, race.date))}
            </Badge>
            <EmptyState
              icon={Flag}
              title="Resultados em breve"
              message="Os resultados e as baterias aparecem aqui assim que a etapa for finalizada."
            />
            {track && (
              <p className={styles.pendingRow}>
                <MapPin size={16} aria-hidden="true" />
                {track.name} · {track.city} · pista com cerca de {track.lengthMeters} m por volta
              </p>
            )}
          </div>
        </Card>
      )}

      {finished && (
        <>
          <Card>
            <div className={styles.summary}>
              <div>
                <p className={styles.summaryLabel}>Vencedor</p>
                <p className={styles.summaryValue}>{winner?.name ?? '—'}</p>
                {winnerEntry && (
                  <p className={`${styles.summarySub} num`}>{formatLapTime(totalTimeOf(winnerEntry.lapTimesMs))}</p>
                )}
              </div>
              <div>
                <p className={styles.summaryLabel}>Volta mais rápida</p>
                <p className={`${styles.summaryValue} ${styles.summaryData} num`}>
                  {fastest ? formatLapTime(fastest.timeMs) : '—'}
                </p>
                {fastestPilot && fastest && (
                  <p className={styles.summarySub}>
                    {fastestPilot.name} ·{' '}
                    {fastest.session.type === 'final' ? 'prova final' : `bateria ${fastest.session.index}`}
                  </p>
                )}
              </div>
            </div>
          </Card>

          <LinkButton
            to={profilePath(profile, `corridas/${race.id}/replay`)}
            variant="primary"
            icon={<Play size={18} fill="currentColor" aria-hidden="true" />}
          >
            Ver replay da corrida
          </LinkButton>

          <SegmentedControl<View>
            label="Visualização da etapa"
            value={view}
            onChange={setView}
            options={[
              { value: 'final', label: 'Resultado final' },
              { value: 'heats', label: 'Baterias' },
            ]}
          />

          {view === 'final' ? (
            <Card flush>
              <RaceResultList
                model={model}
                raceId={race.id}
                highlightPilotId={profile.persona.pilotId}
              />
            </Card>
          ) : (
            <HeatTable model={model} raceId={race.id} highlightPilotId={profile.persona.pilotId} />
          )}
          <p className={styles.hint}>Toque em um piloto para ver o detalhe das voltas.</p>
        </>
      )}
    </>
  );
}
