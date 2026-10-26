import { useNavigate, useParams } from 'react-router-dom';
import { useModel } from '@/app/providers/ChampionshipProvider';
import { useProfile } from '@/app/providers/ProfileProvider';
import { profilePath } from '@/app/profiles';
import { LinkButton } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState } from '@/components/ui/StateViews';
import { RaceReplay } from './RaceReplay';

/** Tela do Race Replay: cabeçalho, escolha da etapa e a reprodução. */
export function RaceReplayPage() {
  const { raceId } = useParams();
  const model = useModel();
  const profile = useProfile();
  const navigate = useNavigate();
  const calendar = profilePath(profile, 'corridas');

  const race = raceId ? model.racesById.get(raceId) : undefined;
  if (!race) {
    return (
      <EmptyState
        heading="h1"
        title="Etapa não encontrada"
        message="Não existe uma etapa com este endereço. Volte ao calendário para escolher uma."
        action={
          <LinkButton to={calendar} variant="primary">
            Ver calendário
          </LinkButton>
        }
      />
    );
  }

  const detail = profilePath(profile, `corridas/${race.id}`);
  const track = model.tracksById.get(race.trackId);
  const finished = model.championship.races
    .filter((r) => r.status === 'finished')
    .sort((a, b) => a.round - b.round);

  if (race.status !== 'finished') {
    return (
      <>
        <PageHeader back={{ to: detail, label: `Etapa ${race.round}` }} eyebrow="Replay" title={race.name} />
        <EmptyState
          title="Replay indisponível"
          message="O replay fica disponível depois que a etapa for finalizada."
          action={
            <LinkButton to={detail} variant="primary">
              Ver informações da etapa
            </LinkButton>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        back={{ to: detail, label: `Resultado da etapa ${race.round}` }}
        eyebrow="Replay da corrida"
        title={race.name}
        subtitle={track ? `${track.name} · ${track.city}` : undefined}
      />
      {finished.length > 1 && (
        <SegmentedControl
          label="Etapa do replay"
          value={race.id}
          onChange={(id) => navigate(profilePath(profile, `corridas/${id}/replay`), { replace: true })}
          options={finished.map((r) => ({ value: r.id, label: `Etapa ${r.round}` }))}
        />
      )}
      <RaceReplay
        key={race.id}
        model={model}
        raceId={race.id}
        focusPilotId={profile.persona.pilotId}
        resultPath={detail}
      />
    </>
  );
}
