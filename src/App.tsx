import React from 'react';
import { AuthProvider } from './features/authentication/AuthProvider';
import { PersonaProvider } from './app/providers/PersonaContext';
import { CaseProvider } from './app/providers/CaseContext';
import { DrawerProvider } from './app/providers/DrawerContext';
import { AppShell } from './app/app-shell/AppShell';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <PersonaProvider>
        <CaseProvider>
          <DrawerProvider>
            <AppShell />
          </DrawerProvider>
        </CaseProvider>
      </PersonaProvider>
    </AuthProvider>
  );
};
