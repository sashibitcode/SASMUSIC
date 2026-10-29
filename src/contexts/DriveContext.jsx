import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getActiveConfig } from '../config';
import { fetchDriveLibrary, deduplicateSongs, DEMO_SONGS, DEMO_PLAYLISTS } from '../services/driveService';

const DriveContext = createContext(null);

const STORAGE_CACHED_SONGS = 'sas_cached_songs_v2';
const STORAGE_CACHED_PLAYLISTS = 'sas_cached_playlists_v2';

export function DriveProvider({ children }) {
  const [config, setConfig] = useState(getActiveConfig());
  const [useDemo, setUseDemo] = useState(false);

  // Initialize from cache with strict deduplication
  const [songs, setSongs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CACHED_SONGS);
      return saved ? deduplicateSongs(JSON.parse(saved)) : [];
    } catch (_) {
      return [];
    }
  });

  const [drivePlaylists, setDrivePlaylists] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CACHED_PLAYLISTS);
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CACHED_SONGS);
      return !saved || JSON.parse(saved).length === 0;
    } catch (_) {
      return true;
    }
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const syncTimerRef = useRef(null);

  // Sync function
  const loadLibrary = useCallback(async (isBackground = false) => {
    const currentConfig = getActiveConfig();
    setConfig(currentConfig);

    // If user explicitly chose demo mode or config is missing, fall back to demo mode
    if (useDemo || !currentConfig.isConfigured) {
      if (!isBackground && songs.length === 0) setIsLoading(true);
      setError(null);
      setTimeout(() => {
        setSongs(DEMO_SONGS);
        setDrivePlaylists(DEMO_PLAYLISTS);
        setLastSyncedAt(new Date());
        setIsLoading(false);
        setIsSyncing(false);
      }, 300);
      return;
    }

    if (isBackground || songs.length > 0) {
      setIsSyncing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await fetchDriveLibrary(currentConfig.folderId, currentConfig.apiKey);
      const uniqueSongs = deduplicateSongs(data.songs);
      setSongs(uniqueSongs);
      setDrivePlaylists(data.playlists);
      setLastSyncedAt(new Date());
      setError(null);

      // Persist to cache
      try {
        localStorage.setItem(STORAGE_CACHED_SONGS, JSON.stringify(uniqueSongs));
        localStorage.setItem(STORAGE_CACHED_PLAYLISTS, JSON.stringify(data.playlists));
      } catch (cacheErr) {
        console.warn('Could not cache songs to localStorage:', cacheErr);
      }
    } catch (err) {
      console.error('Failed to sync Drive library:', err);
      // Only set UI error if it's not a background sync error and no songs exist
      if (songs.length === 0) {
        setError(err);
      }
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [useDemo, songs.length]);

  // Initial load
  useEffect(() => {
    loadLibrary(false);
  }, [useDemo]);

  // Periodic 60s background sync
  useEffect(() => {
    if (syncTimerRef.current) clearInterval(syncTimerRef.current);

    syncTimerRef.current = setInterval(() => {
      // Only run auto-sync if window is visible and online
      if (typeof document !== 'undefined' && !document.hidden && navigator.onLine && config.isConfigured && !useDemo) {
        loadLibrary(true);
      }
    }, 60000); // every 60 seconds

    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, [loadLibrary, config.isConfigured, useDemo]);

  // Listen to online event to auto retry
  useEffect(() => {
    const handleOnline = () => {
      if (error && error.code === 'OFFLINE') {
        loadLibrary(false);
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [error, loadLibrary]);

  const updateConfig = (newFolderId, newApiKey) => {
    if (typeof window !== 'undefined') {
      if (newFolderId) localStorage.setItem('sas_folder_id', newFolderId.trim());
      if (newApiKey) localStorage.setItem('sas_api_key', newApiKey.trim());
    }
    const updated = getActiveConfig();
    setConfig(updated);
    setUseDemo(false);
    loadLibrary(false);
  };

  const toggleDemoMode = () => {
    setUseDemo((prev) => !prev);
  };

  return (
    <DriveContext.Provider
      value={{
        songs,
        drivePlaylists,
        isLoading,
        isSyncing,
        error,
        lastSyncedAt,
        isConfigured: config.isConfigured,
        isDemo: useDemo || !config.isConfigured,
        config,
        refreshLibrary: () => loadLibrary(false),
        updateConfig,
        toggleDemoMode
      }}
    >
      {children}
    </DriveContext.Provider>
  );
}

export function useDrive() {
  const context = useContext(DriveContext);
  if (!context) {
    throw new Error('useDrive must be used within a DriveProvider');
  }
  return context;
}

