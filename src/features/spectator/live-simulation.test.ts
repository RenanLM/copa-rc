import { buildDemoChampionship } from '@/data/demo';
import { sampleReplay } from '@/domain';
import { buildSpectatorLiveSimulation } from './live-simulation';

const championship = buildDemoChampionship();
const race = championship.races.find((entry) => entry.round === 4)!;

describe('simulação ao vivo da espectadora', () => {
  it('gera posições reproduzíveis que mudam durante a etapa 4', () => {
    const simulation = buildSpectatorLiveSimulation(championship, race);
    const initialOrder = sampleReplay(simulation, 0).cars.map((car) => car.pilotId);
    const orders = Array.from({ length: 60 }, (_, index) =>
      sampleReplay(simulation, (index + 1) * 2_000).cars.map((car) => car.pilotId),
    );

    expect(simulation.raceId).toBe(race.id);
    expect(simulation.totalLaps).toBe(race.finalLaps);
    expect(simulation.cars).toHaveLength(championship.pilots.length);
    expect(orders.some((order) => order.some((pilotId, index) => pilotId !== initialOrder[index]))).toBe(true);
    expect(buildSpectatorLiveSimulation(championship, race)).toEqual(simulation);
  });
});
