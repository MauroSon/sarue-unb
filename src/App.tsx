import React, { useState } from 'react';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { CoursesScreen } from './screens/CoursesScreen';
import { GradeBuilderScreen } from './screens/GradeBuilderScreen';
import { MyCourseScreen } from './screens/MyCourseScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { Sidebar, type NavTab } from './components/Sidebar';
import { TooltipProvider, Toaster } from '@/components/ui';
import { useCredentials } from './hooks/useCredentials';
import { SyncProvider, useSync } from './context/SyncContext';
import { DeadlineProvider } from './context/DeadlineContext';
import { NAVIGATE_EVENT } from './lib/utils';

type AppStep = 'onboarding' | 'main';

const AppShell: React.FC = () => {
  const { hasCredentials, isLoading: isCheckingAuth } = useCredentials();
  const { syncAll, isSyncing, lastSyncedAt, steps: syncSteps } = useSync();

  const [step, setStep] = useState<AppStep>('onboarding');
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Usuário recorrente com credenciais salvas pula o onboarding na abertura do app.
  // Roda uma vez no boot apenas: conectar uma plataforma durante o onboarding
  // não deve ejectar o usuário para o app principal no meio do wizard.
  const bootstrapped = React.useRef(false);
  React.useEffect(() => {
    if (isCheckingAuth || bootstrapped.current) return;
    bootstrapped.current = true;
    if (hasCredentials) {
      setStep('main');
    }
  }, [isCheckingAuth, hasCredentials]);

  // Navegação disparada por componentes fora da árvore de tabs (ex.: sino de prazos)
  React.useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ tab: string }>).detail;
      if (detail?.tab) {
        setCurrentTab(detail.tab as NavTab);
      }
    };
    window.addEventListener(NAVIGATE_EVENT, handler);
    return () => window.removeEventListener(NAVIGATE_EVENT, handler);
  }, []);

  // A tela de verificação existe só para o arranque do app. Depois do boot, o
  // loadAll disparado por um save (ex.: conectar SIGAA no onboarding) acende
  // isLoading nesta instância também — renderizar o loading aqui desmontaria
  // o wizard e resetaria o onboarding para o passo 1.
  if (isCheckingAuth && !bootstrapped.current) {
    return (
      <div className="min-h-screen bg-canvas bg-grid flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 bg-unb-blue text-white border-2 border-black rounded-lg flex items-center justify-center font-black text-lg shadow-[4px_4px_0px_0px_#000]">
          UnB
        </div>
        <div className="inline-block animate-spin border-2 border-black border-t-transparent rounded-full h-6 w-6" />
        <p className="text-xs font-bold text-neutral-700">
          Verificando Cofre Seguro...
        </p>
      </div>
    );
  }

  // Fluxo 1: Onboarding animado em 4 passos (bem-vindo, funcionalidades, segurança, login)
  // Sem teste de hasCredentials aqui: conectar uma plataforma dentro do wizard acende
  // hasCredentials e, se o gate testasse, renderizaria o app principal por cima do wizard.
  if (step === 'onboarding') {
    return (
      <OnboardingScreen
        onComplete={() => {
          setStep('main');
          syncAll();
        }}
        onExplore={() => setStep('main')}
      />
    );
  }

  // Fluxo 3: Aplicação Principal (Dashboard com Sidebar Colapsável)
  return (
    <DeadlineProvider>
    <div className="flex h-screen bg-canvas bg-grid overflow-hidden">
      {/* Sidebar Colapsável com Botão de Sincronização no Canto Inferior */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isSyncing={isSyncing}
        onSync={syncAll}
        lastSyncedAt={lastSyncedAt}
        hasConnectedAccounts={Boolean(hasCredentials)}
        syncSteps={syncSteps}
      />

      {/* Área Central de Conteúdo (Sem Header global, títulos direto no corpo) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          {currentTab === 'home' && <DashboardScreen />}
          {currentTab === 'courses' && <CoursesScreen />}
          {currentTab === 'grade' && <GradeBuilderScreen />}
          {currentTab === 'my-course' && <MyCourseScreen />}
          {currentTab === 'settings' && (
            <SettingsScreen
              onResetCredentials={() => {
                setStep('onboarding');
                setCurrentTab('home');
              }}
            />
          )}
        </main>
      </div>
    </div>
    </DeadlineProvider>
  );
};

const App: React.FC = () => (
  <SyncProvider>
    <TooltipProvider delay={150}>
      <Toaster />
      <AppShell />
    </TooltipProvider>
  </SyncProvider>
);

export { App };
