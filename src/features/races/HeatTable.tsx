import { useState } from 'react';
import { PilotLine } from '@/components/PilotLine';
import { Card } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState } from '@/components/ui/StateViews';
import { bestLapOf, type ChampionshipModel, type PilotId, type RaceId } from '@/domain';
import { formatLapTime } from '@/lib/format';
import styles from './HeatTable.module.css';

interface HeatTableProps {
  model: ChampionshipModel;
  raceId: RaceId;
  highlightPilotId?: PilotId;
}

/** Baterias de uma etapa: sessões cronometradas, uma por vez. */
export function HeatTable({ model, raceId, highlightPilotId }: HeatTableProps) {
  const heats = model.resultsByRace.get(raceId)?.heats ?? [];
  const [selected, setSelected] = useState<string>('1');

  if (heats.length === 0) {
    return <EmptyState title="Sem baterias" message="Esta etapa não possui baterias registradas." />;
  }

  const heat = heats.find((h) => String(h.index) === selected) ?? heats[0]!;
  const bests = heat.entries.map((e) => bestLapOf(e.lapTimesMs) ?? Infinity);
  const fastest = Math.min(...bests);

  return (
    <div className={styles.wrap}>
      <SegmentedControl
        label="Bateria"
        value={selected}
        onChange={setSelected}
        options={heats.map((h) => ({ value: String(h.index), label: `Bateria ${h.index}` }))}
      />
      <Card flush>
        <table className={styles.table}>
          <caption className="sr-only">
            Resultado da bateria {heat.index}, ordenado por voltas completadas
          </caption>
          <thead>
            <tr>
              <th scope="col" style={{ paddingTop: 12 }}>
                Pos
              </th>
              <th scope="col" style={{ paddingTop: 12 }}>
                Piloto
              </th>
              <th scope="col" style={{ paddingTop: 12 }}>
                Voltas
              </th>
              <th scope="col" style={{ paddingTop: 12, paddingRight: 12 }}>
                Melhor
              </th>
            </tr>
          </thead>
          <tbody>
            {heat.entries.map((entry) => {
              const pilot = model.pilotsById.get(entry.pilotId);
              const team = pilot && model.teamsById.get(pilot.teamId);
              if (!pilot || !team) return null;
              const best = bestLapOf(entry.lapTimesMs);
              const isFastest = best !== null && best === fastest;
              return (
                <tr key={entry.pilotId} className={entry.pilotId === highlightPilotId ? styles.highlight : ''}>
                  <td className="num">{entry.position}</td>
                  <td>
                    <PilotLine pilot={pilot} team={team} />
                  </td>
                  <td className="num">{entry.lapTimesMs.length}</td>
                  <td className={`${styles.best} num`} style={{ paddingRight: 12 }}>
                    <span className={isFastest ? styles.fastest : undefined}>
                      {best !== null ? formatLapTime(best) : '—'}
                      {isFastest && <span className="sr-only"> (mais rápida da bateria)</span>}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
