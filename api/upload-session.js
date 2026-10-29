import { setCorsHeaders, verifyToken } from './_utils.js';

const ALLOWED_EXTENSIONS = ['.mp3', '.m4a', '.aac', '.wav'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

/**
 * Sanitizes strings for safe filename usage in Google Drive
 */
function sanitizeFileName(str) {
  if (!str) return 'Unknown';
  return str
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // remove invalid filesystem chars
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Exchanges Google OAuth2 refresh token for a fresh access token
 */
async function getDriveAccessToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google OAuth credentials not configured on server (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN)');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Failed to refresh Google Drive access token');
  }

  return data.access_token;
}

/**
 * Checks if a file with the given name already exists in the target Drive folder
 */
async function checkDuplicateFile(accessToken, folderId, fileName) {
  // Drive search query: escape single quotes and backslashes
  const escapedName = fileName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const query = `'${folderId}' in parents and trashed = false and name = '${escapedName}'`;
  
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&pageSize=1`;
  
  const response = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.warn('Drive duplicate check warning:', errorText);
    return false; // Proceed if search check fails non-critically
  }

  const result = await response.json();
  return Boolean(result.files && result.files.length > 0);
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Verify Authorization Bearer JWT
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const jwtSecret = process.env.JWT_SECRET || 'sas-music-jwt-secret-key-32-chars-long';

  const decoded = verifyToken(token, jwtSecret);
  if (!decoded || decoded.role !== 'uploader') {
    return res.status(401).json({ error: 'Invalid or expired upload session. Please unlock again.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // ignore
      }
    }

    const { title, artist, originalFileName, mimeType, fileSize } = body || {};

    if (!fileSize || typeof fileSize !== 'number') {
      return res.status(400).json({ error: 'Missing or invalid file size' });
    }

    if (fileSize > MAX_FILE_SIZE) {
      return res.status(400).json({ error: 'File size exceeds 50 MB limit' });
    }

    // Determine extension
    const extMatch = (originalFileName || '').match(/\.([a-z0-9]+)$/i);
    const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : '.mp3';

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return res.status(400).json({
        error: `Invalid file format: ${ext}. Only mp3, m4a, aac, and wav are supported.`
      });
    }

    // Format target file name: "Title - Artist.ext"
    const cleanTitle = sanitizeFileName(title || 'Untitled Song');
    const cleanArtist = sanitizeFileName(artist || 'Unknown Artist');
    const formattedFileName = `${cleanTitle} - ${cleanArtist}${ext}`;

    const folderId = process.env.DRIVE_FOLDER_ID || process.env.VITE_DRIVE_FOLDER_ID;
    if (!folderId) {
      return res.status(500).json({ error: 'DRIVE_FOLDER_ID is not configured on the server' });
    }

    // 2. Get fresh Google Drive OAuth2 Access Token
    const accessToken = await getDriveAccessToken();

    // 3. Check for duplicates in the target folder
    const isDuplicate = await checkDuplicateFile(accessToken, folderId, formattedFileName);
    if (isDuplicate) {
      return res.status(409).json({
        error: `A song named "${formattedFileName}" already exists in your library.`
      });
    }

    // 4. Initiate Google Drive Resumable Upload Session
    const uploadInitUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable';
    const initResponse = await fetch(uploadInitUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': mimeType || 'audio/mpeg',
        'X-Upload-Content-Length': String(fileSize)
      },
      body: JSON.stringify({
        name: formattedFileName,
        parents: [folderId],
        mimeType: mimeType || 'audio/mpeg'
      })
    });

    if (!initResponse.ok) {
      const errBody = await initResponse.text();
      console.error('Failed to initiate Drive resumable session:', errBody);
      return res.status(initResponse.status).json({
        error: 'Google Drive rejected upload session initiation. Please check Drive permissions.'
      });
    }

    const resumableUploadUrl = initResponse.headers.get('location');
    if (!resumableUploadUrl) {
      return res.status(500).json({ error: 'Did not receive upload session URL from Google Drive' });
    }

    return res.status(200).json({
      success: true,
      uploadUrl: resumableUploadUrl,
      fileName: formattedFileName
    });
  } catch (error) {
    console.error('Error in upload-session:', error);
    return res.status(500).json({
      error: error.message || 'Failed to create upload session'
    });
  }
}

