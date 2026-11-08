import React, { useState } from 'react';
import {
  Folder,
  Plus,
  Play,
  Shuffle,
  Music,
  Trash2,
  ChevronLeft,
  FolderPlus,
  ListMusic,
  Cloud
} from 'lucide-react';
import { useDrive } from '../../contexts/DriveContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { useAudio } from '../../contexts/AudioContext';
import { SongRow } from './SongRow';
import { getFolderCoverArt } from '../../services/coverArtService';
import { isVipFolder, isVipUnlocked } from '../../utils/vipConfig';

export function PlaylistsView() {
  const { drivePlaylists, songs } = useDrive();
  const { localPlaylists, createPlaylist, deletePlaylist, currentUser } = useLibrary();
  const { playSong } = useAudio();

  const [activePlaylist, setActivePlaylist] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  // 100% Privacy: Hide VIP folder if not unlocked; pin to top if unlocked
  const visibleDrivePlaylists = React.useMemo(() => {
    const isUnlocked = isVipUnlocked();
    const filtered = (drivePlaylists || []).filter((folder) => {
      if (!isUnlocked && isVipFolder(folder.name)) {
        return false;
      }
      return true;
    });

    if (isUnlocked) {
      filtered.sort((a, b) => {
        const aVip = isVipFolder(a.name);
        const bVip = isVipFolder(b.name);
        if (aVip && !bVip) return -1;
        if (!aVip && bVip) return 1;
        return 0;
      });
    }

    return filtered;
  }, [drivePlaylists]);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setIsCreating(false);
  };

  const getPlaylistSongs = (playlist) => {
    if (!playlist) return [];
    let list = [];
    if (playlist.isDriveFolder) {
      list = songs.filter(
        (s) => s.folderId === playlist.id || s.folderName === playlist.name
      );
    } else {
      const idSet = new Set(playlist.songIds || []);
      list = songs.filter((s) => idSet.has(s.id));
    }
    const seen = new Set();
    return list.filter((s) => {
      if (!s || !s.id || seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  };

  if (activePlaylist) {
    const playlistSongs = getPlaylistSongs(activePlaylist);

    const handlePlayAll = () => {
      if (playlistSongs.length > 0) {
        playSong(playlistSongs[0], playlistSongs);
      }
    };

    const handleShufflePlay = () => {
      if (playlistSongs.length > 0) {
        const shuffled = [...playlistSongs].sort(() => Math.random() - 0.5);
        playSong(shuffled[0], shuffled);
      }
    };

    return (
      <div className="space-y-4 pb-4">
        {/* Back navigation */}
        <button
          onClick={() => setActivePlaylist(null)}
          className="min-h-[44px] flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to all playlists</span>
        </button>

        {/* Playlist Header Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-[#171717] to-[#171717] border border-white/10 shadow-xl overflow-hidden relative">
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/15 flex-shrink-0 shadow-lg relative bg-[#06110c]">
              <img
                src={getFolderCoverArt(activePlaylist.name)}
                alt={activePlaylist.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{activePlaylist.name}</h3>
                {activePlaylist.isDriveFolder && (
                  <span className="text-[10px] uppercase font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25">
                    Drive Folder
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {playlistSongs.length} {playlistSongs.length === 1 ? 'song' : 'songs'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {playlistSongs.length > 0 && (
              <>
                <button
                  onClick={handleShufflePlay}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl glass-card hover:border-white/20 text-slate-200 text-xs font-medium transition-all active:scale-95"
                >
                  <Shuffle className="w-3.5 h-3.5 text-slate-300" />
                  <span>Shuffle</span>
                </button>
                <button
                  onClick={handlePlayAll}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl crimson-glow-btn text-white text-xs font-semibold shadow-md transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Play All</span>
                </button>
              </>
            )}

            {!activePlaylist.isDriveFolder && (
              <button
                onClick={() => {
                  deletePlaylist(activePlaylist.id);
                  setActivePlaylist(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-[#222222] transition-colors"
                title="Delete Playlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Playlist Songs List */}
        {playlistSongs.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl bg-[#171717] border border-dashed border-[#282f2b]">
            <Music className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white">Playlist is empty</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {activePlaylist.isDriveFolder
                ? 'No audio files found in this playlist.'
                : 'Add songs to this playlist by clicking "..." next to any song in the library.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {playlistSongs.map((song, idx) => (
              <SongRow
                key={song.id}
                song={song}
                index={idx}
                playlist={playlistSongs}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {/* Featured Playlists Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-[#A31C1B]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Featured Playlists ({visibleDrivePlaylists.length})
            </h3>
          </div>
        </div>

        {visibleDrivePlaylists.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#171717] border border-[#282f2b] text-xs text-slate-400">
            No playlists found. Create folders like "Love", "Sad", or "Party" to automatically generate playlists.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {visibleDrivePlaylists.map((folder) => {
              const count = folder.songCount !== undefined
                ? folder.songCount
                : songs.filter((s) => s.folderId === folder.id || s.folderName === folder.name).length;
              const coverImg = getFolderCoverArt(folder.name);
              const isVip = isVipFolder(folder.name);
              const vipUnlocked = isVip && isVipUnlocked();

              return (
                <div
                  key={folder.id}
                  onClick={() => setActivePlaylist({ ...folder, isDriveFolder: true })}
                  className={`group p-3.5 rounded-2xl transition-all cursor-pointer shadow-md flex items-center justify-between border ${
                    isVip
                      ? 'bg-gradient-to-r from-rose-950/20 via-[#171717] to-[#171717] border-rose-500/40 hover:border-rose-400 shadow-rose-950/20'
                      : 'bg-[#171717] hover:bg-[#222222] border-[#282f2b] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-13 h-13 w-[52px] h-[52px] rounded-xl overflow-hidden border border-white/15 text-slate-300 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform relative bg-[#06110c] shadow-md">
                      <img
                        src={coverImg}
                        alt={folder.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-white transition-colors">
                        {folder.name}
                      </h4>
                      <p className="text-[11px] mt-0.5 text-slate-400">
                        {count} {count === 1 ? 'track' : 'tracks'}
                      </p>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-[#222222] group-hover:bg-white text-slate-300 group-hover:text-slate-900 flex items-center justify-center transition-colors flex-shrink-0">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Local Playlists Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-slate-300" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              My Playlists ({localPlaylists.length})
            </h3>
            {currentUser && (
              <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full flex items-center gap-1" title="Synced across all devices with your Google account">
                <Cloud className="w-2.5 h-2.5 text-emerald-400" />
                <span>Cloud</span>
              </span>
            )}
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A31C1B] hover:bg-[#be2524] text-white text-xs font-semibold transition-all active:scale-95 shadow-md shadow-[#A31C1B]/35"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Playlist</span>
          </button>
        </div>

        {/* Modal: Create playlist */}
        {isCreating && (
          <form
            onSubmit={handleCreate}
            className="mb-4 p-4 rounded-2xl bg-[#171717] border border-[#A31C1B]/50 shadow-xl flex flex-col sm:flex-row items-center gap-3 animate-slideDown"
          >
            <input
              type="text"
              autoFocus
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Enter playlist name (e.g. My Favorites 2026)..."
              className="w-full sm:flex-1 px-3.5 py-2 text-xs rounded-xl bg-[#222222] border border-[#282f2b] text-white placeholder-slate-500 focus:outline-none focus:border-[#A31C1B]"
            />
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3.5 py-2 rounded-xl text-xs text-slate-300 hover:text-white bg-[#222222]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newPlaylistName.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#A31C1B] hover:bg-[#be2524] text-white disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {localPlaylists.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#171717] border border-dashed border-[#282f2b] text-center">
            <FolderPlus className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-300 font-medium">No custom playlists created yet</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Click "+ New Playlist" above to organize your music library.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {localPlaylists.map((pl) => {
              const coverImg = getFolderCoverArt(pl.name);
              return (
                <div
                  key={pl.id}
                  onClick={() => setActivePlaylist({ ...pl, isDriveFolder: false })}
                  className="group p-3.5 rounded-2xl bg-[#171717] hover:bg-[#222222] border border-[#282f2b] hover:border-white/20 transition-all cursor-pointer shadow-md flex items-center justify-between"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-[52px] h-[52px] rounded-xl overflow-hidden border border-white/15 text-slate-300 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform relative bg-[#06110c] shadow-md">
                      <img
                        src={coverImg}
                        alt={pl.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-white transition-colors">
                        {pl.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {(pl.songIds || []).length} {pl.songIds?.length === 1 ? 'track' : 'tracks'}
                      </p>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-[#222222] group-hover:bg-white text-slate-300 group-hover:text-slate-900 flex items-center justify-center transition-colors flex-shrink-0">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
