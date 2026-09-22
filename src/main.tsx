// Safeguard for environments where window.fetch only has a getter
if (typeof window !== 'undefined') {
  try {
    const desc = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (desc && desc.configurable && !desc.set) {
      let customFetch: typeof window.fetch | undefined;
      const origGet = desc.get;
      Object.defineProperty(window, 'fetch', {
        get() {
          return customFetch !== undefined ? customFetch : (origGet ? origGet.call(this) : undefined);
        },
        set(val: typeof window.fetch) {
          customFetch = val;
        },
        configurable: true,
        enumerable: desc.enumerable !== undefined ? desc.enumerable : true,
      });
    }
  } catch {
    // Ignore if not configurable
  }
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
