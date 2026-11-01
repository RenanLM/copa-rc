import { useMemo, useState } from 'react';
import { useModel } from '@/app/providers/ChampionshipProvider';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { PilotNumber } from '@/components/ui/PilotNumber';
import styles from './SpectatorDirectoryPage.module.css';

type DirectoryView = 'pilots' | 'teams';

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

export function SpectatorDirectoryPage() {
  const model = useModel();
  const [view, setView] = useState<DirectoryView>('pilots');
  const [query, setQuery] = useState('');
  const term = normalize(query.trim());

  const pilots = useMemo(
    () => model.championship.pilots.filter((pilot) => {
      const team = model.teamsById.get(pilot.teamId);
      return normalize(`${pilot.name} ${team?.name ?? ''} ${pilot.city} ${pilot.number}`).includes(term);
    }),
    [model, term],
  );
  const teams = useMemo(
    () => model.championship.teams.filter((team) => {
      const pilotNames = team.pilotIds
        .map((id) => model.pilotsById.get(id)?.name ?? '')
        .join(' ');
      return normalize(`${team.name} ${team.city} ${pilotNames}`).includes(term);
    }),
    [model, term],
  );

  return (
    <>
      <PageHeader
        eyebrow="Guia de participantes"
        title="Pilotos e equipes"
        subtitle="Reconheça quem está na pista pelo nome, número do carro e equipe."
      />

      <Card className={styles.notice}>
        Participantes e equipes são fictícios e fazem parte dos dados de demonstração.
      </Card>

      <div className={styles.switch} role="group" aria-label="Tipo de participantes">
        <button
          type="button"
          className={view === 'pilots' ? styles.selected : styles.option}
          aria-pressed={view === 'pilots'}
          onClick={() => setView('pilots')}
        >
          Pilotos <span>{model.championship.pilots.length}</span>
        </button>
        <button
          type="button"
          className={view === 'teams' ? styles.selected : styles.option}
          aria-pressed={view === 'teams'}
          onClick={() => setView('teams')}
        >
          Equipes <span>{model.championship.teams.length}</span>
        </button>
      </div>

      <div className={styles.search}>
        <label htmlFor="participant-search">
          {view === 'pilots' ? 'Encontrar piloto ou equipe' : 'Encontrar equipe ou piloto'}
        </label>
        <input
          id="participant-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={view === 'pilots' ? 'Nome, equipe ou número' : 'Nome da equipe ou cidade'}
          autoComplete="off"
        />
      </div>

      {view === 'pilots' ? (
        <section className={styles.list} aria-label={`${pilots.length} pilotos encontrados`}>
          {pilots.length === 0 ? (
            <Card className={styles.empty}>Não encontramos esse piloto. Tente outro nome ou número.</Card>
          ) : pilots.map((pilot) => {
            const team = model.teamsById.get(pilot.teamId);
            if (!team) return null;
            return (
              <Card as="article" className={styles.personCard} key={pilot.id}>
                <div className={styles.personHeading}>
                  <PilotNumber number={pilot.number} color={team.color} />
                  <div className={styles.personIdentity}>
                    <h2>{pilot.name}</h2>
                    <p>{team.name} · {team.city}</p>
                  </div>
                </div>
                <p className={styles.bio}>{pilot.bio}</p>
              </Card>
            );
          })}
        </section>
      ) : (
        <section className={styles.list} aria-label={`${teams.length} equipes encontradas`}>
          {teams.length === 0 ? (
            <Card className={styles.empty}>Não encontramos essa equipe. Tente outro nome ou cidade.</Card>
          ) : teams.map((team) => (
            <Card
              as="article"
              className={styles.teamCard}
              key={team.id}
              style={{ '--team': team.color } as React.CSSProperties}
            >
              <div className={styles.teamHeading}>
                <span className={styles.teamSwatch} aria-hidden="true" />
                <div>
                  <h2>{team.name}</h2>
                  <p>{team.city}</p>
                </div>
              </div>
              <ul className={styles.roster} aria-label={`Pilotos da equipe ${team.name}`}>
                {team.pilotIds.map((id) => {
                  const pilot = model.pilotsById.get(id);
                  if (!pilot) return null;
                  return (
                    <li key={pilot.id}>
                      <PilotNumber number={pilot.number} color={team.color} />
                      <span>{pilot.name}</span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ))}
        </section>
      )}
    </>
  );
}
