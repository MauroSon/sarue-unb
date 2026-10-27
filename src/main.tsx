import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ContainerProvider } from './context/ContainerContext';
import { applyUiZoom, getUiZoom } from './lib/accessibility';
import { applyTheme, getThemeMode } from './lib/theme';
import './fonts.css';
import './index.css';

// Aplica o zoom da interface salvo antes do primeiro paint para evitar flash de layout
applyUiZoom(getUiZoom());
// Tema salvo antes do primeiro paint: sem flash claro→escuro na abertura.
applyTheme(getThemeMode());

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ContainerProvider>
      <App />
    </ContainerProvider>
  </React.StrictMode>
);
