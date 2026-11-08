import { useMemo } from 'react';
import { CalendarDays, FlaskConical, MapPin, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useBaseChampionship, useModel } from '@/app/providers/ChampionshipProvider';
import { useProfile } from '@/app/providers/ProfileProvider';
import { useScenario } from '@/app/providers/ScenarioProvider';
import { profilePath } from '@/app/profiles';
import { Badge } from '@/components/ui/Badge';
import { Button, LinkButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/StateViews';
import { demoScenarioFor } from '@/data/demo/scenarios';
import { buildReplay, finishedRaces, nextRace } from '@/domain';
import { daysBetween, formatCountdown, formatLongDate } from '@/lib/format';
import { LiveSimulation } from './LiveSimulation';
import styles from './SpectatorLivePage.module.css';

/**
 * "Ao Vivo": se há etapa em andamento, mostra a simulação dela; senão, explica que
 * nada está acontecendo agora e para onde ir (próxima etapa, último resultado).
 */
export function SpectatorLivePage() {
  const model = useModel();
  const base = useBaseChampionship();
  const profile = useProfile();
  const navigate = useNavigate();
  const { setChoice, selectable } = useScenario();
  const { championship } = model;

  const liveRace = championship.races.find((race) => race.status === 'live');
  const upcoming = nextRace(championship);
  const lastFinished = finishedRaces(championship).at(-1);

  // A fonte dos dados ao vivo é a base completa: numa transmissão real viria da cronometragem.
  const replay = useMemo(() => (liveRace ? buildReplay(base, liveRace.id) : null), [base, liveRace]);

  const showResult = () => {
    if (!liveRace) return;
    const finishedMoment = demoScenarioFor(liveRace.round, 'finished');
    if (finishedMoment && selectable) setChoice(finishedMoment);
    navigate(profilePath(profile, `etapa/${liveRace.id}`));
  };

  if (liveRace) {
    return (
      <>
        <PageHeader
          eyebrow="Etapa em andamento"
          title="Ao Vivo"
          subtitle={`Acompanhe a etapa ${liveRace.round} como se estivesse na arquibancada: veja os carros, as ultrapassagens e quem lidera.`}
        />
        {replay ? (
          <LiveSimulation model={model} race={liveRace} replay={replay} onShowResult={showResult} />
        ) : (
          <EmptyState
            icon={Radio}
            title="Sem dados desta etapa agora"
            message="Não recebemos as posições desta etapa. Tente novamente em instantes."
          />
        )}
      </>
    );
  }

  // Nenhuma etapa em andamento ----------------------------------------------
  const upcomingTrack = upcoming && model.tracksById.get(upcoming.trackId);
  const simulationMoment = upcoming ? demoScenarioFor(upcoming.round, 'live') : null;

  return (
    <>
      <PageHeader
        eyebrow="Acompanhamento"
        title="Ao Vivo"
        subtitle="Aqui você acompanha as posições durante uma etapa. Neste momento, nenhuma etapa está em andamento."
      />

      <Card aria-labelledby="no-live-title">
        <EmptyState
          icon={Radio}
          title="Nenhuma etapa em andamento"
          message={
            upcoming
              ? 'Quando uma etapa começar, os carros, as ultrapassagens e a ordem de chegada aparecem aqui.'
              : 'O campeonato terminou: não há mais etapas a acompanhar.'
          }
        />
        {upcoming && (
          <div className={styles.next}>
            <div className={styles.nextHead}>
              <h2 className={styles.nextTitle} id="no-live-title">
                Próxima etapa · {upcoming.name}
              </h2>
              <Badge tone="data">{formatCountdown(daysBetween(championship.referenceDate, upcoming.date))}</Badge>
            </div>
            <p className={styles.nextInfo}>
              <MapPin size={16} aria-hidden="true" />
              {upcomingTrack ? `${upcomingTrack.name} · ${upcomingTrack.city}` : 'Local a confirmar'}
            </p>
            <p className={styles.nextInfo}>
              <CalendarDays size={16} aria-hidden="true" />
              {formatLongDate(upcoming.date)} · {upcoming.startTime}
            </p>
          </div>
        )}
        {lastFinished && (
          <div className={styles.actions}>
            <LinkButton to={profilePath(profile, `etapa/${lastFinished.id}`)} variant="primary">
              Ver resultado da etapa {lastFinished.round}
            </LinkButton>
          </div>
        )}
      </Card>

      {selectable && simulationMoment && upcoming && (
        <Card tone="data" aria-labelledby="demo-live-title">
          <div className={styles.demoHead}>
            <FlaskConical size={18} aria-hidden="true" />
            <h2 className={styles.nextTitle} id="demo-live-title">
              Para a demonstração
            </h2>
          </div>
          <p className={styles.nextInfo}>
            Quer ver como é acompanhar uma etapa em andamento? Esta simulação usa dados fictícios e leva você até o
            resultado e ao pódio.
          </p>
          <div className={styles.actions}>
            <Button onClick={() => setChoice(simulationMoment)}>Simular a etapa {upcoming.round} em andamento</Button>
          </div>
        </Card>
      )}
    </>
  );
}
