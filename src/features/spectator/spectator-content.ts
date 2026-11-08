import { Flag, Trophy, UserRound, Wrench, type LucideIcon } from 'lucide-react';
import type { PostKind } from '@/domain';

/**
 * Como cada tipo de publicação aparece na tela. O tipo sempre é dito por texto
 * além do ícone, para não depender de cor nem de interpretar um símbolo.
 */
export const POST_KINDS: Record<PostKind, { label: string; icon: LucideIcon }> = {
  result: { label: 'Resultado', icon: Trophy },
  event: { label: 'Acontecimento', icon: Flag },
  pilots: { label: 'Pilotos', icon: UserRound },
  'behind-the-scenes': { label: 'Bastidores', icon: Wrench },
};
