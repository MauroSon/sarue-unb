import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ContainerProvider } from './context/ContainerContext';
import { logDebug } from './lib/debug-log';
import './fonts.css';
import './index.css';

logDebug('boot — página carregou');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ContainerProvider>
      <App />
    </ContainerProvider>
  </React.StrictMode>
);
