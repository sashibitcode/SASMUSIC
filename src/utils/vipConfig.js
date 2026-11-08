/**
 * SAS MUSIC - VIP Access & Configuration
 * 
 * Handles passcode authorization for the dedicated VIP offline sync feature.
 * Target Folder: "For You ❤️" (matches any variation of "for you" with heart emoji)
 * Passcode: "loveyou01"
 */

const STORAGE_VIP_UNLOCKED = 'sas_vip_unlocked_v1';
const STORAGE_VIP_DOWNLOADED = 'sas_vip_downloaded_ids_v1';
const STORAGE_VIP_CUSTOM_SONGS = 'sas_vip_custom_songs_v1';
const STORAGE_VIP_ACTIVE_MODE = 'sas_vip_active_mode_v1';
const VIP_PASSCODE = 'loveyou01';
const VIP_TARGET_FOLDER_NAME = 'For You ❤️';

/**
 * Checks if VIP mode is currently unlocked on this device
 */
export function isVipUnlocked() {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_VIP_UNLOCKED) === 'true';
  } catch (_) {
    return false;
  }
}

/**
 * Attempts to unlock VIP mode with user-provided passcode
 * Returns true if successful, false otherwise
 */
export function unlockVip(enteredCode) {
  if (!enteredCode || typeof enteredCode !== 'string') return false;
  const clean = enteredCode.trim().toLowerCase();

  if (clean === VIP_PASSCODE) {
    try {
      localStorage.setItem(STORAGE_VIP_UNLOCKED, 'true');
      localStorage.setItem(STORAGE_VIP_ACTIVE_MODE, 'offline');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sas-vip-change', { detail: { unlocked: true } }));
        window.dispatchEvent(new CustomEvent('sas-vip-mode-change', { detail: { mode: 'offline' } }));
      }
      return true;
    } catch (_) {}
  }
  return false;
}

/**
 * Locks VIP mode (resets access on this device)
 */
export function lockVip() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_VIP_UNLOCKED);
    localStorage.removeItem(STORAGE_VIP_ACTIVE_MODE);
    window.dispatchEvent(new CustomEvent('sas-vip-change', { detail: { unlocked: false } }));
    window.dispatchEvent(new CustomEvent('sas-vip-mode-change', { detail: { mode: 'online' } }));
  } catch (_) {}
}

/**
 * Checks if a Drive folder name matches the VIP folder target ("For You ❤️")
 */
export function isVipFolder(folderName) {
  if (!folderName || typeof folderName !== 'string') return false;
  const clean = folderName.trim().toLowerCase();
  // Matches "For You ❤️", "For You 💖", "for you", "foryou"
  return clean.includes('for you') || clean.includes('foryou');
}

/**
 * Gets the canonical VIP folder display name
 */
export function getVipFolderName() {
  return VIP_TARGET_FOLDER_NAME;
}

/**
 * Gets list of song IDs already downloaded under VIP collection
 */
export function getVipDownloadedIds() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_VIP_DOWNLOADED);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

/**
 * Marks a song ID as downloaded under VIP collection
 */
export function markVipDownloaded(songId) {
  if (typeof window === 'undefined' || !songId) return;
  try {
    const list = getVipDownloadedIds();
    if (!list.includes(songId)) {
      list.push(songId);
      localStorage.setItem(STORAGE_VIP_DOWNLOADED, JSON.stringify(list));
    }
  } catch (_) {}
}

/**
 * Removes a song ID from VIP downloaded list
 */
export function removeVipDownloaded(songId) {
  if (typeof window === 'undefined' || !songId) return;
  try {
    let list = getVipDownloadedIds();
    list = list.filter((id) => id !== songId);
    localStorage.setItem(STORAGE_VIP_DOWNLOADED, JSON.stringify(list));
  } catch (_) {}
}

/**
 * Gets list of custom songs user sent from online catalog to offline space
 */
export function getCustomOfflineSongs() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_VIP_CUSTOM_SONGS);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

/**
 * Adds a song object to custom offline collection and marks it downloaded
 */
export function addSongToOffline(song) {
  if (typeof window === 'undefined' || !song || !song.id) return false;
  try {
    const list = getCustomOfflineSongs();
    const existingIndex = list.findIndex((s) => s.id === song.id);
    if (existingIndex === -1) {
      list.unshift(song);
      localStorage.setItem(STORAGE_VIP_CUSTOM_SONGS, JSON.stringify(list));
    }
    markVipDownloaded(song.id);
    window.dispatchEvent(new CustomEvent('sas-vip-change', { detail: { updatedSongId: song.id } }));
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Removes a custom song from offline space
 */
export function removeSongFromOffline(songId) {
  if (typeof window === 'undefined' || !songId) return false;
  try {
    let list = getCustomOfflineSongs();
    list = list.filter((s) => s.id !== songId);
    localStorage.setItem(STORAGE_VIP_CUSTOM_SONGS, JSON.stringify(list));
    removeVipDownloaded(songId);
    window.dispatchEvent(new CustomEvent('sas-vip-change', { detail: { removedSongId: songId } }));
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Checks whether a song is already part of the private offline space
 */
export function isSongInOffline(songId, driveVipSongs = []) {
  if (!songId) return false;
  if (Array.isArray(driveVipSongs) && driveVipSongs.some((s) => s && s.id === songId)) {
    return true;
  }
  const custom = getCustomOfflineSongs();
  return custom.some((s) => s && s.id === songId);
}

/**
 * Gets currently active mode ('offline' | 'online')
 */
export function getVipActiveMode() {
  if (typeof window === 'undefined') return 'online';
  if (!isVipUnlocked()) return 'online';
  try {
    return localStorage.getItem(STORAGE_VIP_ACTIVE_MODE) || 'offline';
  } catch (_) {
    return 'offline';
  }
}

/**
 * Sets active mode and dispatches live update event
 */
export function setVipActiveMode(mode) {
  if (typeof window === 'undefined') return;
  const target = mode === 'online' ? 'online' : 'offline';
  try {
    localStorage.setItem(STORAGE_VIP_ACTIVE_MODE, target);
    window.dispatchEvent(new CustomEvent('sas-vip-mode-change', { detail: { mode: target } }));
  } catch (_) {}
}


