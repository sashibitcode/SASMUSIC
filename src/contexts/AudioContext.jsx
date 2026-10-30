import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { setupMediaSession } from '../services/mediaSession';
import { useLibrary } from './LibraryContext';
import { showFloatingToast } from '../utils/toast';

const AudioContext = createContext(null);

const STORAGE_LAST_SONG = 'sas_last_song';
const STORAGE_LAST_TIME = 'sas_last_position';
const STORAGE_VOLUME = 'sas_volume';
const STORAGE_REPEAT = 'sas_repeat_mode';
const STORAGE_SHUFFLE = 'sas_shuffle_mode';

/**
 * Resolves high-speed streaming URL, bypassing slow/rate-limited googleapis.com endpoints
 */
export const resolveFastAudioUrl = (song) => {
  if (!song) return '';
  if (song.isDemo && song.streamUrl) {
    return song.streamUrl;
  }
  if (song.id) {
    return `/api/stream?id=${encodeURIComponent(song.id)}`;
  }
  return song.streamUrl || '';
};

export function AudioProvider({ children }) {
  const { addToRecentlyPlayed } = useLibrary();

  const audioRef = useRef(new Audio());
  const retryCountRef = useRef(0);

  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_VOLUME);
    return saved !== null ? Number(saved) : 0.8;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [shuffleMode, setShuffleMode] = useState(() => {
    return localStorage.getItem(STORAGE_SHUFFLE) === 'true';
  });
  const [repeatMode, setRepeatMode] = useState(() => {
    return localStorage.getItem(STORAGE_REPEAT) || 'off'; // 'off' | 'all' | 'one'
  });
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [playbackError, setPlaybackError] = useState(null);

  // SyncPlay Integration
  const syncActionHandlerRef = useRef(null);
  const isSyncActionRef = useRef(false);
  const setSyncActionHandler = useCallback((handler) => {
    syncActionHandlerRef.current = handler;
  }, []);

  // Keep a ref to current values to avoid closure issues in audio event listeners
  const stateRef = useRef({
    currentSong,
    queue,
    queueIndex,
    repeatMode,
    shuffleMode,
    currentTime
  });

  useEffect(() => {
    stateRef.current = {
      currentSong,
      queue,
      queueIndex,
      repeatMode,
      shuffleMode,
      currentTime
    };
  }, [currentSong, queue, queueIndex, repeatMode, shuffleMode, currentTime]);

  // Audio element setup and event listeners
  useEffect(() => {
    const audio = audioRef.current;
    audio.preload = 'auto';
    audio.volume = volume;

    const onPlay = () => {
      setIsPlaying(true);
      retryCountRef.current = 0;
      setPlaybackError(null);
    };
    const onPause = () => setIsPlaying(false);
    const onLoadStart = () => setIsLoadingAudio(true);
    const onWaiting = () => setIsLoadingAudio(true);
    const onPlaying = () => {
      setIsLoadingAudio(false);
      setIsPlaying(true);
      setPlaybackError(null);
    };
    const onCanPlay = () => setIsLoadingAudio(false);
    const onSeeked = () => setIsLoadingAudio(false);
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.currentTime > 0) {
        setIsLoadingAudio(false);
      }
      // Save position periodically every ~3 seconds
      if (Math.floor(audio.currentTime) % 3 === 0) {
        localStorage.setItem(STORAGE_LAST_TIME, String(audio.currentTime));
      }
    };
    const onDurationChange = () => {
      if (!isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const onError = (e) => {
      console.warn('Audio playback error:', e);
      setIsLoadingAudio(false);

      const mediaErr = audio.error;
      let errMsg = 'Playback error: failed to stream this audio track.';
      if (mediaErr) {
        switch (mediaErr.code) {
          case 1:
            errMsg = 'Audio playback aborted.';
            break;
          case 2:
            errMsg = 'Network error while streaming audio.';
            break;
          case 3:
            errMsg = 'Audio decoding error.';
            break;
          case 4:
            errMsg = 'Audio format not supported or stream unreachable.';
            break;
        }
      }

      const active = stateRef.current.currentSong;
      // Automatic network retry on transient mobile data drops
      if (retryCountRef.current < 2 && active) {
        retryCountRef.current += 1;
        setIsLoadingAudio(true);
        setTimeout(() => {
          if (audioRef.current && stateRef.current.currentSong) {
            audioRef.current.load();
            audioRef.current.play().catch(console.warn);
          }
        }, 1000);
      } else {
        setIsPlaying(false);
        setPlaybackError(errMsg);
        showFloatingToast(errMsg, 'error');
      }
    };

    // Auto-advance logic
    const onEnded = () => {
      const { repeatMode, queue, queueIndex, currentSong } = stateRef.current;

      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(console.warn);
        return;
      }

      if (queue.length > 0) {
        const nextIndex = queueIndex + 1;
        if (nextIndex < queue.length) {
          playQueueIndex(nextIndex);
        } else if (repeatMode === 'all') {
          playQueueIndex(0);
        } else {
          setIsPlaying(false);
        }
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('loadstart', onLoadStart);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('seeked', onSeeked);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    // Prevent background audio suspension on screen lock / tab switch
    const onVisibilityChange = () => {
      const { isPlaying, currentSong } = stateRef.current;
      if (document.visibilityState === 'visible' && isPlaying && audio.paused && currentSong) {
        audio.play().catch(console.warn);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('loadstart', onLoadStart);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('seeked', onSeeked);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  // Screen WakeLock integration to keep audio pipeline active in background
  useEffect(() => {
    let wakeLock = null;
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && isPlaying) {
      navigator.wakeLock.request('screen').then((lock) => {
        wakeLock = lock;
      }).catch(() => {});
    }

    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
        wakeLock = null;
      }
    };
  }, [isPlaying]);

  // Update audio volume when state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      localStorage.setItem(STORAGE_VOLUME, String(volume));
    }
  }, [volume, isMuted]);

  // Save repeat & shuffle modes
  useEffect(() => {
    localStorage.setItem(STORAGE_REPEAT, repeatMode);
  }, [repeatMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SHUFFLE, String(shuffleMode));
  }, [shuffleMode]);

  // Play a specific queue index
  const playQueueIndex = useCallback((index) => {
    const currentQueue = stateRef.current.queue;
    if (index >= 0 && index < currentQueue.length) {
      const songToPlay = currentQueue[index];
      setQueueIndex(index);
      setCurrentSong(songToPlay);
      setIsLoadingAudio(true);
      setPlaybackError(null);

      const audio = audioRef.current;
      const targetUrl = resolveFastAudioUrl(songToPlay);
      if (audio.src !== targetUrl) {
        audio.src = targetUrl;
        audio.preload = 'auto';
      } else {
        audio.currentTime = 0;
      }
      audio.play().catch((err) => {
        console.warn('Audio play request interrupted:', err);
      });

      addToRecentlyPlayed(songToPlay);
      localStorage.setItem(STORAGE_LAST_SONG, JSON.stringify(songToPlay));
      localStorage.setItem(STORAGE_LAST_TIME, '0');
    }
  }, [addToRecentlyPlayed]);

  // Main playback trigger: plays a song and optionally sets a new queue
  const playSong = useCallback((song, newQueue = null) => {
    if (!song) return;

    let targetQueue = newQueue ? [...newQueue] : [song];
    // Strictly deduplicate targetQueue so no song appears multiple times
    const seenIds = new Set();
    targetQueue = targetQueue.filter((s) => {
      if (!s || !s.id || seenIds.has(s.id)) return false;
      seenIds.add(s.id);
      return true;
    });

    let targetIndex = targetQueue.findIndex((s) => s.id === song.id);

    if (targetIndex === -1) {
      targetQueue = [song, ...targetQueue];
      targetIndex = 0;
    }

    setQueue(targetQueue);
    setQueueIndex(targetIndex);
    setCurrentSong(song);
    setIsLoadingAudio(true);
    setPlaybackError(null);

    const audio = audioRef.current;
    const targetUrl = resolveFastAudioUrl(song);
    if (audio.src !== targetUrl) {
      audio.src = targetUrl;
      audio.preload = 'auto';
    } else {
      audio.currentTime = 0;
    }
    audio.play().catch((err) => {
      console.warn('Playback start error:', err);
    });

    addToRecentlyPlayed(song);
    localStorage.setItem(STORAGE_LAST_SONG, JSON.stringify(song));
    localStorage.setItem(STORAGE_LAST_TIME, '0');

    if (syncActionHandlerRef.current && !isSyncActionRef.current) {
      syncActionHandlerRef.current({
        type: 'CHANGE_SONG',
        song,
        queue: targetQueue,
        queueIndex: targetIndex,
        position: 0,
        isPlaying: true
      });
    }
  }, [addToRecentlyPlayed]);

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!currentSong) return;

    const willPlay = audio.paused;
    if (willPlay) {
      audio.play().catch(console.warn);
    } else {
      audio.pause();
    }

    if (syncActionHandlerRef.current && !isSyncActionRef.current) {
      syncActionHandlerRef.current({
        type: willPlay ? 'PLAY' : 'PAUSE',
        position: audio.currentTime,
        isPlaying: willPlay
      });
    }
  }, [currentSong]);

  // Next track
  const nextTrack = useCallback(() => {
    const { queue, queueIndex, repeatMode } = stateRef.current;
    if (queue.length === 0) return;

    const nextIndex = queueIndex + 1;
    if (nextIndex < queue.length) {
      playQueueIndex(nextIndex);
    } else if (repeatMode === 'all') {
      playQueueIndex(0);
    }
  }, [playQueueIndex]);

  // Previous track (if current time > 3s, re-seeks to 0; else goes to prev song)
  const previousTrack = useCallback(() => {
    const audio = audioRef.current;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    const { queue, queueIndex, repeatMode } = stateRef.current;
    if (queue.length === 0) return;

    const prevIndex = queueIndex - 1;
    if (prevIndex >= 0) {
      playQueueIndex(prevIndex);
    } else if (repeatMode === 'all') {
      playQueueIndex(queue.length - 1);
    } else {
      audio.currentTime = 0;
    }
  }, [playQueueIndex]);

  // Seek to specific time (seconds)
  const seek = useCallback((targetSeconds) => {
    const audio = audioRef.current;
    if (audio && !isNaN(targetSeconds)) {
      setIsLoadingAudio(true);
      audio.currentTime = targetSeconds;
      setCurrentTime(targetSeconds);

      if (syncActionHandlerRef.current && !isSyncActionRef.current) {
        syncActionHandlerRef.current({
          type: 'SEEK',
          position: targetSeconds,
          isPlaying: !audio.paused
        });
      }
    }
  }, []);

  // Set volume
  const setVolume = useCallback((val) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Shuffle toggle
  const toggleShuffle = useCallback(() => {
    setShuffleMode((prev) => {
      const nextShuffle = !prev;
      if (nextShuffle && queue.length > 1) {
        // Shuffle the upcoming songs in queue (keeping current song at head)
        const current = queue[queueIndex];
        const rest = queue.filter((_, idx) => idx !== queueIndex);
        
        // Fisher-Yates shuffle
        for (let i = rest.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [rest[i], rest[j]] = [rest[j], rest[i]];
        }

        const newShuffledQueue = [current, ...rest];
        setQueue(newShuffledQueue);
        setQueueIndex(0);
      }
      return nextShuffle;
    });
  }, [queue, queueIndex]);

  // Repeat toggle: off -> all -> one -> off
  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  // Queue manipulation actions (Deduplicated)
  const addToQueue = useCallback((song) => {
    if (!song || !song.id) return;
    setQueue((prev) => {
      // Do not add if already in queue
      if (prev.some((s) => s.id === song.id)) {
        return prev;
      }
      return [...prev, song];
    });
  }, []);

  const playNextInQueue = useCallback((song) => {
    if (!song || !song.id) return;
    setQueue((prev) => {
      // Remove any existing copy in upcoming queue so it doesn't duplicate
      const filtered = prev.filter((s, idx) => idx === queueIndex || s.id !== song.id);
      const nextQueue = [...filtered];
      nextQueue.splice(queueIndex + 1, 0, song);
      return nextQueue;
    });
  }, [queueIndex]);

  const removeFromQueue = useCallback((indexToRemove) => {
    setQueue((prev) => {
      if (indexToRemove === queueIndex) return prev; // Don't remove currently playing
      const nextQueue = prev.filter((_, idx) => idx !== indexToRemove);
      if (indexToRemove < queueIndex) {
        setQueueIndex((current) => current - 1);
      }
      return nextQueue;
    });
  }, [queueIndex]);

  const clearQueue = useCallback(() => {
    if (currentSong) {
      setQueue([currentSong]);
      setQueueIndex(0);
    } else {
      setQueue([]);
      setQueueIndex(0);
    }
  }, [currentSong]);

  const reorderQueue = useCallback((fromIndex, toIndex) => {
    setQueue((prev) => {
      const result = Array.from(prev);
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });

    if (fromIndex === queueIndex) {
      setQueueIndex(toIndex);
    } else if (fromIndex < queueIndex && toIndex >= queueIndex) {
      setQueueIndex((prev) => prev - 1);
    } else if (fromIndex > queueIndex && toIndex <= queueIndex) {
      setQueueIndex((prev) => prev + 1);
    }
  }, [queueIndex]);

  // Restore last played song on startup
  useEffect(() => {
    try {
      const savedSongStr = localStorage.getItem(STORAGE_LAST_SONG);
      const savedTime = localStorage.getItem(STORAGE_LAST_TIME);

      if (savedSongStr) {
        const parsedSong = JSON.parse(savedSongStr);
        if (parsedSong && parsedSong.streamUrl) {
          setCurrentSong(parsedSong);
          setQueue([parsedSong]);
          setQueueIndex(0);

          const audio = audioRef.current;
          audio.src = resolveFastAudioUrl(parsedSong);
          if (savedTime && !isNaN(savedTime)) {
            const timeNum = Number(savedTime);
            audio.currentTime = timeNum;
            setCurrentTime(timeNum);
          }
        }
      }
    } catch (e) {
      console.warn('Error restoring last played track:', e);
    }
  }, []);

  // Connect native Media Session API
  useEffect(() => {
    if (currentSong) {
      setupMediaSession({
        song: currentSong,
        isPlaying,
        currentTime,
        duration,
        onPlay: togglePlay,
        onPause: togglePlay,
        onNext: nextTrack,
        onPrevious: previousTrack,
        onSeek: seek
      });
    }
  }, [currentSong, isPlaying, duration, togglePlay, nextTrack, previousTrack, seek]);

  return (
    <AudioContext.Provider
      value={{
        currentSong,
        isPlaying,
        isLoadingAudio,
        playbackError,
        currentTime,
        duration,
        volume,
        isMuted,
        queue,
        queueIndex,
        shuffleMode,
        repeatMode,
        isFullPlayerOpen,
        setIsFullPlayerOpen,
        isQueueOpen,
        setIsQueueOpen,
        playSong,
        togglePlay,
        nextTrack,
        previousTrack,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        toggleRepeat,
        addToQueue,
        playNextInQueue,
        removeFromQueue,
        clearQueue,
        reorderQueue,
        setSyncActionHandler,
        isSyncActionRef
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}

