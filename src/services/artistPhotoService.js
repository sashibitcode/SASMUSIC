/**
 * Artist Photo Service
 * 
 * Provides verified high-resolution portrait photos for popular Indian & international singers.
 * Supports:
 * 1. Local offline photos stored in /singers/<slug>.jpg
 * 2. High-speed Deezer CDN fallback
 * 3. Dynamic search for new/unlisted artists with localStorage caching
 */

const STORAGE_KEY = 'sas_artist_photos_v1';
const memoryCache = new Map();

// Local downloaded singer photos map
export const LOCAL_ARTIST_PHOTOS = {
  'arijit-singh': '/singers/arijit-singh.jpg',
  'pawan-singh': '/singers/pawan-singh.jpg',
  'pritam': '/singers/pritam.jpg',
  'mithoon': '/singers/mithoon.jpg',
  'lata-mangeshkar': '/singers/lata-mangeshkar.jpg',
  'khesari-lal': '/singers/khesari-lal.jpg',
  'mukesh': '/singers/mukesh.jpg',
  'kishore-kumar': '/singers/kishore-kumar.jpg',
  'atif-aslam': '/singers/atif-aslam.jpg',
  'jubin-nautiyal': '/singers/jubin-nautiyal.jpg',
  'sachin-jigar': '/singers/sachin-jigar.jpg',
  'alka-yagnik': '/singers/alka-yagnik.jpg',
  'sonu-nigam': '/singers/sonu-nigam.jpg',
  'udit-narayan': '/singers/udit-narayan.jpg',
  'kumar-sanu': '/singers/kumar-sanu.jpg',
  'shilpi-raj': '/singers/shilpi-raj.jpg',
  'neelkamal-singh': '/singers/neelkamal-singh.jpg',
  'b-praak': '/singers/b-praak.jpg',
  'altaaf-sayyed': '/singers/altaaf-sayyed.jpg',
  'amaal-mallik': '/singers/amaal-mallik.jpg',
  'armaan-malik': '/singers/armaan-malik.jpg',
  'rito-riba': '/singers/rito-riba.jpg',
  'mohammed-rafi': '/singers/mohammed-rafi.jpg',
  'ar-rahman': '/singers/ar-rahman.jpg',
  'vishal-shekhar': '/singers/vishal-shekhar.jpg',
  'badshah': '/singers/badshah.jpg',
  'yo-yo-honey-singh': '/singers/yo-yo-honey-singh.jpg',
  'diljit-dosanjh': '/singers/diljit-dosanjh.jpg',
  'sidhu-moose-wala': '/singers/sidhu-moose-wala.jpg',
  'shreya-ghoshal': '/singers/shreya-ghoshal.jpg',
  'sunidhi-chauhan': '/singers/sunidhi-chauhan.jpg',
  'neha-kakkar': '/singers/neha-kakkar.jpg',
  'darshan-raval': '/singers/darshan-raval.jpg',
  'kk': '/singers/kk.jpg',
  'guru-randhawa': '/singers/guru-randhawa.jpg'
};

// CDN fallback URLs (500x500 high-res)
export const CDN_ARTIST_PHOTOS = {
  'arijit-singh': 'https://cdn-images.dzcdn.net/images/artist/ac5350cff290edd5b69fa584b8b1bd4f/500x500-000000-80-0-0.jpg',
  'pawan-singh': 'https://cdn-images.dzcdn.net/images/artist/6647e95562490fdf93be14c5a75a9c1b/500x500-000000-80-0-0.jpg',
  'pritam': 'https://cdn-images.dzcdn.net/images/artist/d4914ccd414067cd5e2c108867079a85/500x500-000000-80-0-0.jpg',
  'mithoon': 'https://cdn-images.dzcdn.net/images/artist/0234187f18c9a9d5334c08c8e758cdf9/500x500-000000-80-0-0.jpg',
  'lata-mangeshkar': 'https://cdn-images.dzcdn.net/images/artist/837d46f90f541736e07817f463317c80/500x500-000000-80-0-0.jpg',
  'khesari-lal': 'https://cdn-images.dzcdn.net/images/artist/13020d9ed4a84e2346d07b267912b74c/500x500-000000-80-0-0.jpg',
  'mukesh': 'https://cdn-images.dzcdn.net/images/artist/681c4defe94f8a7c23bbdb1b5edfd143/500x500-000000-80-0-0.jpg',
  'kishore-kumar': 'https://cdn-images.dzcdn.net/images/artist/5972263348ad902e29a4749e748ff452/500x500-000000-80-0-0.jpg',
  'atif-aslam': 'https://cdn-images.dzcdn.net/images/artist/0ea90444148fff9c11d77f06a344724e/500x500-000000-80-0-0.jpg',
  'jubin-nautiyal': 'https://cdn-images.dzcdn.net/images/artist/9031b483049b5551abcb11529873b4f6/500x500-000000-80-0-0.jpg',
  'sachin-jigar': 'https://cdn-images.dzcdn.net/images/artist/d812840574d5c6177ef5480a4ba24d59/500x500-000000-80-0-0.jpg',
  'alka-yagnik': 'https://cdn-images.dzcdn.net/images/artist/ebb52754c04679e33acf4d6056fa211a/500x500-000000-80-0-0.jpg',
  'sonu-nigam': 'https://cdn-images.dzcdn.net/images/artist/812220125c4f0db57050438b65afcf78/500x500-000000-80-0-0.jpg',
  'udit-narayan': 'https://cdn-images.dzcdn.net/images/artist/287f18b3d4798dfff688a9246184b084/500x500-000000-80-0-0.jpg',
  'kumar-sanu': 'https://cdn-images.dzcdn.net/images/artist/7ad58f1c03087a082e22a718acc3f1fc/500x500-000000-80-0-0.jpg',
  'shilpi-raj': 'https://cdn-images.dzcdn.net/images/artist/157db341abced6c98e113dd84a8d5854/500x500-000000-80-0-0.jpg',
  'neelkamal-singh': 'https://cdn-images.dzcdn.net/images/artist/e2f1440b827214ce0af3e648ed5126a4/500x500-000000-80-0-0.jpg',
  'b-praak': 'https://cdn-images.dzcdn.net/images/artist/44273932122d6e9d441b19eafb4c362e/500x500-000000-80-0-0.jpg',
  'altaaf-sayyed': 'https://cdn-images.dzcdn.net/images/artist/58fb9151e29c323393b82409765d1189/500x500-000000-80-0-0.jpg',
  'amaal-mallik': 'https://cdn-images.dzcdn.net/images/artist/cfc9d2b93ab31037332ba220cc0e4b4e/500x500-000000-80-0-0.jpg',
  'armaan-malik': 'https://cdn-images.dzcdn.net/images/artist/3aacd4e00a34aefb6041d30e0cc5bc5e/500x500-000000-80-0-0.jpg',
  'rito-riba': 'https://cdn-images.dzcdn.net/images/artist/1505f257947bc85bf2ae63c0e1ea5e45/500x500-000000-80-0-0.jpg',
  'mohammed-rafi': 'https://cdn-images.dzcdn.net/images/artist/9e79b89a9b2073fae0cc2f6bce278abe/500x500-000000-80-0-0.jpg',
  'ar-rahman': 'https://cdn-images.dzcdn.net/images/artist/bd34315ef977a62a9e28c1ab19bb8ac4/500x500-000000-80-0-0.jpg',
  'vishal-shekhar': 'https://cdn-images.dzcdn.net/images/artist/5871137ebfd9723ea757b8380fe404c5/500x500-000000-80-0-0.jpg',
  'badshah': 'https://cdn-images.dzcdn.net/images/artist/5b90b89299a7d42f81d79afa263a85d2/500x500-000000-80-0-0.jpg',
  'yo-yo-honey-singh': 'https://cdn-images.dzcdn.net/images/artist/7859b461c10352f02a11368905f0903f/500x500-000000-80-0-0.jpg',
  'diljit-dosanjh': 'https://cdn-images.dzcdn.net/images/artist/79b85e695e0ca6529e56bf3b628e92bd/500x500-000000-80-0-0.jpg',
  'sidhu-moose-wala': 'https://cdn-images.dzcdn.net/images/artist/f559ebe3851db26a6a47a76b1d95748f/500x500-000000-80-0-0.jpg',
  'shreya-ghoshal': 'https://cdn-images.dzcdn.net/images/artist/3bb832d37d10ff2affcfa9afdc7c68a0/500x500-000000-80-0-0.jpg',
  'sunidhi-chauhan': 'https://cdn-images.dzcdn.net/images/artist/8e040375f4d1e2b4d1b72e12ee0c6606/500x500-000000-80-0-0.jpg',
  'neha-kakkar': 'https://cdn-images.dzcdn.net/images/artist/5cb15ae9a9fa7f415391d17d1cfd47fb/500x500-000000-80-0-0.jpg',
  'darshan-raval': 'https://cdn-images.dzcdn.net/images/artist/cfc9d2b93ab31037332ba220cc0e4b4e/500x500-000000-80-0-0.jpg',
  'kk': 'https://cdn-images.dzcdn.net/images/artist/e2f1440b827214ce0af3e648ed5126a4/500x500-000000-80-0-0.jpg',
  'guru-randhawa': 'https://cdn-images.dzcdn.net/images/artist/49ebc15e8e52db9a35e407ea37cbefad/500x500-000000-80-0-0.jpg'
};

// Initialize cache from localStorage
try {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.entries(parsed).forEach(([k, v]) => memoryCache.set(k, v));
    }
  }
} catch (_) {}

/**
 * Normalizes artist name to matched slug
 */
export function getArtistSlug(artistName = '') {
  if (!artistName) return '';
  const clean = artistName
    .toLowerCase()
    .trim()
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ');

  if (clean.includes('arijit')) return 'arijit-singh';
  if (clean.includes('pawan')) return 'pawan-singh';
  if (clean.includes('khesari')) return 'khesari-lal';
  if (clean.includes('pritam')) return 'pritam';
  if (clean.includes('mithoon')) return 'mithoon';
  if (clean.includes('lata')) return 'lata-mangeshkar';
  if (clean.includes('kishore')) return 'kishore-kumar';
  if (clean.includes('mukesh')) return 'mukesh';
  if (clean.includes('atif')) return 'atif-aslam';
  if (clean.includes('jubin')) return 'jubin-nautiyal';
  if (clean.includes('sachin') || clean.includes('jigar')) return 'sachin-jigar';
  if (clean.includes('alka')) return 'alka-yagnik';
  if (clean.includes('sonu')) return 'sonu-nigam';
  if (clean.includes('udit')) return 'udit-narayan';
  if (clean.includes('kumar sanu') || clean.includes('sanu')) return 'kumar-sanu';
  if (clean.includes('shilpi')) return 'shilpi-raj';
  if (clean.includes('neelkamal')) return 'neelkamal-singh';
  if (clean.includes('praak')) return 'b-praak';
  if (clean.includes('altaaf') || clean.includes('sayyed')) return 'altaaf-sayyed';
  if (clean.includes('amaal')) return 'amaal-mallik';
  if (clean.includes('armaan')) return 'armaan-malik';
  if (clean.includes('rito')) return 'rito-riba';
  if (clean.includes('rafi')) return 'mohammed-rafi';
  if (clean.includes('rahman')) return 'ar-rahman';
  if (clean.includes('vishal') || clean.includes('shekhar')) return 'vishal-shekhar';
  if (clean.includes('badshah')) return 'badshah';
  if (clean.includes('honey')) return 'yo-yo-honey-singh';
  if (clean.includes('diljit')) return 'diljit-dosanjh';
  if (clean.includes('sidhu') || clean.includes('moose')) return 'sidhu-moose-wala';
  if (clean.includes('shreya')) return 'shreya-ghoshal';
  if (clean.includes('sunidhi')) return 'sunidhi-chauhan';
  if (clean.includes('neha')) return 'neha-kakkar';
  if (clean.includes('darshan')) return 'darshan-raval';
  if (clean === 'kk' || clean.includes('k.k.')) return 'kk';
  if (clean.includes('guru')) return 'guru-randhawa';

  return clean.replace(/\s+/g, '-');
}

/**
 * Returns artist photo URL synchronously (local file, cached or CDN)
 */
export function getArtistPhoto(artistName = '') {
  if (!artistName) return null;
  const slug = getArtistSlug(artistName);

  if (LOCAL_ARTIST_PHOTOS[slug]) {
    return LOCAL_ARTIST_PHOTOS[slug];
  }

  if (memoryCache.has(slug)) {
    return memoryCache.get(slug);
  }

  if (CDN_ARTIST_PHOTOS[slug]) {
    return CDN_ARTIST_PHOTOS[slug];
  }

  return null;
}

/**
 * Dynamically fetches artist image from Deezer with cache
 */
export async function fetchArtistPhoto(artistName = '') {
  if (!artistName) return null;
  const slug = getArtistSlug(artistName);

  const local = LOCAL_ARTIST_PHOTOS[slug];
  if (local) return local;

  if (memoryCache.has(slug)) {
    return memoryCache.get(slug);
  }

  try {
    const res = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(artistName)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.data && data.data.length > 0) {
      const pic = data.data[0].picture_big || data.data[0].picture_medium;
      if (pic) {
        memoryCache.set(slug, pic);
        try {
          if (typeof window !== 'undefined') {
            const obj = {};
            Array.from(memoryCache.entries()).slice(-100).forEach(([k, v]) => (obj[k] = v));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
          }
        } catch (_) {}
        return pic;
      }
    }
  } catch (err) {
    console.warn(`Could not fetch photo for artist "${artistName}":`, err.message);
  }

  return CDN_ARTIST_PHOTOS[slug] || null;
}

