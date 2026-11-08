import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { setPendingSimulation } from '@/lib/demo-settings';
import { App } from './App';

const ready = { timeout: 3000 };

beforeEach(() => {
  setPendingSimulation('none');
  localStorage.clear();
  const favicon = document.createElement('link');
  favicon.rel = 'icon';
  document.head.append(favicon);
});

afterEach(() => {
  cleanup();
  document.querySelector('link[rel="icon"]')?.remove();
});

function open(hash: string) {
  window.location.hash = hash;
  render(<App />);
}

describe('aplicativo (interface)', () => {
  it('abre o painel do piloto com posição e pontos calculados pelo domínio', async () => {
    open('#/piloto');
    const hero = await screen.findByRole('region', { name: /Resumo de Lucas Ferreira/ }, ready);
    expect(within(hero).getByText('3', { selector: '.sr-only' })).toBeInTheDocument();
    expect(within(hero).getByText('11', { selector: '.sr-only' })).toBeInTheDocument();
    expect(screen.getByText(/Etapa 4 · GP Turbo Norte/)).toBeInTheDocument();
  });

  it('mostra a navegação do piloto e navega para a classificação com destaque', async () => {
    open('#/piloto');
    await screen.findByRole('region', { name: /Resumo de Lucas Ferreira/ }, ready);

    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    fireEvent.click(screen.getByRole('button', { name: 'Ativar modo escuro' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(localStorage.getItem('rc-championship-theme')).toBe('dark');
    expect(document.querySelector('link[rel="icon"]')).toHaveAttribute('href', '/favicon-dark.svg');
    fireEvent.click(screen.getByRole('button', { name: 'Ativar modo claro' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(document.querySelector('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg');

    const nav = screen.getByRole('navigation', { name: 'Navegação principal' });
    for (const label of ['Início', 'Corridas', 'Classificação', 'Simulador', 'Perfil']) {
      expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument();
    }

    fireEvent.click(within(nav).getByRole('link', { name: 'Classificação' }));
    expect(await screen.findByRole('heading', { name: 'Classificação' })).toBeInTheDocument();
    expect(screen.getByText('Diego Martins')).toBeInTheDocument();
    expect(screen.getByText(/você/)).toBeInTheDocument();
    // empates não resolvidos são explicados, não escondidos
    expect(screen.getByText(/ainda não define o critério de desempate/)).toBeInTheDocument();
  });

  it('mostra a navegação da espectadora e reaproveita a classificação sem destaque pessoal', async () => {
    open('#/espectadora/classificacao');
    expect(await screen.findByRole('heading', { name: 'Classificação' }, ready)).toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: 'Navegação principal' });
    for (const label of ['Início', 'Ao Vivo', 'Classificação', 'Feed', 'Pilotos']) {
      expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument();
    }
    expect(screen.getByText('Lucas Ferreira')).toBeInTheDocument();
    expect(screen.queryByText(/· você/)).not.toBeInTheDocument();
    fireEvent.click(within(nav).getByRole('link', { name: 'Ao Vivo' }));
    expect(within(nav).getByRole('link', { name: 'Ao Vivo' })).toHaveAttribute('aria-current', 'page');
  });

  it('apresenta a etapa 4 em andamento na página inicial da espectadora', async () => {
    open('#/espectadora');
    expect(await screen.findByText('Ao vivo · simulação', {}, ready)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'GP Turbo Norte' })).toBeInTheDocument();
    expect(screen.getByText(/não há dados reais ao vivo/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Acompanhar corrida/ })).toHaveAttribute(
      'href',
      '#/espectadora/ao-vivo',
    );
    expect(screen.queryByText('Próxima etapa')).not.toBeInTheDocument();
  });

  it('simula a etapa 4 para a espectadora com pista, ordem dinâmica e origem identificada', async () => {
    open('#/espectadora/ao-vivo');
    expect(await screen.findByRole('heading', { name: 'Ao Vivo' }, ready)).toBeInTheDocument();
    expect(screen.getByText('Simulação ilustrativa')).toBeInTheDocument();
    expect(screen.getByText(/Posições e ultrapassagens são fictícias/)).toBeInTheDocument();
    expect(screen.getAllByText(/GP Turbo Norte/)).toHaveLength(2);
    expect(screen.getByRole('img', { name: /Simulação da etapa 4, GP Turbo Norte/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Posições na pista' })).toBeInTheDocument();
    const pauseButton = screen.queryByRole('button', { name: 'Pausar simulação' });
    if (pauseButton) {
      fireEvent.click(pauseButton);
      expect(await screen.findByRole('button', { name: 'Retomar simulação' })).toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole('button', { name: 'Retomar simulação' }));
    expect(await screen.findByRole('button', { name: 'Pausar simulação' })).toBeInTheDocument();
  });

  it('permite explorar e filtrar publicações demonstrativas das equipes', async () => {
    open('#/espectadora/feed');
    expect(await screen.findByRole('heading', { name: 'Feed das equipes' }, ready)).toBeInTheDocument();
    expect(screen.getByText('Conteúdo de demonstração')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Torque Lab' }));
    expect(screen.getByRole('button', { name: 'Torque Lab' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByRole('heading', { name: 'Ajustes antes da largada' })).toHaveLength(2);
    expect(screen.queryByRole('heading', { name: 'Pódio da etapa' })).not.toBeInTheDocument();
  });

  it('ajuda a encontrar pilotos por nome e oferece a lista de equipes', async () => {
    open('#/espectadora/pilotos-equipes');
    expect(await screen.findByRole('heading', { name: 'Pilotos e equipes' }, ready)).toBeInTheDocument();
    const search = screen.getByRole('searchbox', { name: 'Encontrar piloto ou equipe' });
    fireEvent.change(search, { target: { value: 'Lucas' } });
    expect(screen.getByRole('heading', { name: 'Lucas Ferreira' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Bianca Moreira' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Equipes/ }));
    expect(screen.getByRole('heading', { name: 'Torque Lab' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Apex Racing' })).not.toBeInTheDocument();
  });

  it('exibe o resultado da etapa 3 e detalha as voltas ao tocar em um piloto', async () => {
    open('#/piloto/corridas/etapa-3');
    expect(await screen.findByRole('heading', { name: 'GP Cajueiro' }, ready)).toBeInTheDocument();
    const lucas = within(screen.getByRole('main')).getByRole('button', { name: /Lucas Ferreira/ });
    expect(lucas).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(lucas);
    expect(lucas).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByText('Ritmo médio')).toBeInTheDocument();
  });

  it('etapas futuras não exibem resultados inventados', async () => {
    open('#/piloto/corridas/etapa-4');
    expect(await screen.findByRole('heading', { name: 'GP Turbo Norte' }, ready)).toBeInTheDocument();
    expect(screen.getByText('Resultados em breve')).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup', { name: 'Visualização da etapa' })).not.toBeInTheDocument();
  });

  it('trata falha de carregamento e permite tentar novamente', async () => {
    setPendingSimulation('error');
    open('#/piloto');
    expect(await screen.findByRole('alert', {}, ready)).toHaveTextContent('Não foi possível carregar');
    // a navegação continua disponível durante o erro
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Tentar novamente/ }));
    expect(
      await screen.findByRole('region', { name: /Resumo de Lucas Ferreira/ }, ready),
    ).toBeInTheDocument();
  });

  it('rota inexistente mostra página amigável com caminho de volta', async () => {
    open('#/piloto/nada-aqui');
    expect(await screen.findByRole('heading', { name: 'Página não encontrada' }, ready)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir para o início' })).toBeInTheDocument();
  });
});
