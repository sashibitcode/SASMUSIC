/**
 * Google Drive API v3 Service
 * 
 * Handles listing files, pagination, subfolders as playlists,
 * direct media streaming URLs, error taxonomy, and demo mode.
 */

import { parseSongFileName } from '../utils/songParser.js';

// Curated high quality royalty-free demo tracks for immediate preview/testing
export const DEMO_SONGS = [
  {
    id: 'demo-track-1',
    name: 'Midnight City Lights - Synthwave Dreams.mp3',
    title: 'Midnight City Lights',
    artist: 'Synthwave Dreams',
    size: 5420000,
    modifiedTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    mimeType: 'audio/mp3',
    streamUrl: 'https://cdn.freesound.org/previews/612/612610_5674468-lq.mp3',
    folderName: 'Main Drive',
    isDemo: true
  },
  {
    id: 'demo-track-2',
    name: 'Neon Chill Groove - Lo-Fi Beats.mp3',
    title: 'Neon Chill Groove',
    artist: 'Lo-Fi Beats',
    size: 4210000,
    modifiedTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    mimeType: 'audio/mp3',
    streamUrl: 'https://cdn.freesound.org/previews/557/557815_11861866-lq.mp3',
    folderName: 'Main Drive',
    isDemo: true
  },
  {
    id: 'demo-track-3',
    name: 'Cosmic Horizon - Ambient Galaxy.mp3',
    title: 'Cosmic Horizon',
    artist: 'Ambient Galaxy',
    size: 6150000,
    modifiedTime: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    mimeType: 'audio/mp3',
    streamUrl: 'https://cdn.freesound.org/previews/415/415804_5121236-lq.mp3',
    folderName: 'Ambient Session',
    isDemo: true
  },
  {
    id: 'demo-track-4',
    name: 'Coffee Shop Acoustic - Sunrise Melodies.mp3',
    title: 'Coffee Shop Acoustic',
    artist: 'Sunrise Melodies',
    size: 3890000,
    modifiedTime: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    mimeType: 'audio/mp3',
    streamUrl: 'https://cdn.freesound.org/previews/654/654253_11861866-lq.mp3',
    folderName: 'Acoustic Chill',
    isDemo: true
  }
];

export const DEMO_PLAYLISTS = [
  {
    id: 'demo-folder-1',
    name: 'Ambient Session',
    songCount: 1,
    isDriveFolder: true
  },
  {
    id: 'demo-folder-2',
    name: 'Acoustic Chill',
    songCount: 1,
    isDriveFolder: true
  }
];

/**
 * Generates direct high-speed audio streaming URL via same-origin edge proxy
 * Bypasses Google Cross-Origin Resource Policy (CORP: same-site) blocks
 */
export function getDriveStreamUrl(fileId) {
  if (!fileId) return '';
  return `/api/stream?id=${encodeURIComponent(fileId)}`;
}

/**
 * Fallback streaming endpoint
 */
export function getDriveFallbackStreamUrl(fileId) {
  if (!fileId) return '';
  return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`;
}

/**
 * Fetches all audio files from a specific folder with pagination support
 */
async function fetchFolderAudioFiles(folderId, apiKey, folderName = 'Main Drive') {
  let allFiles = [];
  let pageToken = null;
  const baseUrl = 'https://www.googleapis.com/drive/v3/files';

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and mimeType contains 'audio/' and trashed = false`,
      fields: 'nextPageToken,files(id,name,mimeType,size,modifiedTime)',
      orderBy: 'modifiedTime desc',
      pageSize: '1000',
      key: apiKey
    });

    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    const response = await fetch(`${baseUrl}?${params.toString()}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw parseDriveApiError(response.status, errorData);
    }

    const data = await response.json();
    const files = (data.files || []).map((file) => {
      const { title, artist } = parseSongFileName(file.name);
      return {
        id: file.id,
        name: file.name,
        title,
        artist,
        mimeType: file.mimeType,
        size: Number(file.size || 0),
        modifiedTime: file.modifiedTime,
        streamUrl: getDriveStreamUrl(file.id),
        fallbackStreamUrl: getDriveFallbackStreamUrl(file.id),
        folderId,
        folderName
      };
    });

    allFiles = allFiles.concat(files);
    pageToken = data.nextPageToken || null;
  } while (pageToken);

  return allFiles;
}

/**
 * Fetches subfolders inside the main folder to serve as playlists
 */
async function fetchSubfolders(parentFolderId, apiKey) {
  const params = new URLSearchParams({
    q: `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id,name,modifiedTime)',
    orderBy: 'name asc',
    pageSize: '100',
    key: apiKey
  });

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw parseDriveApiError(response.status, errorData);
  }

  const data = await response.json();
  return (data.files || []).map((folder) => ({
    id: folder.id,
    name: folder.name,
    modifiedTime: folder.modifiedTime,
    isDriveFolder: true
  }));
}

/**
 * Deduplicates an array of songs by ID, filename, and normalized title+artist
 */
export function deduplicateSongs(songs) {
  if (!Array.isArray(songs)) return [];
  const seenIds = new Set();
  const seenKeys = new Set();
  const result = [];

  for (const song of songs) {
    if (!song || !song.id) continue;

    // Deduplicate by file ID
    if (seenIds.has(song.id)) continue;

    // Deduplicate by normalized title & artist (stripping bitrate tags like (256k), extra punctuation)
    const cleanTitle = (song.title || song.name || '')
      .toLowerCase()
      .replace(/\(256k\)|\(320k\)|\(128k\)/gi, '')
      .replace(/[^a-z0-9]/gi, '');

    const cleanArtist = (song.artist || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '');

    const titleKey = cleanTitle.length > 3 ? `${cleanTitle}__${cleanArtist}` : null;

    if (titleKey && seenKeys.has(titleKey)) {
      continue; // Duplicate song detected, skip
    }

    seenIds.add(song.id);
    if (titleKey) seenKeys.add(titleKey);
    result.push(song);
  }

  return result;
}

/**
 * Main entry point: Loads all songs from main folder & subfolders
 */
export async function fetchDriveLibrary(folderId, apiKey) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    const err = new Error('No internet connection. Please check your network and try again.');
    err.code = 'OFFLINE';
    throw err;
  }

  if (!folderId || !apiKey || folderId === 'PASTE_FOLDER_ID_HERE' || apiKey === 'PASTE_API_KEY_HERE') {
    const err = new Error('Google Drive configuration missing.');
    err.code = 'NOT_CONFIGURED';
    throw err;
  }

  try {
    // 1. Fetch main folder audio files
    const mainFiles = await fetchFolderAudioFiles(folderId, apiKey, 'Main Folder');

    // 2. Fetch subfolders
    let subfolders = [];
    try {
      subfolders = await fetchSubfolders(folderId, apiKey);
    } catch (folderErr) {
      console.warn('Subfolder discovery skipped or failed:', folderErr.message);
    }

    // 3. Fetch audio files for each subfolder in parallel
    const subfolderSongsPromises = subfolders.map(async (folder) => {
      try {
        const files = await fetchFolderAudioFiles(folder.id, apiKey, folder.name);
        return { folder, files };
      } catch (err) {
        console.warn(`Could not load files from subfolder "${folder.name}":`, err.message);
        return { folder, files: [] };
      }
    });

    const subfolderResults = await Promise.all(subfolderSongsPromises);

    // Collect all files from main folder + all subfolders
    const rawAllFiles = [...mainFiles];
    subfolderResults.forEach((r) => {
      if (r && Array.isArray(r.files)) {
        rawAllFiles.push(...r.files);
      }
    });

    // Strictly deduplicate so no song ever appears multiple times
    const allSongs = deduplicateSongs(rawAllFiles);

    // Build enriched playlist objects with deduplicated songs
    const enrichedPlaylists = subfolders.map((folder) => {
      const match = subfolderResults.find((r) => r.folder.id === folder.id);
      const rawSongs = match ? match.files : [];
      const uniqueFolderSongs = deduplicateSongs(rawSongs);
      return {
        ...folder,
        songIds: uniqueFolderSongs.map((s) => s.id),
        songCount: uniqueFolderSongs.length
      };
    });

    return {
      songs: allSongs,
      playlists: enrichedPlaylists,
      totalCount: allSongs.length
    };
  } catch (err) {
    throw err;
  }
}

/**
 * Parses Google Drive API errors into actionable user-friendly representations
 */
function parseDriveApiError(status, data = {}) {
  const gError = data.error || {};
  const message = gError.message || '';
  const reason = (gError.errors && gError.errors[0] && gError.errors[0].reason) || '';

  const error = new Error();

  if (status === 400 || reason === 'keyInvalid' || message.toLowerCase().includes('api key not valid')) {
    error.code = 'INVALID_API_KEY';
    error.message = 'Invalid Google Drive API Key. Please verify the key in Google Cloud Console and ensure the Google Drive API is enabled.';
  } else if (status === 403 && (reason === 'dailyLimitExceeded' || reason === 'userRateLimitExceeded' || reason === 'quotaExceeded')) {
    error.code = 'QUOTA_EXCEEDED';
    error.message = 'Google Drive API quota limit reached. Google Cloud allows 20,000 requests/day for free. Please wait a short while and retry.';
  } else if (status === 404 || reason === 'notFound') {
    error.code = 'FOLDER_NOT_FOUND';
    error.message = 'Drive Folder ID not found. Ensure the folder is shared with "Anyone with the link can view".';
  } else if (status === 403) {
    error.code = 'ACCESS_DENIED';
    error.message = 'Access denied. Please ensure the Google Drive folder link sharing is set to "Anyone with the link can view" and the API Key has no restrictive restrictions blocking this domain.';
  } else {
    error.code = 'DRIVE_ERROR';
    error.message = message || `Google Drive API error (${status}). Please check your settings.`;
  }

  return error;
}

