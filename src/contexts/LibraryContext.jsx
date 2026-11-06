import React, { createContext, useContext, useState, useEffect } from 'react';

const LibraryContext = createContext(null);

const STORAGE_FAVORITES = 'sas_favorites';
const STORAGE_RECENTS = 'sas_recently_played';
const STORAGE_PLAYLISTS = 'sas_local_playlists';

export function LibraryProvider({ children }) {
  // 1. Favorites: Set of song IDs
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

  // Sync favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FAVORITES, JSON.stringify(favorites));
    } catch (e) {
      console.warn('Failed saving favorites to localStorage:', e);
    }
  }, [favorites]);

  // Sync recents to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_RECENTS, JSON.stringify(recentlyPlayed));
    } catch (e) {
      console.warn('Failed saving recents to localStorage:', e);
    }
  }, [recentlyPlayed]);

  // Sync local playlists to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PLAYLISTS, JSON.stringify(localPlaylists));
    } catch (e) {
      console.warn('Failed saving playlists to localStorage:', e);
    }
  }, [localPlaylists]);

  // Favorite actions
  const toggleFavorite = (songId) => {
    if (!songId) return;
    setFavorites((prev) => {
      if (prev.includes(songId)) {
        return prev.filter((id) => id !== songId);
      } else {
        return [songId, ...prev];
      }
    });
  };

  const isFavorite = (songId) => favorites.includes(songId);

  // Recently played action
  const addToRecentlyPlayed = (song) => {
    if (!song || !song.id) return;
    setRecentlyPlayed((prev) => {
      // Remove previous entry of the same song if exists
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
      ].slice(0, 50); // limit to last 50
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
    setLocalPlaylists((prev) => [newPlaylist, ...prev]);
    return newPlaylist;
  };

  const deletePlaylist = (playlistId) => {
    setLocalPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
  };

  const renamePlaylist = (playlistId, newName) => {
    if (!newName || !newName.trim()) return;
    setLocalPlaylists((prev) =>
      prev.map((p) => (p.id === playlistId ? { ...p, name: newName.trim() } : p))
    );
  };

  const addSongToPlaylist = (playlistId, songId) => {
    setLocalPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          if (!p.songIds.includes(songId)) {
            return { ...p, songIds: [...p.songIds, songId] };
          }
        }
        return p;
      })
    );
  };

  const removeSongFromPlaylist = (playlistId, songId) => {
    setLocalPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          return { ...p, songIds: p.songIds.filter((id) => id !== songId) };
        }
        return p;
      })
    );
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
        removeSongFromPlaylist
      }}
    >
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

