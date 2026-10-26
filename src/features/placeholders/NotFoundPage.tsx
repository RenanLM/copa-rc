import { useProfile } from '@/app/providers/ProfileProvider';
import { profilePath } from '@/app/profiles';
import { LinkButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/StateViews';

export function NotFoundPage() {
  const profile = useProfile();
  return (
    <EmptyState
      heading="h1"
      title="Página não encontrada"
      message="O endereço que você abriu não existe. Volte para o início e continue de lá."
      action={
        <LinkButton to={profilePath(profile)} variant="primary">
          Ir para o início
        </LinkButton>
      }
    />
  );
}
