import { buildDemoChampionship } from '@/data/demo';
import { gapToLeader } from './laps';
import { buildReplay, gridOrder, sampleReplay } from './replay';

const demo = buildDemoChampionship();

describe('buildReplay', () => {
  it('só existe para etapas finalizadas', () => {
    expect(buildReplay(demo, 'etapa-4')).toBeNull();
    expect(buildReplay(demo, 'inexistente')).toBeNull();
    expect(buildReplay(demo, 'etapa-3')).not.toBeNull();
  });

  it('a duração é o instante em que o último piloto cruza a linha', () => {
    const model = buildReplay(demo, 'etapa-3')!;
    const results = demo.results.find((r) => r.raceId === 'etapa-3')!;
    const slowest = Math.max(...results.final.map((e) => e.lapTimesMs.reduce((a, b) => a + b, 0)));
    expect(model.durationMs).toBe(slowest);
    expect(model.totalLaps).toBe(20);
  });

  it('a ordem de largada contém todos os pilotos, sem repetição', () => {
    const grid = gridOrder(demo, 'etapa-3');
    expect(grid).toHaveLength(12);
    expect(new Set(grid).size).toBe(12);
    const model = buildReplay(demo, 'etapa-3')!;
    expect(new Set(model.cars.map((c) => c.gridIndex)).size).toBe(12);
  });
});

describe('sampleReplay', () => {
  const model = buildReplay(demo, 'etapa-3')!;

  it('na largada ninguém passou da linha e a corrida não terminou', () => {
    const snap = sampleReplay(model, 0);
    expect(snap.cars.every((c) => c.progress <= 0 && !c.finished && c.lapsCompleted === 0)).toBe(true);
    expect(snap.leaderLap).toBe(1);
    expect(snap.raceFinished).toBe(false);
  });

  it('ao final, a ordem é exatamente o resultado oficial', () => {
    const snap = sampleReplay(model, model.durationMs);
    const official = demo.results
      .find((r) => r.raceId === 'etapa-3')!
      .final.slice()
      .sort((a, b) => a.position - b.position)
      .map((e) => e.pilotId);
    expect(snap.cars.map((c) => c.pilotId)).toEqual(official);
    expect(snap.raceFinished).toBe(true);
    expect(snap.cars.every((c) => c.finished && c.lapsCompleted === 20)).toBe(true);
  });

  it('as diferenças finais coincidem com as do resultado oficial', () => {
    const snap = sampleReplay(model, model.durationMs);
    const final = demo.results.find((r) => r.raceId === 'etapa-3')!.final;
    const leader = final.find((e) => e.position === 1)!;
    for (const car of snap.cars) {
      const entry = final.find((e) => e.pilotId === car.pilotId)!;
      expect(car.gap).toEqual(gapToLeader(entry, leader));
    }
  });

  it('o progresso de cada carro nunca diminui com o tempo', () => {
    const last = new Map<string, number>();
    for (let t = 0; t <= model.durationMs; t += 2_500) {
      for (const car of sampleReplay(model, t).cars) {
        expect(car.progress).toBeGreaterThanOrEqual((last.get(car.pilotId) ?? -1) - 1e-9);
        last.set(car.pilotId, car.progress);
      }
    }
  });

  it('a volta exibida acompanha o líder', () => {
    const lider = model.cars.find((c) => c.lapEndsMs.length === 20 && c.lapEndsMs[19]! === Math.min(...model.cars.filter((x) => x.status === 'finished').map((x) => x.lapEndsMs[19]!)))!;
    expect(sampleReplay(model, lider.lapEndsMs[4]! + 1).leaderLap).toBe(6);
    expect(sampleReplay(model, lider.lapEndsMs[18]! + 1).leaderLap).toBe(20);
  });

  it('quem terminou segue em ritmo reduzido, sem passar de meia volta além da linha', () => {
    const snap = sampleReplay(model, model.durationMs);
    for (const car of snap.cars) {
      expect(car.visualProgress).toBeGreaterThanOrEqual(car.progress);
      expect(car.visualProgress).toBeLessThanOrEqual(20.5);
    }
    // o vencedor cruzou antes e já está mais adiante do que o último a terminar
    expect(snap.cars[0]!.visualProgress).toBeGreaterThan(snap.cars.at(-1)!.visualProgress);
    // enquanto corre, o desenho coincide com o progresso
    const mid = sampleReplay(model, model.durationMs / 2);
    expect(mid.cars.every((c) => c.visualProgress === c.progress)).toBe(true);
  });

  it('é determinístico', () => {
    expect(sampleReplay(model, 123_456)).toEqual(sampleReplay(model, 123_456));
  });
});

describe('abandono', () => {
  const model = buildReplay(demo, 'etapa-2')!;
  const dnf = model.cars.find((c) => c.status === 'dnf')!;

  it('o carro para onde o registro termina e fica sinalizado', () => {
    const lastEnd = dnf.lapEndsMs[dnf.lapEndsMs.length - 1]!;
    const before = sampleReplay(model, lastEnd - 1).cars.find((c) => c.pilotId === dnf.pilotId)!;
    expect(before.retired).toBe(false);
    const after = sampleReplay(model, lastEnd + 60_000).cars.find((c) => c.pilotId === dnf.pilotId)!;
    expect(after.retired).toBe(true);
    expect(after.progress).toBe(9);
    expect(after.gap).toEqual({ kind: 'dnf' });
  });

  it('termina em último e a corrida acaba mesmo assim', () => {
    const snap = sampleReplay(model, model.durationMs);
    expect(snap.cars.at(-1)?.pilotId).toBe(dnf.pilotId);
    expect(snap.raceFinished).toBe(true);
  });
});
