import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Card } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { EvolutionPoint } from '@/domain';
import { formatOrdinal } from '@/lib/format';
import { ChartLegend, ChartTitle, DataTable, chartStyles as s, type SeriesInfo } from './chart-parts';

export interface EvolutionSeries {
  info: SeriesInfo;
  points: readonly EvolutionPoint[];
}

interface EvolutionChartProps {
  /** A primeira série é o piloto em foco; a segunda (opcional) é o comparado. */
  series: readonly EvolutionSeries[];
  /** Pilotos no campeonato (limite inferior da escala de posição). */
  fieldSize: number;
}

type Metric = 'points' | 'position';

// Geometria do gráfico (grade 340 × 210).
const W = 340;
const H = 210;
const ML = 34;
const MR = 40;
const MT = 14;
const MB = 28;
const INNER_W = W - ML - MR;
const INNER_H = H - MT - MB;
const EASE = [0.2, 0.7, 0.2, 1] as const;

const valueOf = (p: EvolutionPoint, metric: Metric) =>
  metric === 'points' ? p.cumulativePoints : p.championshipPosition;

/** Evolução do piloto ao longo das etapas: pontos acumulados ou posição no campeonato. */
export function EvolutionChart({ series, fieldSize }: EvolutionChartProps) {
  const reduceMotion = useReducedMotion();
  const [metric, setMetric] = useState<Metric>('points');
  const rounds = series[0]?.points ?? [];
  const finished = rounds.filter((p) => p.cumulativePoints !== null);
  const [selected, setSelected] = useState<number>(finished.at(-1)?.race.round ?? 1);

  if (rounds.length === 0 || finished.length === 0) return null;

  const x = (index: number) => ML + (index / Math.max(1, rounds.length - 1)) * INNER_W;

  const allValues = series.flatMap((srs) => srs.points.map((p) => valueOf(p, 'points') ?? 0));
  const niceMax = Math.max(10, Math.ceil(Math.max(...allValues) / 10) * 10);
  const y = (value: number) =>
    metric === 'points'
      ? MT + INNER_H - (value / niceMax) * INNER_H
      : MT + ((value - 1) / Math.max(1, fieldSize - 1)) * INNER_H;

  const ticks: number[] =
    metric === 'points'
      ? Array.from({ length: niceMax / (niceMax > 40 ? 20 : 10) + 1 }, (_, i) => i * (niceMax > 40 ? 20 : 10))
      : [...new Set([1, Math.round(fieldSize / 4), Math.round(fieldSize / 2), Math.round((3 * fieldSize) / 4), fieldSize])];
  const tickLabel = (t: number) => (metric === 'points' ? String(t) : `${t}º`);
  const endLabel = (v: number) => (metric === 'points' ? String(v) : formatOrdinal(v));

  const selectedIndex = rounds.findIndex((p) => p.race.round === selected);

  // Rótulos de ponta: se as séries terminam muito próximas, afasta um pouco para não colidirem.
  const ends = series.map((srs) => {
    const last = [...srs.points].reverse().find((p) => valueOf(p, metric) !== null);
    const index = last ? srs.points.indexOf(last) : -1;
    return last && index >= 0 ? { x: x(index), y: y(valueOf(last, metric)!), value: valueOf(last, metric)! } : null;
  });
  const close = ends[0] && ends[1] ? Math.abs(ends[0].y - ends[1].y) < 14 : false;
  const labelDy = (i: number) => (close ? (i === 0 ? -5 : 11) : 4);

  const summary = series
    .map((srs) => {
      const last = [...srs.points].reverse().find((p) => p.cumulativePoints !== null);
      return last
        ? `${srs.info.name}: ${last.cumulativePoints} pontos e ${formatOrdinal(last.championshipPosition ?? 0)} lugar após a etapa ${last.race.round}`
        : '';
    })
    .filter(Boolean)
    .join('. ');

  return (
    <Card aria-labelledby="evolution-chart-title">
      <ChartTitle
        id="evolution-chart-title"
        title="Evolução no campeonato"
        subtitle={metric === 'points' ? 'Pontos acumulados após cada etapa' : 'Posição no campeonato após cada etapa (1º no topo)'}
      />
      <div className={s.controls}>
        <SegmentedControl<Metric>
          label="Medida do gráfico"
          value={metric}
          onChange={setMetric}
          options={[
            { value: 'points', label: 'Pontos' },
            { value: 'position', label: 'Posição' },
          ]}
        />
      </div>
      <ChartLegend series={series.map((srs) => srs.info)} />

      <div role="img" aria-label={`Gráfico de linhas. ${summary}. Os mesmos valores estão na tabela abaixo.`}>
        <svg className={s.svg} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          {ticks.map((t) => (
            <g key={t}>
              <line className={s.grid} x1={ML} x2={W - MR} y1={y(t)} y2={y(t)} />
              <text className={s.axisText} x={ML - 8} y={y(t) + 3} textAnchor="end">
                {tickLabel(t)}
              </text>
            </g>
          ))}

          {rounds.map((p, i) => (
            <text
              key={p.race.id}
              className={s.axisText}
              x={x(i)}
              y={H - 8}
              textAnchor="middle"
              style={{ fill: p.cumulativePoints === null ? 'var(--text-3)' : undefined, fontWeight: p.race.round === selected ? 700 : 400 }}
            >
              {`E${p.race.round}`}
            </text>
          ))}

          {selectedIndex >= 0 && (
            <line className={s.grid} x1={x(selectedIndex)} x2={x(selectedIndex)} y1={MT} y2={MT + INNER_H} style={{ stroke: 'var(--border-strong)' }} />
          )}

          {[...series].reverse().map((srs) => {
            const seriesIndex = series.indexOf(srs);
            const pts = srs.points
              .map((p, i) => ({ p, i, v: valueOf(p, metric) }))
              .filter((d): d is { p: EvolutionPoint; i: number; v: number } => d.v !== null);
            const path = pts.map((d, k) => `${k === 0 ? 'M' : 'L'}${x(d.i).toFixed(1)} ${y(d.v).toFixed(1)}`).join(' ');
            const end = ends[seriesIndex];
            return (
              <g key={`${srs.info.key}-${metric}`}>
                {pts.length > 1 && (
                  <motion.path
                    d={path}
                    fill="none"
                    stroke={srs.info.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={reduceMotion ? false : { pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.7, ease: EASE }}
                  />
                )}
                {pts.map((d, k) => (
                  <motion.circle
                    key={d.p.race.id}
                    cx={x(d.i)}
                    cy={y(d.v)}
                    r={d.p.race.round === selected ? 6.5 : 5}
                    fill={srs.info.color}
                    stroke="var(--surface)"
                    strokeWidth="2"
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.12 * k + 0.2 }}
                    style={{ transformBox: 'fill-box', transformOrigin: 'center', cursor: 'pointer' }}
                    onClick={() => setSelected(d.p.race.round)}
                  />
                ))}
                {end && (
                  <text className={s.valueText} x={end.x + 11} y={end.y + labelDy(seriesIndex)}>
                    {endLabel(end.value)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <SegmentedControl
        label="Etapa em destaque"
        value={String(selected)}
        onChange={(v) => setSelected(Number(v))}
        options={finished.map((p) => ({ value: String(p.race.round), label: `Etapa ${p.race.round}` }))}
      />
      <ul style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {series.map((srs) => {
          const p = srs.points.find((pt) => pt.race.round === selected);
          if (!p || p.racePosition === null) return null;
          return (
            <li key={srs.info.key} style={{ display: 'flex', flexDirection: 'column', gap: 1, fontSize: 'var(--fs-sm)', color: 'var(--text-2)' }}>
              <strong style={{ color: 'var(--text)' }}>{srs.info.name}</strong>
              <span>
                {formatOrdinal(p.racePosition)} na prova ({p.racePoints} {p.racePoints === 1 ? 'pt' : 'pts'}) ·{' '}
                {formatOrdinal(p.championshipPosition ?? 0)} no campeonato · {p.cumulativePoints} acumulados
              </span>
            </li>
          );
        })}
      </ul>

      <DataTable
        caption="Evolução por etapa"
        headers={['Etapa', ...series.flatMap((srs) => [`${srs.info.name}: prova`, 'pts', 'campeonato', 'acumulado'])]}
        rows={rounds.map((p, i) => [
          `Etapa ${p.race.round}`,
          ...series.flatMap((srs) => {
            const q = srs.points[i];
            return q && q.racePosition !== null
              ? [formatOrdinal(q.racePosition), `+${q.racePoints}`, formatOrdinal(q.championshipPosition ?? 0), q.cumulativePoints]
              : ['–', '–', '–', '–'];
          }),
        ])}
      />
    </Card>
  );
}
