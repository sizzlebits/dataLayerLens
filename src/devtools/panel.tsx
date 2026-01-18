import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DevToolsPanel } from './DevToolsPanel';
import '@/styles/globals.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <DevToolsPanel />
    </StrictMode>
  );
}
