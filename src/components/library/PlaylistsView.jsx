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
  ListMusic
} from 'lucide-react';
import { useDrive } from '../../contexts/DriveContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { useAudio } from '../../contexts/AudioContext';
import { SongRow } from './SongRow';

export function PlaylistsView() {
  const { drivePlaylists, songs } = useDrive();
  const { localPlaylists, createPlaylist, deletePlaylist } = useLibrary();
  const { playSong } = useAudio();

  const [activePlaylist, setActivePlaylist] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

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
      <div className="space-y-4 pb-36 md:pb-28">
        {/* Back navigation */}
        <button
          onClick={() => setActivePlaylist(null)}
          className="min-h-[44px] flex items-center gap-1.5 text-xs font-semibold text-[#fca5a5] hover:text-white transition-colors active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to all playlists</span>
        </button>

        {/* Playlist Header Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#A31C1B]/30 via-[#171717] to-[#171717] border border-[#A31C1B]/40 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#A31C1B]/20 border border-[#A31C1B]/40 text-[#fca5a5] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#A31C1B]/20">
              {activePlaylist.isDriveFolder ? (
                <Folder className="w-7 h-7 text-[#A31C1B]" />
              ) : (
                <ListMusic className="w-7 h-7 text-[#A31C1B]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{activePlaylist.name}</h3>
                {activePlaylist.isDriveFolder && (
                  <span className="text-[10px] uppercase font-semibold text-[#fca5a5] px-2 py-0.5 rounded-full bg-[#06110c] border border-[#A31C1B]/40">
                    Playlist
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
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#171717] hover:bg-[#222222] border border-[#282f2b] text-slate-200 text-xs font-medium transition-all active:scale-95"
                >
                  <Shuffle className="w-3.5 h-3.5 text-[#A31C1B]" />
                  <span>Shuffle</span>
                </button>
                <button
                  onClick={handlePlayAll}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#A31C1B] hover:bg-[#be2524] text-white text-xs font-semibold shadow-md shadow-[#A31C1B]/40 transition-all active:scale-95"
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
    <div className="space-y-6 pb-36 md:pb-28">
      {/* Featured Playlists Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-[#A31C1B]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Featured Playlists ({drivePlaylists.length})
            </h3>
          </div>
        </div>

        {drivePlaylists.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#171717] border border-[#282f2b] text-xs text-slate-400">
            No playlists found. Create folders like "Love", "Sad", or "Party" to automatically generate playlists.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {drivePlaylists.map((folder) => {
              const count = folder.songCount !== undefined
                ? folder.songCount
                : songs.filter((s) => s.folderId === folder.id || s.folderName === folder.name).length;

              return (
                <div
                  key={folder.id}
                  onClick={() => setActivePlaylist({ ...folder, isDriveFolder: true })}
                  className="group p-4 rounded-2xl bg-[#171717] hover:bg-[#222222] border border-[#282f2b] hover:border-[#A31C1B]/60 transition-all cursor-pointer shadow-md flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-[#06110c] border border-[#A31C1B]/40 text-[#A31C1B] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <ListMusic className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#fca5a5] transition-colors">
                        {folder.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {count} {count === 1 ? 'track' : 'tracks'}
                      </p>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-[#222222] group-hover:bg-[#A31C1B] text-slate-300 group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
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
            <ListMusic className="w-4 h-4 text-[#A31C1B]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              My Playlists ({localPlaylists.length})
            </h3>
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
            {localPlaylists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => setActivePlaylist({ ...pl, isDriveFolder: false })}
                className="group p-4 rounded-2xl bg-[#171717] hover:bg-[#222222] border border-[#282f2b] hover:border-[#A31C1B]/60 transition-all cursor-pointer shadow-md flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#06110c] border border-[#A31C1B]/40 text-[#A31C1B] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <ListMusic className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#fca5a5] transition-colors">
                      {pl.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {(pl.songIds || []).length} {pl.songIds?.length === 1 ? 'track' : 'tracks'}
                    </p>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-full bg-[#222222] group-hover:bg-[#A31C1B] text-slate-300 group-hover:text-white flex items-center justify-center transition-colors flex-shrink-0">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
