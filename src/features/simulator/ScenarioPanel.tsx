import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { PilotNumber } from '@/components/ui/PilotNumber';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { PilotId, Predictor, RivalPreset } from '@/domain';
import { formatOrdinal } from '@/lib/format';
import styles from './ScenarioPanel.module.css';

export type PresetChoice = RivalPreset | 'custom';

interface ScenarioPanelProps {
  predictor: Predictor;
  preset: PresetChoice;
  onPreset: (preset: RivalPreset) => void;
  /** Pódio de cada etapa considerada (índice = colocação − 1). */
  podiums: readonly (readonly PilotId[])[];
  onEditSlot: (raceIndex: number, placing: number, pilotId: PilotId) => void;
  /** Número da última etapa disputada (referência do cenário "repetem"). */
  lastRound: number;
}

/** Como os adversários se comportam nas etapas restantes: cenários prontos ou ajuste manual. */
export function ScenarioPanel({ predictor, preset, onPreset, podiums, onEditSlot, lastRound }: ScenarioPanelProps) {
  const name = useId();
  const [raceIndex, setRaceIndex] = useState(0);
  const { championship, pilot, races, slots } = predictor;
  const index = Math.min(raceIndex, races.length - 1);
  const podium = podiums[index] ?? [];
  const mine = podium.indexOf(pilot.id);

  const options: { value: PresetChoice; title: string; text: string; tag?: string }[] = [
    {
      value: 'favorable',
      title: 'Mais favorável a você',
      text: 'Os adversários somam o mínimo possível contra você: o melhor cenário que a matemática permite.',
    },
    {
      value: 'hard',
      title: 'Mais difícil para você',
      text: 'Os adversários somam o máximo possível contra você: o pior cenário que a matemática permite.',
    },
    {
      value: 'repeat',
      title: `Rivais repetem a etapa ${lastRound}`,
      text: 'Cada adversário repete a colocação da última etapa. É só uma referência, não uma previsão.',
      tag: 'Ilustrativo',
    },
  ];
  if (preset === 'custom') {
    options.push({ value: 'custom', title: 'Personalizado', text: 'Você ajustou os resultados dos adversários.' });
  }

  return (
    <div className={styles.editorBody}>
      <div className={styles.presets} role="radiogroup" aria-label="Cenário dos adversários">
        {options.map((option) => {
          const on = preset === option.value;
          return (
            <label key={option.value} className={`${styles.preset} ${on ? styles.presetOn : ''}`}>
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={on}
                disabled={option.value === 'custom'}
                onChange={() => option.value !== 'custom' && onPreset(option.value)}
              />
              <span className={styles.radio} aria-hidden="true" />
              <span>
                <span className={styles.presetTitle}>{option.title}</span>
                <span className={styles.presetText} style={{ display: 'block' }}>
                  {option.text}
                </span>
                {option.tag && (
                  <span className={styles.badgeRow}>
                    <Badge tone="data">{option.tag}</Badge>
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      <details className={styles.editor}>
        <summary>
          Ajustar resultados dos adversários
          <ChevronDown size={20} aria-hidden="true" />
        </summary>
        <div className={styles.editorBody} style={{ marginTop: 12 }}>
          {races.length > 1 && (
            <SegmentedControl
              label="Etapa a ajustar"
              value={String(index)}
              onChange={(v) => setRaceIndex(Number(v))}
              options={races.map((race, i) => ({ value: String(i), label: `Etapa ${race.round}` }))}
            />
          )}
          <ol className={styles.slots} aria-label={`Quem termina em cada posição que pontua na etapa ${races[index]?.round}`}>
            {Array.from({ length: slots }, (_, i) => i + 1).map((placing) => {
              const occupant = podium[placing - 1];
              const isMe = occupant === pilot.id;
              const occupantPilot = occupant ? championship.pilots.find((p) => p.id === occupant) : undefined;
              const team = occupantPilot && championship.teams.find((t) => t.id === occupantPilot.teamId);
              return (
                <li key={placing} className={styles.slot}>
                  <span className={`${styles.slotPos} num`}>{formatOrdinal(placing)}</span>
                  {occupantPilot && team ? <PilotNumber number={occupantPilot.number} color={team.color} /> : <span />}
                  {isMe ? (
                    <span className={styles.mine}>Você (definido no mapa acima)</span>
                  ) : (
                    <select
                      className={styles.select}
                      aria-label={`Quem termina em ${formatOrdinal(placing)} na etapa ${races[index]?.round}`}
                      value={occupant ?? ''}
                      onChange={(event) => onEditSlot(index, placing, event.target.value)}
                    >
                      {predictor.rivalIds.map((id) => {
                        const rival = championship.pilots.find((p) => p.id === id);
                        return (
                          <option key={id} value={id}>
                            {rival?.name}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </li>
              );
            })}
          </ol>
          <p className={styles.hint}>
            Ao escolher um piloto que já está em outra posição, os dois trocam de lugar: nunca há pilotos repetidos.
            {mine < 0 && ' Você está fora das posições que pontuam nesta etapa.'}
          </p>
        </div>
      </details>
    </div>
  );
}
