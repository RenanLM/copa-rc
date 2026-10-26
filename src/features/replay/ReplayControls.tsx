import type { CSSProperties } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { formatClock } from '@/lib/format';
import { REPLAY_SPEEDS, type ReplayPlayer, type ReplaySpeed } from './ReplayPlayer';
import { usePlayerState, useSnapshot } from './useReplayPlayer';
import styles from './ReplayControls.module.css';

interface ReplayControlsProps {
  player: ReplayPlayer;
  totalLaps: number;
}

const SLIDER_STEP_MS = 1000;

const SPEED_OPTIONS = REPLAY_SPEEDS.map((s) => ({ value: String(s), label: `${s}×` }));

/** Reproduzir/pausar, reiniciar, velocidade e linha do tempo: controle explícito. */
export function ReplayControls({ player, totalLaps }: ReplayControlsProps) {
  const state = usePlayerState(player, 10);
  const snapshot = useSnapshot(player, 4);
  const duration = player.model.durationMs;
  // O máximo é arredondado ao degrau do controle: assim o navegador permite
  // arrastar até o fim exato (o `seek` limita ao fim real da corrida).
  const sliderMax = Math.max(SLIDER_STEP_MS, Math.ceil(duration / SLIDER_STEP_MS) * SLIDER_STEP_MS);
  const percent = (state.timeMs / sliderMax) * 100;

  const playLabel = state.ended ? 'Reproduzir novamente' : state.playing ? 'Pausar' : 'Reproduzir';
  const PlayIcon = state.playing ? Pause : Play;

  return (
    <div className={styles.controls}>
      <div className={styles.timeline}>
        <input
          className={styles.range}
          style={{ '--p': `${percent}%` } as CSSProperties}
          type="range"
          min={0}
          max={sliderMax}
          step={SLIDER_STEP_MS}
          value={Math.round(state.timeMs)}
          onChange={(event) => player.seek(Number(event.target.value))}
          aria-label="Linha do tempo da corrida"
          aria-valuetext={`Volta ${snapshot.leaderLap} de ${totalLaps}, ${formatClock(state.timeMs)}`}
        />
        <div className={`${styles.times} num`} aria-hidden="true">
          <span>{formatClock(state.timeMs)}</span>
          <span>{formatClock(duration)}</span>
        </div>
      </div>

      <div className={styles.row}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => player.restart()}
          aria-label="Reiniciar do começo"
          title="Reiniciar do começo"
        >
          <RotateCcw size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.playButton}
          onClick={() => player.toggle()}
          aria-label={playLabel}
          title={playLabel}
        >
          <PlayIcon size={26} fill="currentColor" aria-hidden="true" />
        </button>
        <div className={styles.speed}>
          <span className={styles.speedLabel}>
            Velocidade
          </span>
          <SegmentedControl
            label="Velocidade da reprodução"
            options={SPEED_OPTIONS}
            value={String(state.speed)}
            onChange={(value) => player.setSpeed(Number(value) as ReplaySpeed)}
          />
        </div>
      </div>
    </div>
  );
}
