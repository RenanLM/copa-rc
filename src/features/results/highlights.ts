import { Flag, Gauge, Trophy, TrendingUp, Users, type LucideIcon } from 'lucide-react';
import type { ChampionshipModel, RaceHighlight } from '@/domain';
import { formatLapTime, formatOrdinal } from '@/lib/format';

export interface HighlightText {
  key: string;
  Icon: LucideIcon;
  title: string;
  text: string;
}

/**
 * Transforma um destaque calculado pelo domínio em frase para quem não conhece
 * corridas RC: sem siglas, dizendo o que aconteceu e por que importa.
 */
export function describeHighlight(model: ChampionshipModel, highlight: RaceHighlight): HighlightText | null {
  const pilot = (id: string) => model.pilotsById.get(id)?.name ?? 'Piloto';
  const team = (id: string) => model.teamsById.get(id)?.name ?? 'Equipe';

  switch (highlight.kind) {
    case 'winner':
      return {
        key: 'winner',
        Icon: Trophy,
        title: 'Vencedor da etapa',
        text: `${pilot(highlight.pilotId)}, da ${team(highlight.teamId)}, cruzou a linha de chegada em primeiro.`,
      };
    case 'team-podium': {
      const [first, second] = highlight.pilotIds;
      const names = highlight.pilotIds.map(pilot);
      return {
        key: `team-podium-${highlight.teamId}`,
        Icon: Users,
        title: highlight.double ? `Dobradinha da ${team(highlight.teamId)}` : `Dois pilotos da ${team(highlight.teamId)} no pódio`,
        text: highlight.double
          ? `${pilot(first!)} e ${pilot(second!)} terminaram em 1º e 2º.`
          : `${names.join(' e ')} terminaram em ${highlight.positions.map(formatOrdinal).join(' e ')}.`,
      };
    }
    case 'pilot-lead':
      return {
        key: 'pilot-lead',
        Icon: TrendingUp,
        title: 'Nova liderança do campeonato',
        text: `${pilot(highlight.pilotId)} assume a ponta da classificação de pilotos; antes, ${pilot(highlight.previousLeaderId)} liderava.`,
      };
    case 'team-lead':
      return {
        key: 'team-lead',
        Icon: Flag,
        title: 'Nova líder entre as equipes',
        text: `A ${team(highlight.teamId)} ultrapassa a ${team(highlight.previousLeaderId)} na soma de pontos dos dois pilotos.`,
      };
    case 'fastest-lap': {
      const where = highlight.session.type === 'final' ? 'na prova final' : `na bateria ${highlight.session.index}`;
      return {
        key: 'fastest-lap',
        Icon: Gauge,
        title: 'Volta mais rápida',
        text: `${pilot(highlight.pilotId)}, em ${formatLapTime(highlight.timeMs)}, ${where}.`,
      };
    }
    case 'biggest-climb':
      return {
        key: 'biggest-climb',
        Icon: TrendingUp,
        title: 'Maior avanço na classificação',
        text: `${pilot(highlight.pilotId)} subiu ${highlight.places} posições no campeonato.`,
      };
  }
}
