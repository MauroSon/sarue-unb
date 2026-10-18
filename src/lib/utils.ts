import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Evento DOM para navegação entre tabs a partir de componentes sem acesso ao estado do App. */
export const NAVIGATE_EVENT = 'sarue:navigate';

export function navigateToTab(tab: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(NAVIGATE_EVENT, { detail: { tab } }));
}

export async function openExternalUrl(url: string): Promise<void> {
  if (!url) return;
  if (!/^https?:\/\//i.test(url)) {
    console.warn('Blocked unsafe external URL scheme:', url);
    return;
  }
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    try {
      const { commands } = await import('@/core/infrastructure/bindings');
      const response = await commands.openExternalUrl(url);
      if (response.status === 'error') {
        throw new Error(response.error);
      }
      return;
    } catch (e) {
      console.warn('Erro ao abrir link externo via Tauri, usando fallback:', e);
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

