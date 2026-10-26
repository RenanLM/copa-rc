import { useState } from 'react';
import { motion } from 'motion/react';
import { useModel } from '@/app/providers/ChampionshipProvider';
import { useProfile } from '@/app/providers/ProfileProvider';
import { PilotLine } from '@/components/PilotLine';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { PositionDelta } from '@/components/ui/PositionDelta';
import { SeasonProgress } from '@/components/ui/SeasonProgress';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState } from '@/components/ui/StateViews';
import type { ChampionshipModel } from '@/domain';
import { ScoringLegend } from './ScoringLegend';
import styles from './StandingsPage.module.css';

type View = 'pilots' | 'teams';

const EASE = [0.2, 0.7, 0.2, 1] as const;

function PositionCell({ position, tied }: { position: number; tied: boolean }) {
  return (
    <span
      className={`${styles.position} ${position === 1 ? styles.leader : ''} num`}
      aria-label={`Posição ${position}${tied ? ', empatado' : ''}`}
    >
      <span aria-hidden="true">{position}</span>
      {tied && (
        <span className={styles.tie} aria-hidden="true">
          =
        </span>
      )}
    </span>
  );
}

function PilotsList({ model, highlightPilotId }: { model: ChampionshipModel; highlightPilotId?: string }) {
  // Variação em relação à classificação da etapa anterior (mesma fonte do restante do app).
  const previous = model.history.at(-2)?.pilots;

  return (
    <ol className={styles.list}>
      {model.pilotStandings.map((standing, index) => {
        const pilot = model.pilotsById.get(standing.pilotId);
        const team = pilot && model.teamsById.get(pilot.teamId);
        if (!pilot || !team) return null;
        const before = previous?.find((p) => p.pilotId === standing.pilotId);
        const highlighted = standing.pilotId === highlightPilotId;
        return (
          <motion.li
            key={standing.pilotId}
            className={`${styles.item} ${highlighted ? styles.highlight : ''}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28, delay: Math.min(index, 12) * 0.03, ease: EASE }}
          >
            <PositionCell position={standing.position} tied={standing.tied} />
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
            <PositionDelta change={before ? before.position - standing.position : null} />
            <span className={styles.points}>
              <span className={`${styles.pointsValue} num`}>
                <AnimatedNumber value={standing.points} id={`standing-${standing.pilotId}`} />
              </span>
              <span className={styles.pointsUnit}>pts</span>
            </span>
          </motion.li>
        );
      })}
    </ol>
  );
}

function TeamsList({ model }: { model: ChampionshipModel }) {
  return (
    <ol className={styles.list}>
      {model.teamStandings.map((standing, index) => {
        const team = model.teamsById.get(standing.teamId);
        if (!team) return null;
        return (
          <motion.li
            key={standing.teamId}
            className={styles.teamItem}
            style={{ '--team': team.color } as React.CSSProperties}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28, delay: index * 0.04, ease: EASE }}
          >
            <PositionCell position={standing.position} tied={standing.tied} />
            <div>
              <p className={styles.teamName}>{team.name}</p>
              <p className={styles.teamPilots}>
                {standing.pilotPoints.map((p) => (
                  <span key={p.pilotId}>
                    {model.pilotsById.get(p.pilotId)?.name.split(' ')[0]}{' '}
                    <strong className="num">{p.points}</strong>
                  </span>
                ))}
              </p>
            </div>
            <span className={styles.points}>
              <span className={`${styles.pointsValue} num`}>
                <AnimatedNumber value={standing.points} id={`team-standing-${standing.teamId}`} />
              </span>
              <span className={styles.pointsUnit}>pts</span>
            </span>
          </motion.li>
        );
      })}
    </ol>
  );
}

/** Classificação geral. Mesma tela para todos os perfis; só o destaque muda. */
export function StandingsPage() {
  const model = useModel();
  const profile = useProfile();
  const [view, setView] = useState<View>('pilots');
  const { championship, lastFinishedRound } = model;

  if (lastFinishedRound === 0) {
    return (
      <>
        <PageHeader eyebrow={`Temporada ${championship.season}`} title="Classificação" />
        <EmptyState
          title="Classificação ainda indisponível"
          message="Ela aparece aqui assim que a primeira etapa for finalizada."
        />
      </>
    );
  }

  const hasTies = (view === 'pilots' ? model.pilotStandings : model.teamStandings).some((s) => s.tied);

  return (
    <>
      <PageHeader
        eyebrow={`Temporada ${championship.season}`}
        title="Classificação"
        subtitle={`Após a etapa ${lastFinishedRound} de ${championship.rules.totalRaces}`}
      />
      <SeasonProgress completed={lastFinishedRound} total={championship.rules.totalRaces} />
      <SegmentedControl<View>
        label="Tipo de classificação"
        value={view}
        onChange={setView}
        options={[
          { value: 'pilots', label: 'Pilotos' },
          { value: 'teams', label: 'Equipes' },
        ]}
      />

      <Card flush>
        {view === 'pilots' ? (
          <PilotsList model={model} highlightPilotId={profile.persona.pilotId} />
        ) : (
          <TeamsList model={model} />
        )}
      </Card>

      {hasTies && (
        <p className={styles.legend}>
          <span>
            <strong aria-hidden="true">=</strong> Empate: o regulamento ainda não define o critério de
            desempate, então os empatados dividem a mesma posição.
          </span>
        </p>
      )}
      <ScoringLegend rules={championship.rules} />
    </>
  );
}
