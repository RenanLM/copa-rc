import { buildDemoChampionship } from '@/data/demo';
import { buildReplay } from '@/domain';
import { ReplayPlayer } from './ReplayPlayer';

const model = buildReplay(buildDemoChampionship(), 'etapa-3')!;
const newPlayer = () => new ReplayPlayer(model, 4);

describe('ReplayPlayer', () => {
  it('começa pausado no início', () => {
    expect(newPlayer().getState()).toEqual({ timeMs: 0, playing: false, speed: 4, ended: false });
  });

  it('só avança o tempo quando está tocando, multiplicado pela velocidade', () => {
    const p = newPlayer();
    p.advance(1000);
    expect(p.getState().timeMs).toBe(0);
    p.play();
    p.advance(1000);
    expect(p.getState().timeMs).toBe(4000);
    p.setSpeed(8);
    p.advance(500);
    expect(p.getState().timeMs).toBe(8000);
    p.destroy();
  });

  it('pausar congela o tempo e alternar retoma', () => {
    const p = newPlayer();
    p.play();
    p.advance(250);
    p.pause();
    p.advance(250);
    expect(p.getState().timeMs).toBe(1000);
    p.toggle();
    expect(p.getState().playing).toBe(true);
    p.toggle();
    expect(p.getState().playing).toBe(false);
    p.destroy();
  });

  it('chega ao fim sem ultrapassar a duração e para', () => {
    const p = newPlayer();
    p.play();
    p.advance(model.durationMs); // x4 → muito além do fim
    const state = p.getState();
    expect(state.timeMs).toBe(model.durationMs);
    expect(state.ended).toBe(true);
    expect(state.playing).toBe(false);
    expect(p.getSnapshot().raceFinished).toBe(true);
  });

  it('tocar depois do fim recomeça do zero', () => {
    const p = newPlayer();
    p.seek(model.durationMs);
    expect(p.getState().ended).toBe(true);
    p.play();
    expect(p.getState()).toMatchObject({ timeMs: 0, ended: false, playing: true });
    p.destroy();
  });

  it('reiniciar volta ao início e toca', () => {
    const p = newPlayer();
    p.play();
    p.advance(5000);
    p.restart();
    expect(p.getState()).toMatchObject({ timeMs: 0, playing: true, ended: false });
    p.destroy();
  });

  it('seek limita o tempo ao intervalo da corrida', () => {
    const p = newPlayer();
    p.seek(-500);
    expect(p.getState().timeMs).toBe(0);
    p.seek(model.durationMs + 9999);
    expect(p.getState().timeMs).toBe(model.durationMs);
  });

  it('notifica os assinantes a cada mudança e permite cancelar', () => {
    const p = newPlayer();
    const seen: number[] = [];
    const off = p.subscribe((s) => seen.push(s.timeMs));
    p.play();
    p.advance(100);
    off();
    p.advance(100);
    expect(seen).toEqual([0, 400]);
    p.destroy();
  });

  it('o retrato acompanha o tempo e é memorizado por instante', () => {
    const p = newPlayer();
    const a = p.getSnapshot();
    expect(p.getSnapshot()).toBe(a);
    p.seek(60_000);
    expect(p.getSnapshot().timeMs).toBe(60_000);
    expect(p.getSnapshot()).not.toBe(a);
  });
});
