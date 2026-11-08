import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { setScenarioChoice } from '@/lib/demo-scenario';
import { setPendingSimulation } from '@/lib/demo-settings';
import { App } from './App';

const ready = { timeout: 3000 };

beforeEach(() => {
  setPendingSimulation('none');
  setScenarioChoice('auto');
  sessionStorage.clear();
  localStorage.clear();
  const favicon = document.createElement('link');
  favicon.rel = 'icon';
  document.head.append(favicon);
});

afterEach(() => {
  cleanup();
  document.querySelector('link[rel="icon"]')?.remove();
});

async function openFeed() {
  window.location.hash = '#/espectadora/feed';
  render(<App />);
  await screen.findByRole('heading', { name: 'Feed das equipes' }, ready);
}

const articles = () => screen.queryAllByRole('article');
const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const summary = () => screen.getByRole('status');

describe('feed da espectadora', () => {
  it('identifica o conteúdo como demonstração, no aviso e em cada publicação', async () => {
    await openFeed();
    expect(screen.getByText('Conteúdo de demonstração')).toBeInTheDocument();
    expect(articles().length).toBeGreaterThan(0);
    for (const article of articles()) {
      expect(within(article).getByText('Demonstração')).toBeInTheDocument();
      expect(within(article).getByText('Arte demonstrativa')).toBeInTheDocument();
    }
  });

  it('cada publicação mostra equipe, etapa, tipo, data e hora e texto', async () => {
    await openFeed();
    press('Torque Lab');
    press('Etapa 3');
    const first = articles()[0]!;
    expect(within(first).getByRole('heading', { name: 'Resultado: GP Cajueiro' })).toBeInTheDocument();
    expect(within(first).getByText('Torque Lab')).toBeInTheDocument();
    expect(within(first).getByText(/Etapa 3 · GP Cajueiro/)).toBeInTheDocument();
    expect(within(first).getByText('Resultado', { selector: 'span' })).toBeInTheDocument();
    const when = within(first).getByText('27 set · 16:45');
    expect(when.tagName).toBe('TIME');
    expect(when).toHaveAttribute('datetime', '2026-09-27T16:45');
    expect(within(first).getByText(/Lucas Ferreira terminou em 3º \(\+3 pontos\)/)).toBeInTheDocument();
    expect(within(first).getByText(/Lucas Ferreira, Bianca Moreira/)).toBeInTheDocument();
  });

  it('missão: encontrar as publicações de uma equipe durante a terceira etapa', async () => {
    await openFeed();
    press('Torque Lab');
    press('Etapa 3');
    expect(screen.getByRole('button', { name: 'Torque Lab' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Etapa 3' })).toHaveAttribute('aria-pressed', 'true');
    expect(articles()).toHaveLength(4);
    // mais recentes primeiro
    expect(articles().map((a) => within(a).getByRole('heading', { level: 3 }).textContent)).toEqual([
      'Resultado: GP Cajueiro',
      'Chegada a Cajueiro',
      'Lucas e Bianca estudam a pista',
      'Ajustes antes da largada',
    ]);
    expect(summary()).toHaveTextContent('4 publicações · Torque Lab · etapa 3');
  });

  it('os filtros de equipe e de etapa se combinam e podem ser desfeitos', async () => {
    await openFeed();
    press('Etapa 1');
    expect(summary()).toHaveTextContent('Mostrando 8 de 13 publicações · etapa 1');
    press('Apex Racing');
    expect(articles()).toHaveLength(2);
    expect(summary()).toHaveTextContent('2 publicações · Apex Racing · etapa 1');
    press('Todas as etapas');
    expect(articles().length).toBeGreaterThan(2);
    for (const a of articles()) expect(within(a).getByText('Apex Racing')).toBeInTheDocument();
    press('Todas as equipes');
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument();
  });

  it('mostra a cota de 4 publicações e avisa quando o limite é atingido', async () => {
    await openFeed();
    press('Torque Lab');
    const quota = screen.getByRole('region', { name: /Limite de publicações · Torque Lab/ });
    // todas as etapas abertas aparecem; a etapa 3 está no limite
    const item3 = within(quota).getByText('Etapa 3').closest('li')!;
    expect(within(item3).getByText('4 de 4')).toBeInTheDocument();
    expect(within(item3).getByText('limite atingido')).toBeInTheDocument();
    const item1 = within(quota).getByText('Etapa 1').closest('li')!;
    expect(within(item1).getByText('2 de 4')).toBeInTheDocument();
    expect(within(item1).queryByText('limite atingido')).not.toBeInTheDocument();
    // com uma etapa escolhida, só ela aparece
    press('Etapa 2');
    expect(within(quota).queryByText('Etapa 3')).not.toBeInTheDocument();
    expect(within(quota).getByText('2 de 4')).toBeInTheDocument();
  });

  it('explica o estado vazio e oferece caminhos de volta', async () => {
    await openFeed();
    press('Aurora Speed');
    press('Etapa 2');
    expect(articles()).toHaveLength(0);
    expect(screen.getByRole('heading', { name: 'Nenhuma publicação com esses filtros' })).toBeInTheDocument();
    expect(screen.getByText(/Aurora Speed não tem publicações na etapa 2/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ver todas as etapas de Aurora Speed' }));
    expect(screen.getByRole('button', { name: 'Etapa 2' })).toHaveAttribute('aria-pressed', 'false');
    expect(articles().length).toBeGreaterThan(0);
    press('Etapa 2');
    fireEvent.click(within(screen.getByRole('main')).getAllByRole('button', { name: 'Limpar filtros' }).at(-1)!);
    expect(screen.getByRole('button', { name: 'Todas as equipes' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Todas as etapas' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('mostra 8 publicações por vez e informa quantas faltam', async () => {
    await openFeed();
    expect(articles()).toHaveLength(8);
    expect(summary()).toHaveTextContent('Mostrando 8 de 45 publicações');
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar mais publicações (37)' }));
    expect(articles()).toHaveLength(16);
    expect(summary()).toHaveTextContent('Mostrando 16 de 45 publicações');
    // trocar o filtro volta ao primeiro lote
    press('Etapa 1');
    expect(articles()).toHaveLength(8);
    expect(summary()).toHaveTextContent('Mostrando 8 de 13 publicações · etapa 1');
  });

  it('acompanha o momento do campeonato: etapa 4 só tem publicações até aquele instante', async () => {
    await openFeed();
    // espectadora começa com a etapa 4 em andamento: 7 publicações da etapa 4
    press('Etapa 4');
    expect(articles()).toHaveLength(7);
    for (const a of articles()) {
      expect(within(a).queryByText('Resultado', { selector: 'span' })).not.toBeInTheDocument();
    }
  });

  it('após a etapa 3 a etapa 4 não existe nos filtros; após a etapa 4 há resultados', async () => {
    setScenarioChoice('after-race-3');
    await openFeed();
    expect(screen.queryByRole('button', { name: 'Etapa 4' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Etapa 3' })).toBeInTheDocument();
    cleanup();

    setScenarioChoice('after-race-4');
    await openFeed();
    press('Etapa 4');
    expect(summary()).toHaveTextContent('Mostrando 8 de 16 publicações · etapa 4');
    press('Vortex Motorsport');
    expect(articles()).toHaveLength(4);
    const quota = screen.getByRole('region', { name: /Limite de publicações · Vortex Motorsport/ });
    expect(within(quota).getByText('limite atingido')).toBeInTheDocument();
  });
});
