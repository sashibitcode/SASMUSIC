import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { SyncClient } from '../services/sync/syncClient';
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
    isSyncActionRef
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

  const clientRef = useRef(null);
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

  // Convert members map to sorted list (Host first, then alphabetically)
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

  // Host Heartbeat Broadcast (every 4 seconds) to prevent drift and inform late joiners
  useEffect(() => {
    if (!isHost || !clientRef.current || !roomCode) return;

    const interval = setInterval(() => {
      const { currentSong: activeSong, isPlaying: activePlaying, currentTime: activeTime, queue: activeQueue, queueIndex: activeIdx } = stateRef.current;
      if (activeSong && clientRef.current) {
        clientRef.current.publishState({
          type: 'SYNC_STATE',
          song: activeSong,
          isPlaying: activePlaying,
          position: activeTime,
          queue: activeQueue,
          queueIndex: activeIdx
        });
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isHost, roomCode]);

  // Handle incoming authoritative state from Host
  const handleHostState = useCallback((state) => {
    if (stateRef.current.isHost) return; // Host doesn't mirror themselves

    const { song, isPlaying: hostPlaying, position, hostTime, hostName: currentHostName, hostId: currentHostId } = state;
    if (!song) return;

    setHostId(currentHostId);
    if (currentHostName) setHostName(currentHostName);

    // Latency & elapsed time calculation
    const elapsed = Math.max(0, (Date.now() - (hostTime || Date.now())) / 1000);
    const expectedPosition = position + (hostPlaying ? elapsed : 0);

    const { currentSong: localSong, isPlaying: localPlaying, currentTime: localTime } = stateRef.current;

    // Track changed
    if (!localSong || localSong.id !== song.id) {
      if (isSyncActionRef) isSyncActionRef.current = true;
      playSong(song);
      setTimeout(() => {
        seek(expectedPosition);
        if (isSyncActionRef) isSyncActionRef.current = false;
      }, 300);
      return;
    }

    // Playback state toggle (Play/Pause)
    if (localPlaying !== hostPlaying) {
      if (isSyncActionRef) isSyncActionRef.current = true;
      if (hostPlaying) {
        seek(expectedPosition);
        togglePlay();
      } else {
        seek(position);
        togglePlay();
      }
      setTimeout(() => {
        if (isSyncActionRef) isSyncActionRef.current = false;
      }, 100);
      return;
    }

    // Drift correction: if drift > 1.8 seconds, smoothly adjust without re-buffering
    const drift = Math.abs(localTime - expectedPosition);
    if (drift > 1.8) {
      if (isSyncActionRef) isSyncActionRef.current = true;
      seek(expectedPosition);
      setTimeout(() => {
        if (isSyncActionRef) isSyncActionRef.current = false;
      }, 100);
    }
  }, [playSong, seek, togglePlay, isSyncActionRef]);

  // Handle transient playback actions from Host
  const handleHostAction = useCallback((action) => {
    if (stateRef.current.isHost) return; // Host doesn't mirror themselves

    const { type, position, song, hostTime, senderName } = action;

    if (type === 'ROOM_CLOSED') {
      showFloatingToast(`The host (${senderName || 'Host'}) has closed the SyncPlay room.`, 'info');
      disconnectRoom();
      return;
    }

    const elapsed = Math.max(0, (Date.now() - (hostTime || Date.now())) / 1000);
    const expectedPosition = (position || 0) + (action.isPlaying ? elapsed : 0);

    if (isSyncActionRef) isSyncActionRef.current = true;

    switch (type) {
      case 'PLAY':
        seek(expectedPosition);
        if (!stateRef.current.isPlaying) {
          togglePlay();
        }
        break;

      case 'PAUSE':
        seek(position || 0);
        if (stateRef.current.isPlaying) {
          togglePlay();
        }
        break;

      case 'SEEK':
        seek(expectedPosition);
        break;

      case 'CHANGE_SONG':
        if (song) {
          playSong(song);
          setTimeout(() => seek(expectedPosition), 300);
        }
        break;

      default:
        break;
    }

    setTimeout(() => {
      if (isSyncActionRef) isSyncActionRef.current = false;
    }, 150);
  }, [playSong, seek, togglePlay, isSyncActionRef]);

  // Handle member presence updates
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

  // Hook into AudioContext to broadcast Host events to room
  useEffect(() => {
    if (!setSyncActionHandler) return;

    setSyncActionHandler((action) => {
      const { isHost: activeIsHost, roomCode: activeCode } = stateRef.current;
      if (!activeIsHost || !activeCode || !clientRef.current) return;

      // Host broadcasts action to members
      clientRef.current.publishAction(action);

      // Also publish updated state
      const { currentSong: activeSong, isPlaying: activePlaying, currentTime: activeTime, queue: activeQueue, queueIndex: activeIdx } = stateRef.current;
      if (activeSong) {
        clientRef.current.publishState({
          type: 'SYNC_STATE',
          song: activeSong,
          isPlaying: action.type === 'PLAY' ? true : action.type === 'PAUSE' ? false : activePlaying,
          position: action.position !== undefined ? action.position : activeTime,
          queue: activeQueue,
          queueIndex: activeIdx
        });
      }
    });

    return () => setSyncActionHandler(null);
  }, [setSyncActionHandler]);

  // Disconnect from active room
  const disconnectRoom = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    setRoomCode(null);
    setIsHost(false);
    setHostId(null);
    setHostName('');
    setConnectionStatus('DISCONNECTED');
    setMembersMap(new Map());
    setNeedsUserGesture(false);
  }, []);

  // Create Room (User becomes Host)
  const createRoom = useCallback((customHostName) => {
    disconnectRoom();

    if (customHostName) setUserName(customHostName);
    const activeHostName = customHostName || userName;

    // Generate random 6-digit numeric room code (e.g. 749201)
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

    // Initial member roster with Host
    setMembersMap(new Map([[userId, { ...userProfile, lastSeen: Date.now() }]]));

    client.connect();

    // If host is already playing a song, publish initial state immediately
    const { currentSong: s, isPlaying: p, currentTime: t, queue: q, queueIndex: qi } = stateRef.current;
    if (s) {
      setTimeout(() => {
        client.publishState({
          type: 'SYNC_STATE',
          song: s,
          isPlaying: p,
          position: t,
          queue: q,
          queueIndex: qi
        });
      }, 500);
    }

    showFloatingToast(`Sync Room #${code} created! You are the host.`, 'info');
    return code;
  }, [disconnectRoom, userName, userId, avatarColor, handleHostState, handleHostAction, handlePresenceUpdate]);

  // Join Room (User becomes Member)
  const joinRoom = useCallback((code, customUserName) => {
    const cleanCode = String(code).trim().replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      showFloatingToast('Please enter a valid 6-digit room code.', 'error');
      return false;
    }

    disconnectRoom();

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

    // Add self to member roster
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

  // Copy 6-digit room code
  const copyRoomCode = useCallback(() => {
    if (!roomCode) return;
    navigator.clipboard?.writeText(roomCode).then(() => {
      showFloatingToast(`Room Code ${roomCode} copied to clipboard!`, 'info');
    }).catch(() => {
      showFloatingToast(`Room Code: ${roomCode}`, 'info');
    });
  }, [roomCode]);

  // Copy shareable invite link
  const copyShareLink = useCallback(() => {
    if (!roomCode) return;
    const url = `${window.location.origin}/?room=${roomCode}`;
    navigator.clipboard?.writeText(url).then(() => {
      showFloatingToast('Invite link copied to clipboard!', 'info');
    }).catch(() => {
      showFloatingToast(`Invite URL: ${url}`, 'info');
    });
  }, [roomCode]);

  // Autoplay unlock gesture trigger
  const triggerAutoplayUnlock = useCallback(() => {
    setNeedsUserGesture(false);
    togglePlay();
  }, [togglePlay]);

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

