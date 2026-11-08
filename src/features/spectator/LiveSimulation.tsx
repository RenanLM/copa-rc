import { useEffect, useState } from 'react';
import { FastForward, Flag, Pause, Play, RotateCcw } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { ChampionshipModel, PilotId, Race, ReplayModel } from '@/domain';
import { Leaderboard } from '@/features/replay/Leaderboard';
import type { ReplayPlayer, ReplaySpeed } from '@/features/replay/ReplayPlayer';
import { StageHeader } from '@/features/replay/StageHud';
import { TrackStage, type StageCar } from '@/features/replay/TrackStage';
import { usePlayerState, useReplayPlayer, useSnapshot } from '@/features/replay/useReplayPlayer';
import styles from './LiveSimulation.module.css';

const SPEEDS: readonly ReplaySpeed[] = [2, 4, 8];
const SPEED_OPTIONS = SPEEDS.map((s) => ({ value: String(s), label: `${s}×` }));

interface LiveSimulationProps {
  model: ChampionshipModel;
  race: Race;
  /** Voltas da simulação. Numa transmissão real, viriam da cronometragem. */
  replay: ReplayModel;
  /** Chamado pelo botão "Ver resultado e pódio", mostrado quando a simulação termina. */
  onShowResult: () => void;
}

/**
 * Acompanhamento da etapa para quem está de fora. Hoje é uma SIMULAÇÃO: usa as
 * voltas da etapa e termina exatamente no resultado que depois alimenta a
 * classificação. Nunca é apresentada como transmissão ao vivo.
 */
export function LiveSimulation({ model, race, replay, onShowResult }: LiveSimulationProps) {
  const player = useReplayPlayer(replay);
  if (!player) return null;
  return <LiveStage model={model} race={race} replay={replay} player={player} onShowResult={onShowResult} />;
}

function LiveStage({
  model,
  race,
  replay,
  player,
  onShowResult,
}: LiveSimulationProps & { player: ReplayPlayer }) {
  const reduceMotion = useReducedMotion();
  const state = usePlayerState(player, 4);
  const snapshot = useSnapshot(player, 4);
  const track = model.tracksById.get(race.trackId);
  const [selectedPilotId, setSelectedPilotId] = useState<PilotId | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const cars: StageCar[] = replay.cars.flatMap((car) => {
    const pilot = model.pilotsById.get(car.pilotId);
    const team = pilot && model.teamsById.get(pilot.teamId);
    return pilot && team ? [{ pilotId: pilot.id, number: pilot.number, color: team.color, name: pilot.name }] : [];
  });

  // Começa sozinha, a menos que a pessoa prefira menos movimento.
  useEffect(() => {
    if (!reduceMotion) player.play();
  }, [player, reduceMotion]);

  useEffect(() => {
    if (state.ended) setAnnouncement('Simulação encerrada. O resultado e o pódio já podem ser vistos.');
  }, [state.ended]);

  const getPilot = (pilotId: PilotId) => {
    const pilot = model.pilotsById.get(pilotId);
    const team = pilot && model.teamsById.get(pilot.teamId);
    return pilot && team ? { pilot, team } : undefined;
  };

  const status = state.ended ? 'Simulação encerrada' : state.playing ? 'Simulação em andamento' : 'Simulação pausada';

  return (
    <div className={styles.wrap}>
      <div className={styles.topline}>
        <div className={styles.event}>
          <ProvenanceBadge kind="simulation" />
          <span className={styles.eventName}>
            Etapa {race.round} · {race.name}
          </span>
        </div>
        <span className={`${styles.livePill} ${state.playing ? styles.pulsing : ''}`} role="status">
          <span className={styles.liveDot} aria-hidden="true" />
          {status}
        </span>
      </div>
      <p className={styles.disclaimer}>
        Etapa {race.round} simulada para esta demonstração. Posições, tempos e ultrapassagens são fictícios e não vêm de
        uma transmissão real.
      </p>

      <TrackStage
        player={player}
        track={track}
        cars={cars}
        selectedPilotId={selectedPilotId}
        label={`Simulação da etapa ${race.round}, ${race.name}. ${cars.length} carros percorrem a pista; a ordem atual aparece no placar abaixo.`}
        header={<StageHeader player={player} totalLaps={replay.totalLaps} />}
      />

      {state.ended && (
        <Card tone="accent" className={styles.finished} aria-labelledby="live-finished-title" role="region">
          <p className={styles.finishedTitle} id="live-finished-title">
            <Flag size={18} aria-hidden="true" /> Bandeira quadriculada
          </p>
          <p className={styles.controlHint}>
            A simulação da etapa {race.round} terminou. Veja quem subiu ao pódio e como ficou a classificação do campeonato.
          </p>
          <Button variant="primary" onClick={onShowResult}>
            Ver resultado e pódio
          </Button>
        </Card>
      )}

      <Card className={styles.controls}>
        <p className={styles.controlHint}>
          {reduceMotion && !state.playing && !state.ended
            ? 'Animação pausada pela preferência de movimento reduzido. Toque em Retomar para ver a corrida.'
            : 'Você controla a simulação: pause, reinicie, mude a velocidade ou vá direto ao final.'}
        </p>
        <div className={styles.controlActions}>
          <button type="button" className={styles.controlButton} onClick={() => player.restart()}>
            <RotateCcw size={19} aria-hidden="true" />
            Reiniciar
          </button>
          <button
            type="button"
            className={styles.playButton}
            onClick={() => player.toggle()}
            aria-label={state.playing ? 'Pausar simulação' : state.ended ? 'Rever simulação' : 'Retomar simulação'}
          >
            {state.playing ? (
              <Pause size={20} fill="currentColor" aria-hidden="true" />
            ) : (
              <Play size={20} fill="currentColor" aria-hidden="true" />
            )}
            {state.playing ? 'Pausar' : state.ended ? 'Rever' : 'Retomar'}
          </button>
        </div>
        <div className={styles.speedRow}>
          <span className={styles.speedLabel}>Velocidade</span>
          <SegmentedControl
            label="Velocidade da simulação"
            options={SPEED_OPTIONS}
            value={String(state.speed)}
            onChange={(value) => player.setSpeed(Number(value) as ReplaySpeed)}
          />
        </div>
        {!state.ended && (
          <Button
            variant="ghost"
            size="small"
            icon={<FastForward size={16} aria-hidden="true" />}
            onClick={() => player.seek(replay.durationMs)}
          >
            Ir para o final
          </Button>
        )}
      </Card>

      <Card flush aria-labelledby="spectator-live-standings">
        <div className={styles.leaderboardHeading}>
          <div>
            <p className={styles.eyebrow}>
              Etapa {race.round} · {race.name}
            </p>
            <h2 id="spectator-live-standings">Posições na pista</h2>
          </div>
          <span className={styles.lapCount}>
            Volta {snapshot.leaderLap}/{replay.totalLaps}
          </span>
        </div>
        <Leaderboard
          player={player}
          totalLaps={replay.totalLaps}
          getPilot={getPilot}
          selectedPilotId={selectedPilotId}
          onSelect={setSelectedPilotId}
          onAnnounce={setAnnouncement}
        />
      </Card>

      <p className={styles.footnote}>
        Toque em um piloto para localizar o carro na pista. A cor identifica a equipe; nome e número ajudam a confirmar.
      </p>
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
    </div>
  );
}
