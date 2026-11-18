import { renderHook } from '@testing-library/react';
import { buildDemoChampionship } from '@/data/demo';
import { buildReplay } from '@/domain';
import { DEFAULT_REPLAY_SPEED } from './ReplayPlayer';
import { useReplayPlayer } from './useReplayPlayer';

const model = buildReplay(buildDemoChampionship('after-race-4'), 'etapa-4')!;

describe('useReplayPlayer', () => {
  it('usa a velocidade padrão do replay quando nenhuma é pedida', () => {
    const { result } = renderHook(() => useReplayPlayer(model));
    expect(result.current?.getState().speed).toBe(DEFAULT_REPLAY_SPEED);
  });

  it('aceita uma velocidade inicial (a etapa em andamento roda em 1×)', () => {
    const { result } = renderHook(() => useReplayPlayer(model, 1));
    expect(result.current?.getState().speed).toBe(1);
    expect(result.current?.getState().playing).toBe(false);
  });

  it('sem modelo não há relógio', () => {
    const { result } = renderHook(() => useReplayPlayer(null, 1));
    expect(result.current).toBeNull();
  });
});
