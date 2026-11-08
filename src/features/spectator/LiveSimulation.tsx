import { useEffect, useMemo, useState } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge';
import { Card } from '@/components/ui/Card';
import type { ChampionshipModel, PilotId, Race } from '@/domain';
import { Leaderboard } from '@/features/replay/Leaderboard';
import { ReplayPlayer } from '@/features/replay/ReplayPlayer';
import { StageHeader } from '@/features/replay/StageHud';
import { TrackStage, type StageCar } from '@/features/replay/TrackStage';
import { useSnapshot } from '@/features/replay/useReplayPlayer';
import { buildSpectatorLiveSimulation } from './live-simulation';
import styles from './LiveSimulation.module.css';

const SIMULATION_SPEED = 2;
const LOOP_PAUSE_MS = 900;

export function LiveSimulation({ model, race }: { model: ChampionshipModel; race: Race }) {
  const reduceMotion = useReducedMotion();
  const replay = useMemo(
    () => buildSpectatorLiveSimulation(model.championship, race),
    [model.championship, race],
  );
  const player = useMemo(() => new ReplayPlayer(replay), [replay]);
  const snapshot = useSnapshot(player, 4);
  const track = model.tracksById.get(race.trackId);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPilotId, setSelectedPilotId] = useState<PilotId | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const cars = useMemo<StageCar[]>(
    () => replay.cars.flatMap((car) => {
      const pilot = model.pilotsById.get(car.pilotId);
      const team = pilot && model.teamsById.get(pilot.teamId);
      return pilot && team
        ? [{ pilotId: pilot.id, number: pilot.number, color: team.color, name: pilot.name }]
        : [];
    }),
    [model, replay],
  );

  useEffect(() => {
    player.setSpeed(SIMULATION_SPEED);
    if (!reduceMotion) {
      player.play();
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
    let loopTimer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = player.subscribe((next) => {
      if (next.ended) {
        setIsPlaying(false);
        loopTimer = setTimeout(() => {
          player.seek(0);
          player.play();
          setIsPlaying(true);
        }, LOOP_PAUSE_MS);
      }
    });

    return () => {
      unsubscribe();
      if (loopTimer !== undefined) clearTimeout(loopTimer);
      player.pause();
      player.destroy();
    };
  }, [player, reduceMotion]);

  const togglePlayback = () => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
      return;
    }
    if (player.getState().ended) player.seek(0);
    player.play();
    setIsPlaying(true);
  };

  const getPilot = (pilotId: PilotId) => {
    const pilot = model.pilotsById.get(pilotId);
    const team = pilot && model.teamsById.get(pilot.teamId);
    return pilot && team ? { pilot, team } : undefined;
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.topline}>
        <div className={styles.event}>
          <ProvenanceBadge kind="simulation" />
          <span className={styles.eventName}>Etapa {race.round} · {race.name}</span>
        </div>
        <span className={`${styles.livePill} ${isPlaying ? styles.pulsing : ''}`}>
          <span className={styles.liveDot} aria-hidden="true" />
          {isPlaying ? 'AO VIVO · SIMULADO' : 'SIMULAÇÃO PAUSADA'}
        </span>
      </div>
      <p className={styles.disclaimer}>
        Etapa 4 criada para demonstrar a experiência da arquibancada. Posições e ultrapassagens são fictícias.
      </p>

      <TrackStage
        player={player}
        track={track}
        cars={cars}
        selectedPilotId={selectedPilotId}
        label={`Simulação da etapa ${race.round}, ${race.name}. ${cars.length} carros percorrem a pista; a ordem atual aparece no placar abaixo.`}
        header={<StageHeader player={player} totalLaps={replay.totalLaps} />}
      />

      <Card className={styles.controls}>
        <p className={styles.controlHint}>
          {reduceMotion && !isPlaying
            ? 'Animação pausada pela preferência de movimento reduzido.'
            : 'A corrida reinicia automaticamente após a bandeirada.'}
        </p>
        <div className={styles.controlActions}>
          <button type="button" className={styles.controlButton} onClick={() => player.restart()}>
            <RotateCcw size={19} aria-hidden="true" />
            Reiniciar
          </button>
          <button
            type="button"
            className={styles.playButton}
            onClick={togglePlayback}
            aria-label={isPlaying ? 'Pausar simulação' : 'Retomar simulação'}
          >
            {isPlaying ? <Pause size={20} fill="currentColor" aria-hidden="true" /> : <Play size={20} fill="currentColor" aria-hidden="true" />}
            {isPlaying ? 'Pausar' : 'Retomar'}
          </button>
        </div>
      </Card>

      <Card flush aria-labelledby="spectator-live-standings">
        <div className={styles.leaderboardHeading}>
          <div>
            <p className={styles.eyebrow}>Etapa {race.round} · {race.name}</p>
            <h2 id="spectator-live-standings">Posições na pista</h2>
          </div>
          <span className={styles.lapCount}>Volta {snapshot.leaderLap}/{replay.totalLaps}</span>
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
      <div className="sr-only" role="status" aria-live="polite">{announcement}</div>
    </div>
  );
}
