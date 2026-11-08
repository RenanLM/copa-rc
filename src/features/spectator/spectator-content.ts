export interface SpectatorPost {
  id: string;
  teamId: string;
  raceRound: number;
  title: string;
  message: string;
  artworkDescription: string;
}

/** Conteúdo editorial fictício para demonstrar o feed antes de existir uma API. */
export const spectatorPosts: readonly SpectatorPost[] = [
  {
    id: 'torque-lab-setup',
    teamId: 'torque-lab',
    raceRound: 3,
    title: 'Ajustes antes da largada',
    message: 'A equipe revisou o carro e alinhou a estratégia para a etapa. Como será o ritmo na pista?',
    artworkDescription: 'Carro azul da Torque Lab contornando uma pista de automodelismo.',
  },
  {
    id: 'apex-podium',
    teamId: 'apex-racing',
    raceRound: 3,
    title: 'Pódio da etapa',
    message: 'Diego Martins venceu a prova final. A equipe comemora mais um resultado importante no campeonato.',
    artworkDescription: 'Carro laranja da Apex Racing cruzando a linha de chegada.',
  },
  {
    id: 'vortex-team',
    teamId: 'vortex-motorsport',
    raceRound: 3,
    title: 'Corrida em equipe',
    message: 'Rafael e Helena fecharam a etapa entre os primeiros colocados e somaram pontos para a Vortex.',
    artworkDescription: 'Dois carros roxos da Vortex Motorsport lado a lado na pista.',
  },
  {
    id: 'nitro-corner',
    teamId: 'nitro-garage',
    raceRound: 2,
    title: 'Curvas que fazem diferença',
    message: 'Thiago e Paula trabalharam no acerto para ganhar velocidade nas curvas mais lentas.',
    artworkDescription: 'Carro verde da Nitro Garage fazendo uma curva fechada.',
  },
  {
    id: 'aurora-grid',
    teamId: 'aurora-speed',
    raceRound: 2,
    title: 'Prontos para a próxima',
    message: 'A Aurora Speed já prepara os carros para o próximo encontro na pista.',
    artworkDescription: 'Carro rosa da Aurora Speed alinhado na reta.',
  },
  {
    id: 'delta-fans',
    teamId: 'delta-pit-crew',
    raceRound: 1,
    title: 'Um dia de corrida',
    message: 'A equipe agradece a torcida e convida todo mundo a acompanhar a próxima etapa.',
    artworkDescription: 'Carro amarelo da Delta Pit Crew passando diante da arquibancada.',
  },
];
