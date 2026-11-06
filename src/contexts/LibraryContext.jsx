import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { IS_CLERK_CONFIGURED } from '../config/clerkConfig';

const LibraryContext = createContext(null);

const STORAGE_FAVORITES = 'sas_favorites';
const STORAGE_RECENTS = 'sas_recently_played';
const STORAGE_PLAYLISTS = 'sas_local_playlists';

/**
 * Bridge component that securely connects to Clerk's useUser hook
 * only when mounted inside ClerkProvider.
 */
function ClerkSyncBridge({ onSyncUser }) {
  const { user, isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    onSyncUser({ user, isSignedIn, isLoaded });
  }, [user, isSignedIn, isLoaded, onSyncUser]);

  return null;
}

export function LibraryProvider({ children }) {
  // 1. Favorites: Array of song IDs
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FAVORITES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 2. Recently Played: Array of song objects (max 50)
  const [recentlyPlayed, setRecentlyPlayed] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_RECENTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 3. Local custom playlists: Array of { id, name, createdAt, songIds: [] }
  const [localPlaylists, setLocalPlaylists] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PLAYLISTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Active logged-in user state & cloud sync status
  const [currentUser, setCurrentUser] = useState(null);
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const syncTimeoutRef = useRef(null);

  /**
   * Pushes latest state to Clerk Cloud user.unsafeMetadata
   */
  const pushToClerkCloud = useCallback((updatedFavs, updatedPlaylists) => {
    if (!currentUser || typeof currentUser.update !== 'function') return;

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      const metadataPayload = {
        ...currentUser.unsafeMetadata
      };
      if (updatedFavs !== undefined) metadataPayload.favorites = updatedFavs;
      if (updatedPlaylists !== undefined) metadataPayload.playlists = updatedPlaylists;

      currentUser.update({
        unsafeMetadata: metadataPayload
      })
      .then(() => {
        setIsCloudSynced(true);
      })
      .catch((err) => {
        console.warn('Failed syncing library to Clerk Cloud:', err);
      });
    }, 350);
  }, [currentUser]);

  /**
   * Synchronizes user account when user logs in with Gmail/Clerk or logs out
   */
  const handleUserChange = useCallback((clerkData) => {
    const { user, isSignedIn, isLoaded } = clerkData || {};
    if (!isLoaded) return;

    if (isSignedIn && user) {
      setCurrentUser(user);
      const userId = user.id;
      const userFavKey = `sas_favorites_${userId}`;
      const userPlKey = `sas_playlists_${userId}`;

      // A. Pull cloud metadata from Clerk
      const cloudFavs = Array.isArray(user.unsafeMetadata?.favorites)
        ? user.unsafeMetadata.favorites
        : [];
      const cloudPlaylists = Array.isArray(user.unsafeMetadata?.playlists)
        ? user.unsafeMetadata.playlists
        : [];

      // B. Pull user-scoped local cache
      let localUserFavs = [];
      let localUserPlaylists = [];
      try {
        const savedFavs = localStorage.getItem(userFavKey);
        if (savedFavs) localUserFavs = JSON.parse(savedFavs);
        const savedPl = localStorage.getItem(userPlKey);
        if (savedPl) localUserPlaylists = JSON.parse(savedPl);
      } catch (_) {}

      // C. Pull guest items (to merge if user liked songs before logging in)
      let guestFavs = [];
      let guestPlaylists = [];
      try {
        const savedGuestFavs = localStorage.getItem(STORAGE_FAVORITES);
        if (savedGuestFavs) guestFavs = JSON.parse(savedGuestFavs);
        const savedGuestPl = localStorage.getItem(STORAGE_PLAYLISTS);
        if (savedGuestPl) guestPlaylists = JSON.parse(savedGuestPl);
      } catch (_) {}

      // Merge favorites without duplicates
      const mergedFavs = Array.from(new Set([...cloudFavs, ...localUserFavs, ...guestFavs]));
      setFavorites(mergedFavs);
      try {
        localStorage.setItem(userFavKey, JSON.stringify(mergedFavs));
      } catch (_) {}

      // Merge playlists by playlist ID
      const plMap = new Map();
      cloudPlaylists.forEach((p) => p && p.id && plMap.set(p.id, p));
      localUserPlaylists.forEach((p) => p && p.id && plMap.set(p.id, p));
      guestPlaylists.forEach((p) => p && p.id && plMap.set(p.id, p));
      const mergedPlaylists = Array.from(plMap.values());
      setLocalPlaylists(mergedPlaylists);
      try {
        localStorage.setItem(userPlKey, JSON.stringify(mergedPlaylists));
      } catch (_) {}

      setIsCloudSynced(true);

      // If new merged items exist that weren't in cloud yet, sync back to Clerk
      if (mergedFavs.length > cloudFavs.length || mergedPlaylists.length > cloudPlaylists.length) {
        user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            favorites: mergedFavs,
            playlists: mergedPlaylists
          }
        }).catch((e) => console.warn('Initial cloud merge sync warning:', e));
      }

      // D. Send Real-Time Telegram Login Alert (session-deduplicated)
      try {
        const sessionAlertKey = `sas_login_alert_${userId}`;
        if (typeof window !== 'undefined' && !sessionStorage.getItem(sessionAlertKey)) {
          sessionStorage.setItem(sessionAlertKey, String(Date.now()));
          fetch('/api/notify-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              userName: user.fullName || user.firstName || 'Music Listener',
              userEmail: user.primaryEmailAddress?.emailAddress || 'Not Provided',
              authProvider: user.externalAccounts?.[0]?.providerTitle || 'Google',
              userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
            })
          }).catch((err) => {
            console.debug('Login alert dispatch warning:', err);
          });
        }
      } catch (_) {}
    } else {
      // User is signed out: fallback to guest storage
      setCurrentUser(null);
      setIsCloudSynced(false);
      try {
        if (typeof window !== 'undefined') {
          Object.keys(sessionStorage).forEach((k) => {
            if (k.startsWith('sas_login_alert_')) sessionStorage.removeItem(k);
          });
        }
      } catch (_) {}
      try {
        const savedFavs = localStorage.getItem(STORAGE_FAVORITES);
        setFavorites(savedFavs ? JSON.parse(savedFavs) : []);
        const savedPl = localStorage.getItem(STORAGE_PLAYLISTS);
        setLocalPlaylists(savedPl ? JSON.parse(savedPl) : []);
      } catch (_) {}
    }
  }, []);

  // Sync recents to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_RECENTS, JSON.stringify(recentlyPlayed));
    } catch (e) {
      console.warn('Failed saving recents to localStorage:', e);
    }
  }, [recentlyPlayed]);

  // Favorite actions
  const toggleFavorite = (songId) => {
    if (!songId) return;
    setFavorites((prev) => {
      const next = prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [songId, ...prev];

      // Save to localStorage (user-scoped or guest)
      const storageKey = currentUser ? `sas_favorites_${currentUser.id}` : STORAGE_FAVORITES;
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (_) {}

      // Push to Clerk Cloud User Metadata
      pushToClerkCloud(next, undefined);
      return next;
    });
  };

  const isFavorite = (songId) => favorites.includes(songId);

  // Recently played action
  const addToRecentlyPlayed = (song) => {
    if (!song || !song.id) return;
    setRecentlyPlayed((prev) => {
      const filtered = prev.filter((item) => item.id !== song.id);
      return [
        {
          id: song.id,
          name: song.name,
          title: song.title,
          artist: song.artist,
          streamUrl: song.streamUrl,
          folderName: song.folderName,
          playedAt: new Date().toISOString()
        },
        ...filtered
      ].slice(0, 50);
    });
  };

  const clearRecentlyPlayed = () => {
    setRecentlyPlayed([]);
  };

  // Custom playlist actions
  const createPlaylist = (name) => {
    if (!name || !name.trim()) return null;
    const newPlaylist = {
      id: `local-pl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      createdAt: new Date().toISOString(),
      songIds: [],
      isCustom: true
    };

    setLocalPlaylists((prev) => {
      const next = [newPlaylist, ...prev];
      const storageKey = currentUser ? `sas_playlists_${currentUser.id}` : STORAGE_PLAYLISTS;
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (_) {}

      // Push to Clerk Cloud User Metadata
      pushToClerkCloud(undefined, next);
      return next;
    });

    return newPlaylist;
  };

  const deletePlaylist = (playlistId) => {
    setLocalPlaylists((prev) => {
      const next = prev.filter((p) => p.id !== playlistId);
      const storageKey = currentUser ? `sas_playlists_${currentUser.id}` : STORAGE_PLAYLISTS;
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (_) {}

      pushToClerkCloud(undefined, next);
      return next;
    });
  };

  const renamePlaylist = (playlistId, newName) => {
    if (!newName || !newName.trim()) return;
    setLocalPlaylists((prev) => {
      const next = prev.map((p) => (p.id === playlistId ? { ...p, name: newName.trim() } : p));
      const storageKey = currentUser ? `sas_playlists_${currentUser.id}` : STORAGE_PLAYLISTS;
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (_) {}

      pushToClerkCloud(undefined, next);
      return next;
    });
  };

  const addSongToPlaylist = (playlistId, songId) => {
    setLocalPlaylists((prev) => {
      const next = prev.map((p) => {
        if (p.id === playlistId) {
          if (!p.songIds.includes(songId)) {
            return { ...p, songIds: [...p.songIds, songId] };
          }
        }
        return p;
      });

      const storageKey = currentUser ? `sas_playlists_${currentUser.id}` : STORAGE_PLAYLISTS;
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (_) {}

      pushToClerkCloud(undefined, next);
      return next;
    });
  };

  const removeSongFromPlaylist = (playlistId, songId) => {
    setLocalPlaylists((prev) => {
      const next = prev.map((p) => {
        if (p.id === playlistId) {
          return { ...p, songIds: p.songIds.filter((id) => id !== songId) };
        }
        return p;
      });

      const storageKey = currentUser ? `sas_playlists_${currentUser.id}` : STORAGE_PLAYLISTS;
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (_) {}

      pushToClerkCloud(undefined, next);
      return next;
    });
  };

  return (
    <LibraryContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
        recentlyPlayed,
        addToRecentlyPlayed,
        clearRecentlyPlayed,
        localPlaylists,
        createPlaylist,
        deletePlaylist,
        renamePlaylist,
        addSongToPlaylist,
        removeSongFromPlaylist,
        isCloudSynced,
        currentUser
      }}
    >
      {/* Clerk Sync Bridge mounts safely inside ClerkProvider */}
      {IS_CLERK_CONFIGURED && <ClerkSyncBridge onSyncUser={handleUserChange} />}
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}
