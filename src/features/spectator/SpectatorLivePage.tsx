import { useModel } from '@/app/providers/ChampionshipProvider';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { LiveSimulation } from './LiveSimulation';

export function SpectatorLivePage() {
  const model = useModel();
  const { championship } = model;
  const race =
    championship.races.find((entry) => entry.round === 4) ??
    championship.races
      .filter((entry) => entry.status === 'scheduled')
      .sort((a, b) => a.round - b.round)[0];

  return (
    <>
      <PageHeader
        eyebrow="Simulação acadêmica"
        title="Ao Vivo"
        subtitle="Acompanhe a etapa 4 como se estivesse na arquibancada: veja os carros, as ultrapassagens e quem lidera."
      />
      {race ? <LiveSimulation model={model} race={race} /> : (
        <Card>
          <p>O calendário desta temporada ainda não tem etapas cadastradas.</p>
        </Card>
      )}
    </>
  );
}
