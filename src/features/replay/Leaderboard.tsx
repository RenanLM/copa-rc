import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { PilotLine } from '@/components/PilotLine';
import type { GapToLeader, Pilot, PilotId, Team } from '@/domain';
import { formatGap, formatOrdinal } from '@/lib/format';
import type { ReplayPlayer } from './ReplayPlayer';
import { usePlayerState, useSnapshot } from './useReplayPlayer';
import styles from './Leaderboard.module.css';

interface LeaderboardProps {
  player: ReplayPlayer;
  totalLaps: number;
  getPilot: (pilotId: PilotId) => { pilot: Pilot; team: Team } | undefined;
  focusPilotId?: PilotId;
  selectedPilotId: PilotId | null;
  onSelect: (pilotId: PilotId | null) => void;
  /** Texto para leitores de tela quando o piloto em foco muda de posição. */
  onAnnounce: (message: string) => void;
}

/** Durante a corrida a diferença é estimada: uma casa decimal, para não sugerir precisão. */
function liveGap(gap: GapToLeader, finished: boolean): string {
  if (gap.kind === 'time' && !finished) return `+${(gap.ms / 1000).toFixed(1)} s`;
  return formatGap(gap);
}

const FLASH_MS = 1800;
const MAX_FLASH_SPEED = 4; // acima disso, as trocas são rápidas demais para sinalizar uma a uma
const MAX_FLASH_JUMP_MS = 5000; // saltos maiores (barra de tempo) não são ultrapassagens

/** Classificação dinâmica: as linhas se reordenam com animação quando há ultrapassagem. */
export function Leaderboard({
  player,
  totalLaps,
  getPilot,
  focusPilotId,
  selectedPilotId,
  onSelect,
  onAnnounce,
}: LeaderboardProps) {
  const snapshot = useSnapshot(player, 4);
  const state = usePlayerState(player, 4);
  const previous = useRef(new Map<PilotId, number>());
  const previousTime = useRef(0);
  const timers = useRef(new Map<PilotId, ReturnType<typeof setTimeout>>());
  const [changes, setChanges] = useState<Record<PilotId, 'up' | 'down'>>({});

  // Detecta ultrapassagens comparando com a ordem anterior.
  useEffect(() => {
    const next = new Map(snapshot.cars.map((c) => [c.pilotId, c.position]));
    const before = previous.current;
    const jumped = Math.abs(snapshot.timeMs - previousTime.current) > MAX_FLASH_JUMP_MS;
    previousTime.current = snapshot.timeMs;
    if (before.size > 0 && !jumped && state.playing && state.speed <= MAX_FLASH_SPEED) {
      const fresh: Record<PilotId, 'up' | 'down'> = {};
      for (const [id, position] of next) {
        const old = before.get(id);
        if (old !== undefined && old !== position) fresh[id] = position < old ? 'up' : 'down';
      }
      if (Object.keys(fresh).length > 0) {
        setChanges((current) => ({ ...current, ...fresh }));
        for (const id of Object.keys(fresh)) {
          clearTimeout(timers.current.get(id));
          timers.current.set(
            id,
            setTimeout(() => setChanges((c) => {
              const { [id]: _removed, ...rest } = c;
              return rest;
            }), FLASH_MS),
          );
        }
      }
    }
    // Anuncia (só) as mudanças do piloto em foco.
    if (focusPilotId) {
      const was = before.get(focusPilotId);
      const now = next.get(focusPilotId);
      if (!jumped && was !== undefined && now !== undefined && was !== now) {
        const name = getPilot(focusPilotId)?.pilot.name ?? 'Piloto';
        onAnnounce(`${name} ${now < was ? 'subiu' : 'caiu'} para ${formatOrdinal(now)} lugar`);
      }
    }
    previous.current = next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => clearTimeout(t));
  }, []);

  // Voltou ao início: limpa sinalizações e histórico de posições.
  useEffect(() => {
    if (state.timeMs === 0) {
      previous.current = new Map();
      setChanges({});
    }
  }, [state.timeMs]);

  return (
    <>
      <ol className={styles.list} aria-label="Classificação ao vivo">
        {snapshot.cars.map((car) => {
          const info = getPilot(car.pilotId);
          if (!info) return null;
          const { pilot, team } = info;
          const isFocus = car.pilotId === focusPilotId;
          const isSelected = car.pilotId === selectedPilotId;
          const change = changes[car.pilotId];
          return (
            <motion.li
              key={car.pilotId}
              layout="position"
              transition={{ type: 'spring', stiffness: 520, damping: 42 }}
              className={`${styles.item} ${isFocus ? styles.highlight : ''} ${isSelected ? styles.selected : ''}`}
            >
              <button
                type="button"
                className={styles.row}
                aria-pressed={isSelected}
                aria-label={`${formatOrdinal(car.position)}: ${pilot.name}, ${team.name}. Toque para destacar na pista.`}
                onClick={() => onSelect(isSelected ? null : car.pilotId)}
              >
                <span className={`${styles.position} num`} aria-hidden="true">
                  {car.position}
                </span>
                <span className={`${styles.change} ${change === 'down' ? styles.changeDown : ''}`} aria-hidden="true">
                  {change === 'up' && <ArrowUp size={16} />}
                  {change === 'down' && <ArrowDown size={16} />}
                </span>
                <PilotLine pilot={pilot} team={team} sub={isFocus ? `${team.name} · você` : undefined} />
                <span className={styles.info} aria-hidden="true">
                  <span className={`${styles.gap} ${car.retired ? styles.out : ''} num`}>
                    {car.position === 1 ? (car.finished ? 'Vencedor' : 'Líder') : liveGap(car.gap, car.finished)}
                  </span>
                  <span className={`${styles.lap} num`}>
                    {car.retired ? 'Fora da prova' : car.finished ? 'Terminou' : `Volta ${car.lap}/${totalLaps}`}
                  </span>
                </span>
              </button>
            </motion.li>
          );
        })}
      </ol>
      <p className={styles.hint}>Toque em um piloto para destacá-lo na pista. As diferenças durante a corrida são estimadas.</p>
    </>
  );
}
