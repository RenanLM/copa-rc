import {
  pointsForPosition,
  type ChampionshipRules,
  type FeedPost,
  type Pilot,
  type PilotId,
  type PostKind,
  type Race,
  type RaceResults,
  type Team,
  type TeamId,
} from '@/domain';

/**
 * Publicações de DEMONSTRAÇÃO do feed. Tudo é fictício e marcado como tal.
 *
 * Duas fontes, para que o feed nunca contradiga os resultados:
 *  - editoriais (escritas à mão): pilotos, acontecimentos e bastidores, sem citar
 *    tempos ou colocações que não estejam nos dados;
 *  - de resultado (geradas): montadas a partir dos resultados oficiais e das
 *    regras de pontos.
 *
 * Regra do regulamento: no máximo 4 publicações por equipe em cada prova. As
 * equipes que mais publicam chegam exatamente a 4 (Torque Lab na etapa 3, Torque
 * Lab e Vortex na etapa 4), o que exercita a regra e o aviso de limite na tela.
 */

const P = {
  lucas: 'lucas-ferreira',
  bianca: 'bianca-moreira',
  diego: 'diego-martins',
  carla: 'carla-ribeiro',
  rafael: 'rafael-nunes',
  helena: 'helena-duarte',
  thiago: 'thiago-barros',
  paula: 'paula-siqueira',
  mateus: 'mateus-cavalcante',
  larissa: 'larissa-pinheiro',
  andre: 'andre-lima',
  juliana: 'juliana-freitas',
} as const;

const T = {
  torque: 'torque-lab',
  apex: 'apex-racing',
  vortex: 'vortex-motorsport',
  nitro: 'nitro-garage',
  aurora: 'aurora-speed',
  delta: 'delta-pit-crew',
} as const;

interface Editorial {
  round: number;
  teamId: TeamId;
  kind: PostKind;
  /** AAAA-MM-DDTHH:mm */
  at: string;
  title: string;
  text: string;
  pilots: readonly PilotId[];
  alt: string;
}

const ed = (
  round: number,
  teamId: TeamId,
  kind: PostKind,
  at: string,
  title: string,
  text: string,
  pilots: readonly PilotId[],
  alt: string,
): Editorial => ({ round, teamId, kind, at, title, text, pilots, alt });

const editorial: readonly Editorial[] = [
  // ───────── Etapa 1 · GP Lagoa Seca (02 ago, 09:00) ─────────
  ed(1, T.torque, 'behind-the-scenes', '2026-08-01T18:20', 'Semana de ajustes',
    'A equipe passou a semana ajustando a suspensão e conferindo as baterias para a abertura da temporada em Lagoa Seca.',
    [P.lucas, P.bianca], 'Bancada da Torque Lab com peças de suspensão ao lado de um carro azul.'),
  ed(1, T.apex, 'pilots', '2026-08-01T20:05', 'Diego chega confiante',
    'Diego Martins e Carla Ribeiro treinaram juntos o fim de semana inteiro. A Apex quer largar bem na primeira prova do ano.',
    [P.diego, P.carla], 'Carro laranja da Apex Racing parado na grade de largada.'),
  ed(1, T.vortex, 'pilots', '2026-08-01T19:10', 'Estreia de Helena',
    'Helena Duarte disputa a primeira etapa da carreira ao lado do campeão da temporada passada, Rafael Nunes.',
    [P.helena, P.rafael], 'Dois carros roxos da Vortex Motorsport alinhados no box.'),
  ed(1, T.delta, 'behind-the-scenes', '2026-08-01T17:40', 'Mutirão no box',
    'Sábado de mutirão: André Lima ensina o grupo novo a montar o carro do zero.',
    [P.andre, P.juliana], 'Carro amarelo da Delta Pit Crew desmontado sobre a bancada.'),
  ed(1, T.delta, 'event', '2026-08-02T08:50', 'Carros na grade',
    'Os 12 carros estão alinhados em Lagoa Seca. A largada da etapa está marcada para as 9h.',
    [], 'Fila de carros coloridos na grade de largada, vista de cima.'),
  ed(1, T.delta, 'behind-the-scenes', '2026-08-02T15:10', 'Dia de aprendizado',
    'Sem pontos desta vez, mas com muita coisa aprendida. A equipe já planeja ajustes para a próxima etapa.',
    [P.andre, P.juliana], 'Carro amarelo da Delta Pit Crew sendo guardado na caixa de transporte.'),
  ed(1, T.nitro, 'event', '2026-08-02T08:40', 'Nitro Garage na pista',
    'Thiago Barros e Paula Siqueira entram na pista de Lagoa Seca para a etapa de abertura da temporada.',
    [P.thiago, P.paula], 'Dois carros verdes da Nitro Garage entrando na pista de Lagoa Seca.'),
  ed(1, T.aurora, 'pilots', '2026-08-01T16:30', 'Mateus quer o melhor tempo',
    'Mateus Cavalcante e Larissa Pinheiro foram à pista cedo para buscar o melhor tempo nas baterias.',
    [P.mateus, P.larissa], 'Carro rosa da Aurora Speed alinhado na reta.'),
  ed(1, T.aurora, 'behind-the-scenes', '2026-08-03T10:15', 'Aprendizados da abertura',
    'A Aurora Speed revisou os dados da primeira etapa e já separou os pontos a melhorar.',
    [P.mateus, P.larissa], 'Anotações e um carro rosa sobre a mesa da equipe.'),

  // ───────── Etapa 2 · GP do Campus (30 ago, 09:00) ─────────
  ed(2, T.vortex, 'pilots', '2026-08-29T18:00', 'Campeão em casa',
    'Rafael Nunes, campeão da temporada passada, quer abrir vantagem no Circuito do Campus.',
    [P.rafael], 'Carro roxo número 5 da Vortex Motorsport na reta de largada.'),
  ed(2, T.vortex, 'behind-the-scenes', '2026-08-30T14:40', 'Comemoração no box',
    'Dia de festa no box da Vortex: a equipe comemorou a vitória de Rafael Nunes com todo mundo.',
    [P.rafael, P.helena], 'Integrantes da Vortex Motorsport comemorando ao lado do carro roxo.'),
  ed(2, T.apex, 'behind-the-scenes', '2026-08-29T20:30', 'Acerto para pista rápida',
    'O Circuito do Campus tem retas curtas e curvas rápidas. A Apex trabalhou na aerodinâmica e na altura do carro.',
    [P.diego, P.carla], 'Carro laranja da Apex Racing com a carroceria aberta para ajuste.'),
  ed(2, T.torque, 'behind-the-scenes', '2026-08-29T19:00', 'Pista exige carro estável',
    'Com muitas curvas seguidas, a Torque Lab apostou em um acerto mais estável para Lucas e Bianca.',
    [P.lucas, P.bianca], 'Carro azul da Torque Lab fazendo uma curva em S.'),
  ed(2, T.nitro, 'pilots', '2026-08-30T13:20', 'Thiago no pódio',
    'Thiago Barros terminou em 3º e levou a Nitro Garage ao pódio pela primeira vez na temporada.',
    [P.thiago], 'Carro verde da Nitro Garage cruzando a linha de chegada.'),
  ed(2, T.delta, 'event', '2026-08-30T09:50', 'Juliana abandona na volta 9',
    'Juliana Freitas teve de abandonar a prova na volta 9. A equipe já revisa o carro para entender o que aconteceu.',
    [P.juliana], 'Carro amarelo da Delta Pit Crew parado ao lado da pista.'),
  ed(2, T.delta, 'behind-the-scenes', '2026-08-31T11:00', 'Oficina a toda',
    'Segunda-feira de trabalho na oficina: o carro da Juliana passa por uma revisão completa antes da próxima etapa.',
    [P.andre, P.juliana], 'Mecânicos da Delta Pit Crew trabalhando em um carro amarelo.'),

  // ───────── Etapa 3 · GP Cajueiro (27 set, 14:00) ─────────
  ed(3, T.torque, 'behind-the-scenes', '2026-09-26T18:10', 'Ajustes antes da largada',
    'A equipe revisou o carro e alinhou a estratégia para a etapa. Como será o ritmo na pista?',
    [P.lucas, P.bianca], 'Carro azul da Torque Lab contornando uma pista de automodelismo.'),
  ed(3, T.torque, 'pilots', '2026-09-26T21:00', 'Lucas e Bianca estudam a pista',
    'Os pilotos passaram a noite analisando as voltas da etapa anterior para escolher a melhor linha em Cajueiro.',
    [P.lucas, P.bianca], 'Tela com o traçado da pista Cajueiro e linhas coloridas de trajetória.'),
  ed(3, T.torque, 'event', '2026-09-27T12:40', 'Chegada a Cajueiro',
    'A Torque Lab já está na Pista Cajueiro. A largada da etapa 3 é às 14h.',
    [P.lucas, P.bianca], 'Caixa de transporte da Torque Lab aberta ao lado da pista Cajueiro.'),
  ed(3, T.apex, 'pilots', '2026-09-26T19:30', 'Diego busca a segunda vitória',
    'Diego Martins venceu a abertura da temporada e agora quer a segunda vitória do ano.',
    [P.diego], 'Carro laranja número 1 da Apex Racing no box.'),
  ed(3, T.apex, 'behind-the-scenes', '2026-09-27T18:20', 'Pódio e churrasco no box',
    'Diego Martins venceu a etapa 3. A equipe comemora com um churrasco no box.',
    [P.diego, P.carla], 'Carro laranja da Apex Racing cruzando a linha de chegada.'),
  ed(3, T.vortex, 'behind-the-scenes', '2026-09-26T17:20', 'Pneus novos em Cajueiro',
    'A equipe testou duas misturas de pneu na pista de Cajueiro antes de decidir o acerto final.',
    [P.rafael, P.helena], 'Dois jogos de pneus pequenos lado a lado sobre a bancada da Vortex.'),
  ed(3, T.vortex, 'pilots', '2026-09-27T17:50', 'Os dois entre os cinco primeiros',
    'Rafael Nunes e Helena Duarte terminaram a etapa 3 entre os cinco primeiros colocados.',
    [P.rafael, P.helena], 'Dois carros roxos da Vortex Motorsport lado a lado na pista.'),
  ed(3, T.nitro, 'behind-the-scenes', '2026-09-26T16:40', 'Curvas que fazem diferença',
    'Thiago e Paula trabalharam no acerto para ganhar velocidade nas curvas mais lentas.',
    [P.thiago, P.paula], 'Carro verde da Nitro Garage fazendo uma curva fechada.'),
  ed(3, T.aurora, 'pilots', '2026-09-27T17:30', 'Mateus volta a pontuar',
    'Mateus Cavalcante terminou em 5º e marcou os primeiros pontos da temporada para a Aurora Speed.',
    [P.mateus], 'Carro rosa da Aurora Speed comemorado por mecânicos no fim da prova.'),
  ed(3, T.delta, 'behind-the-scenes', '2026-09-27T19:00', 'Um dia de corrida',
    'A equipe agradece a torcida e convida todo mundo a acompanhar a próxima etapa.',
    [P.andre, P.juliana], 'Carro amarelo da Delta Pit Crew passando diante da arquibancada.'),

  // ───────── Etapa 4 · GP Turbo Norte (25 out, 09:00) ─────────
  ed(4, T.vortex, 'behind-the-scenes', '2026-10-23T18:00', 'Vortex testa novo acerto',
    'Com a Arena Turbo Norte à vista, a equipe testou um novo acerto de suspensão nos treinos de sexta-feira.',
    [P.rafael, P.helena], 'Carro roxo da Vortex Motorsport em treino, em uma pista vazia.'),
  ed(4, T.vortex, 'pilots', '2026-10-25T12:20', 'Dobradinha em Turbo Norte',
    'Rafael Nunes venceu e Helena Duarte foi a segunda: a Vortex fez a dobradinha em Turbo Norte.',
    [P.rafael, P.helena], 'Dois carros roxos cruzando a linha de chegada, um logo atrás do outro.'),
  ed(4, T.vortex, 'event', '2026-10-25T13:10', 'Vortex lidera entre as equipes',
    'Com a dobradinha, a Vortex Motorsport assume a liderança do campeonato de equipes.',
    [P.rafael, P.helena], 'Placar de equipes com a Vortex Motorsport no topo.'),
  ed(4, T.torque, 'pilots', '2026-10-24T19:00', 'De olho no pódio',
    'Lucas Ferreira, em 3º no campeonato, chega a Sobral querendo mais um pódio.',
    [P.lucas], 'Carro azul número 7 da Torque Lab diante da pista de Sobral.'),
  ed(4, T.torque, 'event', '2026-10-25T09:08', 'Largada em Sobral',
    'A etapa 4 já começou na Arena Turbo Norte. Lucas Ferreira e Bianca Moreira estão na pista.',
    [P.lucas, P.bianca], 'Carros coloridos saindo da grade de largada em Sobral.'),
  ed(4, T.torque, 'pilots', '2026-10-25T12:35', 'Terceiro pódio do ano',
    'Lucas Ferreira terminou em 3º e conquistou o terceiro pódio da temporada.',
    [P.lucas], 'Carro azul número 7 da Torque Lab ao lado do pódio.'),
  ed(4, T.apex, 'pilots', '2026-10-24T20:10', 'Diego defende a liderança',
    'Diego Martins chega a Sobral como líder do campeonato e quer ampliar a vantagem.',
    [P.diego], 'Carro laranja número 1 da Apex Racing no box.'),
  ed(4, T.apex, 'event', '2026-10-25T12:50', 'Liderança por um ponto',
    'Diego Martins terminou em 4º e perdeu a liderança do campeonato por apenas um ponto.',
    [P.diego], 'Carro laranja da Apex Racing na reta final da prova.'),
  ed(4, T.nitro, 'behind-the-scenes', '2026-10-24T17:30', 'Escolha de pneus',
    'A equipe reviu a escolha de pneus para o piso liso da Arena Turbo Norte.',
    [P.thiago, P.paula], 'Pneus de automodelismo alinhados sobre uma mesa.'),
  ed(4, T.aurora, 'pilots', '2026-10-24T16:20', 'Largadas em treino',
    'Larissa Pinheiro e Mateus Cavalcante treinaram largadas durante a semana.',
    [P.larissa, P.mateus], 'Carros rosa da Aurora Speed largando lado a lado em treino.'),
  ed(4, T.aurora, 'behind-the-scenes', '2026-10-26T09:00', 'Balanço da etapa',
    'A Aurora Speed não pontuou em Turbo Norte e já revisa os tempos das baterias para preparar a etapa 5.',
    [P.mateus, P.larissa], 'Gráfico de tempos de volta ao lado de um carro rosa.'),
  ed(4, T.delta, 'behind-the-scenes', '2026-10-23T20:00', 'Chassi novo na oficina',
    'A Delta Pit Crew montou um chassi novo para Juliana Freitas depois do abandono na etapa 2.',
    [P.andre, P.juliana], 'Chassi amarelo novo sobre a bancada da oficina.'),
];

/** Soma `minutes` a uma data e hora local AAAA-MM-DDTHH:mm (sem fuso). */
function addMinutes(local: string, minutes: number): string {
  const [date, time] = local.split('T') as [string, string];
  const [y, mo, d] = date.split('-').map(Number) as [number, number, number];
  const [h, mi] = time.split(':').map(Number) as [number, number];
  const t = new Date(Date.UTC(y, mo - 1, d, h, mi + minutes));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}T${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}`;
}

/** Dados de que o feed gerado depende. */
export interface DemoFeedSource {
  races: readonly Race[];
  results: readonly RaceResults[];
  teams: readonly Team[];
  pilots: readonly Pilot[];
  rules: ChampionshipRules;
}

/**
 * Uma publicação de resultado por equipe e etapa em que ela pontuou, escrita a
 * partir dos resultados oficiais. Sai 2h45 depois da largada.
 */
function resultPosts(args: DemoFeedSource): FeedPost[] {
  const pilotNames = new Map(args.pilots.map((p) => [p.id, p.name]));
  const posts: FeedPost[] = [];
  for (const result of args.results) {
    const race = args.races.find((r) => r.id === result.raceId);
    if (!race) continue;
    for (const team of args.teams) {
      const parts: string[] = [];
      let total = 0;
      for (const pilotId of team.pilotIds) {
        const entry = result.final.find((e) => e.pilotId === pilotId);
        if (!entry) continue;
        const points = pointsForPosition(entry.position, args.rules);
        total += points;
        const name = pilotNames.get(pilotId) ?? pilotId;
        parts.push(
          entry.status === 'dnf'
            ? `${name} abandonou a prova`
            : `${name} terminou em ${entry.position}º (${points > 0 ? `+${points} ${points === 1 ? 'ponto' : 'pontos'}` : 'sem pontos'})`,
        );
      }
      if (total === 0) continue; // equipes sem pontos na etapa não ganham resumo de resultado
      posts.push({
        id: `${race.id}-${team.id}-resultado`,
        teamId: team.id,
        raceId: race.id,
        kind: 'result',
        title: `Resultado: ${race.name}`,
        text: `${parts.join(' e ')}. A equipe soma ${total} ${total === 1 ? 'ponto' : 'pontos'} na etapa ${race.round}.`,
        publishedAt: addMinutes(`${race.date}T${race.startTime}`, 165),
        pilotIds: team.pilotIds,
        imageAlt: `Resumo do resultado da ${team.name} na etapa ${race.round}.`,
        isDemo: true,
      });
    }
  }
  return posts;
}

/** Feed completo de demonstração (etapas 1 a 4), pronto para ser recortado por momento. */
export function buildDemoFeed(args: DemoFeedSource): FeedPost[] {
  const written: FeedPost[] = editorial.map((e, index) => ({
    id: `post-${String(index + 1).padStart(2, '0')}-e${e.round}-${e.teamId}`,
    teamId: e.teamId,
    raceId: `etapa-${e.round}`,
    kind: e.kind,
    title: e.title,
    text: e.text,
    publishedAt: e.at,
    pilotIds: e.pilots,
    imageAlt: e.alt,
    isDemo: true,
  }));
  return [...written, ...resultPosts(args)];
}
