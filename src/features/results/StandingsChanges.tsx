import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { PilotLine } from '@/components/PilotLine';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Button, LinkButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PositionDelta } from '@/components/ui/PositionDelta';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { ChampionshipModel, PilotId, RaceImpact, StandingChange } from '@/domain';
import { useVisibleOnce } from '@/lib/useVisibleOnce';
import styles from './StandingsChanges.module.css';

type View = 'pilots' | 'teams';
type Phase = 'before' | 'after';

interface StandingsChangesProps {
  model: ChampionshipModel;
  impact: RaceImpact;
  /** Piloto em destaque (opcional). */
  highlightPilotId?: PilotId;
  /** Para onde "Ver classificação completa" leva. */
  standingsPath: string;
}

const SPRING = { type: 'spring', stiffness: 520, damping: 42 } as const;
/** Linhas mostradas: quem estava ou ficou entre os primeiros. A lista completa fica na Classificação. */
const TOP = 6;
const HOLD_BEFORE_MS = 1000;

/**
 * "Como ficou o campeonato": mostra a classificação ANTES da etapa e, em seguida,
 * reordena as linhas até a classificação DEPOIS, com os pontos somados. Começa
 * quando o quadro aparece na tela. Com movimento reduzido, mostra direto o depois.
 */
export function StandingsChanges({ model, impact, highlightPilotId, standingsPath }: StandingsChangesProps) {
  const reduceMotion = useReducedMotion();
  const { ref, visible, supported } = useVisibleOnce<HTMLDivElement>();
  const animate = !reduceMotion && supported;
  const [view, setView] = useState<View>('pilots');
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState<Phase>(animate ? 'before' : 'after');

  useEffect(() => {
    if (!animate) {
      setPhase('after');
      return;
    }
    setPhase('before');
    if (!visible) return;
    const timer = setTimeout(() => setPhase('after'), HOLD_BEFORE_MS);
    return () => clearTimeout(timer);
  }, [animate, visible, run, view]);

  const rows = useMemo(() => {
    const source: StandingChange[] = view === 'pilots' ? impact.pilots : impact.teams;
    const afterIndex = new Map(source.map((row, index) => [row.id, index]));
    const shown = source.filter(
      (row) => row.positionAfter <= TOP || (row.positionBefore !== null && row.positionBefore <= TOP),
    );
    return [...shown].sort((a, b) =>
      phase === 'after'
        ? afterIndex.get(a.id)! - afterIndex.get(b.id)!
        : (a.positionBefore ?? a.positionAfter) - (b.positionBefore ?? b.positionAfter) ||
          afterIndex.get(a.id)! - afterIndex.get(b.id)!,
    );
  }, [impact, view, phase]);

  const showAfter = phase === 'after';
  const unit = view === 'pilots' ? 'pilotos' : 'equipes';

  return (
    <Card aria-labelledby="changes-title" role="region">
      <div className={styles.head}>
        <h2 className={styles.title} id="changes-title">
          Como ficou o campeonato
        </h2>
        {animate && (
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
      <p className={styles.note}>
        {showAfter
          ? `Classificação depois da etapa ${impact.race.round}, com os pontos que cada um somou nela.`
          : `Classificação antes da etapa ${impact.race.round}…`}
      </p>
      <SegmentedControl<View>
        label="Classificação a comparar"
        value={view}
        onChange={setView}
        options={[
          { value: 'pilots', label: 'Pilotos' },
          { value: 'teams', label: 'Equipes' },
        ]}
      />

      <div ref={ref}>
        <ol className={styles.list} aria-label={`Classificação de ${unit} ${showAfter ? 'depois' : 'antes'} da etapa`}>
          {rows.map((row) => {
            const position = showAfter ? row.positionAfter : (row.positionBefore ?? row.positionAfter);
            const tied = showAfter ? row.tiedAfter : row.tiedBefore;
            const points = showAfter ? row.pointsAfter : row.pointsBefore;
            const pilot = view === 'pilots' ? model.pilotsById.get(row.id) : undefined;
            const team = view === 'pilots' ? pilot && model.teamsById.get(pilot.teamId) : model.teamsById.get(row.id);
            if (!team) return null;
            const focus = row.id === highlightPilotId;
            return (
              <motion.li
                key={row.id}
                layout="position"
                transition={SPRING}
                className={`${styles.item} ${focus ? styles.highlight : ''}`}
              >
                <div
                  className={`${styles.row} ${view === 'teams' ? styles.teamRow : ''}`}
                  style={{ '--team': team.color } as CSSProperties}
                >
                  <span
                    className={`${styles.position} num`}
                    aria-label={`Posição ${position}${tied ? ', empatado' : ''}`}
                  >
                    <span aria-hidden="true">{position}</span>
                    {tied && (
                      <span className={styles.tie} aria-hidden="true">
                        =
                      </span>
                    )}
                  </span>
                  {pilot && view === 'pilots' ? (
                    <PilotLine pilot={pilot} team={team} sub={focus ? `${team.name} · você` : undefined} />
                  ) : (
                    <span className={styles.teamBody}>
                      <span className={styles.teamName} style={{ display: 'block' }}>
                        {team.name}
                      </span>
                      <span className={styles.teamPilots} style={{ display: 'block' }}>
                        {team.pilotIds.map((id) => model.pilotsById.get(id)?.name.split(' ')[0]).join(' e ')}
                      </span>
                    </span>
                  )}
                  <span className={styles.side}>
                    {showAfter && row.positionBefore !== null && (
                      <PositionDelta change={row.positionBefore - row.positionAfter} />
                    )}
                    {showAfter && row.gained > 0 && (
                      <span className={`${styles.gain} num`}>
                        +{row.gained}
                        <span className="sr-only"> pontos na etapa</span>
                      </span>
                    )}
                  </span>
                  <span className={styles.points}>
                    <span className={`${styles.pointsValue} num`}>
                      <AnimatedNumber value={points} duration={0.6} />
                    </span>
                    <span className={styles.pointsUnit}>pts</span>
                  </span>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>

      <LinkButton to={standingsPath} size="small" className={styles.more}>
        Ver classificação completa
      </LinkButton>
    </Card>
  );
}
