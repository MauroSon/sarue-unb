import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ContainerProvider } from './context/ContainerContext';
import { applyUiZoom, getUiZoom } from './lib/accessibility';
import './fonts.css';
import './index.css';

// Aplica o zoom da interface salvo antes do primeiro paint para evitar flash de layout
applyUiZoom(getUiZoom());

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ContainerProvider>
      <App />
    </ContainerProvider>
  </React.StrictMode>
);
