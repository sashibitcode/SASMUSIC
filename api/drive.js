import { setCorsHeaders } from './_utils.js';

const AUDIO_EXTENSIONS = /\.(mp3|m4a|flac|wav|aac|ogg|opus|wma|alac|aiff)$/i;

/**
 * Sanitizes and parses song title & artist from filename
 */
function parseSongFileName(rawFileName) {
  if (!rawFileName || typeof rawFileName !== 'string') {
    return { title: 'Unknown Track', artist: 'Unknown Artist' };
  }

  let cleanName = rawFileName.replace(AUDIO_EXTENSIONS, '').trim();
  cleanName = cleanName.replace(/\s*\(\d+k(bps)?\)/gi, '');
  cleanName = cleanName.replace(/\s*\[\d+k(bps)?\]/gi, '');
  cleanName = cleanName.replace(/#\w+/gi, '');

  if ((cleanName.match(/_/g) || []).length > 2) {
    cleanName = cleanName.replace(/_{2,}/g, ' - ');
    cleanName = cleanName.replace(/_/g, ' ');
  }

  cleanName = cleanName.replace(/^\d+[\s\.\-_]+\s*/, '');
  cleanName = cleanName.replace(/\s+/g, ' ').trim();

  const separatorMatch = cleanName.match(/\s+[-–—]\s+/);
  if (separatorMatch && separatorMatch.index !== undefined) {
    const partA = cleanName.substring(0, separatorMatch.index).trim();
    const rest = cleanName.substring(separatorMatch.index + separatorMatch[0].length).trim();
    const otherParts = rest.split(/\s+[-–—]\s+/).map((p) => p.trim()).filter(Boolean);

    if (partA.length <= 4 && otherParts.length > 0) {
      return {
        title: otherParts[0],
        artist: `${partA}${otherParts.length > 1 ? ' • ' + otherParts.slice(1).join(' • ') : ''}`
      };
    }

    return {
      title: partA || 'Unknown Title',
      artist: otherParts.join(' • ') || 'Unknown Artist'
    };
  }

  return {
    title: cleanName || 'Unknown Title',
    artist: 'Unknown Artist'
  };
}

/**
 * Deduplicates songs by ID, filename and normalized title+artist
 */
function deduplicateSongs(songs) {
  if (!Array.isArray(songs)) return [];
  const seenIds = new Set();
  const seenKeys = new Set();
  const result = [];

  for (const song of songs) {
    if (!song || !song.id || song.mimeType === 'application/vnd.google-apps.folder' || song.isDriveFolder) continue;
    if (seenIds.has(song.id)) continue;

    const cleanTitle = (song.title || song.name || '')
      .toLowerCase()
      .replace(/\(256k\)|\(320k\)|\(128k\)/gi, '')
      .replace(/[^a-z0-9]/gi, '');

    const cleanArtist = (song.artist || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '');

    const titleKey = cleanTitle.length > 3 ? `${cleanTitle}__${cleanArtist}` : null;
    if (titleKey && seenKeys.has(titleKey)) continue;

    seenIds.add(song.id);
    if (titleKey) seenKeys.add(titleKey);
    result.push(song);
  }

  return result;
}

/**
 * Executes Google Drive API v3 requests with Referer header to fulfill website restrictions
 */
async function fetchFromGoogleDrive(params, apiKey) {
  params.key = apiKey;
  const url = `https://www.googleapis.com/drive/v3/files?${new URLSearchParams(params).toString()}`;
  const response = await fetch(url, {
    headers: {
      'Referer': 'https://sashibitcode-music.vercel.app/',
      'User-Agent': 'SAS-Music-Proxy/1.0'
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.error?.message || `Google Drive API error (${response.status})`);
    err.status = response.status;
    err.data = errorData;
    throw err;
  }

  return response.json();
}

/**
 * Serverless Handler for Google Drive Library Fetch & Edge Caching
 */
export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const folderId = req.query.folderId || process.env.DRIVE_FOLDER_ID || process.env.VITE_DRIVE_FOLDER_ID;
  const apiKey = process.env.DRIVE_API_KEY || process.env.VITE_DRIVE_API_KEY;

  if (!folderId || !apiKey) {
    return res.status(500).json({
      error: 'Google Drive configuration missing on server (DRIVE_FOLDER_ID or DRIVE_API_KEY)',
      code: 'NOT_CONFIGURED'
    });
  }

  try {
    // 1. Fetch main folder audio files (with pagination)
    let allMainFiles = [];
    let pageToken = null;

    do {
      const params = {
        q: `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder' and (mimeType contains 'audio/' or name contains '.mp3' or name contains '.m4a' or name contains '.wav' or name contains '.aac' or name contains '.flac' or name contains '.opus') and trashed = false`,
        fields: 'nextPageToken,files(id,name,mimeType,size,modifiedTime)',
        orderBy: 'modifiedTime desc',
        pageSize: '1000'
      };

      if (pageToken) params.pageToken = pageToken;

      const data = await fetchFromGoogleDrive(params, apiKey);
      const files = (data.files || [])
        .filter((file) => file.mimeType !== 'application/vnd.google-apps.folder')
        .map((file) => {
        const { title, artist } = parseSongFileName(file.name);
        return {
          id: file.id,
          name: file.name,
          title,
          artist,
          mimeType: file.mimeType,
          size: Number(file.size || 0),
          modifiedTime: file.modifiedTime,
          streamUrl: `/api/stream?id=${encodeURIComponent(file.id)}`,
          fallbackStreamUrl: `https://drive.google.com/uc?export=download&id=${encodeURIComponent(file.id)}`,
          folderId,
          folderName: 'Main Folder'
        };
      });

      allMainFiles = allMainFiles.concat(files);
      pageToken = data.nextPageToken || null;
    } while (pageToken);

    // 2. Fetch subfolders to serve as playlists
    let subfolders = [];
    try {
      const folderData = await fetchFromGoogleDrive({
        q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id,name,modifiedTime)',
        orderBy: 'name asc',
        pageSize: '100'
      }, apiKey);

      subfolders = (folderData.files || []).map((folder) => ({
        id: folder.id,
        name: folder.name,
        modifiedTime: folder.modifiedTime,
        isDriveFolder: true
      }));
    } catch (fErr) {
      console.warn('Subfolder discovery skipped in proxy:', fErr.message);
    }

    // 3. Fetch subfolder audio files in parallel
    const subfolderPromises = subfolders.map(async (folder) => {
      try {
        let subFiles = [];
        let subPageToken = null;

        do {
          const params = {
            q: `'${folder.id}' in parents and mimeType != 'application/vnd.google-apps.folder' and (mimeType contains 'audio/' or name contains '.mp3' or name contains '.m4a' or name contains '.wav' or name contains '.aac' or name contains '.flac' or name contains '.opus') and trashed = false`,
            fields: 'nextPageToken,files(id,name,mimeType,size,modifiedTime)',
            orderBy: 'modifiedTime desc',
            pageSize: '1000'
          };

          if (subPageToken) params.pageToken = subPageToken;

          const data = await fetchFromGoogleDrive(params, apiKey);
          const files = (data.files || [])
            .filter((file) => file.mimeType !== 'application/vnd.google-apps.folder')
            .map((file) => {
            const { title, artist } = parseSongFileName(file.name);
            return {
              id: file.id,
              name: file.name,
              title,
              artist,
              mimeType: file.mimeType,
              size: Number(file.size || 0),
              modifiedTime: file.modifiedTime,
              streamUrl: `/api/stream?id=${encodeURIComponent(file.id)}`,
              fallbackStreamUrl: `https://drive.google.com/uc?export=download&id=${encodeURIComponent(file.id)}`,
              folderId: folder.id,
              folderName: folder.name
            };
          });

          subFiles = subFiles.concat(files);
          subPageToken = data.nextPageToken || null;
        } while (subPageToken);

        return { folder, files: subFiles };
      } catch (err) {
        console.warn(`Could not load files from subfolder "${folder.name}":`, err.message);
        return { folder, files: [] };
      }
    });

    const subfolderResults = await Promise.all(subfolderPromises);

    const rawAllFiles = [];
    subfolderResults.forEach((r) => {
      if (r && Array.isArray(r.files)) {
        rawAllFiles.push(...r.files);
      }
    });
    rawAllFiles.push(...allMainFiles);

    const allSongs = deduplicateSongs(rawAllFiles);

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

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({
      songs: allSongs,
      playlists: enrichedPlaylists,
      totalCount: allSongs.length
    });
  } catch (err) {
    console.error('Drive proxy error:', err);
    return res.status(err.status || 500).json({
      error: err.message || 'Failed to fetch Google Drive library',
      code: err.data?.error?.errors?.[0]?.reason || 'DRIVE_ERROR'
    });
  }
}

