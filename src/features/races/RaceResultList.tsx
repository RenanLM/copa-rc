import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Timer } from 'lucide-react';
import { PilotLine } from '@/components/PilotLine';
import { EmptyState } from '@/components/ui/StateViews';
import {
  bestLapOf,
  gapToLeader,
  pointsForPosition,
  totalTimeOf,
  type ChampionshipModel,
  type PilotId,
  type RaceId,
} from '@/domain';
import { formatGap, formatLapTime } from '@/lib/format';
import styles from './RaceResultList.module.css';

interface RaceResultListProps {
  model: ChampionshipModel;
  raceId: RaceId;
  /** Piloto em destaque (ex.: o próprio usuário). Opcional: componente é independente de persona. */
  highlightPilotId?: PilotId;
}

const PODIUM_CLASS = ['podium1', 'podium2', 'podium3'] as const;

/** Classificação final de uma etapa. Linhas expansíveis mostram os dados de voltas. */
export function RaceResultList({ model, raceId, highlightPilotId }: RaceResultListProps) {
  const uid = useId();
  const [openId, setOpenId] = useState<PilotId | null>(null);
  const results = model.resultsByRace.get(raceId);
  const race = model.racesById.get(raceId);

  if (!results || !race) {
    return <EmptyState title="Resultado indisponível" message="Esta etapa ainda não possui resultados." />;
  }

  const entries = [...results.final].sort((a, b) => a.position - b.position);
  const leader = entries.find((e) => e.position === 1);
  const finalBest = Math.min(...entries.map((e) => bestLapOf(e.lapTimesMs) ?? Infinity));

  return (
    <ol className={styles.list}>
      {entries.map((entry, index) => {
        const pilot = model.pilotsById.get(entry.pilotId);
        const team = pilot && model.teamsById.get(pilot.teamId);
        if (!pilot || !team || !leader) return null;

        const points = pointsForPosition(entry.position, model.championship.rules);
        const best = bestLapOf(entry.lapTimesMs);
        const total = totalTimeOf(entry.lapTimesMs);
        const isOpen = openId === entry.pilotId;
        const highlighted = entry.pilotId === highlightPilotId;
        const hasFastest = best !== null && best === finalBest;
        const panelId = `${uid}-${entry.pilotId}`;
        const podium = entry.position <= 3 ? styles[PODIUM_CLASS[entry.position - 1]!] : '';

        return (
          <motion.li
            key={entry.pilotId}
            className={`${styles.item} ${highlighted ? styles.highlight : ''} ${isOpen ? styles.open : ''}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: Math.min(index, 12) * 0.03, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <button
              type="button"
              className={styles.row}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenId(isOpen ? null : entry.pilotId)}
            >
              <span className={`${styles.position} ${podium} num`}>
                <span className="sr-only">Posição </span>
                {entry.position}
              </span>
              <PilotLine
                pilot={pilot}
                team={team}
                sub={
                  <>
                    {team.name}
                    {highlighted && ' · você'}
                  </>
                }
              />
              <span className={styles.score}>
                <span className={`${styles.pts} ${points > 0 ? styles.ptsScoring : styles.ptsZero} num`}>
                  {points > 0 ? `+${points}` : '0'}
                  <span className="sr-only"> {points === 1 ? 'ponto' : 'pontos'}</span>
                </span>
                <span className={`${styles.gap} num`}>
                  {entry.position === 1 ? formatLapTime(total) : formatGap(gapToLeader(entry, leader))}
                </span>
              </span>
              <ChevronDown size={16} className={styles.chev} aria-hidden="true" />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  className={styles.details}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
                >
                  <dl className={styles.grid}>
                    {entry.status === 'dnf' ? (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <dt>Situação</dt>
                        <dd>Abandonou na volta {entry.lapTimesMs.length + 1}</dd>
                      </div>
                    ) : (
                      <div>
                        <dt>Tempo total</dt>
                        <dd className="num">{formatLapTime(total)}</dd>
                      </div>
                    )}
                    <div>
                      <dt>Voltas</dt>
                      <dd className="num">
                        {entry.lapTimesMs.length} de {race.finalLaps}
                      </dd>
                    </div>
                    <div>
                      <dt>Melhor volta</dt>
                      <dd className={`${styles.data} num`}>
                        {best !== null ? formatLapTime(best) : '—'}
                        {best !== null && (
                          <span className="sr-only"> na volta {entry.lapTimesMs.indexOf(best) + 1}</span>
                        )}
                      </dd>
                      {hasFastest && (
                        <span className={styles.fastest}>
                          <Timer size={12} aria-hidden="true" /> Volta mais rápida da prova
                        </span>
                      )}
                    </div>
                    <div>
                      <dt>Ritmo médio</dt>
                      <dd className="num">
                        {entry.lapTimesMs.length > 0 ? formatLapTime(total / entry.lapTimesMs.length) : '—'}
                      </dd>
                    </div>
                  </dl>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.li>
        );
      })}
    </ol>
  );
}
