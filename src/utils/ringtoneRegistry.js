/**
 * Master Registry & Metadata Mapper for Phone Ringtones
 * Maps raw ReelAudio filenames and Drive file IDs to verified song titles, artists, tags, and durations.
 */

import { showFloatingToast } from './toast.js';

export const RINGTONE_FOLDER_ID = '1wx-FnZS44ARfl3T_11QBzQdeAZqixMdw';

export const RINGTONES_MASTER_CATALOG = [
  {
    fileId: '1tPpST8HYOcYiAk1qq9j_XWYpfZLU9jsg',
    fileName: 'ReelAudio-11145.mp3',
    title: 'Jai Jai Ram',
    artist: 'A.R. Rahman & Arijit Singh',
    duration: 30
  },
  {
    fileId: '14h27GDCmZsGw_PjMMr2X8JrwzLV7eyah',
    fileName: 'ReelAudio-32321.mp3',
    title: 'Ram Ram Eeswaram',
    artist: 'Saicharan Bhaskaruni',
    duration: 14
  },
  {
    fileId: '1lVIMXEmtaE3QXjtzosgt96NCp3eqdrrF',
    fileName: 'ReelAudio-32905.mp3',
    title: 'Shambhu Stuti',
    artist: 'Ketan Kumar',
    duration: 16
  },
  {
    fileId: '1hh7HeBXsnqRpbiGylwcsKyGgpSgDnoyo',
    fileName: 'ReelAudio-42397.mp3',
    title: 'Shambhu Stuti (Shiv Tandav)',
    artist: 'Ketan Kumar',
    duration: 20
  },
  {
    fileId: '1dBlr8Ji2slfxYcl1Kle_riqU99p6WeQs',
    fileName: 'ReelAudio-46818.mp3',
    title: 'Dwarika No Nath Maro',
    artist: 'Utpal Jivrajani',
    duration: 31
  },
  {
    fileId: '1HNMIZ-X4TwRjV_IJZ9S6P-PUZGmFg8yk',
    fileName: 'ReelAudio-6150.mp3',
    title: 'Hai Katha Sangram Ki',
    artist: 'Himanshu Singh',
    duration: 103
  },
  {
    fileId: '1zfcQAkSMYrL_dhvN1EzdYJZL37m4L1Pb',
    fileName: 'ReelAudio-72681.mp3',
    title: 'Scottish Bagpipes',
    artist: 'Hellfish',
    duration: 46
  },
  {
    fileId: '1wfUziFgMvWM1mlYBlp2V5pUAmfyjL41E',
    fileName: 'ReelAudio-73910.mp3',
    title: 'Dil Lagana Mana Tha',
    artist: 'Krish Mondal',
    duration: 19
  },
  {
    fileId: '15Zwit6zc8U3aqNLlUZaY2l_JSCQePLba',
    fileName: 'ReelAudio-76501.mp3',
    title: 'Bajrang Baan (Lofi)',
    artist: 'Rasraj Ji Maharaj',
    duration: 13
  },
  {
    fileId: '1_4lqit7O49bjv9lD3wopQTwWlxnPtL5I',
    fileName: 'ReelAudio-79369.mp3',
    title: 'Radha Radha Naam Jaap',
    artist: 'Sanatan Music',
    duration: 30
  },
  {
    fileId: '1BCI_TCYHFKxYx41ckUs6ew1HjnlivNXt',
    fileName: 'ReelAudio-82309.mp3',
    title: 'Krishnaya Vasudevaya',
    artist: 'Siddharth Amit Bhavsar',
    duration: 13
  },
  {
    fileId: '15K5XI1etrl3EwOBa_sjivAYyjzHYFBDM',
    fileName: 'ReelAudio-8557.mp3',
    title: 'Mere Tan Me Bhi Ram',
    artist: 'Mohit Yadav & Monika Yadav',
    duration: 31
  },
  {
    fileId: '1SzhRryGOPsKaofVOj8Sin2CGI-TJzY7e',
    fileName: 'ReelAudio-88807.mp3',
    title: 'Om Namo Bhagavate Vasudevaya',
    artist: 'Sanjith Hegde',
    duration: 30
  },
  {
    fileId: '1deJlBBcWdkB882BtXIg6etN795EJFdis',
    fileName: 'ReelAudio-8890.mp3',
    title: 'Sankatmochan Hanuman',
    artist: 'Raanjha & Smokey',
    duration: 62
  }
];

// Lookup maps for O(1) matching
const byFileId = new Map();
const byFileName = new Map();

RINGTONES_MASTER_CATALOG.forEach((item) => {
  if (item.fileId) byFileId.set(item.fileId, item);
  if (item.fileName) {
    byFileName.set(item.fileName.toLowerCase(), item);
    // Also without extension
    const base = item.fileName.replace(/\.mp3$/i, '').toLowerCase();
    byFileName.set(base, item);
  }
});

/**
 * Checks whether a given song belongs to the Ringtone collection
 */
export function isRingtoneSong(song) {
  if (!song) return false;
  if (song.folderId === RINGTONE_FOLDER_ID) return true;
  const folder = (song.folderName || '').trim().toLowerCase();
  if (folder.includes('ringtone')) return true;
  if (song.id && byFileId.has(song.id)) return true;
  if (song.name && byFileName.has(song.name.toLowerCase())) return true;
  return Boolean(song.isRingtone);
}

/**
 * Returns clean metadata (title, artist, tag, duration) if this is a known ringtone
 */
export function getRingtoneMetadata(rawFileName = '', fileId = null) {
  if (fileId && byFileId.has(fileId)) {
    return byFileId.get(fileId);
  }
  if (rawFileName) {
    const key = rawFileName.trim().toLowerCase();
    if (byFileName.has(key)) return byFileName.get(key);
    const keyNoExt = key.replace(/\.(mp3|m4a|wav|aac|flac)$/i, '');
    if (byFileName.has(keyNoExt)) return byFileName.get(keyNoExt);
  }
  return null;
}

/**
 * Downloads a ringtone as an MP3 file with a clean title
 * Designed for mobile browser and PWA compatibility
 */
export async function downloadRingtoneAudio(song) {
  if (!song) return;

  const cleanTitle = song.title || song.name?.replace(/\.mp3$/i, '') || 'Ringtone';
  const downloadFileName = `${cleanTitle} - Ringtone.mp3`.replace(/[/\\?%*:|"<>]/g, '_');

  showFloatingToast(`Downloading ${cleanTitle}...`);

  try {
    const targetUrl = song.streamUrl || `/api/stream?id=${encodeURIComponent(song.id)}`;
    
    // Attempt binary blob download so mobile browsers don't hijack to a player tab
    const res = await fetch(targetUrl);
    if (!res.ok) throw new Error(`Stream responded with ${res.status}`);

    const blob = await res.blob();
    const objectUrl = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = objectUrl;
    a.download = downloadFileName;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objectUrl);
    }, 2000);

    showFloatingToast('✅ Ringtone Downloaded! Phone Settings me jaakar set karein.');
  } catch (err) {
    console.warn('Blob download fallback:', err);
    // Fallback: direct download link
    const fallbackUrl = song.fallbackStreamUrl || `https://drive.google.com/uc?export=download&id=${encodeURIComponent(song.id)}`;
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = fallbackUrl;
    a.download = downloadFileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 1000);
    showFloatingToast('Download started! Phone Settings > Sound me check karein.');
  }
}
