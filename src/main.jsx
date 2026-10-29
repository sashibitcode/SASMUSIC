import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { LibraryProvider } from './contexts/LibraryContext';
import { DriveProvider } from './contexts/DriveContext';
import { AudioProvider } from './contexts/AudioContext';
import { registerSW } from 'virtual:pwa-register';

// Auto-register service worker for PWA offline shell & updates
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('New SAS Music content available; reloading.');
    },
    onOfflineReady() {
      console.log('SAS Music is ready for offline playback.');
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LibraryProvider>
      <DriveProvider>
        <AudioProvider>
          <App />
        </AudioProvider>
      </DriveProvider>
    </LibraryProvider>
  </React.StrictMode>
);

