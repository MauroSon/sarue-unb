import React from 'react';
import { Home, BookOpen, CalendarDays, Settings, PanelLeftClose, PanelLeftOpen, RefreshCw, GraduationCap } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui';
import { SyncStatusTooltip } from './SyncStatusTooltip';
import { DeadlineBell } from './notifications/DeadlineBell';
import type { SyncStepInfo } from '../context/SyncContext';

export type NavTab = 'home' | 'courses' | 'grade' | 'my-course' | 'settings';

export interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isSyncing?: boolean;
  onSync?: () => void;
  lastSyncedAt?: string | null;
  hasConnectedAccounts?: boolean;
  syncSteps?: Record<'sigaa' | 'aprender3' | 'teams' | 'myCourse' | 'ghPages', SyncStepInfo>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isSyncing = false,
  onSync,
  lastSyncedAt,
  hasConnectedAccounts = false,
  syncSteps,
}) => {
  const navItems = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'courses' as NavTab, label: 'Disciplinas', icon: BookOpen },
    { id: 'grade' as NavTab, label: 'Montar Grade', icon: CalendarDays },
    { id: 'my-course' as NavTab, label: 'Meu Curso', icon: GraduationCap },
    { id: 'settings' as NavTab, label: 'Configurações', icon: Settings },
  ];

  const formatLastSync = (isoString?: string | null) => {
    if (!isoString) return 'Não sincronizado';
    try {
      let date = new Date(isoString);
      if (isNaN(date.getTime())) {
        const numeric = Number(isoString.replace(/[^0-9]/g, ''));
        if (numeric > 0) {
          date = new Date(numeric < 1e11 ? numeric * 1000 : numeric);
        }
      }
      if (isNaN(date.getTime())) return 'Não sincronizado';
      return `Último: ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return '';
    }
  };

  const activeSyncStep = syncSteps
    ? (['sigaa', 'aprender3', 'myCourse', 'teams', 'ghPages'] as const)
        .map((id) => syncSteps[id])
        .find((s) => s?.status === 'syncing')
    : undefined;

  return (
    <aside
      className={`group h-screen bg-white border-r-2 border-black flex flex-col justify-between transition-[width] duration-200 select-none z-20 shrink-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Topo da Sidebar */}
      <div>
        {/* Header da Sidebar */}
        <div className="p-4 border-b-2 border-black flex items-center justify-between min-h-[69px]">
          {!isCollapsed ? (
            <>
              {/* Quando expandido: Logo e nome */}
              <button
                type="button"
                onClick={() => onSelectTab('home')}
                title="Ir para a Home"
                aria-label="Ir para a Home"
                className="cursor-pointer flex items-center gap-2.5 min-w-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue focus-visible:ring-offset-2"
              >
                <div className="w-9 h-9 bg-unb-blue text-white border-2 border-black rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-[2px_2px_0px_0px_#000]">
                  UnB
                </div>
                <span className="font-extrabold text-sm tracking-tight truncate text-black">
                  UnB <span className="text-[#468AFB]">Aggregator</span>
                </span>
              </button>

              {/* Botão de Colapsar: só visível no hover-group da sidebar */}
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Recolher barra lateral"
                className="cursor-pointer p-1.5 border-2 border-black rounded-lg bg-white hover:bg-neutral-100 text-black shadow-[2px_2px_0px_0px_#000] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue focus-visible:ring-offset-2 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-[transform,box-shadow,background-color,border-color] opacity-0 group-hover:opacity-100"
              >
                <PanelLeftClose className="w-4 h-4 stroke-[2.5]" />
              </button>
            </>
          ) : (
            /* Quando colapsado: normal exibe o ícone da plataforma, no hover-group substitui pelo botão de expandir */
            <div className="w-full flex justify-center">
              {/* Ícone da plataforma (visível por padrão, oculto no hover-group) */}
              <div className="flex group-hover:hidden items-center justify-center">
                <button
                  type="button"
                  onClick={() => onSelectTab('home')}
                  title="Ir para a Home"
                  aria-label="Ir para a Home"
                  className="cursor-pointer w-9 h-9 bg-unb-blue text-white border-2 border-black rounded-xl flex items-center justify-center font-black text-xs shadow-[2px_2px_0px_0px_#000] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue focus-visible:ring-offset-2"
                >
                  UnB
                </button>
              </div>

              {/* Botão de Expandir (oculto por padrão, substitui o ícone no hover-group) */}
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Expandir barra lateral"
                className="cursor-pointer hidden group-hover:flex w-9 h-9 items-center justify-center border-2 border-black rounded-lg bg-neo-blue hover:bg-neo-blueHover text-white shadow-[2px_2px_0px_0px_#000] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue focus-visible:ring-offset-2 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-[transform,box-shadow,background-color,border-color]"
              >
                <PanelLeftOpen className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>

        {/* Lista de Navegação - Estilo Opção 1 (Ledger/Binder full-bleed neobrutalism.dev) */}
        <nav className="border-b-2 border-black">
          <ul className="flex flex-col">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <li key={item.id} className="border-b-2 border-black last:border-b-0">
                  <button
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    title={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    className={`cursor-pointer w-full flex items-center select-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-colors duration-150 ${
                      isCollapsed
                        ? 'justify-center py-3.5 px-2'
                        : 'gap-3 px-4 py-3.5 text-left'
                    } ${
                      isActive
                        ? 'bg-neo-blue text-white font-black'
                        : 'bg-white text-neutral-800 hover:bg-neutral-100 font-bold'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0 stroke-[2.5]" />
                    {!isCollapsed ? (
                      <span className="text-sm font-extrabold tracking-tight">{item.label}</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Canto Inferior da Sidebar: Botão de Sincronizar com Efeito Macio */}
      <div className="p-3 border-t-2 border-black">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger
                type="button"
                onClick={isSyncing || !hasConnectedAccounts ? undefined : onSync}
                aria-disabled={isSyncing || !hasConnectedAccounts}
                className={`min-w-0 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 font-bold text-xs rounded-2xl border-2 transition-[transform,box-shadow,background-color,border-color] duration-150 ease-out select-none ${
                  !hasConnectedAccounts || isSyncing
                    ? 'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed shadow-none'
                    : 'cursor-pointer bg-neo-blue hover:bg-neo-blueHover text-white border-black focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue focus-visible:ring-offset-2 focus-visible:ring-offset-white shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                }`}
              >
                <RefreshCw className={`w-4 h-4 stroke-[2.5] ${isSyncing || activeSyncStep ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
              </TooltipTrigger>
              {syncSteps && (
                <TooltipContent
                  side="top"
                  align="center"
                  sideOffset={8}
                  className="p-0 border-2 border-black rounded-lg overflow-hidden"
                >
                  <SyncStatusTooltip
                    steps={syncSteps}
                    isSyncing={isSyncing || Boolean(activeSyncStep)}
                    lastSyncedAt={lastSyncedAt ?? null}
                  />
                </TooltipContent>
              )}
            </Tooltip>
            <DeadlineBell />
            </div>
            <p className="text-[11px] text-neutral-500 font-semibold text-center truncate">
              {formatLastSync(lastSyncedAt)}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Tooltip>
              <TooltipTrigger
                type="button"
                onClick={isSyncing || !hasConnectedAccounts ? undefined : onSync}
                aria-disabled={isSyncing || !hasConnectedAccounts}
                className={`w-10 h-10 flex items-center justify-center rounded-2xl border-2 transition-[transform,box-shadow,background-color,border-color] duration-150 ease-out select-none ${
                  !hasConnectedAccounts || isSyncing
                    ? 'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed shadow-none'
                    : 'cursor-pointer bg-neo-blue hover:bg-neo-blueHover text-white border-black focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-neo-blue focus-visible:ring-offset-2 focus-visible:ring-offset-white shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                }`}
              >
                <RefreshCw className={`w-4 h-4 stroke-[2.5] ${isSyncing ? 'animate-spin' : ''}`} />
              </TooltipTrigger>
              {syncSteps && (
                <TooltipContent
                  side="right"
                  align="center"
                  sideOffset={12}
                  className="p-0 border-2 border-black rounded-lg overflow-hidden"
                >
                  <SyncStatusTooltip
                    steps={syncSteps}
                    isSyncing={isSyncing}
                    lastSyncedAt={lastSyncedAt ?? null}
                  />
                </TooltipContent>
              )}
            </Tooltip>
            <DeadlineBell />
          </div>
        )}
      </div>
    </aside>
  );
};
