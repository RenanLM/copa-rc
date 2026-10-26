import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { setPendingSimulation } from '@/lib/demo-settings';
import { App } from './App';

const ready = { timeout: 3000 };

beforeEach(() => {
  setPendingSimulation('none');
  localStorage.clear();
});

afterEach(() => cleanup());

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
    for (const label of ['Início', 'Ao Vivo', 'Classificação', 'Feed', 'Pilotos e Equipes']) {
      expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument();
    }
    expect(screen.getByText('Lucas Ferreira')).toBeInTheDocument();
    expect(screen.queryByText(/· você/)).not.toBeInTheDocument();
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
