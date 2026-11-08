import { useMemo, useState } from 'react';
import { Newspaper, ShieldCheck } from 'lucide-react';
import { useModel } from '@/app/providers/ChampionshipProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/StateViews';
import {
  feedQuota,
  filterFeed,
  sortFeed,
  type ChampionshipModel,
  type FeedPost,
} from '@/domain';
import { formatPostDate } from '@/lib/format';
import { SpectatorPostArtwork } from './SpectatorPostArtwork';
import { POST_KINDS } from './spectator-content';
import styles from './SpectatorFeedPage.module.css';

/** Quantas publicações aparecem por vez; "Mostrar mais" acrescenta outro lote. */
const PAGE_SIZE = 8;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Feed das equipes. Responde à tarefa "encontrar as publicações de uma equipe
 * durante a terceira etapa": filtros de equipe e de etapa combináveis, resultado
 * contado, estado vazio explicado e a regra de 4 publicações por equipe e etapa
 * à vista. Lê as publicações do mesmo modelo das demais telas, então só mostra o
 * que já existe no momento escolhido para o campeonato.
 */
export function SpectatorFeedPage() {
  const model = useModel();
  const { championship } = model;
  const { feed, rules } = championship;

  const [teamId, setTeamId] = useState<string | null>(null);
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Só etapas que já começaram têm feed; a lista acompanha o momento do campeonato.
  const openRaces = useMemo(
    () =>
      championship.races
        .filter((race) => race.status !== 'scheduled')
        .sort((a, b) => a.round - b.round),
    [championship.races],
  );
  // Trocar de momento pode tirar do ar a etapa escolhida: volta a "todas".
  const raceId = openRaces.some((race) => race.id === selectedRaceId) ? selectedRaceId : null;

  const team = teamId ? model.teamsById.get(teamId) : undefined;
  const race = raceId ? model.racesById.get(raceId) : undefined;
  const filtered = useMemo(
    () => sortFeed(filterFeed(feed, { teamId, raceId })),
    [feed, teamId, raceId],
  );
  const shown = filtered.slice(0, visible);
  const remaining = filtered.length - shown.length;
  const filtering = Boolean(team || race);

  const chooseTeam = (id: string | null) => {
    setTeamId(id);
    setVisible(PAGE_SIZE);
  };
  const chooseRace = (id: string | null) => {
    setSelectedRaceId(id);
    setVisible(PAGE_SIZE);
  };
  const clearFilters = () => {
    chooseTeam(null);
    chooseRace(null);
  };

  const quotaRaces = race ? [race] : openRaces;

  return (
    <>
      <PageHeader
        eyebrow="Bastidores do campeonato"
        title="Feed das equipes"
        subtitle="Encontre as publicações de uma equipe e de uma etapa."
      />

      <Card className={styles.notice}>
        <strong>Conteúdo de demonstração</strong>
        <span>
          As publicações e ilustrações abaixo são fictícias; não foram enviadas pelas equipes. Cada
          equipe pode publicar até {rules.maxPostsPerTeamPerRace} vezes por etapa.
        </span>
      </Card>

      <section className={styles.filters} aria-label="Filtros do feed">
        <div className={styles.filterGroup}>
          <p className={styles.filterLabel} id="feed-filter-team">
            Equipe
          </p>
          <div
            className={`${styles.chips} ${styles.chipsScroll}`}
            role="group"
            aria-labelledby="feed-filter-team"
          >
            <button
              type="button"
              className={!team ? styles.chipActive : styles.chip}
              aria-pressed={!team}
              onClick={() => chooseTeam(null)}
            >
              Todas as equipes
            </button>
            {championship.teams.map((t) => (
              <button
                type="button"
                key={t.id}
                className={teamId === t.id ? styles.chipActive : styles.chip}
                aria-pressed={teamId === t.id}
                onClick={() => chooseTeam(t.id)}
              >
                <span className={styles.swatch} style={{ backgroundColor: t.color }} aria-hidden="true" />
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <p className={styles.filterLabel} id="feed-filter-race">
            Etapa
          </p>
          <div
            className={`${styles.chips} ${styles.chipsWrap}`}
            role="group"
            aria-labelledby="feed-filter-race"
          >
            <button
              type="button"
              className={!race ? styles.chipActive : styles.chip}
              aria-pressed={!race}
              onClick={() => chooseRace(null)}
            >
              Todas as etapas
            </button>
            {openRaces.map((r) => (
              <button
                type="button"
                key={r.id}
                className={raceId === r.id ? styles.chipActive : styles.chip}
                aria-pressed={raceId === r.id}
                onClick={() => chooseRace(r.id)}
              >
                Etapa {r.round}
              </button>
            ))}
          </div>
        </div>
      </section>

      {team && (
        <section className={styles.quota} aria-labelledby="feed-quota-title">
          <h2 className={styles.quotaTitle} id="feed-quota-title">
            <ShieldCheck size={16} aria-hidden="true" />
            Limite de publicações · {team.name}
          </h2>
          <ul className={styles.quotaList}>
            {quotaRaces.map((r) => {
              const quota = feedQuota(feed, team.id, r.id, rules);
              return (
                <li className={styles.quotaItem} key={r.id} data-full={quota.full || undefined}>
                  <span>Etapa {r.round}</span>
                  <span className={styles.pips} aria-hidden="true">
                    {Array.from({ length: quota.max }, (_, i) => (
                      <span className={i < quota.count ? styles.pipOn : styles.pip} key={i} />
                    ))}
                  </span>
                  <strong>
                    {quota.count} de {quota.max}
                  </strong>
                  {quota.full && <span className={styles.quotaFull}>limite atingido</span>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="feed-list-title" className={styles.timeline}>
        <div className={styles.summaryRow}>
          <h2 className={styles.summaryTitle} id="feed-list-title">
            Publicações
          </h2>
          <p className={styles.summary} role="status">
            {summaryText({ total: filtered.length, shown: shown.length, team: team?.name, round: race?.round })}
          </p>
          {filtering && (
            <Button variant="ghost" size="small" onClick={clearFilters}>
              Limpar filtros
            </Button>
          )}
        </div>

        {filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={Newspaper}
              title={filtering ? 'Nenhuma publicação com esses filtros' : 'Ainda não há publicações'}
              message={emptyMessage({ filtering, team: team?.name, round: race?.round })}
              action={
                filtering ? (
                  <div className={styles.emptyActions}>
                    {team && race && (
                      <Button variant="primary" onClick={() => chooseRace(null)}>
                        Ver todas as etapas de {team.name}
                      </Button>
                    )}
                    <Button variant={team && race ? 'secondary' : 'primary'} onClick={clearFilters}>
                      Limpar filtros
                    </Button>
                  </div>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <>
            <ul className={styles.posts}>
              {shown.map((post) => (
                <li key={post.id}>
                  <PostCard post={post} model={model} />
                </li>
              ))}
            </ul>
            {remaining > 0 && (
              <Button className={styles.more} onClick={() => setVisible((n) => n + PAGE_SIZE)}>
                Mostrar mais publicações ({remaining})
              </Button>
            )}
          </>
        )}
      </section>
    </>
  );
}

/** Uma publicação: equipe, etapa, tipo, data e hora (quando existem), texto e pilotos citados. */
function PostCard({ post, model }: { post: FeedPost; model: ChampionshipModel }) {
  const team = model.teamsById.get(post.teamId);
  const race = model.racesById.get(post.raceId);
  if (!team || !race) return null;
  const kind = POST_KINDS[post.kind];
  const KindIcon = kind.icon;
  const when = formatPostDate(post.publishedAt);
  const pilotNames = (post.pilotIds ?? [])
    .map((id) => model.pilotsById.get(id)?.name)
    .filter((name): name is string => Boolean(name));
  const titleId = `post-title-${post.id}`;
  return (
    <Card as="article" flush className={styles.post} aria-labelledby={titleId}>
      <SpectatorPostArtwork team={team} description={post.imageAlt} kind={post.kind} />
      <div className={styles.postBody}>
        <div className={styles.postMeta}>
          <span className={styles.swatch} style={{ backgroundColor: team.color }} aria-hidden="true" />
          <strong>{team.name}</strong>
          <span aria-hidden="true">·</span>
          <span>
            Etapa {race.round} · {race.name}
          </span>
        </div>
        <div className={styles.postTags}>
          <Badge tone="soft">
            <KindIcon size={12} aria-hidden="true" />
            {kind.label}
          </Badge>
          {post.isDemo && <Badge tone="data">Demonstração</Badge>}
          {when && post.publishedAt && (
            <time className={styles.when} dateTime={post.publishedAt}>
              {when}
            </time>
          )}
        </div>
        <h3 id={titleId}>{post.title}</h3>
        <p>{post.text}</p>
        {pilotNames.length > 0 && (
          <p className={styles.pilots}>
            <span className={styles.pilotsLabel}>Pilotos citados:</span> {pilotNames.join(', ')}
          </p>
        )}
      </div>
    </Card>
  );
}

function summaryText(args: { total: number; shown: number; team?: string; round?: number }): string {
  const { total, shown, team, round } = args;
  const scope = [team, round ? `etapa ${round}` : null].filter(Boolean).join(' · ');
  const count =
    total > shown ? `Mostrando ${shown} de ${total} publicações` : plural(total, 'publicação', 'publicações');
  return scope ? `${count} · ${scope}` : count;
}

function emptyMessage(args: { filtering: boolean; team?: string; round?: number }): string {
  const { filtering, team, round } = args;
  if (!filtering) return 'Quando as equipes publicarem, as novidades aparecem aqui.';
  if (team && round) return `${team} não tem publicações na etapa ${round}. Veja as outras etapas ou limpe os filtros.`;
  if (team) return `${team} ainda não publicou no feed.`;
  return `Ninguém publicou na etapa ${round} até agora.`;
}
