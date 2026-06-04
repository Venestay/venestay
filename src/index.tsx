import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from '@/App';
import { AuthProvider } from '@/features/auth/hooks/AuthContext';

// SPA Resiliency: Auto-reload on chunk load/dynamic import failures (common after new deployments)
const handleChunkError = () => {
  try {
    const lastReload = sessionStorage.getItem('last_chunk_error_reload');
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
      sessionStorage.setItem('last_chunk_error_reload', now.toString());
      window.location.reload();
    }
  } catch (e) {
    console.error('Failed to auto-reload on chunk error:', e);
  }
};

window.addEventListener('error', (event) => {
  const target = event.target as HTMLElement;
  if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
    const src = (target as HTMLScriptElement).src || (target as HTMLLinkElement).href || '';
    if (src.includes('/assets/')) {
      handleChunkError();
    }
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  const errorMsg = event.reason?.message || '';
  if (
    errorMsg.includes('Failed to fetch dynamically imported module') ||
    errorMsg.includes('ChunkLoadError') ||
    errorMsg.includes('Failed to load module script') ||
    errorMsg.includes('Expected a JavaScript-or-Wasm module script')
  ) {
    handleChunkError();
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);






