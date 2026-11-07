/**
 * Smart Category & Metadata Extractor for SAS Music Library
 * 
 * Dynamically analyzes loaded songs and Google Drive subfolders to classify:
 * 1. Languages & Regions: Hindi / Bollywood, Bhojpuri Dhamaka, Punjabi Beats
 * 2. Playlists & Drive Folders: ZYM / Gym & Workout, Custom Playlists
 * 3. Moods & Genres: Love & Romantic, Sad & Broken, 90s Retro Gold, Dance & Party
 * 4. Top Artists & Singers with live track counts
 */

export const MUSIC_CATEGORIES = [
  {
    id: 'hindi',
    label: 'Hindi & Bollywood',
    shortLabel: 'Hindi',
    emoji: '🇮🇳',
    icon: 'Sparkles',
    badge: 'Popular',
    desc: 'Bollywood, Melodies & Acoustic Love',
    gradient: 'from-rose-600/85 via-red-950/60 to-[#06110c]/90',
    borderColor: 'border-rose-500/40',
    accentColor: '#e11d48'
  },
  {
    id: 'bhojpuri',
    label: 'Bhojpuri Dhamaka',
    shortLabel: 'Bhojpuri',
    emoji: '🌾',
    icon: 'Radio',
    badge: 'Trending',
    desc: 'Desi Tadka, Pawan Singh, Khesari & Party Hits',
    gradient: 'from-amber-500/85 via-amber-950/60 to-[#06110c]/90',
    borderColor: 'border-amber-500/40',
    accentColor: '#f59e0b'
  },
  {
    id: 'chhath',
    label: 'Chhath Special',
    shortLabel: 'Chhath',
    emoji: '🌅',
    icon: 'Sun',
    badge: 'Special',
    desc: 'Bhojpuri Chhath Geet, Sharda Sinha, Pawan Singh & Arghya Bhajans',
    gradient: 'from-amber-600/90 via-orange-950/65 to-[#06110c]/90',
    borderColor: 'border-amber-500/40',
    accentColor: '#f59e0b'
  },
  {
    id: 'gym',
    label: 'Gym & Workout',
    shortLabel: 'Gym / ZYM',
    emoji: '🏋️‍♂️',
    icon: 'Dumbbell',
    badge: 'Hype',
    desc: 'High BPM, Bass Boosted & Workout Power',
    gradient: 'from-emerald-500/85 via-emerald-950/60 to-[#06110c]/90',
    borderColor: 'border-emerald-500/40',
    accentColor: '#10b981'
  },
  {
    id: 'retro',
    label: '90s & Retro Gold',
    shortLabel: '90s Retro',
    emoji: '📻',
    icon: 'History',
    badge: 'Classics',
    desc: 'Kishore Kumar, Lata, Mukesh & 90s Vintage',
    gradient: 'from-purple-500/85 via-purple-950/60 to-[#06110c]/90',
    borderColor: 'border-purple-500/40',
    accentColor: '#a855f7'
  },
  {
    id: 'romantic',
    label: 'Love & Romantic',
    shortLabel: 'Romantic',
    emoji: '💖',
    icon: 'Heart',
    badge: 'Feelings',
    desc: 'Arijit, Ishq, Dil ki Baatein & Slow Melodies',
    gradient: 'from-pink-500/85 via-rose-950/60 to-[#06110c]/90',
    borderColor: 'border-pink-500/40',
    accentColor: '#ec4899'
  },
  {
    id: 'sad',
    label: 'Sad & Broken Heart',
    shortLabel: 'Sad / Dard',
    emoji: '💔',
    icon: 'CloudRain',
    badge: 'Emotional',
    desc: 'Dard, Tanhai, Judai & Soulful Ballads',
    gradient: 'from-blue-500/85 via-slate-900/70 to-[#06110c]/90',
    borderColor: 'border-blue-500/40',
    accentColor: '#3b82f6'
  },
  {
    id: 'punjabi',
    label: 'Punjabi Beats',
    shortLabel: 'Punjabi',
    emoji: '🔥',
    icon: 'Flame',
    badge: 'Banger',
    desc: 'B Praak, Jaani, Sidhu & Urban Punjabi',
    gradient: 'from-orange-500/85 via-amber-950/60 to-[#06110c]/90',
    borderColor: 'border-orange-500/40',
    accentColor: '#f97316'
  }
];

export const KNOWN_ARTISTS = [
  'Arijit Singh',
  'Pawan Singh',
  'Pritam',
  'Mithoon',
  'Lata Mangeshkar',
  'Khesari Lal',
  'Mukesh',
  'Kishore Kumar',
  'Atif Aslam',
  'Jubin Nautiyal',
  'Sachin Jigar',
  'Alka Yagnik',
  'Sonu Nigam',
  'Udit Narayan',
  'Kumar Sanu',
  'Shilpi Raj',
  'Neelkamal Singh',
  'B Praak',
  'Altaaf Sayyed',
  'Amaal Mallik',
  'Armaan Malik',
  'Rito Riba',
  'Mohammed Rafi',
  'A.R. Rahman',
  'Vishal-Shekhar'
];

/**
 * Checks if a song belongs to a specific category
 */
export function isSongInCategory(song, categoryId) {
  if (!song) return false;
  const fullText = `${song.title || ''} ${song.artist || ''} ${song.name || ''} ${song.folderName || ''}`.toLowerCase();
  const folder = (song.folderName || '').toLowerCase();

  switch (categoryId) {
    case 'bhojpuri':
      return (
        folder.includes('bhojpuri') ||
        fullText.includes('bhojpuri') ||
        fullText.includes('pawan singh') ||
        fullText.includes('khesari') ||
        fullText.includes('shilpi raj') ||
        fullText.includes('neelkamal') ||
        fullText.includes('kallu') ||
        fullText.includes('gunjan singh') ||
        fullText.includes('ritesh pandey') ||
        fullText.includes('pramod premi') ||
        fullText.includes('laika') ||
        fullText.includes('odhani') ||
        fullText.includes('ghagra') ||
        fullText.includes('kamariya') ||
        fullText.includes('choli') ||
        fullText.includes('dewar') ||
        fullText.includes('bhatar') ||
        fullText.includes('badhiya') ||
        fullText.includes('lach lach') ||
        fullText.includes('lat lag')
      );

    case 'chhath':
      return (
        folder.includes('chhath') ||
        folder.includes('chhat') ||
        folder.includes('puja') ||
        fullText.includes('chhath') ||
        fullText.includes('chhat') ||
        fullText.includes('chhathi') ||
        fullText.includes('arghya') ||
        fullText.includes('aragh') ||
        fullText.includes('suruj') ||
        fullText.includes('surya') ||
        fullText.includes('sooraj') ||
        fullText.includes('dina nath') ||
        fullText.includes('dinanath') ||
        fullText.includes('sharda sinha') ||
        fullText.includes('anuradha paudwal') ||
        fullText.includes('kelwa ke paat') ||
        fullText.includes('kaanch hi baans') ||
        fullText.includes('ug ho suruj') ||
        fullText.includes('pahile pahil') ||
        fullText.includes('bahangi') ||
        fullText.includes('daura') ||
        fullText.includes('soop') ||
        fullText.includes('thekua') ||
        fullText.includes('ghat') ||
        fullText.includes('mahaparv') ||
        (song.category && song.category.toLowerCase().includes('chhath')) ||
        (song.genre && song.genre.toLowerCase().includes('chhath'))
      );

    case 'gym':
      return (
        folder.includes('zym') ||
        folder.includes('gym') ||
        folder.includes('workout') ||
        fullText.includes('zym') ||
        fullText.includes('gym') ||
        fullText.includes('workout') ||
        fullText.includes('motivation') ||
        fullText.includes('bass boost') ||
        fullText.includes('trap') ||
        fullText.includes('energetic') ||
        fullText.includes('sooraj dooba')
      );

    case 'retro':
      return (
        fullText.includes('lata mangeshkar') ||
        fullText.includes('mukesh') ||
        fullText.includes('kishore kumar') ||
        fullText.includes('mohammed rafi') ||
        fullText.includes('rafi') ||
        fullText.includes('asha bhosle') ||
        fullText.includes('kumar sanu') ||
        fullText.includes('udit narayan') ||
        fullText.includes('alka yagnik') ||
        fullText.includes('kavita krishnamurthy') ||
        fullText.includes('old song') ||
        fullText.includes('retro') ||
        fullText.includes('classic') ||
        fullText.includes('kabhi kabhi') ||
        /19[5-9][0-9]|200[0-5]/i.test(fullText)
      );

    case 'romantic':
      return (
        fullText.includes('love') ||
        fullText.includes('ishq') ||
        fullText.includes('dil') ||
        fullText.includes('pyar') ||
        fullText.includes('mohabbat') ||
        fullText.includes('sanam') ||
        fullText.includes('humsafar') ||
        fullText.includes('tum kya mile') ||
        fullText.includes('jaadui') ||
        fullText.includes('rabba janda') ||
        fullText.includes('tere vaaste') ||
        fullText.includes('teri sohbat') ||
        fullText.includes('apna bana le') ||
        fullText.includes('mann jogiya') ||
        fullText.includes('agar tum saath ho') ||
        fullText.includes('tera naam doon') ||
        fullText.includes('ve kamleya') ||
        fullText.includes('gehra hua') ||
        fullText.includes('tera chehra')
      );

    case 'sad':
      return (
        fullText.includes('sad') ||
        fullText.includes('dard') ||
        fullText.includes('judai') ||
        fullText.includes('tanhai') ||
        fullText.includes('bewafa') ||
        fullText.includes('aaj ro len de') ||
        fullText.includes('chhod diya') ||
        fullText.includes('ae dil hai mushkil') ||
        fullText.includes('main dhoondne ko') ||
        fullText.includes('tera hi bus hona') ||
        fullText.includes('yeh jism') ||
        fullText.includes('bairan') ||
        fullText.includes('haaye re') ||
        fullText.includes('aawaara') ||
        fullText.includes('broken')
      );

    case 'punjabi':
      return (
        fullText.includes('punjabi') ||
        fullText.includes('b praak') ||
        fullText.includes('jaani') ||
        fullText.includes('sidhu') ||
        fullText.includes('dhillon') ||
        fullText.includes('karan aujla') ||
        fullText.includes('diljit') ||
        fullText.includes('mal mal') ||
        fullText.includes('tainu khabar nahi') ||
        fullText.includes('sohbat')
      );

    case 'hindi':
      // Hindi/Bollywood: Bollywood composers, modern Hindi hits, or not strictly foreign
      return (
        fullText.includes('arijit') ||
        fullText.includes('pritam') ||
        fullText.includes('mithoon') ||
        fullText.includes('sachin jigar') ||
        fullText.includes('jubin nautiyal') ||
        fullText.includes('atif aslam') ||
        fullText.includes('amaal mallik') ||
        fullText.includes('armaan malik') ||
        fullText.includes('vishal-shekhar') ||
        fullText.includes('altaaf sayyed') ||
        fullText.includes('sonu nigam') ||
        fullText.includes('t-series') ||
        fullText.includes('sony music') ||
        fullText.includes('saregama') ||
        fullText.includes('hindi') ||
        fullText.includes('bollywood') ||
        (!isSongInCategory(song, 'bhojpuri') && (song.mimeType || '').includes('audio'))
      );

    default:
      return true;
  }
}

/**
 * Returns total count of songs for each category
 */
export function getCategoryCounts(songs = []) {
  const counts = {};
  for (const cat of MUSIC_CATEGORIES) {
    counts[cat.id] = songs.filter((s) => isSongInCategory(s, cat.id)).length;
  }
  return counts;
}

/**
 * Extracts and sorts top artists present in the loaded library with actual track counts
 */
export function extractTopArtists(songs = []) {
  if (!songs || songs.length === 0) return [];

  const counts = {};

  for (const song of songs) {
    if (!song) continue;
    const fullText = `${song.title || ''} ${song.artist || ''} ${song.name || ''}`
      .toLowerCase()
      .replace(/_/g, ' ');

    for (const artist of KNOWN_ARTISTS) {
      const normalized = artist.toLowerCase();
      if (fullText.includes(normalized)) {
        counts[artist] = (counts[artist] || 0) + 1;
      }
    }

    if (song.artist && song.artist !== 'Unknown Artist' && !song.artist.includes('•')) {
      const art = song.artist.trim();
      if (art.length > 2 && !counts[art] && !art.includes('@')) {
        counts[art] = (counts[art] || 0) + 1;
      }
    }
  }

  return Object.entries(counts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
}

/**
 * Filter songs based on an active filter object:
 * { type: 'all' | 'category' | 'artist' | 'playlist', value: string | null }
 */
export function filterSongsByCategory(songs = [], filter = { type: 'all', value: null }) {
  if (!filter || filter.type === 'all' || !filter.value) {
    return songs;
  }

  const { type, value } = filter;

  if (type === 'category') {
    return songs.filter((song) => isSongInCategory(song, value));
  }

  if (type === 'artist') {
    const artistQuery = value.toLowerCase().trim();
    return songs.filter((song) => {
      const text = `${song.artist || ''} ${song.title || ''} ${song.name || ''}`
        .toLowerCase()
        .replace(/_/g, ' ');
      return text.includes(artistQuery);
    });
  }

  if (type === 'playlist') {
    const targetFolder = value.toLowerCase().trim();
    return songs.filter((song) => {
      const folder = (song.folderName || '').toLowerCase().trim();
      return folder === targetFolder || folder.includes(targetFolder);
    });
  }

  // Backwards compatibility for legacy types ('genre', 'trending', 'old', 'new')
  if (type === 'genre') {
    return songs.filter((song) => isSongInCategory(song, value));
  }
  if (type === 'old') {
    return songs.filter((song) => isSongInCategory(song, 'retro'));
  }
  if (type === 'new') {
    return songs.filter((song) => isSongInCategory(song, 'hindi'));
  }
  if (type === 'trending') {
    return songs.filter((song) => isSongInCategory(song, 'bhojpuri') || isSongInCategory(song, 'punjabi'));
  }

  return songs;
}
