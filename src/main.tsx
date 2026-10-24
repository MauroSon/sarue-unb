import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ContainerProvider } from './context/ContainerContext';
import './fonts.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ContainerProvider>
      <App />
    </ContainerProvider>
  </React.StrictMode>
);
