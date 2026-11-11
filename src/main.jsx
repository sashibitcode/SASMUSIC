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
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Auto-register service worker for PWA offline shell & updates
if ('serviceWorker' in navigator) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('New SAS Music content available; applying update.');
      // Instantly activate the new service worker and refresh the client with latest assets
      updateSW(true);
    },
    onOfflineReady() {
      console.log('SAS Music is ready for offline playback.');
    }
  });

  // Check for newly deployed updates every time the user re-opens or switches back to the app
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          reg.update().catch(() => {});
        }
      }).catch(() => {});
    }
  });

  // Periodic background check every 30 minutes
  setInterval(() => {
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) {
        reg.update().catch(() => {});
      }
    }).catch(() => {});
  }, 30 * 60 * 1000);
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
    <ErrorBoundary>
      <RootApp />
    </ErrorBoundary>
  </React.StrictMode>
);
