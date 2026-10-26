import { motion } from 'motion/react';
import { PilotLine } from '@/components/PilotLine';
import { Card } from '@/components/ui/Card';
import { LinkButton } from '@/components/ui/Button';
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge';
import {
  pointsForPosition,
  scoringPositions,
  totalTimeOf,
  type ChampionshipModel,
  type PilotId,
  type RaceId,
} from '@/domain';
import { formatLapTime } from '@/lib/format';
import styles from './FinalResultCard.module.css';

interface FinalResultCardProps {
  model: ChampionshipModel;
  raceId: RaceId;
  focusPilotId?: PilotId;
  resultPath: string;
}

/**
 * Resultado final exibido ao término do replay. Vem da classificação OFICIAL da
 * etapa (a mesma da tela de resultados), não da simulação.
 */
export function FinalResultCard({ model, raceId, focusPilotId, resultPath }: FinalResultCardProps) {
  const results = model.resultsByRace.get(raceId);
  const race = model.racesById.get(raceId);
  if (!results || !race) return null;

  const rules = model.championship.rules;
  const ordered = [...results.final].sort((a, b) => a.position - b.position);
  const shown = ordered.slice(0, scoringPositions(rules));
  const focusEntry = focusPilotId ? ordered.find((e) => e.pilotId === focusPilotId) : undefined;
  const focusOutside = focusEntry && !shown.some((e) => e.pilotId === focusEntry.pilotId);
  const rows = focusOutside ? [...shown, focusEntry] : shown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
    >
      <Card tone="accent" aria-labelledby="replay-final-title" role="region">
        <div className={styles.head}>
          <h2 className={styles.title} id="replay-final-title">
            Resultado final · Etapa {race.round}
          </h2>
          <ProvenanceBadge kind="final" />
        </div>
        <ol className={styles.list}>
          {rows.map((entry, index) => {
            const pilot = model.pilotsById.get(entry.pilotId);
            const team = pilot && model.teamsById.get(pilot.teamId);
            if (!pilot || !team) return null;
            const points = pointsForPosition(entry.position, rules);
            return (
              <motion.li
                key={entry.pilotId}
                className={`${styles.row} ${entry.pilotId === focusPilotId ? styles.focus : ''}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.28, delay: 0.1 + index * 0.07, ease: [0.2, 0.7, 0.2, 1] }}
              >
                <span className={`${styles.position} num`}>
                  <span className="sr-only">Posição </span>
                  {entry.position}
                </span>
                <PilotLine
                  pilot={pilot}
                  team={team}
                  sub={entry.position === 1 ? formatLapTime(totalTimeOf(entry.lapTimesMs)) : undefined}
                />
                <span className={`${styles.points} ${points === 0 ? styles.zero : ''} num`}>
                  {points > 0 ? `+${points}` : '0'}
                  <span className="sr-only"> {points === 1 ? 'ponto' : 'pontos'}</span>
                </span>
              </motion.li>
            );
          })}
        </ol>
        <LinkButton to={resultPath} size="small" className={styles.cta}>
          Ver resultado completo
        </LinkButton>
      </Card>
    </motion.div>
  );
}
