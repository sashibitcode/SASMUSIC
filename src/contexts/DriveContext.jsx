import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getActiveConfig } from '../config';
import { fetchDriveLibrary, deduplicateSongs, DEMO_SONGS, DEMO_PLAYLISTS } from '../services/driveService';
import { autoSyncVipFolder, saveOnlineSongToOffline } from '../services/vipAutoSync';
import {
  isVipUnlocked,
  isVipFolder,
  getCustomOfflineSongs,
  removeSongFromOffline,
  isSongInOffline,
  getVipActiveMode,
  setVipActiveMode,
  lockVip
} from '../utils/vipConfig';

const DriveContext = createContext(null);

const STORAGE_CACHED_SONGS = 'sas_cached_songs_v4';
const STORAGE_CACHED_PLAYLISTS = 'sas_cached_playlists_v4';

function migrateFastStreamUrls(songList) {
  if (!Array.isArray(songList)) return [];
  return songList.map((s) => {
    if (!s || !s.id) return s;
    if (s.isDemo) return s;
    return {
      ...s,
      streamUrl: `/api/stream?id=${encodeURIComponent(s.id)}`,
      fallbackStreamUrl: `https://drive.google.com/uc?export=download&id=${encodeURIComponent(s.id)}`
    };
  });
}

export function DriveProvider({ children }) {
  const [config, setConfig] = useState(getActiveConfig());
  const [useDemo, setUseDemo] = useState(false);

  // Initialize from cache with strict deduplication & fast stream URL migration
  const [songs, setSongs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CACHED_SONGS) || localStorage.getItem('sas_cached_songs_v3') || localStorage.getItem('sas_cached_songs_v2');
      return saved ? deduplicateSongs(migrateFastStreamUrls(JSON.parse(saved))) : [];
    } catch (_) {
      return [];
    }
  });

  const [drivePlaylists, setDrivePlaylists] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CACHED_PLAYLISTS) || localStorage.getItem('sas_cached_playlists_v3') || localStorage.getItem('sas_cached_playlists_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CACHED_SONGS) || localStorage.getItem('sas_cached_songs_v3') || localStorage.getItem('sas_cached_songs_v2');
      return !saved || JSON.parse(saved).length === 0;
    } catch (_) {
      return true;
    }
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [vipUnlocked, setVipUnlocked] = useState(() => isVipUnlocked());
  const [vipActiveMode, setVipActiveModeState] = useState(() => getVipActiveMode());
  const [customOfflineSongs, setCustomOfflineSongs] = useState(() => getCustomOfflineSongs());

  // Listen to live VIP unlock/lock events to instantly show/hide private collection
  useEffect(() => {
    const handleVipChange = (e) => {
      setVipUnlocked(Boolean(e.detail?.unlocked ?? isVipUnlocked()));
      setCustomOfflineSongs(getCustomOfflineSongs());
    };
    const handleModeChange = (e) => {
      setVipActiveModeState(e.detail?.mode || getVipActiveMode());
    };
    window.addEventListener('sas-vip-change', handleVipChange);
    window.addEventListener('sas-vip-mode-change', handleModeChange);
    return () => {
      window.removeEventListener('sas-vip-change', handleVipChange);
      window.removeEventListener('sas-vip-mode-change', handleModeChange);
    };
  }, []);

  // Combined offline songs: Google Drive "For You ❤️" + user custom-sent tracks
  const offlineSongs = React.useMemo(() => {
    if (!vipUnlocked) return [];
    const driveVip = songs.filter((s) => isVipFolder(s.folderName));
    const seen = new Set();
    const combined = [];
    for (const song of [...driveVip, ...customOfflineSongs]) {
      if (song && song.id && !seen.has(song.id)) {
        seen.add(song.id);
        combined.push(song);
      }
    }
    return combined;
  }, [songs, customOfflineSongs, vipUnlocked]);

  // Filter songs & playlists: 100% hide VIP tracks if not unlocked on this device
  const visibleSongs = React.useMemo(() => {
    if (vipUnlocked) return songs;
    return songs.filter((s) => !isVipFolder(s.folderName));
  }, [songs, vipUnlocked]);

  const visiblePlaylists = React.useMemo(() => {
    if (vipUnlocked) return drivePlaylists;
    return drivePlaylists.filter((f) => !isVipFolder(f.name));
  }, [drivePlaylists, vipUnlocked]);

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

      // Background VIP Auto-Sync: automatically download new songs from 'For You ❤️'
      setTimeout(() => {
        autoSyncVipFolder(uniqueSongs);
      }, 1500);
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

  // Auto-sync VIP folder whenever device connects to internet / comes online
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Network] Internet connected. Triggering background Drive sync...');
      loadLibrary(true);
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [loadLibrary]);

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
        songs: visibleSongs,
        allSongs: songs,
        drivePlaylists: visiblePlaylists,
        isVipUnlocked: vipUnlocked,
        offlineSongs,
        vipActiveMode,
        switchVipMode: (mode) => {
          setVipActiveMode(mode);
          setVipActiveModeState(mode);
        },
        saveSongToOffline: (song) => saveOnlineSongToOffline(song),
        removeSongFromOffline: (songId) => removeSongFromOffline(songId),
        isSongInOffline: (songId) => isSongInOffline(songId, songs.filter((s) => isVipFolder(s.folderName))),
        lockPrivateSpace: () => lockVip(),
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

