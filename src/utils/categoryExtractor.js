/**
 * Category & Metadata Extractor for SAS Music Library
 * 
 * Dynamically analyzes loaded songs and Google Drive subfolders to extract:
 * 1. Top Artists (with live track counts)
 * 2. Era classification (Trending, New Songs, Old Songs)
 * 3. Moods & Genres (Love, Dance, Sad, Bhojpuri, Retro)
 * 4. Drive Playlists & Folders
 */

const KNOWN_ARTISTS = [
  'Pawan Singh',
  'Alka Yagnik',
  'Sonu Nigam',
  'Udit Narayan',
  'Khesari Lal',
  'Kishore Kumar',
  'KK',
  'Kumar Sanu',
  'Kavita Krishnamurthy',
  'Rahat Fateh Ali Khan',
  'Neelkamal Singh',
  'Arijit Singh',
  'Sunidhi Chauhan',
  'Mohammed Rafi',
  'A.R. Rahman',
  'AR Rahman',
  'Amit Trivedi',
  'Babul Supriyo',
  'Shilpi Raj',
  'Kalpana',
  'Shaan',
  'Jatin-Lalit',
  'Anand Raj Anand',
  'Sapna Awasthi',
  'Richa Sharma'
];

export const DEFAULT_TOP_ARTISTS = [
  { name: 'Pawan Singh', count: 7 },
  { name: 'Alka Yagnik', count: 6 },
  { name: 'Sonu Nigam', count: 4 },
  { name: 'Udit Narayan', count: 3 },
  { name: 'Khesari Lal', count: 3 },
  { name: 'Kishore Kumar', count: 2 },
  { name: 'KK', count: 2 },
  { name: 'Kumar Sanu', count: 2 },
  { name: 'Kavita Krishnamurthy', count: 2 },
  { name: 'Rahat Fateh Ali Khan', count: 2 },
  { name: 'Neelkamal Singh', count: 2 },
  { name: 'Arijit Singh', count: 1 },
  { name: 'Sunidhi Chauhan', count: 1 },
  { name: 'Mohammed Rafi', count: 1 },
  { name: 'A.R. Rahman', count: 2 },
  { name: 'Shilpi Raj', count: 1 },
  { name: 'Babul Supriyo', count: 1 },
  { name: 'Amit Trivedi', count: 1 }
];

/**
 * Extracts and sorts top artists present in the loaded library
 */
export function extractTopArtists(songs = []) {
  if (!songs || songs.length === 0) {
    return DEFAULT_TOP_ARTISTS;
  }

  const counts = {};

  for (const song of songs) {
    if (!song) continue;
    const fullText = `${song.title || ''} ${song.artist || ''} ${song.name || ''}`
      .toLowerCase()
      .replace(/_/g, ' ');

    for (const artist of KNOWN_ARTISTS) {
      const normalizedArtist = artist.toLowerCase();
      if (fullText.includes(normalizedArtist)) {
        counts[artist] = (counts[artist] || 0) + 1;
      }
    }

    // Also pick up clean artist names from song.artist directly
    if (song.artist && song.artist !== 'Unknown Artist' && !song.artist.includes('•')) {
      const art = song.artist.trim();
      if (art.length > 2 && !counts[art]) {
        counts[art] = (counts[art] || 0) + 1;
      }
    }
  }

  // Merge with defaults so known library singers are always present
  for (const def of DEFAULT_TOP_ARTISTS) {
    if (!counts[def.name]) {
      counts[def.name] = def.count;
    }
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

/**
 * Filter songs based on an active filter object:
 * { type: 'all' | 'trending' | 'new' | 'old' | 'genre' | 'playlist' | 'artist', value: string | null }
 */
export function filterSongsByCategory(songs = [], filter = { type: 'all', value: null }) {
  if (!filter || filter.type === 'all' || !filter.value) {
    return songs;
  }

  const { type, value } = filter;

  switch (type) {
    case 'trending': {
      // Viral tracks, party hits, and most requested songs
      return songs.filter((song) => {
        const text = `${song.title} ${song.artist} ${song.name || ''}`.toLowerCase();
        return (
          text.includes('viral') ||
          text.includes('mashup') ||
          text.includes('remix') ||
          text.includes('trend') ||
          text.includes('8k') ||
          text.includes('badhiya') ||
          text.includes('lach lach') ||
          text.includes('odhani') ||
          text.includes('ghagra') ||
          text.includes('lat lag') ||
          text.includes('sweety')
        );
      });
    }

    case 'new': {
      // 2020-2026 modern songs or recently modified files
      return songs.filter((song) => {
        const text = `${song.title} ${song.name || ''}`.toLowerCase();
        const hasRecentYear = /202[0-9]|203[0-9]/i.test(text);
        const isRecentDate = song.modifiedTime && new Date(song.modifiedTime) > new Date('2022-01-01');
        return hasRecentYear || isRecentDate;
      });
    }

    case 'old': {
      // Retro & 90s Bollywood gold
      return songs.filter((song) => {
        const text = `${song.title} ${song.artist} ${song.name || ''}`.toLowerCase();
        const isRetroYear = /19[5-9][0-9]|200[0-9]/i.test(text);
        const hasRetroArtist =
          text.includes('kishore') ||
          text.includes('mohammed rafi') ||
          text.includes('rafi') ||
          text.includes('kumar sanu') ||
          text.includes('udit narayan') ||
          text.includes('alka yagnik') ||
          text.includes('kavita') ||
          text.includes('padosan') ||
          text.includes('aradhana') ||
          text.includes('gumnaam') ||
          text.includes('biwi no') ||
          text.includes('bade miyan');
        return isRetroYear || hasRetroArtist;
      });
    }

    case 'genre': {
      const g = value.toLowerCase();
      return songs.filter((song) => {
        const text = `${song.title} ${song.artist} ${song.folderName || ''} ${song.name || ''}`.toLowerCase();
        if (g === 'love') {
          return text.includes('love') || text.includes('ishq') || text.includes('dil') || text.includes('pyar') || text.includes('mast mast') || text.includes('rab');
        }
        if (g === 'dance') {
          return text.includes('dance') || text.includes('disco') || text.includes('ghagra') || text.includes('mashup') || text.includes('remix') || text.includes('drama');
        }
        if (g === 'sad') {
          return text.includes('sad') || text.includes('aawaara') || text.includes('sach keh raha') || text.includes('dard') || text.includes('judai');
        }
        if (g === 'bhojpuri') {
          return (
            text.includes('bhojpuri') ||
            text.includes('pawan') ||
            text.includes('khesari') ||
            text.includes('neelkamal') ||
            text.includes('shilpi') ||
            text.includes('dinesh') ||
            text.includes('kallu')
          );
        }
        return text.includes(g);
      });
    }

    case 'playlist': {
      const targetFolder = value.toLowerCase().trim();
      return songs.filter((song) => {
        const folder = (song.folderName || '').toLowerCase().trim();
        return folder === targetFolder || folder.includes(targetFolder);
      });
    }

    case 'artist': {
      const artistQuery = value.toLowerCase().trim();
      return songs.filter((song) => {
        const text = `${song.artist || ''} ${song.title || ''} ${song.name || ''}`
          .toLowerCase()
          .replace(/_/g, ' ');
        return text.includes(artistQuery);
      });
    }

    default:
      return songs;
  }
}

