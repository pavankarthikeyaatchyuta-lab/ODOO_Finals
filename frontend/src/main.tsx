/**
 * =============================================================================
 * THE ROYAL KNOT - Frontend Application Entry Point
 * =============================================================================
 * Bootstraps the React 19 single-page application into the DOM root element.
 * Applies strict mode checks for development safety and imports global CSS tokens.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

/**
 * Initialize and render the top-level application root.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
