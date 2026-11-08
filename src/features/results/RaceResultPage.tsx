import { useMemo } from 'react';
import { Radio } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useModel } from '@/app/providers/ChampionshipProvider';
import { useProfile } from '@/app/providers/ProfileProvider';
import { profilePath } from '@/app/profiles';
import { LinkButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState } from '@/components/ui/StateViews';
import { getRaceImpact } from '@/domain';
import { formatLongDate } from '@/lib/format';
import { RaceResultList } from '@/features/races/RaceResultList';
import { Podium } from './Podium';
import { RaceHighlights } from './RaceHighlights';
import { StandingsChanges } from './StandingsChanges';
import styles from './RaceResultPage.module.css';

/**
 * Resultado de uma etapa pensado para quem acompanha de fora: pódio, destaques,
 * classificação da etapa com pontos e como o campeonato mudou. Funciona para
 * qualquer etapa finalizada, com a mesma fonte de dados das demais telas.
 */
export function RaceResultPage() {
  const { raceId } = useParams();
  const model = useModel();
  const profile = useProfile();
  const navigate = useNavigate();
  const home = profilePath(profile);
  const standingsPath = profilePath(profile, 'classificacao');

  const race = raceId ? model.racesById.get(raceId) : undefined;
  const impact = useMemo(
    () => (race ? getRaceImpact(model.championship, race.id) : null),
    [model, race],
  );
  const finished = model.championship.races
    .filter((r) => r.status === 'finished')
    .sort((a, b) => a.round - b.round);

  if (!race) {
    return (
      <EmptyState
        heading="h1"
        title="Etapa não encontrada"
        message="Não existe uma etapa com este endereço. Volte ao início para escolher uma."
        action={
          <LinkButton to={home} variant="primary">
            Ir para o início
          </LinkButton>
        }
      />
    );
  }

  const track = model.tracksById.get(race.trackId);

  if (!impact) {
    const live = race.status === 'live';
    return (
      <>
        <PageHeader back={{ to: home, label: 'Início' }} eyebrow={`Etapa ${race.round}`} title={race.name} />
        <Card>
          <EmptyState
            icon={Radio}
            title={live ? 'Etapa em andamento' : 'Resultado em breve'}
            message={
              live
                ? 'O resultado e o pódio aparecem aqui quando a etapa terminar. Enquanto isso, acompanhe as posições.'
                : `A etapa ${race.round} ainda não aconteceu (${formatLongDate(race.date)}). O pódio e a classificação aparecem aqui depois dela.`
            }
            action={
              live ? (
                <LinkButton to={profilePath(profile, 'ao-vivo')} variant="primary">
                  Acompanhar a etapa
                </LinkButton>
              ) : (
                <LinkButton to={home} variant="primary">
                  Voltar ao início
                </LinkButton>
              )
            }
          />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        back={{ to: home, label: 'Início' }}
        eyebrow={`Resultado · Etapa ${race.round} de ${model.championship.rules.totalRaces}`}
        title={race.name}
        subtitle={track ? `${track.name} · ${track.city} · ${formatLongDate(race.date)}` : formatLongDate(race.date)}
      />

      {finished.length > 1 && (
        <SegmentedControl
          label="Etapa"
          value={race.id}
          onChange={(id) => navigate(profilePath(profile, `etapa/${id}`), { replace: true })}
          options={finished.map((r) => ({ value: r.id, label: `Etapa ${r.round}` }))}
        />
      )}

      <div className={styles.meta}>
        <div>
          <ProvenanceBadge kind="final" />
        </div>
        <p className={styles.note}>Resultado de demonstração: pilotos, equipes e tempos são fictícios.</p>
      </div>

      {/* key: ao trocar de etapa, a revelação do pódio recomeça */}
      <Podium
        key={`podium-${race.id}`}
        model={model}
        entries={impact.podium}
        round={race.round}
        highlightPilotId={profile.persona.pilotId}
      />

      <RaceHighlights model={model} highlights={impact.highlights} />

      <Card flush aria-labelledby="race-classification-title" role="region">
        <h2 className={styles.sectionTitle} id="race-classification-title">
          Classificação da etapa e pontos
        </h2>
        <RaceResultList model={model} raceId={race.id} highlightPilotId={profile.persona.pilotId} />
        <p className={styles.hint}>Toque em um piloto para ver as voltas. Só as 5 primeiras posições pontuam.</p>
      </Card>

      <StandingsChanges
        key={`changes-${race.id}`}
        model={model}
        impact={impact}
        highlightPilotId={profile.persona.pilotId}
        standingsPath={standingsPath}
      />
    </>
  );
}
