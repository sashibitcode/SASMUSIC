import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { IS_CLERK_CONFIGURED } from '../config/clerkConfig';

const LibraryContext = createContext(null);

const STORAGE_FAVORITES = 'sas_favorites';
const STORAGE_RECENTS = 'sas_recently_played';
const STORAGE_PLAYLISTS = 'sas_local_playlists';
const STORAGE_PLAY_COUNTS = 'sas_song_play_counts';

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

  // 4. Play Counts: Map of { [songId]: number }
  const [playCounts, setPlayCounts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PLAY_COUNTS);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Active logged-in user state & cloud sync status
  const [currentUser, setCurrentUser] = useState(null);
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const syncTimeoutRef = useRef(null);

  /**
   * Pushes latest state to Clerk Cloud user.unsafeMetadata
   */
  const pushToClerkCloud = useCallback((updatedFavs, updatedPlaylists, updatedPlayCounts) => {
    if (!currentUser || typeof currentUser.update !== 'function') return;

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      const metadataPayload = {
        ...currentUser.unsafeMetadata
      };
      if (updatedFavs !== undefined) metadataPayload.favorites = updatedFavs;
      if (updatedPlaylists !== undefined) metadataPayload.playlists = updatedPlaylists;
      if (updatedPlayCounts !== undefined) metadataPayload.playCounts = updatedPlayCounts;

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

      // C. Pull guest items & counts (to merge if user liked/played songs before logging in)
      let guestFavs = [];
      let guestPlaylists = [];
      let guestPlayCounts = {};
      try {
        const savedGuestFavs = localStorage.getItem(STORAGE_FAVORITES);
        if (savedGuestFavs) guestFavs = JSON.parse(savedGuestFavs);
        const savedGuestPl = localStorage.getItem(STORAGE_PLAYLISTS);
        if (savedGuestPl) guestPlaylists = JSON.parse(savedGuestPl);
        const savedGuestCounts = localStorage.getItem(STORAGE_PLAY_COUNTS);
        if (savedGuestCounts) guestPlayCounts = JSON.parse(savedGuestCounts);
      } catch (_) {}

      // D. Merge play counts
      const userCountsKey = `sas_play_counts_${userId}`;
      let localUserCounts = {};
      try {
        const savedCounts = localStorage.getItem(userCountsKey);
        if (savedCounts) localUserCounts = JSON.parse(savedCounts);
      } catch (_) {}

      const cloudPlayCounts = (user.unsafeMetadata?.playCounts && typeof user.unsafeMetadata.playCounts === 'object')
        ? user.unsafeMetadata.playCounts
        : {};

      const mergedCounts = { ...guestPlayCounts, ...localUserCounts, ...cloudPlayCounts };
      for (const [sId, c] of Object.entries(localUserCounts)) {
        if (cloudPlayCounts[sId]) mergedCounts[sId] = Math.max(cloudPlayCounts[sId], c);
      }
      setPlayCounts(mergedCounts);
      try {
        localStorage.setItem(userCountsKey, JSON.stringify(mergedCounts));
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
            playlists: mergedPlaylists,
            playCounts: mergedCounts
          }
        }).catch((e) => console.warn('Initial cloud merge sync warning:', e));
      }

      // D. Send Real-Time Telegram Alert ONLY when a NEW user explicitly signs in (Never on app open/reload)
      try {
        if (typeof window !== 'undefined') {
          const userNotifiedKey = `sas_user_notified_${userId}`;
          const isLocallyNotified = Boolean(localStorage.getItem(userNotifiedKey));
          const isMetadataNotified = Boolean(user.unsafeMetadata?.telegramNotified);

          // Check if an explicit 'Sign In' click occurred in this session within last 15 minutes
          const signInActionTs = sessionStorage.getItem('sas_sign_in_initiated');
          const isExplicitSignIn = Boolean(
            signInActionTs && (Date.now() - Number(signInActionTs) < 15 * 60 * 1000)
          );

          // If this is just an app open / session restore (no explicit Sign In click), DO NOT NOTIFY
          if (!isExplicitSignIn) {
            if (!isLocallyNotified) {
              localStorage.setItem(userNotifiedKey, 'true');
            }
            if (!isMetadataNotified) {
              user.update({
                unsafeMetadata: {
                  ...user.unsafeMetadata,
                  telegramNotified: true
                }
              }).catch(() => {});
            }
          } else {
            // User explicitly clicked Sign In button
            sessionStorage.removeItem('sas_sign_in_initiated');

            // Only notify if this user hasn't been notified before (brand new user sign-in)
            if (!isLocallyNotified && !isMetadataNotified) {
              localStorage.setItem(userNotifiedKey, 'true');
              user.update({
                unsafeMetadata: {
                  ...user.unsafeMetadata,
                  telegramNotified: true
                }
              }).catch(() => {});

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
          }
        }
      } catch (_) {}
    } else {
      // User is signed out: fallback to guest storage
      setCurrentUser(null);
      setIsCloudSynced(false);
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('sas_sign_in_initiated');
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
        const savedCounts = localStorage.getItem(STORAGE_PLAY_COUNTS);
        setPlayCounts(savedCounts ? JSON.parse(savedCounts) : {});
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

  // Recently played action & play count tracking
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

    // Increment play count for regular tracking
    setPlayCounts((prev) => {
      const updated = {
        ...prev,
        [song.id]: (prev[song.id] || 0) + 1
      };

      const storageKey = currentUser ? `sas_play_counts_${currentUser.id}` : STORAGE_PLAY_COUNTS;
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (_) {}

      // Push updated playCounts to Clerk Cloud
      pushToClerkCloud(undefined, undefined, updated);
      return updated;
    });
  };

  /**
   * Computes user's top regular / frequent songs
   */
  const getRegularSongs = useCallback((allSongs = [], limit = 12) => {
    if (!Array.isArray(allSongs) || allSongs.length === 0) return [];

    const songMap = new Map();
    allSongs.forEach((s) => s && s.id && songMap.set(s.id, s));

    const scored = new Map();

    // 1. Count score: 10 pts per play
    Object.entries(playCounts).forEach(([sId, count]) => {
      if (songMap.has(sId)) {
        scored.set(sId, (count || 1) * 10);
      }
    });

    // 2. Recency bonus: up to 20 pts for recent playback
    recentlyPlayed.forEach((rec, idx) => {
      if (rec && rec.id && songMap.has(rec.id)) {
        const cur = scored.get(rec.id) || 0;
        const bonus = Math.max(0, 20 - idx * 2);
        scored.set(rec.id, cur + bonus);
      }
    });

    // 3. Favorite bonus: 8 pts
    favorites.forEach((favId) => {
      if (songMap.has(favId)) {
        const cur = scored.get(favId) || 0;
        scored.set(favId, cur + 8);
      }
    });

    if (scored.size === 0) return [];

    return Array.from(scored.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([sId]) => songMap.get(sId))
      .filter(Boolean)
      .slice(0, limit);
  }, [playCounts, recentlyPlayed, favorites]);

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
        currentUser,
        playCounts,
        getRegularSongs
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
