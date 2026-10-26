import { Flag, FlaskConical, Radio } from 'lucide-react';
import { Badge } from './Badge';

/**
 * Origem do que está na tela. Nunca misturar as três:
 *  - live: dados reais, atualizados agora;
 *  - simulation: reprodução ilustrativa a partir de dados de demonstração;
 *  - final: classificação oficial já encerrada.
 */
export type Provenance = 'live' | 'simulation' | 'final';

const CONFIG = {
  live: { label: 'Ao vivo', tone: 'alert', Icon: Radio },
  simulation: { label: 'Simulação ilustrativa', tone: 'data', Icon: FlaskConical },
  final: { label: 'Resultado final', tone: 'accent', Icon: Flag },
} as const;

export function ProvenanceBadge({ kind }: { kind: Provenance }) {
  const { label, tone, Icon } = CONFIG[kind];
  return (
    <Badge tone={tone}>
      <Icon size={12} aria-hidden="true" />
      {label}
    </Badge>
  );
}
