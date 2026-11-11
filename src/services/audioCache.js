/**
 * SAS MUSIC - Client-Side Audio Cache & Prefetch Service
 * 
 * Uses the browser's native CacheStorage API to cache audio tracks locally.
 * Results in instant (<20ms) playback on replay, next-track transitions,
 * and zero mobile data consumption for cached tracks.
 */

import { getVipDownloadedIds } from '../utils/vipConfig';

const CACHE_NAME = 'sas-audio-cache-v1';
const MAX_CACHED_TRACKS = 30; // Max ~120-150MB of audio storage
const STORAGE_CACHE_INDEX = 'sas_audio_cache_index';

// In-memory map of active Blob URLs for instant access
const objectUrlMap = new Map();

/**
 * Checks if CacheStorage is supported in this browser
 */
function isCacheSupported() {
  return typeof window !== 'undefined' && 'caches' in window;
}

/**
 * Retrieves the LRU index from localStorage
 */
function getCacheIndex() {
  try {
    const raw = localStorage.getItem(STORAGE_CACHE_INDEX);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

/**
 * Updates the LRU index in localStorage
 */
function saveCacheIndex(index) {
  try {
    localStorage.setItem(STORAGE_CACHE_INDEX, JSON.stringify(index));
  } catch (_) {}
}

/**
 * Marks a song as recently accessed in the LRU index
 */
function touchSongInIndex(songId) {
  let index = getCacheIndex();
  index = index.filter((id) => id !== songId);
  index.push(songId); // most recently used at the end
  saveCacheIndex(index);
}

/**
 * Evicts oldest cached tracks if the cache exceeds MAX_CACHED_TRACKS.
 * Protected VIP songs ('For You ❤️') are NEVER evicted!
 */
async function evictOldTracks(cache) {
  try {
    let index = getCacheIndex();
    const vipIds = new Set(getVipDownloadedIds());

    // Never evict VIP songs
    const evictableIndex = index.filter((id) => !vipIds.has(id));
    if (evictableIndex.length <= MAX_CACHED_TRACKS) return;

    const toRemoveCount = evictableIndex.length - MAX_CACHED_TRACKS;
    const toRemove = evictableIndex.slice(0, toRemoveCount);
    index = index.filter((id) => !toRemove.includes(id));

    for (const songId of toRemove) {
      const url = `/api/stream?id=${encodeURIComponent(songId)}`;
      await cache.delete(url);

      // Clean up in-memory blob URL if exists
      if (objectUrlMap.has(songId)) {
        URL.revokeObjectURL(objectUrlMap.get(songId));
        objectUrlMap.delete(songId);
      }
    }

    saveCacheIndex(index);
  } catch (err) {
    console.warn('[AudioCache] Eviction error:', err);
  }
}

/**
 * Synchronously checks if an audio track is already resident in RAM memory.
 * Returns instant blob URL with 0ms delay without breaking native execution chains.
 */
export function getCachedAudioUrlSync(songId) {
  if (!songId || !objectUrlMap.has(songId)) return null;
  touchSongInIndex(songId);
  return objectUrlMap.get(songId);
}

/**
 * Checks if a song is already cached locally.
 * If yes, returns an instant local Blob URL (0ms latency).
 * If no, returns null.
 */
export async function getCachedAudioUrl(songId) {
  if (!isCacheSupported() || !songId) return null;

  // Return in-memory Blob URL if already created this session
  if (objectUrlMap.has(songId)) {
    touchSongInIndex(songId);
    return objectUrlMap.get(songId);
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const streamUrl = `/api/stream?id=${encodeURIComponent(songId)}`;
    const match = await cache.match(streamUrl);

    if (match) {
      const blob = await match.blob();
      // Ensure the blob is not empty and has valid size
      if (blob && blob.size > 10240) {
        const objectUrl = URL.createObjectURL(blob);
        objectUrlMap.set(songId, objectUrl);
        touchSongInIndex(songId);
        return objectUrl;
      } else {
        // Corrupted or incomplete entry, delete it
        await cache.delete(streamUrl);
      }
    }
  } catch (err) {
    console.warn('[AudioCache] getCachedAudioUrl error:', err);
  }

  return null;
}

/**
 * Background prefetch of an entire audio track into CacheStorage.
 * Runs with low priority so it never interrupts active playback or UI responsiveness.
 */
export async function prefetchAudioTrack(songId) {
  if (!isCacheSupported() || !songId) return;

  const streamUrl = `/api/stream?id=${encodeURIComponent(songId)}`;

  try {
    const cache = await caches.open(CACHE_NAME);
    const existing = await cache.match(streamUrl);
    if (existing) {
      touchSongInIndex(songId);
      return; // Already cached
    }

    // Fetch full track in background with low network priority
    const fetchOptions = {
      method: 'GET',
      headers: { 'Accept': 'audio/*' }
    };

    if ('priority' in Request.prototype) {
      fetchOptions.priority = 'low';
    }

    const response = await fetch(streamUrl, fetchOptions);

    if (response.ok && (response.status === 200 || response.status === 206)) {
      // Put response clone into CacheStorage
      await cache.put(streamUrl, response.clone());
      touchSongInIndex(songId);
      await evictOldTracks(cache);

      // Pre-create blob URL in memory for instant start on next skip
      const blob = await response.blob();
      if (blob && blob.size > 10240 && !objectUrlMap.has(songId)) {
        objectUrlMap.set(songId, URL.createObjectURL(blob));
      }
    }
  } catch (err) {
    // Non-fatal background fetch failure
    console.warn('[AudioCache] prefetchAudioTrack skipped:', err.message);
  }
}

/**
 * Connection Prewarming on pointerdown / touchstart.
 * Sends a lightweight range probe (first 32KB) ~200-300ms before click completes.
 * Pre-establishes DNS, TLS, and HTTP/2 connection so audio starts immediately.
 */
const prewarmedSet = new Set();

export function prewarmStreamConnection(songId) {
  if (!songId || prewarmedSet.has(songId)) return;
  prewarmedSet.add(songId);

  // If already in local memory, no network prewarming needed
  if (objectUrlMap.has(songId)) return;

  const streamUrl = `/api/stream?id=${encodeURIComponent(songId)}`;

  // Use fetch with range 0-32767 to pre-warm the connection socket
  fetch(streamUrl, {
    method: 'GET',
    headers: { 'Range': 'bytes=0-32767' },
    cache: 'no-store'
  }).catch(() => {});

  // Reset prewarmed status after 30 seconds
  setTimeout(() => prewarmedSet.delete(songId), 30000);
}

/**
 * Clears all cached audio files (used in Settings / Troubleshooting)
 */
export async function clearAudioCache() {
  if (!isCacheSupported()) return;

  try {
    // Revoke all in-memory Blob URLs
    for (const [, url] of objectUrlMap) {
      URL.revokeObjectURL(url);
    }
    objectUrlMap.clear();

    await caches.delete(CACHE_NAME);
    localStorage.removeItem(STORAGE_CACHE_INDEX);
  } catch (err) {
    console.warn('[AudioCache] Failed to clear audio cache:', err);
  }
}

