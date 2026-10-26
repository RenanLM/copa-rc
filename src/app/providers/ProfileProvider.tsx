import { createContext, useContext, type ReactNode } from 'react';
import type { ProfileDefinition } from '../profiles';

const ProfileContext = createContext<ProfileDefinition | null>(null);

export function ProfileProvider({
  profile,
  children,
}: {
  profile: ProfileDefinition;
  children: ReactNode;
}) {
  return <ProfileContext.Provider value={profile}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileDefinition {
  const profile = useContext(ProfileContext);
  if (!profile) throw new Error('useProfile precisa estar dentro de ProfileProvider');
  return profile;
}
