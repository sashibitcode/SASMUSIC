import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { SyncClient } from '../services/sync/syncClient';
import { DriftController } from '../services/sync/driftController';
import { getServerTime, getClockOffset, getEstimatedRTT, syncClockWithServer } from '../services/sync/clockSync';
import { useAudio } from './AudioContext';
import { showFloatingToast } from '../utils/toast';

const STORAGE_USER_ID = 'sas_sync_user_id';
const STORAGE_USER_NAME = 'sas_sync_user_name';

const AVATAR_COLORS = [
  '#A31C1B', // Crimson
  '#059669', // Emerald
  '#2563eb', // Blue
  '#d97706', // Amber
  '#7c3aed', // Purple
  '#db2777'  // Pink
];

function getOrCreateUserId() {
  if (typeof window === 'undefined') return 'user_temp';
  let id = localStorage.getItem(STORAGE_USER_ID);
  if (!id) {
    id = 'u_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem(STORAGE_USER_ID, id);
  }
  return id;
}

function getStoredUserName() {
  if (typeof window === 'undefined') return 'Music Fan';
  return localStorage.getItem(STORAGE_USER_NAME) || `Music Fan #${Math.floor(100 + Math.random() * 900)}`;
}

function getAvatarColor(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const SyncPlayContext = createContext(null);

export function SyncPlayProvider({ children }) {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    playSong,
    togglePlay,
    seek,
    queue,
    queueIndex,
    setSyncActionHandler,
    isSyncActionRef,
    audioRef
  } = useAudio();

  // User Profile
  const [userId] = useState(getOrCreateUserId);
  const [userName, setUserNameState] = useState(getStoredUserName);
  const avatarColor = getAvatarColor(userId);

  // Sync Room State
  const [roomCode, setRoomCode] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [hostId, setHostId] = useState(null);
  const [hostName, setHostName] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED'); // DISCONNECTED | CONNECTING | CONNECTED | RECONNECTING
  const [membersMap, setMembersMap] = useState(new Map());
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [needsUserGesture, setNeedsUserGesture] = useState(false);

  // Synchronization Telemetry
  const [measuredDriftMs, setMeasuredDriftMs] = useState(0);
  const [driftStatus, setDriftStatus] = useState('PERFECT_SYNC'); // PERFECT_SYNC | CATCHING_UP | SLOWING_DOWN | BUFFERING
  const [scheduledCountdownMs, setScheduledCountdownMs] = useState(0);

  const clientRef = useRef(null);
  const driftControllerRef = useRef(null);
  const scheduledTimerRef = useRef(null);
  const lastAuthoritativeStateRef = useRef(null);

  // Initialize Drift Controller on audioRef
  useEffect(() => {
    if (audioRef?.current) {
      driftControllerRef.current = new DriftController(audioRef.current);
    }
  }, [audioRef]);

  const stateRef = useRef({
    roomCode,
    isHost,
    hostId,
    currentSong,
    isPlaying,
    currentTime,
    queue,
    queueIndex
  });

  useEffect(() => {
    stateRef.current = {
      roomCode,
      isHost,
      hostId,
      currentSong,
      isPlaying,
      currentTime,
      queue,
      queueIndex
    };
  }, [roomCode, isHost, hostId, currentSong, isPlaying, currentTime, queue, queueIndex]);

  const setUserName = (name) => {
    const trimmed = name.trim();
    if (trimmed) {
      setUserNameState(trimmed);
      localStorage.setItem(STORAGE_USER_NAME, trimmed);
    }
  };

  const members = Array.from(membersMap.values()).sort((a, b) => {
    if (a.isHost) return -1;
    if (b.isHost) return 1;
    return a.userName.localeCompare(b.userName);
  });

  // Prune inactive members every 5 seconds
  useEffect(() => {
    if (!roomCode) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setMembersMap((prev) => {
        let changed = false;
        const next = new Map(prev);
        for (const [id, m] of next.entries()) {
          if (id !== userId && now - m.lastSeen > 16000) {
            next.delete(id);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [roomCode, userId]);

  // Host Continuous Synchronization Heartbeat (every 3 seconds)
  useEffect(() => {
    if (!isHost || !clientRef.current || !roomCode) return;

    const interval = setInterval(() => {
      const { currentSong: s, isPlaying: p, currentTime: t, queue: q, queueIndex: qi } = stateRef.current;
      if (s && clientRef.current) {
        clientRef.current.publishState({
          type: 'SYNC_STATE',
          song: s,
          isPlaying: p,
          position: t,
          queue: q,
          queueIndex: qi,
          serverTimestamp: getServerTime()
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isHost, roomCode]);

  /**
   * Continuous High-Precision Drift Loop (Runs every 300ms)
   * Calculates difference between local playback position and authoritative server timeline.
   */
  useEffect(() => {
    if (!roomCode || isHost || !driftControllerRef.current || !audioRef?.current) return;

    const interval = setInterval(() => {
      const auth = lastAuthoritativeStateRef.current;
      if (!auth || !auth.song) return;

      const audio = audioRef.current;
      if (!audio || audio.readyState < 2) {
        setDriftStatus('BUFFERING');
        return;
      }

      // Calculate expected position from authoritative server timestamp
      const nowServer = getServerTime();
      const elapsedSeconds = Math.max(0, (nowServer - (auth.serverTimestamp || nowServer)) / 1000);
      const expectedPosition = auth.position + (auth.isPlaying ? elapsedSeconds : 0);

      // Evaluate drift and apply micro-rate tuning or gentle realign
      const result = driftControllerRef.current.evaluate(expectedPosition, auth.isPlaying);
      setMeasuredDriftMs(result.driftMs);
      setDriftStatus(result.status);
    }, 300);

    return () => clearInterval(interval);
  }, [roomCode, isHost, audioRef]);

  /**
   * Executes a synchronized playback schedule across all connected devices
   */
  const executeScheduledPlayback = useCallback((scheduledTime, targetSong, targetPosition) => {
    if (scheduledTimerRef.current) {
      clearTimeout(scheduledTimerRef.current);
      scheduledTimerRef.current = null;
    }

    const audio = audioRef.current;
    if (!audio) return;

    const nowServer = getServerTime();
    const delay = scheduledTime - nowServer;

    // 1. Ensure track is cued
    if (isSyncActionRef) isSyncActionRef.current = true;
    if (targetSong && (!stateRef.current.currentSong || stateRef.current.currentSong.id !== targetSong.id)) {
      playSong(targetSong);
    }

    // 2. Schedule exact start
    if (delay > 0) {
      setScheduledCountdownMs(delay);
      audio.currentTime = Math.max(0, targetPosition);

      scheduledTimerRef.current = setTimeout(() => {
        setScheduledCountdownMs(0);
        audio.currentTime = Math.max(0, targetPosition);
        audio.play().catch((err) => {
          if (err?.name === 'NotAllowedError') {
            setNeedsUserGesture(true);
          }
        });
        if (isSyncActionRef) isSyncActionRef.current = false;
      }, delay);
    } else {
      // Late arrival: compute exact offset from missed schedule
      const elapsed = Math.abs(delay) / 1000;
      const accuratePos = targetPosition + elapsed;
      audio.currentTime = Math.max(0, accuratePos);
      audio.play().catch((err) => {
        if (err?.name === 'NotAllowedError') {
          setNeedsUserGesture(true);
        }
      });
      if (isSyncActionRef) isSyncActionRef.current = false;
    }
  }, [audioRef, playSong, isSyncActionRef]);

  // Handle incoming authoritative state from Host (retained on broker)
  const handleHostState = useCallback((state) => {
    if (stateRef.current.isHost) return;

    const { song, isPlaying: hostPlaying, position, serverTimestamp, hostName: hName, hostId: hId } = state;
    if (!song) return;

    setHostId(hId);
    if (hName) setHostName(hName);

    lastAuthoritativeStateRef.current = {
      song,
      isPlaying: hostPlaying,
      position: position || 0,
      serverTimestamp: serverTimestamp || getServerTime()
    };

    const nowServer = getServerTime();
    const elapsed = Math.max(0, (nowServer - (serverTimestamp || nowServer)) / 1000);
    const expectedPosition = (position || 0) + (hostPlaying ? elapsed : 0);

    const { currentSong: localSong } = stateRef.current;
    const audio = audioRef.current;

    // Late Joiner or Track Change
    if (!localSong || localSong.id !== song.id) {
      if (isSyncActionRef) isSyncActionRef.current = true;
      playSong(song);
      setTimeout(() => {
        if (audio) {
          audio.currentTime = expectedPosition;
          if (hostPlaying) {
            audio.play().catch((err) => {
              if (err?.name === 'NotAllowedError') setNeedsUserGesture(true);
            });
          } else {
            audio.pause();
          }
        }
        if (isSyncActionRef) isSyncActionRef.current = false;
      }, 350);
      return;
    }

    // Play/Pause State Synchronization
    if (audio) {
      if (!hostPlaying && !audio.paused) {
        audio.pause();
        audio.currentTime = position || 0;
      } else if (hostPlaying && audio.paused) {
        audio.currentTime = expectedPosition;
        audio.play().catch((err) => {
          if (err?.name === 'NotAllowedError') setNeedsUserGesture(true);
        });
      }
    }
  }, [audioRef, playSong, isSyncActionRef]);

  // Handle transient actions broadcast by Host
  const handleHostAction = useCallback((action) => {
    if (stateRef.current.isHost) return;

    const { type, position, song, scheduledStartTime, serverTimestamp, senderName } = action;

    if (type === 'ROOM_CLOSED') {
      showFloatingToast(`The host (${senderName || 'Host'}) has closed the SyncPlay room.`, 'info');
      disconnectRoom();
      return;
    }

    const audio = audioRef.current;

    switch (type) {
      case 'SCHEDULED_PLAY':
        lastAuthoritativeStateRef.current = {
          song,
          isPlaying: true,
          position: position || 0,
          serverTimestamp: scheduledStartTime || getServerTime()
        };
        executeScheduledPlayback(scheduledStartTime || (getServerTime() + 100), song, position || 0);
        break;

      case 'PAUSE':
        if (scheduledTimerRef.current) {
          clearTimeout(scheduledTimerRef.current);
          scheduledTimerRef.current = null;
        }
        lastAuthoritativeStateRef.current = {
          song: song || stateRef.current.currentSong,
          isPlaying: false,
          position: position || 0,
          serverTimestamp: serverTimestamp || getServerTime()
        };
        if (audio) {
          audio.pause();
          if (position !== undefined) audio.currentTime = position;
        }
        break;

      case 'SEEK':
        lastAuthoritativeStateRef.current = {
          song: stateRef.current.currentSong,
          isPlaying: action.isPlaying,
          position: position || 0,
          serverTimestamp: serverTimestamp || getServerTime()
        };
        if (action.isPlaying && scheduledStartTime) {
          executeScheduledPlayback(scheduledStartTime, stateRef.current.currentSong, position || 0);
        } else if (audio && position !== undefined) {
          audio.currentTime = position;
        }
        break;

      case 'CHANGE_SONG':
        if (song) {
          lastAuthoritativeStateRef.current = {
            song,
            isPlaying: true,
            position: 0,
            serverTimestamp: scheduledStartTime || getServerTime()
          };
          executeScheduledPlayback(scheduledStartTime || (getServerTime() + 700), song, 0);
        }
        break;

      default:
        break;
    }
  }, [audioRef, executeScheduledPlayback]);

  // Handle presence updates from members
  const handlePresenceUpdate = useCallback((p) => {
    if (!p || !p.userId) return;

    if (p.status === 'left') {
      setMembersMap((prev) => {
        const next = new Map(prev);
        next.delete(p.userId);
        return next;
      });
      return;
    }

    setMembersMap((prev) => {
      const next = new Map(prev);
      next.set(p.userId, {
        userId: p.userId,
        userName: p.userName || 'Guest',
        isHost: Boolean(p.isHost),
        avatarColor: p.avatarColor || '#059669',
        status: p.status || 'active',
        lastSeen: Date.now()
      });
      return next;
    });

    if (p.isHost && p.userName) {
      setHostName(p.userName);
    }
  }, []);

  // Hook into AudioContext to broadcast Host events with Scheduled Playback
  useEffect(() => {
    if (!setSyncActionHandler) return;

    setSyncActionHandler((action) => {
      const { isHost: activeIsHost, roomCode: activeCode } = stateRef.current;
      if (!activeIsHost || !activeCode || !clientRef.current) return;

      const nowServer = getServerTime();

      if (action.type === 'PLAY') {
        // Schedule future start 650ms ahead so all connected devices buffer and play together
        const scheduledStartTime = nowServer + 650;
        const currentPos = action.position !== undefined ? action.position : (audioRef?.current?.currentTime || 0);

        clientRef.current.publishAction({
          type: 'SCHEDULED_PLAY',
          song: stateRef.current.currentSong,
          position: currentPos,
          scheduledStartTime
        });

        clientRef.current.publishState({
          type: 'SYNC_STATE',
          song: stateRef.current.currentSong,
          isPlaying: true,
          position: currentPos,
          serverTimestamp: scheduledStartTime
        });

        executeScheduledPlayback(scheduledStartTime, stateRef.current.currentSong, currentPos);
      } else if (action.type === 'PAUSE') {
        const currentPos = action.position !== undefined ? action.position : (audioRef?.current?.currentTime || 0);
        clientRef.current.publishAction({
          type: 'PAUSE',
          position: currentPos,
          song: stateRef.current.currentSong
        });

        clientRef.current.publishState({
          type: 'SYNC_STATE',
          song: stateRef.current.currentSong,
          isPlaying: false,
          position: currentPos,
          serverTimestamp: nowServer
        });
      } else if (action.type === 'SEEK') {
        const targetPos = action.position || 0;
        const scheduledStartTime = nowServer + 450;

        clientRef.current.publishAction({
          type: 'SEEK',
          position: targetPos,
          isPlaying: action.isPlaying,
          scheduledStartTime
        });

        clientRef.current.publishState({
          type: 'SYNC_STATE',
          song: stateRef.current.currentSong,
          isPlaying: action.isPlaying,
          position: targetPos,
          serverTimestamp: scheduledStartTime
        });

        if (action.isPlaying) {
          executeScheduledPlayback(scheduledStartTime, stateRef.current.currentSong, targetPos);
        }
      } else if (action.type === 'CHANGE_SONG') {
        const scheduledStartTime = nowServer + 700;

        clientRef.current.publishAction({
          type: 'CHANGE_SONG',
          song: action.song,
          position: 0,
          scheduledStartTime
        });

        clientRef.current.publishState({
          type: 'SYNC_STATE',
          song: action.song,
          isPlaying: true,
          position: 0,
          serverTimestamp: scheduledStartTime
        });

        executeScheduledPlayback(scheduledStartTime, action.song, 0);
      }
    });

    return () => setSyncActionHandler(null);
  }, [setSyncActionHandler, executeScheduledPlayback, audioRef]);

  // Disconnect from room
  const disconnectRoom = useCallback(() => {
    if (scheduledTimerRef.current) {
      clearTimeout(scheduledTimerRef.current);
      scheduledTimerRef.current = null;
    }
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    if (driftControllerRef.current) {
      driftControllerRef.current.reset();
    }
    setRoomCode(null);
    setIsHost(false);
    setHostId(null);
    setHostName('');
    setConnectionStatus('DISCONNECTED');
    setMembersMap(new Map());
    setNeedsUserGesture(false);
    setMeasuredDriftMs(0);
    setDriftStatus('PERFECT_SYNC');
    lastAuthoritativeStateRef.current = null;
  }, []);

  // Create Room (Host)
  const createRoom = useCallback(async (customHostName) => {
    disconnectRoom();
    await syncClockWithServer();

    if (customHostName) setUserName(customHostName);
    const activeHostName = customHostName || userName;
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const userProfile = {
      userId,
      userName: activeHostName,
      isHost: true,
      avatarColor
    };

    const client = new SyncClient(code, userProfile);
    clientRef.current = client;

    client.onStatusChange((status) => setConnectionStatus(status));
    client.onState((s) => handleHostState(s));
    client.onAction((a) => handleHostAction(a));
    client.onPresence((p) => handlePresenceUpdate(p));

    setRoomCode(code);
    setIsHost(true);
    setHostId(userId);
    setHostName(activeHostName);
    setMembersMap(new Map([[userId, { ...userProfile, lastSeen: Date.now() }]]));

    client.connect();

    // If a track is already loaded, publish state with current server timestamp
    const { currentSong: s, isPlaying: p, currentTime: t, queue: q, queueIndex: qi } = stateRef.current;
    if (s) {
      setTimeout(() => {
        client.publishState({
          type: 'SYNC_STATE',
          song: s,
          isPlaying: p,
          position: t,
          queue: q,
          queueIndex: qi,
          serverTimestamp: getServerTime()
        });
      }, 500);
    }

    showFloatingToast(`Sync Room #${code} created! You are the host.`, 'info');
    return code;
  }, [disconnectRoom, userName, userId, avatarColor, handleHostState, handleHostAction, handlePresenceUpdate]);

  // Join Room (Guest)
  const joinRoom = useCallback(async (code, customUserName) => {
    const cleanCode = String(code).trim().replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      showFloatingToast('Please enter a valid 6-digit room code.', 'error');
      return false;
    }

    disconnectRoom();
    await syncClockWithServer();

    if (customUserName) setUserName(customUserName);
    const activeUserName = customUserName || userName;

    const userProfile = {
      userId,
      userName: activeUserName,
      isHost: false,
      avatarColor
    };

    const client = new SyncClient(cleanCode, userProfile);
    clientRef.current = client;

    client.onStatusChange((status) => setConnectionStatus(status));
    client.onState((s) => handleHostState(s));
    client.onAction((a) => handleHostAction(a));
    client.onPresence((p) => handlePresenceUpdate(p));

    setRoomCode(cleanCode);
    setIsHost(false);
    setMembersMap(new Map([[userId, { ...userProfile, lastSeen: Date.now() }]]));

    client.connect();
    showFloatingToast(`Joined Sync Room #${cleanCode}! Syncing with host...`, 'info');
    return true;
  }, [disconnectRoom, userName, userId, avatarColor, handleHostState, handleHostAction, handlePresenceUpdate]);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (isHost && clientRef.current) {
      clientRef.current.publishAction({ type: 'ROOM_CLOSED' });
    }
    disconnectRoom();
    showFloatingToast('You left the SyncPlay room.', 'info');
  }, [isHost, disconnectRoom]);

  // Close room (Host only)
  const closeRoom = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.publishAction({ type: 'ROOM_CLOSED' });
    }
    disconnectRoom();
    showFloatingToast('SyncPlay room has been ended.', 'info');
  }, [disconnectRoom]);

  // Copy code & share link
  const copyRoomCode = useCallback(() => {
    if (!roomCode) return;
    navigator.clipboard?.writeText(roomCode).then(() => {
      showFloatingToast(`Room Code ${roomCode} copied to clipboard!`, 'info');
    }).catch(() => showFloatingToast(`Room Code: ${roomCode}`, 'info'));
  }, [roomCode]);

  const copyShareLink = useCallback(() => {
    if (!roomCode) return;
    const url = `${window.location.origin}/?room=${roomCode}`;
    navigator.clipboard?.writeText(url).then(() => {
      showFloatingToast('Invite link copied to clipboard!', 'info');
    }).catch(() => showFloatingToast(`Invite URL: ${url}`, 'info'));
  }, [roomCode]);

  // Autoplay gesture unlock
  const triggerAutoplayUnlock = useCallback(() => {
    setNeedsUserGesture(false);
    const audio = audioRef.current;
    if (audio) {
      audio.play().catch(console.warn);
    }
  }, [audioRef]);

  return (
    <SyncPlayContext.Provider
      value={{
        isInRoom: Boolean(roomCode),
        isHost,
        roomCode,
        hostId,
        hostName,
        userName,
        setUserName,
        userId,
        avatarColor,
        connectionStatus,
        members,
        isSyncModalOpen,
        setIsSyncModalOpen,
        needsUserGesture,
        triggerAutoplayUnlock,
        measuredDriftMs,
        driftStatus,
        scheduledCountdownMs,
        clockOffset: getClockOffset(),
        estimatedRTT: getEstimatedRTT(),
        createRoom,
        joinRoom,
        leaveRoom,
        closeRoom,
        copyRoomCode,
        copyShareLink
      }}
    >
      {children}
    </SyncPlayContext.Provider>
  );
}

export function useSyncPlay() {
  const context = useContext(SyncPlayContext);
  if (!context) {
    throw new Error('useSyncPlay must be used within a SyncPlayProvider');
  }
  return context;
}
