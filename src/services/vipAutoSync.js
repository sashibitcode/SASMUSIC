/**
 * SAS MUSIC - VIP Auto-Sync Service
 * 
 * Automatically detects new songs in the "For You ❤️" Drive folder
 * and downloads them in the background as soon as the phone connects to internet.
 */

import {
  isVipUnlocked,
  isVipFolder,
  getVipFolderName,
  getVipDownloadedIds,
  markVipDownloaded
} from '../utils/vipConfig';
import { prefetchAudioTrack, getCachedAudioUrl } from './audioCache';
import { showFloatingToast } from '../utils/toast';

let isSyncInProgress = false;

/**
 * Automatically checks for new songs in the VIP folder and downloads them in the background.
 * Triggers automatically whenever the app connects to the internet or refreshes the library.
 */
export async function autoSyncVipFolder(allSongs) {
  if (!isVipUnlocked()) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  if (!Array.isArray(allSongs) || allSongs.length === 0) return;
  if (isSyncInProgress) return;

  isSyncInProgress = true;

  try {
    // 1. Filter songs belonging to the VIP folder ("For You ❤️")
    const vipSongs = allSongs.filter((s) => s && s.id && isVipFolder(s.folderName));
    if (vipSongs.length === 0) return;

    const downloadedIds = new Set(getVipDownloadedIds());
    const newSongsToDownload = [];

    // 2. Identify songs not yet downloaded
    for (const song of vipSongs) {
      if (!downloadedIds.has(song.id)) {
        // Double check CacheStorage
        const alreadyCached = await getCachedAudioUrl(song.id);
        if (alreadyCached) {
          markVipDownloaded(song.id);
        } else {
          newSongsToDownload.push(song);
        }
      }
    }

    if (newSongsToDownload.length === 0) return;

    console.log(`[VIP Sync] Found ${newSongsToDownload.length} new song(s) for VIP collection. Auto-downloading...`);

    // 3. Download new songs sequentially in background
    let newlyDownloadedCount = 0;
    for (const song of newSongsToDownload) {
      try {
        await prefetchAudioTrack(song.id);
        markVipDownloaded(song.id);
        newlyDownloadedCount += 1;
      } catch (err) {
        console.warn(`[VIP Sync] Failed to auto-download "${song.title}":`, err);
      }
    }

    // 4. Show friendly celebratory notification
    if (newlyDownloadedCount > 0) {
      const msg = newlyDownloadedCount === 1
        ? `✨ 1 naya gaana aapke liye offline save ho gaya! ❤️`
        : `✨ ${newlyDownloadedCount} naye gaane aapke liye offline save ho gaye! ❤️`;
      showFloatingToast(msg, 'success');
    }
  } catch (err) {
    console.warn('[VIP Sync] Auto-sync error:', err);
  } finally {
    isSyncInProgress = false;
  }
}

/**
 * Manually triggers full download of all songs in the VIP folder with progress reporting
 */
export async function manualSyncVipFolder(allSongs, onProgress = null) {
  if (!isVipUnlocked()) return { success: false, reason: 'VIP mode locked' };
  if (!Array.isArray(allSongs) || allSongs.length === 0) {
    return { success: false, reason: 'No songs available' };
  }

  const vipSongs = allSongs.filter((s) => s && s.id && isVipFolder(s.folderName));
  if (vipSongs.length === 0) {
    return {
      success: true,
      total: 0,
      downloaded: 0,
      message: `Google Drive me "${getVipFolderName()}" folder abhi khali hai.`
    };
  }

  let completed = 0;
  for (let i = 0; i < vipSongs.length; i++) {
    const song = vipSongs[i];
    try {
      await prefetchAudioTrack(song.id);
      markVipDownloaded(song.id);
    } catch (e) {
      console.warn('[VIP Sync] Manual sync track failed:', e);
    }
    completed += 1;
    if (typeof onProgress === 'function') {
      onProgress({
        current: completed,
        total: vipSongs.length,
        percent: Math.round((completed / vipSongs.length) * 100),
        currentSongTitle: song.title
      });
    }
  }

  showFloatingToast(`🎉 Saare ${completed} gaane offline save ho gaye! ❤️`, 'success');
  return { success: true, total: vipSongs.length, downloaded: completed };
}

/**
 * Returns current status of VIP offline folder
 */
export function getVipStatus(allSongs) {
  if (!isVipUnlocked()) return { isUnlocked: false };

  const vipSongs = Array.isArray(allSongs)
    ? allSongs.filter((s) => s && s.id && isVipFolder(s.folderName))
    : [];

  const downloadedIds = new Set(getVipDownloadedIds());
  const downloadedCount = vipSongs.filter((s) => downloadedIds.has(s.id)).length;

  return {
    isUnlocked: true,
    folderName: getVipFolderName(),
    totalSongs: vipSongs.length,
    downloadedCount,
    isComplete: vipSongs.length > 0 && downloadedCount >= vipSongs.length
  };
}

