/**
 * High-Speed Album & Folder Cover Art Service
 * 
 * Fetches official high-resolution album artwork from free public music metadata endpoints,
 * caches them in memory and localStorage, and provides thematic artwork for Drive folders.
 */

const STORAGE_KEY = 'sas_cover_art_cache_v2';
const inMemoryCache = new Map();

// Themed high-resolution cover photos for folders & special categories
export const FOLDER_COVERS = {
  zym: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
  gym: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80',
  workout: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80',
  bhojpuri: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
  love: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80',
  romantic: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=80',
  sad: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600&auto=format&fit=crop&q=80',
  retro: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600&auto=format&fit=crop&q=80',
  punjabi: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80'
};

// Initialize cache from localStorage
try {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.entries(parsed).forEach(([key, val]) => inMemoryCache.set(key, val));
    }
  }
} catch (e) {
  console.warn('Failed to load cover art cache:', e);
}

// Persist cache to localStorage with debounce
let persistTimer = null;
function persistCache() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try {
      if (typeof window !== 'undefined') {
        const obj = {};
        // Keep at most 250 recent covers in localStorage
        const entries = Array.from(inMemoryCache.entries()).slice(-250);
        entries.forEach(([k, v]) => (obj[k] = v));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
      }
    } catch (_) {}
  }, 1000);
}

/**
 * Cleans track titles and artist names for accurate metadata matching
 */
export function sanitizeSearchQuery(title = '', artist = '') {
  let clean = `${title} ${artist}`
    .replace(/\(256k\)|\(320k\)|\(128k\)/gi, '')
    .replace(/slowed(\s*n\s*reverb)?/gi, '')
    .replace(/lyrical(\s*video)?/gi, '')
    .replace(/official(\s*music)?(\s*video)?/gi, '')
    .replace(/@\w+/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/【[^】]*】/g, '')
    .replace(/｜/g, ' ')
    .replace(/\|/g, ' ')
    .replace(/_+/g, ' ')
    .replace(/-+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If query is too long, take the first 6 meaningful words
  const words = clean.split(' ').filter(w => w.length > 1);
  return words.slice(0, 6).join(' ');
}

/**
 * Fetches album cover art from iTunes Search API with fallback
 */
export async function fetchSongCoverArt(title = '', artist = '') {
  if (!title && !artist) return null;

  const cacheKey = `${(title || '').toLowerCase().trim()}::${(artist || '').toLowerCase().trim()}`;
  if (inMemoryCache.has(cacheKey)) {
    return inMemoryCache.get(cacheKey);
  }

  const query = sanitizeSearchQuery(title, artist);
  if (!query) return null;

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`;
    const res = await fetch(url, { cache: 'force-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const item = data.results[0];
      const rawUrl = item.artworkUrl100 || '';
      if (rawUrl) {
        const highRes = rawUrl.replace('100x100bb', '600x600bb');
        const thumb = rawUrl.replace('100x100bb', '160x160bb');
        const result = { highRes, thumb, releaseYear: item.releaseDate ? item.releaseDate.slice(0, 4) : '' };

        inMemoryCache.set(cacheKey, result);
        persistCache();
        return result;
      }
    }

    // Try a second fallback with just the clean title if artist was included
    if (artist && artist !== 'Unknown Artist') {
      const cleanTitleOnly = sanitizeSearchQuery(title, '');
      if (cleanTitleOnly && cleanTitleOnly !== query) {
        const fallbackUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanTitleOnly)}&entity=song&limit=1`;
        const fbRes = await fetch(fallbackUrl, { cache: 'force-cache' });
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          if (fbData.results && fbData.results.length > 0) {
            const rawUrl = fbData.results[0].artworkUrl100 || '';
            if (rawUrl) {
              const highRes = rawUrl.replace('100x100bb', '600x600bb');
              const thumb = rawUrl.replace('100x100bb', '160x160bb');
              const result = { highRes, thumb, releaseYear: fbData.results[0].releaseDate ? fbData.results[0].releaseDate.slice(0, 4) : '' };

              inMemoryCache.set(cacheKey, result);
              persistCache();
              return result;
            }
          }
        }
      }
    }

    // Cache null so we don't repeat failed fetches endlessly
    inMemoryCache.set(cacheKey, null);
    return null;
  } catch (err) {
    console.warn(`Cover art fetch skipped for "${title}":`, err.message);
    return null;
  }
}

/**
 * Returns a high-res themed cover image for a Google Drive folder or playlist
 */
export function getFolderCoverArt(folderName = '') {
  if (!folderName) return FOLDER_COVERS.default;
  const name = folderName.toLowerCase().trim();

  for (const [key, url] of Object.entries(FOLDER_COVERS)) {
    if (name.includes(key)) {
      return url;
    }
  }
  return FOLDER_COVERS.default;
}

/**
 * Synchronous cache lookup for instant rendering without flashing
 */
export function getCachedCoverArt(title = '', artist = '') {
  const cacheKey = `${(title || '').toLowerCase().trim()}::${(artist || '').toLowerCase().trim()}`;
  return inMemoryCache.get(cacheKey) || null;
}

