import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/StateViews';

interface ComingSoonPageProps {
  title: string;
  icon: LucideIcon;
  /** Em linguagem do usuário: o que esta área vai permitir fazer. */
  description: string;
}

/** Área prevista na navegação, ainda não liberada. Sinaliza claramente o estado. */
export function ComingSoonPage({ title, icon, description }: ComingSoonPageProps) {
  return (
    <>
      <PageHeader title={title} />
      <Card>
        <EmptyState
          icon={icon}
          title="Em breve"
          message={description}
          action={<Badge tone="data">Em desenvolvimento</Badge>}
        />
      </Card>
    </>
  );
}
