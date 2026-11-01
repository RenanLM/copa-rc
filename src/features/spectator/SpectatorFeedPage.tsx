import { useMemo, useState } from 'react';
import { useModel } from '@/app/providers/ChampionshipProvider';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { SpectatorPostArtwork } from './SpectatorPostArtwork';
import { spectatorPosts } from './spectator-content';
import styles from './SpectatorFeedPage.module.css';

export function SpectatorFeedPage() {
  const model = useModel();
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const posts = useMemo(
    () => spectatorPosts.filter((post) => selectedTeam === 'all' || post.teamId === selectedTeam),
    [selectedTeam],
  );
  const featuredPosts = posts.slice(0, 3);

  return (
    <>
      <PageHeader
        eyebrow="Bastidores do campeonato"
        title="Feed das equipes"
        subtitle="Veja novidades e momentos das equipes entre uma etapa e outra."
      />

      <Card className={styles.notice}>
        <strong>Conteúdo de demonstração</strong>
        <span>As publicações e ilustrações abaixo são exemplos; não foram enviadas pelas equipes.</span>
      </Card>

      <section className={styles.featured} aria-labelledby="featured-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Deslize para explorar</p>
            <h2 id="featured-title">Em destaque</h2>
          </div>
          <span className={styles.peekHint} aria-hidden="true">›</span>
        </div>
        <div className={styles.carousel} aria-label="Publicações em destaque">
          {featuredPosts.length > 0 ? featuredPosts.map((post) => {
            const team = model.teamsById.get(post.teamId);
            if (!team) return null;
            return (
              <article className={styles.featureCard} key={post.id}>
                <SpectatorPostArtwork team={team} description={post.artworkDescription} compact />
                <p className={styles.featureTeam}>{team.name}</p>
                <h3>{post.title}</h3>
              </article>
            );
          }) : <p className={styles.empty}>Nenhuma publicação para esta equipe.</p>}
        </div>
      </section>

      <section className={styles.timeline} aria-labelledby="timeline-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Novidades</p>
            <h2 id="timeline-title">Publicações</h2>
          </div>
          <span className={styles.count}>{posts.length}</span>
        </div>

        <div className={styles.filters} role="group" aria-label="Filtrar publicações por equipe">
          <button
            type="button"
            className={selectedTeam === 'all' ? styles.filterActive : styles.filter}
            aria-pressed={selectedTeam === 'all'}
            onClick={() => setSelectedTeam('all')}
          >
            Todas
          </button>
          {model.championship.teams.map((team) => (
            <button
              type="button"
              key={team.id}
              className={selectedTeam === team.id ? styles.filterActive : styles.filter}
              aria-pressed={selectedTeam === team.id}
              onClick={() => setSelectedTeam(team.id)}
            >
              {team.name}
            </button>
          ))}
        </div>

        <div className={styles.posts}>
          {posts.map((post) => {
            const team = model.teamsById.get(post.teamId);
            if (!team) return null;
            return (
              <Card as="article" flush className={styles.post} key={post.id}>
                <SpectatorPostArtwork team={team} description={post.artworkDescription} />
                <div className={styles.postBody}>
                  <div className={styles.postMeta}>
                    <span className={styles.teamSwatch} style={{ backgroundColor: team.color }} aria-hidden="true" />
                    <strong>{team.name}</strong>
                    <span aria-hidden="true">·</span>
                    <span>Etapa {post.raceRound}</span>
                  </div>
                  <h3>{post.title}</h3>
                  <p>{post.message}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </>
  );
}
