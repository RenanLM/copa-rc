import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge';
import { EmptyState } from '@/components/ui/StateViews';
import { buildReplay, type ChampionshipModel, type PilotId, type RaceId } from '@/domain';
import { FinalResultCard } from './FinalResultCard';
import { Leaderboard } from './Leaderboard';
import { ReplayControls } from './ReplayControls';
import type { ReplayPlayer } from './ReplayPlayer';
import { StageHeader, StartOverlay } from './StageHud';
import { TrackStage, type StageCar } from './TrackStage';
import { usePlayerState, useReplayPlayer } from './useReplayPlayer';
import styles from './RaceReplay.module.css';

interface RaceReplayProps {
  model: ChampionshipModel;
  raceId: RaceId;
  /** Piloto sempre destacado (opcional: o componente não depende de persona). */
  focusPilotId?: PilotId;
  /** Para onde "Ver resultado completo" leva. */
  resultPath: string;
}

/** Aparece quando a reprodução chega ao fim: resultado oficial + aviso para leitores de tela. */
function ReplayOutcome({
  player,
  model,
  raceId,
  focusPilotId,
  resultPath,
  onAnnounce,
}: RaceReplayProps & { player: ReplayPlayer; onAnnounce: (message: string) => void }) {
  const { ended } = usePlayerState(player, 4);
  useEffect(() => {
    if (ended) onAnnounce('Corrida encerrada. O resultado final está logo abaixo.');
  }, [ended]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!ended) return null;
  return <FinalResultCard model={model} raceId={raceId} focusPilotId={focusPilotId} resultPath={resultPath} />;
}

/**
 * Reprodução animada de uma etapa: pista, cronômetro, volta, classificação
 * dinâmica, controles e resultado final. Reutilizável por qualquer perfil.
 */
export function RaceReplay({ model, raceId, focusPilotId, resultPath }: RaceReplayProps) {
  const replay = useMemo(() => buildReplay(model.championship, raceId), [model, raceId]);
  const player = useReplayPlayer(replay);
  const [selected, setSelected] = useState<PilotId | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const cars = useMemo<StageCar[]>(
    () =>
      (replay?.cars ?? []).flatMap((car) => {
        const pilot = model.pilotsById.get(car.pilotId);
        const team = pilot && model.teamsById.get(pilot.teamId);
        return pilot && team ? [{ pilotId: pilot.id, number: pilot.number, color: team.color, name: pilot.name }] : [];
      }),
    [replay, model],
  );

  const race = model.racesById.get(raceId);
  if (!replay || !player || !race) {
    return (
      <EmptyState
        title="Replay indisponível"
        message="O replay só existe para etapas finalizadas e com voltas registradas."
      />
    );
  }

  const track = model.tracksById.get(race.trackId);
  const getPilot = (id: PilotId) => {
    const pilot = model.pilotsById.get(id);
    const team = pilot && model.teamsById.get(pilot.teamId);
    return pilot && team ? { pilot, team } : undefined;
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.meta}>
        <div>
          <ProvenanceBadge kind="simulation" />
        </div>
        <p className={styles.note}>
          Reprodução ilustrativa feita a partir dos tempos de volta da etapa (dados de demonstração). Não é uma
          transmissão ao vivo nem telemetria real.
        </p>
      </div>

      <TrackStage
        player={player}
        track={track}
        cars={cars}
        focusPilotId={focusPilotId}
        selectedPilotId={selected}
        label={`Pista ${track?.name ?? race.name} vista de cima, com ${cars.length} carros. A classificação ao vivo está na lista abaixo.`}
        header={<StageHeader player={player} totalLaps={replay.totalLaps} />}
      >
        <StartOverlay player={player} />
      </TrackStage>

      <Card>
        <ReplayControls player={player} totalLaps={replay.totalLaps} />
      </Card>

      <Card flush aria-labelledby="live-standings-title">
        <h2 className={styles.sectionTitle} id="live-standings-title" style={{ padding: '16px 16px 0' }}>
          Classificação ao vivo
        </h2>
        <Leaderboard
          player={player}
          totalLaps={replay.totalLaps}
          getPilot={getPilot}
          focusPilotId={focusPilotId}
          selectedPilotId={selected}
          onSelect={setSelected}
          onAnnounce={setAnnouncement}
        />
      </Card>

      <ReplayOutcome
        player={player}
        model={model}
        raceId={raceId}
        focusPilotId={focusPilotId}
        resultPath={resultPath}
        onAnnounce={setAnnouncement}
      />

      <p className={styles.footnote}>
        Como funciona: o momento em que cada carro cruza a linha vem das voltas registradas. A posição dentro de cada
        volta e a ordem de largada são estimadas.
      </p>

      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
