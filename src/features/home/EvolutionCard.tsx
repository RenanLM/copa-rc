import { ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import type { EvolutionPoint } from '@/domain';
import { formatOrdinal } from '@/lib/format';
import styles from './cards.module.css';

interface EvolutionCardProps {
  evolution: readonly EvolutionPoint[];
  /** Maior pontuação possível em uma etapa (escala das barras). */
  maxRacePoints: number;
  /** Para onde "Ver análise" leva. */
  detailPath: string;
}

function describe(points: readonly EvolutionPoint[]): string {
  return points
    .map((p) =>
      p.racePosition === null
        ? `Etapa ${p.race.round}: ainda não disputada`
        : `Etapa ${p.race.round}: ${formatOrdinal(p.racePosition)} lugar, ${p.racePoints} pontos, ` +
          `${formatOrdinal(p.championshipPosition ?? 0)} no campeonato`,
    )
    .join('. ');
}

export function EvolutionCard({ evolution, maxRacePoints, detailPath }: EvolutionCardProps) {
  return (
    <Card aria-labelledby="evolution-title">
      <div className={styles.kicker}>
        <h2 className={styles.kickerTitle} id="evolution-title">
          Evolução nas etapas
        </h2>
        <Link to={detailPath} className={styles.moreLink}>
          Ver análise
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <div role="img" aria-label={describe(evolution)}>
        <div className={styles.evolution} aria-hidden="true">
          {evolution.map((point, i) => {
            const raced = point.racePoints !== null;
            const height = raced ? Math.max(6, ((point.racePoints ?? 0) / maxRacePoints) * 100) : 0;
            return (
              <div key={point.race.id} className={styles.col}>
                <span className={styles.colLabel}>Etapa {point.race.round}</span>
                <div className={styles.barArea}>
                  {raced ? (
                    <motion.div
                      className={styles.colBar}
                      style={{ height: `${height}%` }}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.5, delay: 0.08 * i, ease: [0.2, 0.7, 0.2, 1] }}
                    />
                  ) : (
                    <div className={styles.colBarFuture} />
                  )}
                </div>
                <span className={`${styles.colPoints} num ${raced ? '' : styles.colMuted}`}>
                  {raced ? `+${point.racePoints}` : '–'}
                </span>
                <span className={styles.colSub}>
                  {raced ? `${formatOrdinal(point.racePosition ?? 0)} na prova` : 'A disputar'}
                </span>
              </div>
            );
          })}
        </div>
        <p className={styles.rowLabel} aria-hidden="true">
          Posição no campeonato após a etapa
        </p>
        <div className={styles.evolution} style={{ marginTop: 8 }} aria-hidden="true">
          {evolution.map((point) => (
            <div key={point.race.id} className={styles.col}>
              <span className={`${styles.champPos} ${point.championshipPosition === null ? styles.colMuted : ''}`}>
                {point.championshipPosition === null ? '–' : formatOrdinal(point.championshipPosition)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
