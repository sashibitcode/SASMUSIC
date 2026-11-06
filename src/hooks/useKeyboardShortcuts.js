import { useEffect } from 'react';
import { useAudio } from '../contexts/AudioContext';
import { useLibrary } from '../contexts/LibraryContext';

export function useKeyboardShortcuts() {
  const {
    currentSong,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    currentTime,
    duration,
    volume,
    setVolume,
    toggleMute
  } = useAudio();

  const { toggleFavorite } = useLibrary();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is currently typing in an input, textarea or contenteditable
      const target = e.target;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            nextTrack();
          } else {
            seek(Math.min(duration || 0, currentTime + 5));
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            previousTrack();
          } else {
            seek(Math.max(0, currentTime - 5));
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.05));
          break;

        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.05));
          break;

        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;

        case 'KeyF':
          if (currentSong) {
            e.preventDefault();
            toggleFavorite(currentSong.id);
          }
          break;

        case 'KeyN':
          e.preventDefault();
          nextTrack();
          break;

        case 'KeyP':
          e.preventDefault();
          previousTrack();
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentSong,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    currentTime,
    duration,
    volume,
    setVolume,
    toggleMute,
    toggleFavorite
  ]);
}

