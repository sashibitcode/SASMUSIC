import { useEffect, useRef } from 'react';
import { showFloatingToast } from '../utils/toast';

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
  isSyncModalOpen,
  setIsSyncModalOpen,
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
    isSyncModalOpen,
    isPlaying
  });

  useEffect(() => {
    stateRef.current = {
      activeTab,
      isFullPlayerOpen,
      isQueueOpen,
      isSettingsOpen,
      isUploadOpen,
      isSyncModalOpen,
      isPlaying
    };
  }, [activeTab, isFullPlayerOpen, isQueueOpen, isSettingsOpen, isUploadOpen, isSyncModalOpen, isPlaying]);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isHandlingPopRef.current) return;

    if (isSyncModalOpen) {
      window.history.pushState({ sasApp: true, layer: 'syncmodal' }, '');
    }
  }, [isSyncModalOpen]);

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

      // 5. If SyncPlay Modal is open: close sync modal
      if (isSyncModalOpen) {
        setIsSyncModalOpen(false);
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

          showFloatingToast('Music playing in background • Press back again to exit');
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

