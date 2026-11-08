import { useState, type CSSProperties } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Medal, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PilotNumber } from '@/components/ui/PilotNumber';
import type { ChampionshipModel, PilotId, PodiumEntry } from '@/domain';
import { formatGap, formatLapTime } from '@/lib/format';
import styles from './Podium.module.css';

interface PodiumProps {
  model: ChampionshipModel;
  entries: readonly PodiumEntry[];
  round: number;
  /** Piloto a destacar (ex.: o próprio usuário). Opcional: o pódio não depende de persona. */
  highlightPilotId?: PilotId;
}

const MEDAL = { 1: 'ouro', 2: 'prata', 3: 'bronze' } as const;
/** Revelação do 3º para o 1º, como numa premiação. Atrasos em segundos. */
const REVEAL_DELAY = { 3: 0.15, 2: 0.75, 1: 1.4 } as const;
const EASE = [0.2, 0.7, 0.2, 1] as const;

/**
 * Pódio com revelação animada (3º, 2º e depois 1º). A medalha nunca é o único
 * código: cada degrau tem número, texto e pontos. Com movimento reduzido, tudo
 * aparece de uma vez.
 */
export function Podium({ model, entries, round, highlightPilotId }: PodiumProps) {
  const reduceMotion = useReducedMotion();
  const [run, setRun] = useState(0);

  return (
    <Card aria-labelledby="podium-title" role="region">
      <div className={styles.head}>
        <h2 className={styles.title} id="podium-title">
          Pódio · Etapa {round}
        </h2>
        {!reduceMotion && (
          <Button
            variant="ghost"
            size="small"
            icon={<RotateCcw size={16} aria-hidden="true" />}
            onClick={() => setRun((n) => n + 1)}
          >
            Rever
          </Button>
        )}
      </div>

      <ol className={styles.stage} key={run} aria-label={`Três primeiros colocados da etapa ${round}`}>
        {entries.slice(0, 3).map((entry) => {
          const pilot = model.pilotsById.get(entry.pilotId);
          const team = model.teamsById.get(entry.teamId);
          if (!pilot || !team) return null;
          const delay = REVEAL_DELAY[entry.position as 1 | 2 | 3] ?? 0;
          const mine = entry.pilotId === highlightPilotId;
          return (
            <li
              key={entry.pilotId}
              className={`${styles.slot} ${styles[`p${entry.position}`]}`}
              style={{ '--team': team.color } as CSSProperties}
            >
              <motion.div
                className={`${styles.driver} ${mine ? styles.mine : ''}`}
                initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: delay + 0.35, ease: EASE }}
              >
                <PilotNumber number={pilot.number} color={team.color} />
                <span className={styles.name}>{pilot.name}</span>
                <span className={styles.team}>
                  <span className={styles.dot} aria-hidden="true" />
                  <span className={styles.teamName}>{team.name}</span>
                </span>
                <span className={`${styles.points} num`}>
                  +{entry.points} pts
                </span>
                <span className={`${styles.time} num`}>
                  {entry.position === 1 ? formatLapTime(entry.totalTimeMs) : formatGap(entry.gap)}
                </span>
                {mine && <span className={styles.you}>você</span>}
              </motion.div>
              <motion.div
                className={styles.block}
                initial={reduceMotion ? false : { scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.55, delay, ease: EASE }}
              >
                <Medal size={20} aria-hidden="true" />
                <span className={`${styles.ordinal} num`}>{entry.position}º</span>
                <span className="sr-only">
                  Lugar {entry.position}, medalha de {MEDAL[entry.position as 1 | 2 | 3]}
                </span>
              </motion.div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
