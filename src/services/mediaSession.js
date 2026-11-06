/**
 * Media Session API integration
 * Powers lock-screen controls, iOS/Android notification controls,
 * Bluetooth headsets, smartwatch controls, and background playback.
 */

import { generateArtworkDataUri } from '../utils/artGenerator';
import { getCachedCoverArt, fetchSongCoverArt } from './coverArtService';

export function setupMediaSession({
  song,
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onSeek
}) {
  if (!('mediaSession' in navigator) || !song) return;

  try {
    // Absolute URLs required by Android/iOS notification systems for background artwork
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const artworkUri = generateArtworkDataUri(song.title, song.artist);
    const cachedCover = getCachedCoverArt(song.title, song.artist);
    const coverArtUrl = song.coverArt || cachedCover?.highRes || cachedCover?.thumb;

    const artworkList = [];
    if (coverArtUrl) {
      artworkList.push({ src: coverArtUrl, sizes: '600x600', type: 'image/jpeg' });
    }
    artworkList.push(
      { src: artworkUri, sizes: '512x512', type: 'image/svg+xml' },
      { src: origin ? `${origin}/pwa-512x512.png` : '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: origin ? `${origin}/pwa-192x192.png` : '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: origin ? `${origin}/maskable-icon.png` : '/maskable-icon.png', sizes: '512x512', type: 'image/png' }
    );

    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: song.title || 'Unknown Title',
      artist: song.artist || 'SAS Music',
      album: song.folderName || 'SAS Music',
      artwork: artworkList
    });

    // If artwork wasn't in cache yet, fetch it asynchronously and update lockscreen poster
    if (!coverArtUrl) {
      fetchSongCoverArt(song.title, song.artist)
        .then((res) => {
          if (res?.highRes && 'mediaSession' in navigator && navigator.mediaSession.metadata) {
            if (navigator.mediaSession.metadata.title === (song.title || 'Unknown Title')) {
              navigator.mediaSession.metadata.artwork = [
                { src: res.highRes, sizes: '600x600', type: 'image/jpeg' },
                ...artworkList
              ];
            }
          }
        })
        .catch(() => {});
    }

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    // Update position state for scrub bar on lockscreen (if supported and valid)
    if ('setPositionState' in navigator.mediaSession && duration && !isNaN(duration) && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(0, duration),
          playbackRate: 1,
          position: Math.min(Math.max(0, currentTime || 0), duration)
        });
      } catch (posErr) {
        // Safe ignore if audio position is updating rapidly
      }
    }

    // Set action handlers
    const actionHandlers = [
      ['play', onPlay],
      ['pause', onPause],
      ['previoustrack', onPrevious],
      ['nexttrack', onNext],
      ['seekto', (details) => {
        if (details.seekTime !== undefined && onSeek) {
          onSeek(details.seekTime);
        }
      }],
      ['seekbackward', (details) => {
        if (onSeek) {
          const offset = details.seekOffset || 10;
          onSeek(Math.max(0, (currentTime || 0) - offset));
        }
      }],
      ['seekforward', (details) => {
        if (onSeek) {
          const offset = details.seekOffset || 10;
          onSeek(Math.min(duration || 0, (currentTime || 0) + offset));
        }
      }]
    ];

    actionHandlers.forEach(([action, handler]) => {
      try {
        if (handler) {
          navigator.mediaSession.setActionHandler(action, handler);
        } else {
          navigator.mediaSession.setActionHandler(action, null);
        }
      } catch {
        // Some browsers may not support specific actions
      }
    });
  } catch (err) {
    console.warn('MediaSession update error:', err);
  }
}

