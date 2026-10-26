import { useRef, type KeyboardEvent } from 'react';
import { motion } from 'motion/react';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { findCombo, statusOf, type Predictor } from '@/domain';
import { STATUS_META } from './status';
import styles from './RequirementsGrid.module.css';

interface RequirementsGridProps {
  predictor: Predictor;
  target: number;
  /** Colocação do piloto em cada etapa considerada (n+1 = fora dos pontos). */
  placings: readonly number[];
  onChange: (placings: number[]) => void;
}

const EASE = [0.2, 0.7, 0.2, 1] as const;

function placingLabel(placing: number, slots: number): string {
  return placing > slots ? `${slots + 1}º+` : `${placing}º`;
}

/**
 * Mapa dos SEUS resultados: cada célula é uma combinação de colocações nas etapas
 * restantes e mostra, para a posição desejada, se ela é garantida, condicional, só
 * com empate ou impossível. Sem inventar nada: cada estado vem da análise exata.
 *
 * Com 1 etapa restante é uma linha; com 2, uma grade; com 3, escolhe-se por etapa.
 */
export function RequirementsGrid({ predictor, target, placings, onChange }: RequirementsGridProps) {
  const { slots, races } = predictor;
  const choices = Array.from({ length: slots + 1 }, (_, i) => i + 1);
  const cells = useRef(new Map<string, HTMLButtonElement>());

  if (races.length > 2) {
    return (
      <div className={styles.pickers}>
        {races.map((race, i) => (
          <div key={race.id}>
            <p className={styles.pickerLabel}>Seu resultado na etapa {race.round}</p>
            <SegmentedControl
              label={`Seu resultado na etapa ${race.round}`}
              value={String(placings[i])}
              onChange={(v) => onChange(placings.map((p, j) => (j === i ? Number(v) : p)))}
              options={choices.map((c) => ({ value: String(c), label: placingLabel(c, slots) }))}
            />
          </div>
        ))}
      </div>
    );
  }

  const describe = (combo: number[]) => {
    const found = findCombo(predictor, combo)!;
    const status = statusOf(found, target);
    const where = combo
      .map((c, i) => `etapa ${races[i]!.round}: ${c > slots ? 'fora dos pontos' : `${c}º lugar`}`)
      .join(', ');
    return { found, status, label: `${where}. Soma ${found.gained} pontos. ${STATUS_META[status].description}.` };
  };

  const isChosen = (combo: number[]) => combo.every((c, i) => c === placings[i]);

  const move = (event: KeyboardEvent, row: number, col: number) => {
    const delta: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const step = delta[event.key];
    if (!step) return;
    event.preventDefault();
    const r = Math.min(Math.max(row + step[0], 0), races.length === 2 ? choices.length - 1 : 0);
    const c = Math.min(Math.max(col + step[1], 0), choices.length - 1);
    cells.current.get(`${r}-${c}`)?.focus();
  };

  const rows = races.length === 2 ? choices : [0];
  const columns = choices;

  return (
    <div className={styles.wrap}>
      <div
        className={styles.grid}
        style={{ gridTemplateColumns: `${races.length === 2 ? '48px ' : ''}repeat(${columns.length}, 1fr)` }}
        role="grid"
        aria-label="Seus resultados nas etapas restantes e o estado da posição desejada"
      >
        {races.length === 2 && (
          <div className={styles.corner} role="presentation" aria-hidden="true">
            <span>Etapa {races[0]!.round} ↓</span>
            <span>Etapa {races[1]!.round} →</span>
          </div>
        )}
        {columns.map((c) => (
          <div key={`h-${c}`} className={styles.colHead} role="columnheader">
            {placingLabel(c, slots)}
          </div>
        ))}

        {rows.map((r, rowIndex) => (
          <div key={`r-${r}`} style={{ display: 'contents' }} role="row">
            {races.length === 2 && (
              <div className={styles.rowHead} role="rowheader">
                {placingLabel(r, slots)}
              </div>
            )}
            {columns.map((c, colIndex) => {
              const combo = races.length === 2 ? [r, c] : [c];
              const { status, label } = describe(combo);
              const { Icon, className } = STATUS_META[status];
              const chosen = isChosen(combo);
              const found = findCombo(predictor, combo)!;
              return (
                <motion.div
                  key={`${r}-${c}`}
                  role="gridcell"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.22, delay: (rowIndex + colIndex) * 0.02, ease: EASE }}
                >
                  <button
                    type="button"
                    ref={(node) => {
                      if (node) cells.current.set(`${rowIndex}-${colIndex}`, node);
                      else cells.current.delete(`${rowIndex}-${colIndex}`);
                    }}
                    className={`${styles.cell} ${className} ${chosen ? styles.chosen : ''}`}
                    style={{ width: '100%' }}
                    tabIndex={chosen ? 0 : -1}
                    aria-label={label}
                    aria-pressed={chosen}
                    onClick={() => onChange(combo)}
                    onKeyDown={(event) => move(event, rowIndex, colIndex)}
                  >
                    <Icon size={15} aria-hidden="true" />
                    <span className={styles.points} aria-hidden="true">
                      +{found.gained}
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
      <p className={styles.axisNote}>
        Cada quadro é uma combinação dos seus resultados; o número é quantos pontos você soma. Toque para ver o cenário.
      </p>
    </div>
  );
}
