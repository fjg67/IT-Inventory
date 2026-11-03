import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { applyInvenBotMotionPreference, readInvenBotMotionPreference } from './components/invenbot/motion';
import './styles.css';

applyInvenBotMotionPreference(readInvenBotMotionPreference());

// Applique dès le démarrage la préférence globale « Réduire les animations » (sinon active seulement sur Paramètres).
try {
  if (window.localStorage.getItem('it-inventory-web-motion-preference') === 'reduce') {
    document.documentElement.classList.add('reduce-motion');
  }
} catch {
  // Stockage indisponible : on suit la préférence système.
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
