import type { Pilot, Race, Team, Track } from '@/domain';
import type { RaceGenerationSpec } from './generate';

/**
 * Dados de DEMONSTRAÇÃO. Pessoas, equipes, pistas e datas são fictícias.
 * A interface sempre identifica estes dados como demonstrativos.
 */

export const teams: Team[] = [
  {
    id: 'torque-lab',
    name: 'Torque Lab',
    shortName: 'TLB',
    color: '#43C6E8',
    city: 'Fortaleza',
    pilotIds: ['lucas-ferreira', 'bianca-moreira'],
  },
  {
    id: 'apex-racing',
    name: 'Apex Racing',
    shortName: 'APX',
    color: '#FF704D',
    city: 'Caucaia',
    pilotIds: ['diego-martins', 'carla-ribeiro'],
  },
  {
    id: 'vortex-motorsport',
    name: 'Vortex Motorsport',
    shortName: 'VTX',
    color: '#A78BFA',
    city: 'Maracanaú',
    pilotIds: ['rafael-nunes', 'helena-duarte'],
  },
  {
    id: 'nitro-garage',
    name: 'Nitro Garage',
    shortName: 'NTR',
    color: '#4ADE80',
    city: 'Eusébio',
    pilotIds: ['thiago-barros', 'paula-siqueira'],
  },
  {
    id: 'aurora-speed',
    name: 'Aurora Speed',
    shortName: 'AUR',
    color: '#F472B6',
    city: 'Sobral',
    pilotIds: ['mateus-cavalcante', 'larissa-pinheiro'],
  },
  {
    id: 'delta-pit-crew',
    name: 'Delta Pit Crew',
    shortName: 'DLT',
    color: '#FBBF24',
    city: 'Juazeiro do Norte',
    pilotIds: ['andre-lima', 'juliana-freitas'],
  },
];

export const pilots: Pilot[] = [
  {
    id: 'lucas-ferreira',
    name: 'Lucas Ferreira',
    number: 7,
    teamId: 'torque-lab',
    age: 24,
    city: 'Fortaleza',
    bio: 'Estudante de Engenharia e piloto amador. Gosta de analisar cada volta para encontrar décimos de segundo.',
  },
  {
    id: 'bianca-moreira',
    name: 'Bianca Moreira',
    number: 27,
    teamId: 'torque-lab',
    age: 27,
    city: 'Fortaleza',
    bio: 'Mecânica da equipe e piloto. Especialista em acerto de suspensão.',
  },
  {
    id: 'diego-martins',
    name: 'Diego Martins',
    number: 1,
    teamId: 'apex-racing',
    age: 33,
    city: 'Caucaia',
    bio: 'Veterano do kartismo, regular e agressivo nas largadas.',
  },
  {
    id: 'carla-ribeiro',
    name: 'Carla Ribeiro',
    number: 11,
    teamId: 'apex-racing',
    age: 29,
    city: 'Caucaia',
    bio: 'Piloto de ritmo constante, forte nas provas longas.',
  },
  {
    id: 'rafael-nunes',
    name: 'Rafael Nunes',
    number: 5,
    teamId: 'vortex-motorsport',
    age: 31,
    city: 'Maracanaú',
    bio: 'Campeão da temporada anterior. Domina pistas rápidas.',
  },
  {
    id: 'helena-duarte',
    name: 'Helena Duarte',
    number: 55,
    teamId: 'vortex-motorsport',
    age: 22,
    city: 'Maracanaú',
    bio: 'Estreante na categoria, evolui a cada etapa.',
  },
  {
    id: 'thiago-barros',
    name: 'Thiago Barros',
    number: 8,
    teamId: 'nitro-garage',
    age: 26,
    city: 'Eusébio',
    bio: 'Piloto técnico, especialista em curvas lentas.',
  },
  {
    id: 'paula-siqueira',
    name: 'Paula Siqueira',
    number: 88,
    teamId: 'nitro-garage',
    age: 35,
    city: 'Eusébio',
    bio: 'Construtora de carros e piloto de fim de semana.',
  },
  {
    id: 'mateus-cavalcante',
    name: 'Mateus Cavalcante',
    number: 14,
    teamId: 'aurora-speed',
    age: 21,
    city: 'Sobral',
    bio: 'Jovem promessa, rápido em classificação.',
  },
  {
    id: 'larissa-pinheiro',
    name: 'Larissa Pinheiro',
    number: 41,
    teamId: 'aurora-speed',
    age: 25,
    city: 'Sobral',
    bio: 'Prefere estratégia de ultrapassagens a longo prazo.',
  },
  {
    id: 'andre-lima',
    name: 'André Lima',
    number: 3,
    teamId: 'delta-pit-crew',
    age: 40,
    city: 'Juazeiro do Norte',
    bio: 'Um dos fundadores do clube de automodelismo da região.',
  },
  {
    id: 'juliana-freitas',
    name: 'Juliana Freitas',
    number: 33,
    teamId: 'delta-pit-crew',
    age: 23,
    city: 'Juazeiro do Norte',
    bio: 'Piloto ousada, ainda em busca de regularidade.',
  },
];

export const tracks: Track[] = [
  {
    id: 'lagoa-seca', name: 'Autódromo Lagoa Seca', city: 'Caucaia', lengthMeters: 52,
    layout: [[70, 90], [150, 50], [250, 45], [340, 70], [365, 120], [330, 160], [260, 150], [215, 185], [250, 225], [190, 245], [110, 230], [60, 190], [45, 140]],
  },
  {
    id: 'campus', name: 'Circuito do Campus', city: 'Fortaleza', lengthMeters: 47,
    layout: [[60, 70], [140, 45], [220, 70], [280, 45], [350, 80], [360, 140], [300, 170], [330, 215], [260, 245], [190, 215], [140, 245], [70, 225], [40, 160], [90, 130]],
  },
  {
    id: 'cajueiro', name: 'Pista Cajueiro', city: 'Eusébio', lengthMeters: 55,
    layout: [[50, 60], [200, 40], [340, 55], [370, 100], [340, 135], [230, 125], [190, 150], [230, 180], [350, 195], [365, 240], [280, 255], [120, 245], [50, 210], [35, 140]],
  },
  {
    id: 'turbo-norte', name: 'Arena Turbo Norte', city: 'Sobral', lengthMeters: 49,
    layout: [[80, 60], [170, 40], [260, 70], [330, 50], [375, 100], [350, 155], [290, 140], [240, 170], [300, 215], [250, 250], [150, 235], [100, 200], [130, 165], [60, 150], [40, 100]],
  },
  {
    id: 'mar-aberto', name: 'Circuito Mar Aberto', city: 'Fortaleza', lengthMeters: 58,
    layout: [[60, 100], [120, 50], [210, 60], [250, 110], [310, 70], [365, 110], [345, 175], [280, 195], [300, 240], [220, 250], [160, 205], [110, 235], [50, 200], [40, 150]],
  },
];

export const races: Race[] = [
  { id: 'etapa-1', round: 1, name: 'GP Lagoa Seca', trackId: 'lagoa-seca', date: '2026-08-02', startTime: '09:00', status: 'finished', finalLaps: 20 },
  { id: 'etapa-2', round: 2, name: 'GP do Campus', trackId: 'campus', date: '2026-08-30', startTime: '09:00', status: 'finished', finalLaps: 20 },
  { id: 'etapa-3', round: 3, name: 'GP Cajueiro', trackId: 'cajueiro', date: '2026-09-27', startTime: '14:00', status: 'finished', finalLaps: 20 },
  { id: 'etapa-4', round: 4, name: 'GP Turbo Norte', trackId: 'turbo-norte', date: '2026-10-25', startTime: '09:00', status: 'scheduled', finalLaps: 20 },
  { id: 'etapa-5', round: 5, name: 'Grande Final Mar Aberto', trackId: 'mar-aberto', date: '2026-11-22', startTime: '14:00', status: 'scheduled', finalLaps: 20 },
];

/**
 * Ordem de chegada das etapas finalizadas (escrita à mão). Pontos NÃO são
 * armazenados: são sempre calculados pelo domínio.
 */
const HEAT = { heatCount: 3, heatDurationMs: 180_000 } as const;

export const raceSpecs: RaceGenerationSpec[] = [
  {
    raceId: 'etapa-1',
    seed: 20260802,
    baseLapMs: 14_820,
    finalLaps: 20,
    order: [
      'diego-martins', 'lucas-ferreira', 'rafael-nunes', 'bianca-moreira',
      'thiago-barros', 'carla-ribeiro', 'mateus-cavalcante', 'helena-duarte',
      'andre-lima', 'paula-siqueira', 'larissa-pinheiro', 'juliana-freitas',
    ],
    ...HEAT,
  },
  {
    raceId: 'etapa-2',
    seed: 20260830,
    baseLapMs: 13_940,
    finalLaps: 20,
    order: [
      'rafael-nunes', 'diego-martins', 'thiago-barros', 'lucas-ferreira',
      'carla-ribeiro', 'bianca-moreira', 'helena-duarte', 'mateus-cavalcante',
      'paula-siqueira', 'andre-lima', 'larissa-pinheiro', 'juliana-freitas',
    ],
    dnf: { 'juliana-freitas': 9 },
    ...HEAT,
  },
  {
    raceId: 'etapa-3',
    seed: 20260927,
    baseLapMs: 15_410,
    finalLaps: 20,
    order: [
      'diego-martins', 'rafael-nunes', 'lucas-ferreira', 'helena-duarte',
      'mateus-cavalcante', 'thiago-barros', 'bianca-moreira', 'carla-ribeiro',
      'andre-lima', 'larissa-pinheiro', 'paula-siqueira', 'juliana-freitas',
    ],
    ...HEAT,
  },
  {
    // Etapa 4 (usada nos momentos "etapa 4 em andamento" e "após a etapa 4").
    // Dobradinha da Vortex (Rafael 1º, Helena 2º): Rafael assume a liderança do
    // campeonato e a Vortex passa à frente da Apex entre as equipes.
    raceId: 'etapa-4',
    seed: 20261025,
    baseLapMs: 14_200,
    finalLaps: 20,
    order: [
      'rafael-nunes', 'helena-duarte', 'lucas-ferreira', 'diego-martins',
      'thiago-barros', 'bianca-moreira', 'carla-ribeiro', 'mateus-cavalcante',
      'paula-siqueira', 'andre-lima', 'larissa-pinheiro', 'juliana-freitas',
    ],
    ...HEAT,
  },
];
