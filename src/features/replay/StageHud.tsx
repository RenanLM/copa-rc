import { Flag, Play } from 'lucide-react';
import { formatClock } from '@/lib/format';
import type { ReplayPlayer } from './ReplayPlayer';
import { usePlayerState, useSnapshot } from './useReplayPlayer';
import styles from './TrackStage.module.css';

interface StageProps {
  player: ReplayPlayer;
  totalLaps: number;
}

/** Cronômetro e volta, em uma faixa acima da pista (não cobre o traçado). */
export function StageHeader({ player, totalLaps }: StageProps) {
  const state = usePlayerState(player, 10);
  const snapshot = useSnapshot(player, 4);
  const leaderFinished = snapshot.cars[0]?.finished ?? false;

  return (
    <div className={styles.header}>
      <div className={styles.hudItem}>
        <span className={styles.hudLabel}>Tempo</span>
        <span className={`${styles.hudValue} num`}>{formatClock(state.timeMs)}</span>
      </div>
      {leaderFinished && (
        <span className={styles.flag}>
          <Flag size={14} aria-hidden="true" />
          Bandeira quadriculada
        </span>
      )}
      <div className={styles.hudItem} style={{ textAlign: 'right' }}>
        <span className={styles.hudLabel}>Volta</span>
        <span className={`${styles.hudValue} num`}>
          {snapshot.leaderLap}/{totalLaps}
        </span>
      </div>
    </div>
  );
}

/** Botão grande para iniciar, enquanto a corrida ainda não começou. */
export function StartOverlay({ player }: Pick<StageProps, 'player'>) {
  const state = usePlayerState(player, 10);
  if (state.playing || state.timeMs !== 0) return null;
  return (
    <button type="button" className={styles.play} onClick={() => player.play()} aria-label="Reproduzir corrida">
      <span className={styles.playInner}>
        <span className={styles.playCircle}>
          <Play size={32} fill="currentColor" aria-hidden="true" />
        </span>
        Reproduzir corrida
      </span>
    </button>
  );
}
