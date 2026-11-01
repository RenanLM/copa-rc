import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, BatteryWarning, ChevronDown, Flag, Timer } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { ChampionshipModel, Heat, HeatEntry, PilotId, Race } from '@/domain';
import { bestLapOf } from '@/domain';
import { formatLapTime } from '@/lib/format';
import styles from './PilotHeatTelemetry.module.css';

interface PilotHeatTelemetryProps {
  model: ChampionshipModel;
  pilotId: PilotId;
  raceId?: string;
}

interface HeatRecord {
  race: Race;
  heat: Heat;
  entry: HeatEntry;
}

function findRecords(model: ChampionshipModel, pilotId: PilotId, raceId?: string): HeatRecord[] {
  const requestedRace = raceId ? model.racesById.get(raceId) : undefined;
  const races = [
    ...(requestedRace ? [requestedRace] : []),
    ...model.championship.races
      .filter((race) => race.status === 'finished')
      .sort((a, b) => b.round - a.round),
  ];
  const seen = new Set<string>();

  for (const race of races) {
    if (seen.has(race.id)) continue;
    seen.add(race.id);
    const heats = model.resultsByRace.get(race.id)?.heats ?? [];
    const records = heats.flatMap((heat) => {
      const entry = heat.entries.find((candidate) => candidate.pilotId === pilotId);
      return entry ? [{ race, heat, entry }] : [];
    });
    if (records.length > 0) return records.sort((a, b) => a.heat.index - b.heat.index);
  }

  return [];
}

export function PilotHeatTelemetry({ model, pilotId, raceId }: PilotHeatTelemetryProps) {
  const records = useMemo(() => findRecords(model, pilotId, raceId), [model, pilotId, raceId]);
  const [selectedHeat, setSelectedHeat] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  if (records.length === 0) return null;

  const latest = records.at(-1)!;
  const active = records.find((record) => record.heat.index === selectedHeat) ?? latest;
  const pilotName = model.pilotsById.get(pilotId)?.name ?? 'Você';
  const latestPilotBest = bestLapOf(latest.entry.lapTimesMs);
  const latestFieldFastest = Math.min(
    ...latest.heat.entries.map((entry) => bestLapOf(entry.lapTimesMs) ?? Infinity),
  );
  const latestIsFastest =
    latestPilotBest !== null && latestPilotBest === latestFieldFastest;
  const latestAverageLap =
    latest.entry.lapTimesMs.length > 0
      ? latest.entry.lapTimesMs.reduce((sum, lap) => sum + lap, 0) / latest.entry.lapTimesMs.length
      : null;
  const pilotBest = bestLapOf(active.entry.lapTimesMs);
  const fieldFastest = Math.min(
    ...active.heat.entries.map((entry) => bestLapOf(entry.lapTimesMs) ?? Infinity),
  );
  const isFastest = pilotBest !== null && pilotBest === fieldFastest;
  const leader = active.heat.entries.find((entry) => entry.position === 1);
  const comparison =
    leader?.pilotId === pilotId
      ? active.heat.entries
          .filter((entry) => entry.pilotId !== pilotId)
          .sort((a, b) => a.position - b.position)[0]
      : leader;
  const comparisonBest = comparison ? bestLapOf(comparison.lapTimesMs) : null;
  const lapDifference =
    pilotBest !== null && comparisonBest !== null ? pilotBest - comparisonBest : null;
  const averageLap =
    active.entry.lapTimesMs.length > 0
      ? active.entry.lapTimesMs.reduce((sum, lap) => sum + lap, 0) / active.entry.lapTimesMs.length
      : null;
  const isRequestedRace = active.race.id === raceId;
  const comparatorLabel = leader?.pilotId === pilotId ? 'do próximo colocado' : 'do líder';

  return (
    <>
      <Card as="section" aria-labelledby="pilot-heat-telemetry-title" className={styles.card}>
        <div className={styles.heading}>
          <div>
            <p className={styles.kicker}>
              {isRequestedRace ? 'Bateria mais recente' : 'Última bateria registrada'}
            </p>
            <h2 id="pilot-heat-telemetry-title">
              Bateria {latest.heat.index}
            </h2>
          </div>
          <span className={styles.round}>Etapa {latest.race.round}</span>
        </div>
        <p className={styles.raceName}>{latest.race.name}</p>

        <div className={styles.metrics}>
          <div className={`${styles.metric} ${latestIsFastest ? styles.fastest : ''}`}>
            <span className={styles.metricLabel}>
              {latestIsFastest ? 'Melhor da bateria' : 'Sua melhor volta'}
            </span>
            <strong className={`${styles.metricValue} num`}>
              {latestPilotBest === null ? '—' : formatLapTime(latestPilotBest)}
            </strong>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Voltas concluídas</span>
            <strong className={`${styles.metricValue} num`}>{latest.entry.lapTimesMs.length}</strong>
          </div>
          <div className={`${styles.metric} ${styles.pace}`}>
            <span className={styles.metricLabel}>Ritmo médio</span>
            <strong className={`${styles.metricValue} num`}>
              {latestAverageLap === null ? '—' : formatLapTime(latestAverageLap)}
            </strong>
          </div>
        </div>

        <p className={styles.chargeNote}>
          <BatteryWarning size={17} aria-hidden="true" />
          Carga física não monitorada; voltas registradas nesta bateria.
        </p>
        <Button
          className={styles.expandButton}
          variant="secondary"
          icon={<ChevronDown size={18} aria-hidden="true" />}
          onClick={() => {
            setSelectedHeat(latest.heat.index);
            setIsOpen(true);
          }}
        >
          Comparar com o líder e ver telemetria
        </Button>
      </Card>

      <BottomSheet
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Telemetria da bateria"
      >
        <div className={styles.sheetBody}>
          <div className={styles.sessionHeading}>
            <p>{active.race.name} · Etapa {active.race.round}</p>
            <h3>Bateria {active.heat.index}</h3>
          </div>

          {records.length > 1 && (
            <fieldset className={styles.heatPicker}>
              <legend>Selecionar bateria</legend>
              <div className={styles.heatChoices}>
                {records.map((record) => (
                  <button
                    key={`${record.race.id}-${record.heat.index}`}
                    type="button"
                    aria-pressed={record.heat.index === active.heat.index}
                    className={styles.heatChoice}
                    onClick={() => setSelectedHeat(record.heat.index)}
                  >
                    Bateria {record.heat.index}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className={styles.detailMetrics}>
            <div className={`${styles.detailMetric} ${isFastest ? styles.fastest : ''}`}>
              <span>{isFastest ? 'Melhor da bateria' : 'Sua melhor volta'}</span>
              <strong className="num">
                {pilotBest === null ? '—' : `${formatLapTime(pilotBest)} s`}
              </strong>
            </div>
            <div className={`${styles.detailMetric} ${styles.pace}`}>
              <span>Ritmo médio</span>
              <strong className="num">
                {averageLap === null ? '—' : `${formatLapTime(averageLap)} s`}
              </strong>
            </div>
            <div className={styles.detailMetric}>
              <span>Voltas concluídas</span>
              <strong className="num">{active.entry.lapTimesMs.length}</strong>
            </div>
          </div>

          <section className={styles.comparison} aria-labelledby="heat-comparison-title">
            <div className={styles.sectionTitle}>
              <Flag size={17} aria-hidden="true" />
              <h4 id="heat-comparison-title">Comparação de melhor volta</h4>
            </div>
            {comparison && comparisonBest !== null ? (
              <>
                <div className={styles.comparisonRow}>
                  <span>{pilotName}</span>
                  <strong className="num">{pilotBest === null ? '—' : formatLapTime(pilotBest)} s</strong>
                </div>
                <div className={styles.comparisonRow}>
                  <span>
                    {model.pilotsById.get(comparison.pilotId)?.name ?? 'Adversário'} ·{' '}
                    {comparatorLabel}
                  </span>
                  <strong className="num">{formatLapTime(comparisonBest)} s</strong>
                </div>
                {lapDifference !== null && (
                  <p className={styles.difference}>
                    {lapDifference === 0
                      ? 'Mesmo tempo'
                      : (
                          <>
                            {lapDifference > 0 ? (
                              <ArrowDown size={16} aria-hidden="true" />
                            ) : (
                              <ArrowUp size={16} aria-hidden="true" />
                            )}
                            {formatLapTime(Math.abs(lapDifference))} s{' '}
                            {lapDifference > 0 ? 'mais lento' : 'mais rápido'}
                          </>
                        )}
                  </p>
                )}
              </>
            ) : (
              <p className={styles.muted}>Não há tempo de comparação registrado nesta bateria.</p>
            )}
          </section>

          <section aria-labelledby="lap-history-title">
            <div className={styles.sectionTitle}>
              <Timer size={17} aria-hidden="true" />
              <h4 id="lap-history-title">Voltas da bateria</h4>
            </div>
            {active.entry.lapTimesMs.length > 0 ? (
              <ol className={styles.laps}>
                {active.entry.lapTimesMs.map((lap, index) => (
                  <li
                    key={`${active.race.id}-${active.heat.index}-${index}`}
                    className={lap === fieldFastest ? styles.fastestLap : ''}
                  >
                    <span>Volta {index + 1}</span>
                    <strong className="num">{formatLapTime(lap)} s</strong>
                    {lap === fieldFastest && <span className={styles.bestTag}>Melhor</span>}
                  </li>
                ))}
              </ol>
            ) : (
              <p className={styles.muted}>Nenhuma volta registrada.</p>
            )}
          </section>

          <p className={styles.chargeDetail}>
            O sistema registra as voltas da bateria, mas não recebe tensão nem percentual de carga do carro.
          </p>
        </div>
      </BottomSheet>
    </>
  );
}
