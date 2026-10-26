import type { CSSProperties } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Card } from '@/components/ui/Card';
import type { RacePerformance } from '@/domain';
import { formatLapTime, formatOrdinal } from '@/lib/format';
import { ChartTitle } from './chart-parts';
import styles from './HeatMatrix.module.css';

interface HeatMatrixProps {
  performance: readonly RacePerformance[];
}

const EASE = [0.2, 0.7, 0.2, 1] as const;

/** Intensidade de 0 (último) a 1 (primeiro). */
const closeness = (position: number, fieldSize: number) =>
  fieldSize > 1 ? (fieldSize - position) / (fieldSize - 1) : 1;

// Cores de referência (iguais aos tokens): dados, fundo rebaixado, texto e tinta escura.
const DATA_RGB = [67, 198, 232] as const;
const BASE_RGB = [17, 22, 29] as const;
const LIGHT_TEXT = { css: 'var(--text)', luminance: 0.93 };
const DARK_TEXT = { css: '#0b0f14', luminance: 0.005 };

function luminance([r, g, b]: readonly number[]): number {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r!) + 0.7152 * channel(g!) + 0.0722 * channel(b!);
}

function cellStyle(position: number, fieldSize: number, final = false): CSSProperties {
  const weight = (12 + closeness(position, fieldSize) * 80) / 100;
  const rgb = DATA_RGB.map((v, i) => Math.round(v * weight + BASE_RGB[i]! * (1 - weight)));
  const bg = luminance(rgb);
  // Escolhe, entre texto claro e escuro, o de maior contraste com o fundo da célula.
  const contrast = (text: number) => (Math.max(bg, text) + 0.05) / (Math.min(bg, text) + 0.05);
  const ink = contrast(LIGHT_TEXT.luminance) >= contrast(DARK_TEXT.luminance) ? LIGHT_TEXT : DARK_TEXT;
  return {
    '--bg-cell': `rgb(${rgb.join(' ')})`,
    '--ink': ink.css,
    ...(final ? { boxShadow: 'inset 0 0 0 1.5px var(--accent)' } : {}),
  } as CSSProperties;
}

function insight(race: RacePerformance): string | null {
  const first = race.heats[0];
  const last = race.heats.at(-1);
  if (!first || !last || race.heats.length < 2) return null;
  const gained = first.position - last.position;
  const where = `do ${formatOrdinal(first.position)} (bateria ${first.index}) ao ${formatOrdinal(last.position)} (bateria ${last.index})`;
  if (gained > 0) return `Na etapa ${race.race.round} você foi ${where}: subiu ${gained} ${gained === 1 ? 'posição' : 'posições'} ao longo das baterias.`;
  if (gained < 0) return `Na etapa ${race.race.round} você foi ${where}: perdeu ${-gained} ${gained === -1 ? 'posição' : 'posições'} ao longo das baterias.`;
  return `Na etapa ${race.race.round} você manteve o ${formatOrdinal(first.position)} lugar nas baterias.`;
}

/** Posição em cada bateria e na prova final, etapa por etapa. Mais claro = mais perto do 1º. */
export function HeatMatrix({ performance }: HeatMatrixProps) {
  const reduceMotion = useReducedMotion();
  if (performance.length === 0) return null;
  const heatCount = Math.max(...performance.map((p) => p.heats.length));
  const latest = performance.at(-1)!;
  const note = insight(latest);

  return (
    <Card aria-labelledby="heat-matrix-title">
      <ChartTitle
        id="heat-matrix-title"
        title="Baterias e prova final"
        subtitle="Sua posição em cada sessão. Quanto mais claro, mais perto do 1º lugar."
      />
      <table className={styles.table}>
        <caption className="sr-only">Posição em cada bateria e na prova final, por etapa</caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Etapa</span>
            </th>
            {Array.from({ length: heatCount }, (_, i) => (
              <th key={i} scope="col">
                Bateria {i + 1}
              </th>
            ))}
            <th scope="col">Prova</th>
          </tr>
        </thead>
        <tbody>
          {performance.map((race, row) => (
            <tr key={race.race.id}>
              <th scope="row">
                <span className={styles.stage}>Etapa {race.race.round}</span>
              </th>
              {Array.from({ length: heatCount }, (_, i) => {
                const heat = race.heats.find((h) => h.index === i + 1);
                return heat ? (
                  <motion.td
                    key={i}
                    className={styles.cell}
                    style={cellStyle(heat.position, heat.fieldSize)}
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.06 * (row * (heatCount + 1) + i), ease: EASE }}
                  >
                    <span className={`${styles.pos} num`}>
                      <span className="sr-only">Posição </span>
                      {formatOrdinal(heat.position)}
                    </span>
                    <span className={`${styles.lap} num`}>
                      {heat.bestLapMs !== null ? formatLapTime(heat.bestLapMs) : '–'}
                      <span className="sr-only"> melhor volta</span>
                    </span>
                  </motion.td>
                ) : (
                  <td key={i} className={styles.cell} style={{ '--bg-cell': 'transparent', '--ink': 'var(--text-3)' } as CSSProperties}>
                    –
                  </td>
                );
              })}
              <motion.td
                className={styles.cell}
                style={cellStyle(race.finalPosition, race.fieldSize, true)}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.06 * (row * (heatCount + 1) + heatCount), ease: EASE }}
              >
                <span className={`${styles.pos} num`}>
                  <span className="sr-only">Posição </span>
                  {formatOrdinal(race.finalPosition)}
                </span>
                <span className={styles.lap}>
                  {race.points > 0 ? `+${race.points} pts` : '0 pts'}
                </span>
              </motion.td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.scale} aria-hidden="true">
        <span>Último</span>
        <span
          className={styles.ramp}
          style={
            {
              '--ramp-lo': 'color-mix(in srgb, var(--data) 12%, var(--surface-sunken))',
              '--ramp-hi': 'color-mix(in srgb, var(--data) 92%, var(--surface-sunken))',
            } as CSSProperties
          }
        />
        <span>1º</span>
      </div>
      {note && (
        <p className={styles.insight}>
          <strong>{note}</strong>
        </p>
      )}
    </Card>
  );
}
