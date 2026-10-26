import { motion } from 'motion/react';
import { Card } from '@/components/ui/Card';
import type { HeatSummary } from '@/domain';
import { formatLapTime, formatOrdinal } from '@/lib/format';
import styles from './cards.module.css';

interface HeatsCardProps {
  round: number;
  heats: readonly HeatSummary[];
}

export function HeatsCard({ round, heats }: HeatsCardProps) {
  if (heats.length === 0) return null;
  return (
    <Card aria-labelledby="heats-title">
      <div className={styles.kicker}>
        <h2 className={styles.kickerTitle} id="heats-title">
          Baterias · Etapa {round}
        </h2>
      </div>
      <ul className={styles.heats}>
        {heats.map((heat, i) => {
          // Quanto mais cheia a barra, mais perto do 1º lugar da bateria.
          const closeness = (heat.fieldSize - heat.position + 1) / heat.fieldSize;
          return (
            <li key={heat.index} className={styles.heat}>
              <span className={styles.heatName}>
                Bateria {heat.index} · {formatOrdinal(heat.position)} de {heat.fieldSize}
              </span>
              <span className={`${styles.heatStats} num`}>
                {heat.laps} voltas
                {heat.bestLapMs !== null && (
                  <>
                    {' · '}
                    <strong>{formatLapTime(heat.bestLapMs)}</strong>
                  </>
                )}
              </span>
              <span className={styles.track} aria-hidden="true">
                <motion.span
                  className={styles.bar}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: closeness }}
                  transition={{ duration: 0.6, delay: 0.1 * i, ease: [0.2, 0.7, 0.2, 1] }}
                />
              </span>
            </li>
          );
        })}
      </ul>
      <p className={styles.note}>
        A barra mostra o quão perto do 1º lugar da bateria você terminou. O tempo em azul é a sua melhor volta.
      </p>
    </Card>
  );
}
