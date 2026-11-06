import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { LibraryProvider } from './contexts/LibraryContext';
import { DriveProvider } from './contexts/DriveContext';
import { AudioProvider } from './contexts/AudioContext';
import { SyncPlayProvider } from './contexts/SyncPlayContext';
import { ClerkProvider } from '@clerk/clerk-react';
import { clerkAppearance, CLERK_PUBLISHABLE_KEY, IS_CLERK_CONFIGURED } from './config/clerkConfig';
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

function RootApp() {
  const content = (
    <LibraryProvider>
      <DriveProvider>
        <AudioProvider>
          <SyncPlayProvider>
            <App />
          </SyncPlayProvider>
        </AudioProvider>
      </DriveProvider>
    </LibraryProvider>
  );

  if (IS_CLERK_CONFIGURED) {
    return (
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY}
        appearance={clerkAppearance}
        afterSignOutUrl="/"
      >
        {content}
      </ClerkProvider>
    );
  }

  return content;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
);
