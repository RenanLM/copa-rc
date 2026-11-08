import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { setScenarioChoice, type ScenarioChoice } from '@/lib/demo-scenario';
import { setPendingSimulation } from '@/lib/demo-settings';
import { App } from './App';

const ready = { timeout: 3000 };

beforeEach(() => {
  setPendingSimulation('none');
  setScenarioChoice('auto');
  sessionStorage.clear();
  localStorage.clear();
});

afterEach(() => cleanup());

function open(hash: string, moment: ScenarioChoice = 'auto') {
  setScenarioChoice(moment);
  window.location.hash = hash;
  render(<App />);
}

describe('etapa 4 → pódio: o fluxo da espectadora', () => {
  it('acompanha a simulação até o fim e chega ao pódio com a classificação atualizada', async () => {
    open('#/espectadora/ao-vivo');
    await screen.findByRole('heading', { name: 'Ao Vivo' }, ready);
    expect(screen.queryByRole('button', { name: 'Ver resultado e pódio' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Ir para o final/ }));
    const finished = await screen.findByRole('region', { name: /Bandeira quadriculada/ }, ready);
    // a simulação nunca é apresentada como resultado oficial: o botão é explícito
    expect(within(finished).getByText(/simulação da etapa 4 terminou/)).toBeInTheDocument();

    fireEvent.click(within(finished).getByRole('button', { name: 'Ver resultado e pódio' }));
    expect(await screen.findByRole('heading', { name: 'GP Turbo Norte', level: 1 }, { timeout: 5000 })).toBeInTheDocument();

    // pódio: os três primeiros, com medalha em texto e pontos oficiais
    const podium = screen.getByRole('list', { name: 'Três primeiros colocados da etapa 4' });
    const places = within(podium).getAllByRole('listitem');
    expect(places).toHaveLength(3);
    expect(places[0]).toHaveTextContent('Rafael Nunes');
    expect(places[0]).toHaveTextContent('+10 pts');
    expect(places[0]).toHaveTextContent('medalha de ouro');
    expect(places[1]).toHaveTextContent('Helena Duarte');
    expect(places[1]).toHaveTextContent('medalha de prata');
    expect(places[2]).toHaveTextContent('Lucas Ferreira');
    expect(places[2]).toHaveTextContent('+3 pts');
    expect(places[2]).toHaveTextContent('medalha de bronze');
    expect(screen.getByText('Resultado final')).toBeInTheDocument();
  });

  it('o resultado explica o que aconteceu e como o campeonato mudou', async () => {
    open('#/espectadora/etapa/etapa-4', 'after-race-4');
    await screen.findByRole('heading', { name: 'GP Turbo Norte', level: 1 }, ready);

    const highlights = screen.getByRole('region', { name: 'Destaques da etapa' });
    expect(within(highlights).getByText('Dobradinha da Vortex Motorsport')).toBeInTheDocument();
    expect(within(highlights).getByText('Nova liderança do campeonato')).toBeInTheDocument();
    expect(within(highlights).getByText(/Rafael Nunes assume a ponta.*Diego Martins liderava/)).toBeInTheDocument();
    expect(within(highlights).getByText('Nova líder entre as equipes')).toBeInTheDocument();
    expect(within(highlights).getByText('Volta mais rápida')).toBeInTheDocument();

    // classificação completa da etapa, com os pontos
    const classification = screen.getByRole('region', { name: 'Classificação da etapa e pontos' });
    expect(within(classification).getAllByRole('listitem')).toHaveLength(12);

    // mudanças na classificação geral (pilotos): depois da etapa
    const changes = screen.getByRole('region', { name: 'Como ficou o campeonato' });
    const list = within(changes).getByRole('list', { name: /Classificação de pilotos depois da etapa/ });
    const rows = within(list).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Rafael Nunes');
    expect(rows[0]).toHaveTextContent('+10');
    expect(rows[1]).toHaveTextContent('Diego Martins');
    expect(within(changes).getByRole('link', { name: 'Ver classificação completa' })).toHaveAttribute(
      'href',
      '#/espectadora/classificacao',
    );

    // equipes: a Vortex passou a liderar
    fireEvent.click(within(changes).getByRole('radio', { name: 'Equipes' }));
    const teams = within(changes).getByRole('list', { name: /Classificação de equipes depois da etapa/ });
    expect(within(teams).getAllByRole('listitem')[0]).toHaveTextContent('Vortex Motorsport');
    expect(within(teams).getAllByRole('listitem')[0]).toHaveTextContent('+16');
  });

  it('a classificação geral passa a refletir a etapa 4 em todas as telas', async () => {
    open('#/espectadora/classificacao', 'after-race-4');
    await screen.findByRole('heading', { name: 'Classificação' }, ready);
    const first = within(screen.getByRole('main')).getAllByRole('listitem')[0]!;
    expect(first).toHaveTextContent('Rafael Nunes');
    expect(first).toHaveTextContent('29');
    expect(screen.getByText(/após a etapa 4/)).toBeInTheDocument();
  });

  it('etapas anteriores também têm pódio e há seletor de etapa', async () => {
    open('#/espectadora/etapa/etapa-3');
    await screen.findByRole('heading', { name: 'GP Cajueiro', level: 1 }, ready);
    const places = within(screen.getByRole('list', { name: /Três primeiros colocados da etapa 3/ })).getAllByRole('listitem');
    expect(places.map((li) => li.textContent)).toEqual([
      expect.stringContaining('Diego Martins'),
      expect.stringContaining('Rafael Nunes'),
      expect.stringContaining('Lucas Ferreira'),
    ]);
    const chooser = screen.getByRole('radiogroup', { name: 'Etapa' });
    expect(within(chooser).getAllByRole('radio').map((r) => r.getAttribute('value'))).toEqual(['etapa-1', 'etapa-2', 'etapa-3']);
    fireEvent.click(within(chooser).getByRole('radio', { name: 'Etapa 1' }));
    expect(await screen.findByRole('heading', { name: 'GP Lagoa Seca', level: 1 })).toBeInTheDocument();
  });

  it('não inventa resultado: etapa em andamento ou futura mostra o motivo e o caminho', async () => {
    open('#/espectadora/etapa/etapa-4'); // padrão da espectadora: etapa 4 em andamento
    expect(await screen.findByText('Etapa em andamento', {}, ready)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Acompanhar a etapa' })).toHaveAttribute('href', '#/espectadora/ao-vivo');
    expect(screen.queryByRole('list', { name: /Três primeiros/ })).not.toBeInTheDocument();
    cleanup();

    open('#/espectadora/etapa/etapa-4', 'after-race-3');
    expect(await screen.findByText('Resultado em breve', {}, ready)).toBeInTheDocument();
    cleanup();

    open('#/espectadora/etapa/etapa-9', 'after-race-4');
    expect(await screen.findByRole('heading', { name: 'Etapa não encontrada' }, ready)).toBeInTheDocument();
  });
});

describe('início da espectadora por momento do campeonato', () => {
  it('após a etapa 3: etapa agendada, resultado anterior à mão e nada de "próximo evento" repetido', async () => {
    open('#/espectadora', 'after-race-3');
    expect(await screen.findByRole('heading', { name: 'GP Turbo Norte' }, ready)).toBeInTheDocument();
    expect(screen.getByText('Agendada')).toBeInTheDocument();
    expect(screen.getByText(/Em 4 dias/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver resultado da etapa 3/ })).toHaveAttribute('href', '#/espectadora/etapa/etapa-3');
    expect(screen.queryByText('Próximo evento')).not.toBeInTheDocument();
  });

  it('com a etapa 4 em andamento: status, próximo evento e como funciona o campeonato', async () => {
    open('#/espectadora');
    await screen.findByRole('heading', { name: 'GP Turbo Norte' }, ready);
    expect(screen.getByText('Em andamento')).toBeInTheDocument();
    const next = screen.getByRole('region', { name: /Etapa 5 · Grande Final Mar Aberto/ });
    expect(within(next).getByText('Próximo evento')).toBeInTheDocument();
    // explicação em linguagem simples, lida das regras oficiais
    const how = screen.getByRole('region', { name: 'Como funciona o campeonato' });
    expect(how).toHaveTextContent('5 etapas');
    expect(how).toHaveTextContent('10, 6, 3, 2, 1');
    expect(how).toHaveTextContent('2 pilotos');
  });

  it('após a etapa 4: etapa finalizada com o pódio no próprio início', async () => {
    open('#/espectadora', 'after-race-4');
    await screen.findByRole('heading', { name: 'GP Turbo Norte' }, ready);
    expect(screen.getByText('Finalizada')).toBeInTheDocument();
    const podium = screen.getByRole('list', { name: 'Pódio da etapa 4' });
    expect(within(podium).getAllByRole('listitem')[0]).toHaveTextContent('Rafael Nunes');
    expect(screen.getByRole('link', { name: /Ver pódio e resultado/ })).toHaveAttribute('href', '#/espectadora/etapa/etapa-4');
    expect(screen.getByRole('region', { name: /Etapa 5 · Grande Final Mar Aberto/ })).toBeInTheDocument();
    // os líderes refletem a nova classificação
    expect(within(screen.getByRole('list', { name: 'Três primeiros pilotos' })).getAllByRole('listitem')[0]).toHaveTextContent('Rafael Nunes');
    expect(within(screen.getByRole('list', { name: 'Três primeiras equipes' })).getAllByRole('listitem')[0]).toHaveTextContent('Vortex');
  });
});

describe('Ao Vivo sem etapa em andamento', () => {
  it('explica que nada está acontecendo e oferece a simulação como demonstração explícita', async () => {
    open('#/espectadora/ao-vivo', 'after-race-3');
    expect(await screen.findByText('Nenhuma etapa em andamento', {}, ready)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver resultado da etapa 3/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Simular a etapa 4 em andamento/ }));
    expect(await screen.findByText('Simulação ilustrativa', {}, ready)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Posições na pista' })).toBeInTheDocument();
  });

  it('depois da etapa 4 também não há corrida em andamento, e o resultado está à mão', async () => {
    open('#/espectadora/ao-vivo', 'after-race-4');
    expect(await screen.findByText('Nenhuma etapa em andamento', {}, ready)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver resultado da etapa 4/ })).toHaveAttribute('href', '#/espectadora/etapa/etapa-4');
    expect(screen.getByRole('heading', { name: /Próxima etapa · Grande Final Mar Aberto/ })).toBeInTheDocument();
  });
});

describe('momento do campeonato é o mesmo para piloto e espectadora', () => {
  it('o piloto começa após a etapa 3 e a espectadora, com a etapa 4 em andamento', async () => {
    open('#/piloto');
    await screen.findByRole('region', { name: /Resumo de Lucas Ferreira/ }, ready);
    expect(screen.getByText(/Etapa 4 · GP Turbo Norte/)).toBeInTheDocument();
    expect(screen.getByText(/Em 4 dias/)).toBeInTheDocument();
  });

  it('após a etapa 4, o painel do Lucas mostra a etapa 4 como a última e a classificação nova', async () => {
    open('#/piloto', 'after-race-4');
    const hero = await screen.findByRole('region', { name: /Resumo de Lucas Ferreira/ }, ready);
    expect(within(hero).getByText('3', { selector: '.sr-only' })).toBeInTheDocument();
    expect(within(hero).getByText('14', { selector: '.sr-only' })).toBeInTheDocument();
    const last = screen.getByRole('region', { name: 'Última etapa' });
    expect(last).toHaveTextContent('Etapa 4 · GP Turbo Norte');
    expect(last).toHaveTextContent('+3 pts');
    // a próxima etapa passa a ser a 5
    expect(screen.getByRole('region', { name: 'Próxima corrida' })).toHaveTextContent('Etapa 5');
  });

  it('com a etapa 4 em andamento, o piloto vê "Em andamento" e a classificação de antes', async () => {
    open('#/piloto', 'race-4-live');
    const hero = await screen.findByRole('region', { name: /Resumo de Lucas Ferreira/ }, ready);
    expect(within(hero).getByText('11', { selector: '.sr-only' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Corrida em andamento' })).toHaveTextContent('Em andamento');
  });

  it('o seletor de momento fica na folha de perfil e troca o momento na hora', async () => {
    open('#/piloto');
    await screen.findByRole('region', { name: /Resumo de Lucas Ferreira/ }, ready);
    fireEvent.click(screen.getByRole('button', { name: /Trocar perfil/ }));
    const group = await screen.findByRole('radiogroup', { name: 'Momento do campeonato' });
    expect(within(group).getByRole('radio', { name: /Padrão do perfil/ })).toBeChecked();
    expect(within(group).getByText(/Agora: Após a etapa 3/)).toBeInTheDocument();

    fireEvent.click(within(group).getByRole('radio', { name: /^Após a etapa 4/ }));
    expect(within(group).getByRole('radio', { name: /^Após a etapa 4/ })).toBeChecked();
    // sem recarregar: o painel já mostra a etapa 4 como a última
    expect(await screen.findByRole('region', { name: 'Última etapa' })).toHaveTextContent('Etapa 4 · GP Turbo Norte');
  });
});
