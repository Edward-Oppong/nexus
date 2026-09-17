import React, { createContext, useContext, useMemo } from 'react';
import { ClinicalPersona } from '../../domain/persona';
import { MOCK_PERSONAS } from '../../data/users/mockPersonas';
import { useAuth } from '../../features/authentication/AuthProvider';

interface PersonaContextType {
  currentPersona: ClinicalPersona;
  allPersonas: ClinicalPersona[];
  setPersonaById: (id: string) => void;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

export const PersonaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, role } = useAuth();

  const currentPersona = useMemo<ClinicalPersona>(() => {
    // Select base clinical template matching authenticated role
    const base =
      MOCK_PERSONAS.find((p) => {
        if (role === 'organization_admin') return p.role === 'administrator';
        if (role === 'nurse') return p.role === 'nurse';
        if (role === 'laboratory') return p.role === 'laboratory';
        if (role === 'reviewer') return p.role === 'reviewer';
        return p.role === 'clinician';
      }) || MOCK_PERSONAS[0];

    const fullName =
      profile?.fullName ||
      user?.user_metadata?.full_name ||
      (user?.email ? user.email.split('@')[0] : base.name);

    const initials = fullName
      .split(' ')
      .filter(Boolean)
      .map((part: string) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    return {
      ...base,
      name: fullName,
      title: profile?.profession || base.title,
      avatarInitials: initials || base.avatarInitials,
    };
  }, [user, profile, role]);

  return (
    <PersonaContext.Provider value={{ currentPersona, allPersonas: [currentPersona], setPersonaById: () => {} }}>
      {children}
    </PersonaContext.Provider>
  );
};

export const usePersona = () => {
  const context = useContext(PersonaContext);
  if (!context) throw new Error('usePersona must be used within a PersonaProvider');
  return context;
};
