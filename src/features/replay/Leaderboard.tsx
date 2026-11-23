import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArrowDown, ArrowUp, Star } from 'lucide-react';
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
  /** Texto para leitores de tela quando o piloto em foco (ou um preferido) muda de posição. */
  onAnnounce: (message: string) => void;
  /** Pilotos que a pessoa escolheu acompanhar. Só aparecem com `onToggleFavorite`. */
  favoritePilotIds?: readonly PilotId[];
  /** Mostra a estrela de "acompanhar" em cada linha. Sem isto, a lista é só de leitura e seleção. */
  onToggleFavorite?: (pilotId: PilotId) => void;
  /** Mostra "Volta n/N" em cada linha. Padrão: sim (replay); a tela ao vivo mostra a volta só no cabeçalho. */
  showLap?: boolean;
  /** Texto de ajuda abaixo da lista. `null` esconde; sem valor, usa o texto padrão do replay. */
  hint?: ReactNode;
}

/** Durante a corrida a diferença é estimada: uma casa decimal, para não sugerir precisão. */
export function liveGap(gap: GapToLeader, finished: boolean): string {
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
  favoritePilotIds = [],
  onToggleFavorite,
  showLap = true,
  hint,
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
    // Anuncia (só) as mudanças do piloto em foco e dos preferidos, numa mensagem única.
    const watched = [...new Set([focusPilotId, ...favoritePilotIds].filter(Boolean) as PilotId[])];
    const messages: string[] = [];
    for (const id of watched) {
      const was = before.get(id);
      const now = next.get(id);
      if (!jumped && was !== undefined && now !== undefined && was !== now) {
        const name = getPilot(id)?.pilot.name ?? 'Piloto';
        messages.push(`${name} ${now < was ? 'subiu' : 'caiu'} para ${formatOrdinal(now)} lugar`);
      }
    }
    if (messages.length > 0) onAnnounce(messages.join('. '));
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
          const isFavorite = favoritePilotIds.includes(car.pilotId);
          const change = changes[car.pilotId];
          const lapText = car.retired ? 'Fora da prova' : car.finished ? 'Terminou' : showLap ? `Volta ${car.lap}/${totalLaps}` : null;
          return (
            <motion.li
              key={car.pilotId}
              layout="position"
              transition={{ type: 'spring', stiffness: 520, damping: 42 }}
              className={`${styles.item} ${isFocus ? styles.highlight : ''} ${isFavorite ? styles.favorite : ''} ${isSelected ? styles.selected : ''}`}
            >
              <div className={styles.line}>
                <button
                  type="button"
                  className={styles.row}
                  aria-pressed={isSelected}
                  aria-label={`${formatOrdinal(car.position)}: ${pilot.name}, ${team.name}.${isFavorite ? ' Piloto que você acompanha.' : ''} Toque para destacar na pista.`}
                  onClick={() => onSelect(isSelected ? null : car.pilotId)}
                >
                  <span className={`${styles.position} num`} aria-hidden="true">
                    {car.position}
                  </span>
                  <span className={`${styles.change} ${change === 'down' ? styles.changeDown : ''}`} aria-hidden="true">
                    {change === 'up' && <ArrowUp size={16} />}
                    {change === 'down' && <ArrowDown size={16} />}
                  </span>
                  <PilotLine
                    pilot={pilot}
                    team={team}
                    // "Preferido" vem primeiro: em tela estreita é o fim do texto que é cortado
                    sub={isFocus ? `${team.name} · você` : isFavorite ? `Preferido · ${team.name}` : undefined}
                  />
                  <span className={styles.info} aria-hidden="true">
                    <span className={`${styles.gap} ${car.retired ? styles.out : ''} num`}>
                      {car.position === 1 ? (car.finished ? 'Vencedor' : 'Líder') : liveGap(car.gap, car.finished)}
                    </span>
                    {lapText && <span className={`${styles.lap} num`}>{lapText}</span>}
                  </span>
                </button>
                {onToggleFavorite && (
                  <button
                    type="button"
                    className={styles.star}
                    aria-pressed={isFavorite}
                    aria-label={`Acompanhar ${pilot.name}`}
                    onClick={() => onToggleFavorite(car.pilotId)}
                  >
                    <Star size={22} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
                  </button>
                )}
              </div>
            </motion.li>
          );
        })}
      </ol>
      {hint !== null && (
        <p className={styles.hint}>
          {hint ?? 'Toque em um piloto para destacá-lo na pista. As diferenças durante a corrida são estimadas.'}
        </p>
      )}
    </>
  );
}
