import { useEffect, useRef } from 'react';

/**
 * Intelligent PWA Back-Button & Gesture Navigation Hook
 * 
 * Intercepts Android hardware back button, mouse back buttons, and edge swipe-back gestures
 * to gracefully dismiss modals, collapse full-screen players, or navigate back to Home
 * WITHOUT terminating audio playback or closing the PWA abruptly.
 */
export function usePwaBackHandler({
  activeTab,
  setActiveTab,
  isFullPlayerOpen,
  setIsFullPlayerOpen,
  isQueueOpen,
  setIsQueueOpen,
  isSettingsOpen,
  setIsSettingsOpen,
  isUploadOpen,
  setIsUploadOpen,
  isPlaying
}) {
  const lastExitPressRef = useRef(0);
  const isHandlingPopRef = useRef(false);

  // Keep latest state in ref to avoid stale closure issues in popstate listener
  const stateRef = useRef({
    activeTab,
    isFullPlayerOpen,
    isQueueOpen,
    isSettingsOpen,
    isUploadOpen,
    isPlaying
  });

  useEffect(() => {
    stateRef.current = {
      activeTab,
      isFullPlayerOpen,
      isQueueOpen,
      isSettingsOpen,
      isUploadOpen,
      isPlaying
    };
  }, [activeTab, isFullPlayerOpen, isQueueOpen, isSettingsOpen, isUploadOpen, isPlaying]);

  // Initial history sentinel setup so there's always a history state to pop
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Replace current state with app baseline
    if (!window.history.state || !window.history.state.sasApp) {
      window.history.replaceState({ sasApp: true, layer: 'base' }, '');
    }
  }, []);

  // Sync modal states to browser history stack
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isHandlingPopRef.current) return;

    if (isFullPlayerOpen) {
      window.history.pushState({ sasApp: true, layer: 'fullplayer' }, '');
    }
  }, [isFullPlayerOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isHandlingPopRef.current) return;

    if (isQueueOpen) {
      window.history.pushState({ sasApp: true, layer: 'queue' }, '');
    }
  }, [isQueueOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isHandlingPopRef.current) return;

    if (isSettingsOpen) {
      window.history.pushState({ sasApp: true, layer: 'settings' }, '');
    }
  }, [isSettingsOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isHandlingPopRef.current) return;

    if (isUploadOpen) {
      window.history.pushState({ sasApp: true, layer: 'upload' }, '');
    }
  }, [isUploadOpen]);

  // Handle popstate (Back button / swipe-back)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (e) => {
      isHandlingPopRef.current = true;
      const {
        activeTab,
        isFullPlayerOpen,
        isQueueOpen,
        isSettingsOpen,
        isUploadOpen,
        isPlaying
      } = stateRef.current;

      // 1. If Full Player is open: collapse to mini-player, keep music playing
      if (isFullPlayerOpen) {
        setIsFullPlayerOpen(false);
        setTimeout(() => { isHandlingPopRef.current = false; }, 80);
        return;
      }

      // 2. If Queue Drawer is open: close queue, keep music playing
      if (isQueueOpen) {
        setIsQueueOpen(false);
        setTimeout(() => { isHandlingPopRef.current = false; }, 80);
        return;
      }

      // 3. If Settings Modal is open: close settings
      if (isSettingsOpen) {
        setIsSettingsOpen(false);
        setTimeout(() => { isHandlingPopRef.current = false; }, 80);
        return;
      }

      // 4. If Upload Modal is open: close upload modal
      if (isUploadOpen) {
        setIsUploadOpen(false);
        setTimeout(() => { isHandlingPopRef.current = false; }, 80);
        return;
      }

      // 5. If on a sub-tab (search, playlists, favorites, recents): go back to Home
      if (activeTab !== 'songs') {
        setActiveTab('songs');
        // Restore base history state so user can still back again
        window.history.pushState({ sasApp: true, layer: 'base' }, '');
        setTimeout(() => { isHandlingPopRef.current = false; }, 80);
        return;
      }

      // 6. If on Home and song is playing: protect playback from sudden PWA termination
      if (isPlaying) {
        const now = Date.now();
        if (now - lastExitPressRef.current > 2000) {
          // First back press: push sentinel state to keep app & audio alive
          lastExitPressRef.current = now;
          window.history.pushState({ sasApp: true, layer: 'base' }, '');

          showBackgroundToast('Music playing in background • Press back again to exit');
          setTimeout(() => { isHandlingPopRef.current = false; }, 80);
          return;
        }
      }

      // If user pressed back twice or music isn't playing, allow natural exit
      isHandlingPopRef.current = false;
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    setIsFullPlayerOpen,
    setIsQueueOpen,
    setIsSettingsOpen,
    setIsUploadOpen,
    setActiveTab
  ]);
}

/**
 * Lightweight, non-intrusive floating toast notification
 */
function showBackgroundToast(message) {
  if (typeof document === 'undefined') return;

  const existingToast = document.getElementById('sas-bg-toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'sas-bg-toast';
  toast.className = 'fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#171717]/95 border border-[#A31C1B]/60 text-white text-xs font-medium shadow-[0_8px_30px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-all duration-300 pointer-events-none select-none flex items-center gap-2 animate-in fade-in zoom-in-95';
  toast.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span><span>${message}</span>`;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, 10px)';
    setTimeout(() => toast.remove(), 350);
  }, 2200);
}
