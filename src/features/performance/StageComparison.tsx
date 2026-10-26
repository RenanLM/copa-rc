import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Card } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { RacePerformance } from '@/domain';
import { formatLapTime } from '@/lib/format';
import { ChartLegend, ChartTitle, DataTable, chartStyles as s, type SeriesInfo } from './chart-parts';

export interface PerformanceSeries {
  info: SeriesInfo;
  performance: readonly RacePerformance[];
}

interface StageComparisonProps {
  /** A primeira série é o piloto em foco; a segunda (opcional) é o comparado. */
  series: readonly PerformanceSeries[];
  /** Maior pontuação possível em uma etapa. */
  maxRacePoints: number;
}

type Metric = 'bestLap' | 'pace' | 'points';

const W = 340;
const ROW = 50;
const MT = 8;
const PX0 = 112;
const PX1 = 276;
const EASE = [0.2, 0.7, 0.2, 1] as const;

const METRICS: Record<Metric, { label: string; unit: 'percent' | 'points'; read: (p: RacePerformance) => number | null; note: string }> = {
  bestLap: {
    label: 'Melhor volta',
    unit: 'percent',
    read: (p) => p.bestLapRelative,
    note: '100% = tão rápido quanto a volta mais rápida da etapa (de qualquer piloto). Isso permite comparar pistas diferentes.',
  },
  pace: {
    label: 'Ritmo',
    unit: 'percent',
    read: (p) => p.paceRelative,
    note: '100% = o ritmo médio do vencedor da prova final. Quanto maior, mais perto do vencedor.',
  },
  points: {
    label: 'Pontos',
    unit: 'points',
    read: (p) => p.points,
    note: 'Pontos conquistados em cada etapa.',
  },
};

function format(value: number, unit: 'percent' | 'points'): string {
  return unit === 'percent' ? `${value.toFixed(1)}%` : `${value} ${value === 1 ? 'pt' : 'pts'}`;
}

function delta(current: number, previous: number | null, unit: 'percent' | 'points') {
  if (previous === null) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 0.05) return { sign: 0, text: 'igual à anterior' };
  const abs = Math.abs(diff);
  const text = unit === 'percent' ? `${abs.toFixed(1)} p.p.` : `${abs} ${abs === 1 ? 'pt' : 'pts'}`;
  return { sign: diff > 0 ? 1 : -1, text };
}

/**
 * Comparativo entre etapas em gráfico de pontos. Os valores são relativos ao mais
 * rápido de cada etapa, então pistas de tempos diferentes podem ser comparadas.
 */
export function StageComparison({ series, maxRacePoints }: StageComparisonProps) {
  const reduceMotion = useReducedMotion();
  const [metric, setMetric] = useState<Metric>('bestLap');
  const config = METRICS[metric];
  const mine = series[0];
  if (!mine || mine.performance.length === 0) return null;

  const races = mine.performance;
  const comparing = series.length > 1;

  const allValues = series.flatMap((srs) => srs.performance.map((p) => config.read(p))).filter((v): v is number => v !== null);
  const lo = config.unit === 'points' ? 0 : Math.min(94, Math.floor((Math.min(...allValues) - 1) / 2) * 2);
  const hi = config.unit === 'points' ? maxRacePoints : 100;
  const x = (v: number) => PX0 + ((v - lo) / (hi - lo)) * (PX1 - PX0);
  const ticks =
    config.unit === 'points'
      ? Array.from({ length: Math.floor(maxRacePoints / 5) + 1 }, (_, i) => i * 5)
      : [lo, (lo + hi) / 2, hi];
  const height = MT + races.length * ROW + 22;

  const summary = races
    .map((p) => {
      const v = config.read(p);
      return `Etapa ${p.race.round}: ${v === null ? 'sem dado' : format(v, config.unit)}`;
    })
    .join('; ');

  return (
    <Card aria-labelledby="stage-comparison-title">
      <ChartTitle id="stage-comparison-title" title="Comparativo entre etapas" subtitle="Quanto mais à direita, melhor" />
      <div className={s.controls}>
        <SegmentedControl<Metric>
          label="Medida do comparativo"
          value={metric}
          onChange={setMetric}
          options={(Object.keys(METRICS) as Metric[]).map((m) => ({ value: m, label: METRICS[m].label }))}
        />
      </div>
      <ChartLegend series={series.map((srs) => srs.info)} />

      <div role="img" aria-label={`Gráfico de pontos por etapa, ${config.label}. ${mine.info.name}: ${summary}. Os mesmos valores estão na tabela abaixo.`}>
        <svg className={s.svg} viewBox={`0 0 ${W} ${height}`} aria-hidden="true">
          {ticks.map((t) => (
            <g key={t}>
              <line className={s.grid} x1={x(t)} x2={x(t)} y1={MT} y2={MT + races.length * ROW} />
              <text className={s.axisText} x={x(t)} y={MT + races.length * ROW + 14} textAnchor="middle">
                {config.unit === 'percent' ? `${t}%` : t}
              </text>
            </g>
          ))}

          {races.map((p, row) => {
            const cy = MT + row * ROW + ROW / 2;
            const previous = row > 0 ? config.read(races[row - 1]!) : null;
            const value = config.read(p);
            const change = value !== null ? delta(value, previous, config.unit) : null;
            return (
              <g key={p.race.id}>
                <text className={s.axisText} x={0} y={cy - 3} style={{ fill: 'var(--text)', fontWeight: 600, fontSize: 12 }}>
                  Etapa {p.race.round}
                </text>
                <text className={s.axisText} x={0} y={cy + 11}>
                  {p.race.name.length > 18 ? `${p.race.name.slice(0, 17)}…` : p.race.name}
                </text>

                {series.map((srs, k) => {
                  const entry = srs.performance.find((q) => q.race.round === p.race.round);
                  const v = entry ? config.read(entry) : null;
                  if (v === null) return null;
                  const dy = comparing ? (k === 0 ? -5 : 5) : 0;
                  return (
                    <motion.circle
                      key={srs.info.key}
                      cy={cy + dy}
                      r="5"
                      fill={srs.info.color}
                      stroke="var(--surface)"
                      strokeWidth="2"
                      initial={reduceMotion ? false : { cx: PX0, opacity: 0 }}
                      animate={{ cx: x(v), opacity: 1 }}
                      transition={{ duration: 0.55, delay: 0.1 * row, ease: EASE }}
                    />
                  );
                })}

                {value !== null && (
                  <>
                    <text className={s.valueText} x={PX1 + 14} y={cy + (comparing ? -3 : 0)}>
                      {format(value, config.unit)}
                    </text>
                    {comparing ? (
                      (() => {
                        const other = series[1]?.performance.find((q) => q.race.round === p.race.round);
                        const ov = other ? config.read(other) : null;
                        return ov !== null ? (
                          <text className={s.axisText} x={PX1 + 14} y={cy + 13}>
                            {format(ov, config.unit)}
                          </text>
                        ) : null;
                      })()
                    ) : (
                      change && (
                        <text
                          className={s.axisText}
                          x={PX1 + 14}
                          y={cy + 14}
                          style={{ fill: change.sign > 0 ? 'var(--gain)' : change.sign < 0 ? 'var(--alert)' : 'var(--text-2)' }}
                        >
                          {change.sign > 0 ? '▲' : change.sign < 0 ? '▼' : '='} {change.text}
                        </text>
                      )
                    )}
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <p style={{ marginTop: 8, color: 'var(--text-2)', fontSize: 'var(--fs-sm)' }}>{config.note}</p>

      <DataTable
        caption="Desempenho por etapa"
        headers={[
          'Etapa',
          ...series.flatMap((srs) => [
            `${srs.info.name}: melhor volta`,
            'relativa',
            'ritmo relativo',
            'pontos',
            'regularidade',
          ]),
        ]}
        rows={races.map((p) => [
          `Etapa ${p.race.round}`,
          ...series.flatMap((srs) => {
            const q = srs.performance.find((e) => e.race.round === p.race.round);
            return q
              ? [
                  q.bestLapMs !== null ? formatLapTime(q.bestLapMs) : '–',
                  q.bestLapRelative !== null ? `${q.bestLapRelative.toFixed(1)}%` : '–',
                  q.paceRelative !== null ? `${q.paceRelative.toFixed(1)}%` : '–',
                  q.points,
                  q.consistencyPct !== null ? `±${q.consistencyPct.toFixed(1)}%` : '–',
                ]
              : ['–', '–', '–', '–', '–'];
          }),
        ])}
      />
    </Card>
  );
}
