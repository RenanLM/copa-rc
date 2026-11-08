import {
  Calculator,
  Flag,
  House,
  Newspaper,
  Radio,
  Trophy,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { PilotId } from '@/domain';

/**
 * Perfis de uso do aplicativo. Cada perfil declara apenas dados: persona e
 * itens de navegação. As telas são ligadas em `routes.tsx`. Para adicionar um
 * novo perfil basta declará-lo aqui e mapear suas páginas lá.
 */

export type ProfileId = 'pilot' | 'spectator';

export interface Persona {
  name: string;
  age: number;
  occupation: string;
  /** Presente apenas quando a persona é um piloto do campeonato. */
  pilotId?: PilotId;
}

export interface NavItem {
  id: string;
  label: string;
  /** Caminho relativo ao perfil ('' = início). */
  path: string;
  icon: LucideIcon;
}

export interface ProfileDefinition {
  id: ProfileId;
  /** Segmento de URL: /piloto, /espectadora. */
  slug: string;
  roleLabel: string;
  persona: Persona;
  nav: readonly NavItem[];
}

export const PROFILES: readonly ProfileDefinition[] = [
  {
    id: 'pilot',
    slug: 'piloto',
    roleLabel: 'Piloto',
    persona: {
      name: 'Lucas Ferreira',
      age: 24,
      occupation: 'Estudante de Engenharia e piloto amador de RC',
      pilotId: 'lucas-ferreira',
    },
    nav: [
      { id: 'home', label: 'Início', path: '', icon: House },
      { id: 'races', label: 'Corridas', path: 'corridas', icon: Flag },
      { id: 'standings', label: 'Classificação', path: 'classificacao', icon: Trophy },
      { id: 'simulator', label: 'Simulador', path: 'simulador', icon: Calculator },
      { id: 'profile', label: 'Perfil', path: 'perfil', icon: User },
    ],
  },
  {
    id: 'spectator',
    slug: 'espectadora',
    roleLabel: 'Espectadora',
    persona: {
      name: 'Mariana Costa',
      age: 29,
      occupation: 'Designer gráfica e entusiasta de automobilismo',
    },
    nav: [
      { id: 'home', label: 'Início', path: '', icon: House },
      { id: 'live', label: 'Ao Vivo', path: 'ao-vivo', icon: Radio },
      { id: 'standings', label: 'Classificação', path: 'classificacao', icon: Trophy },
      { id: 'feed', label: 'Feed', path: 'feed', icon: Newspaper },
      { id: 'directory', label: 'Pilotos', path: 'pilotos-equipes', icon: Users },
    ],
  },
];

export const DEFAULT_PROFILE: ProfileDefinition = PROFILES[0]!;

export function findProfileBySlug(slug: string | undefined): ProfileDefinition | undefined {
  return PROFILES.find((p) => p.slug === slug);
}

/** Caminho absoluto de uma tela dentro de um perfil. */
export function profilePath(profile: ProfileDefinition, sub = ''): string {
  return sub ? `/${profile.slug}/${sub}` : `/${profile.slug}`;
}

const STORAGE_KEY = 'rcc:last-profile';

export function readLastProfile(): ProfileDefinition {
  try {
    return findProfileBySlug(localStorage.getItem(STORAGE_KEY) ?? undefined) ?? DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function rememberProfile(profile: ProfileDefinition) {
  try {
    localStorage.setItem(STORAGE_KEY, profile.slug);
  } catch {
    /* armazenamento indisponível: o app funciona sem lembrar o perfil */
  }
}
