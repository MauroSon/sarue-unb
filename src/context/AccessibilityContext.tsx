import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { MotionConfig } from 'motion/react';
import {
  applyUiZoom,
  getReducedMotionPreference,
  getUiZoom,
  setReducedMotionPreference,
  type UiZoom,
} from '@/lib/accessibility';

interface AccessibilityContextValue {
  /** true = animações reduzidas incondicionalmente (override do toggle). */
  reduceAnimations: boolean;
  setReduceAnimations: (reduced: boolean) => void;
  /** Zoom atual da interface (paradas de 90% / 100% / 125%). */
  uiZoom: UiZoom;
  setUiZoom: (zoom: UiZoom) => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(
  null,
);

/**
 * Fonte única das preferências de acessibilidade: expõe as preferências
 * para as telas, aplica o MotionConfig global (os componentes motion
 * obedecem ao toggle; com "user" seguem o sistema operacional) e aplica o
 * zoom salvo na abertura do app.
 */
export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [reduceAnimations, setReduceAnimationsState] = useState<boolean>(() =>
    getReducedMotionPreference(),
  );
  const [uiZoom, setUiZoomState] = useState<UiZoom>(() => getUiZoom());

  // Sincroniza a classe html.reduce-motion no boot e a cada alteração
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('reduce-motion', reduceAnimations);
    }
  }, [reduceAnimations]);

  const setReduceAnimations = useCallback((reduced: boolean) => {
    setReducedMotionPreference(reduced);
    setReduceAnimationsState(reduced);
  }, []);

  const setUiZoom = useCallback((zoom: UiZoom) => {
    setUiZoomState(zoom);
    applyUiZoom(zoom);
  }, []);

  const value = useMemo(
    () => ({ reduceAnimations, setReduceAnimations, uiZoom, setUiZoom }),
    [reduceAnimations, setReduceAnimations, uiZoom, setUiZoom],
  );

  return (
    <AccessibilityContext.Provider value={value}>
      <MotionConfig reducedMotion={reduceAnimations ? 'always' : 'user'}>
        {children}
      </MotionConfig>
    </AccessibilityContext.Provider>
  );
};

export function useAccessibility(): AccessibilityContextValue {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      'useAccessibility deve ser usado dentro de AccessibilityProvider',
    );
  }
  return context;
}
