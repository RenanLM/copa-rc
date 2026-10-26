import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReplayModel, ReplaySnapshot } from '@/domain';
import { ReplayPlayer, type PlayerState } from './ReplayPlayer';

/** Cria o relógio de um replay e o encerra ao sair da tela ou trocar de etapa. */
export function useReplayPlayer(model: ReplayModel | null): ReplayPlayer | null {
  const player = useMemo(() => (model ? new ReplayPlayer(model) : null), [model]);
  useEffect(() => () => player?.destroy(), [player]);
  return player;
}

/**
 * Valor derivado do relógio, atualizado no máximo `hz` vezes por segundo (e na
 * hora, quando `changed` indica mudança relevante). Evita redesenhar a lista a
 * cada quadro de animação.
 */
function useThrottledValue<T>(
  player: ReplayPlayer,
  select: (player: ReplayPlayer) => T,
  hz: number,
  changed: (previous: T, next: T) => boolean,
): T {
  const [value, setValue] = useState(() => select(player));
  const selectRef = useRef(select);
  const changedRef = useRef(changed);
  selectRef.current = select;
  changedRef.current = changed;

  useEffect(() => {
    let current = selectRef.current(player);
    let lastEmit = performance.now();
    setValue(current);
    return player.subscribe((state) => {
      const next = selectRef.current(player);
      const now = performance.now();
      if (!state.playing || now - lastEmit >= 1000 / hz || changedRef.current(current, next)) {
        lastEmit = now;
        current = next;
        setValue(next);
      }
    });
  }, [player, hz]);

  return value;
}

const stateChanged = (a: PlayerState, b: PlayerState) =>
  a.playing !== b.playing || a.speed !== b.speed || a.ended !== b.ended;

/** Estado do relógio (tempo, tocando, velocidade, fim) para controles e cronômetro. */
export function usePlayerState(player: ReplayPlayer, hz = 10): PlayerState {
  return useThrottledValue(player, (p) => p.getState(), hz, stateChanged);
}

const orderKey = (s: ReplaySnapshot) =>
  s.cars.map((c) => `${c.pilotId}:${c.finished ? 'f' : c.retired ? 'r' : c.lap}`).join('|');

const snapshotChanged = (a: ReplaySnapshot, b: ReplaySnapshot) => orderKey(a) !== orderKey(b);

/** Retrato da corrida para a classificação ao vivo: muda na hora quando a ordem muda. */
export function useSnapshot(player: ReplayPlayer, hz = 4): ReplaySnapshot {
  return useThrottledValue(player, (p) => p.getSnapshot(), hz, snapshotChanged);
}
