import React, { createContext, useContext, useState } from 'react';
import { ClinicalPersona } from '../../domain/persona';
import { MOCK_PERSONAS } from '../../data/users/mockPersonas';

import { useAuth } from '../../features/authentication/AuthProvider';
import { AppRole } from '../../domain/auth';

interface PersonaContextType {
  currentPersona: ClinicalPersona;
  allPersonas: ClinicalPersona[];
  setPersonaById: (id: string) => void;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

export const PersonaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPersona, setCurrentPersona] = useState<ClinicalPersona>(MOCK_PERSONAS[0]); // Dr. Vance default
  const { switchDemoPersona } = useAuth();

  const setPersonaById = (id: string) => {
    const found = MOCK_PERSONAS.find((p) => p.id === id);
    if (found) {
      setCurrentPersona(found);
      // Synchronize Phase 6C authorization role
      let appRole: AppRole = 'clinician';
      if (found.role === 'nurse') appRole = 'nurse';
      else if (found.role === 'laboratory') appRole = 'laboratory';
      else if (found.role === 'reviewer') appRole = 'reviewer';
      else if (found.role === 'administrator') appRole = 'organization_admin';
      switchDemoPersona(appRole, found.name);
    }
  };

  return (
    <PersonaContext.Provider value={{ currentPersona, allPersonas: MOCK_PERSONAS, setPersonaById }}>
      {children}
    </PersonaContext.Provider>
  );
};

export const usePersona = () => {
  const context = useContext(PersonaContext);
  if (!context) throw new Error('usePersona must be used within a PersonaProvider');
  return context;
};
