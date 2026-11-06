/**
 * Song filename parser
 * 
 * Rules:
 * 1. Strip audio extensions (.mp3, .m4a, .flac, .wav, .aac, .ogg, .opus, etc.)
 * 2. Strip bitrate/quality tags (e.g. "(256k)", "[320kbps]") and hashtag tags.
 * 3. Handle heavy underscore filenames (YouTube/Drive downloads like "Song_Name___Artist.mp3").
 * 4. Parse "Song Name - Artist" -> { title: "Song Name", artist: "Artist" }
 * 5. Fallback when no separator: title = full cleaned filename, artist = "Unknown Artist"
 */

const AUDIO_EXTENSIONS = /\.(mp3|m4a|flac|wav|aac|ogg|opus|wma|alac|aiff)$/i;

export function parseSongFileName(rawFileName) {
  if (!rawFileName || typeof rawFileName !== 'string') {
    return {
      title: 'Unknown Track',
      artist: 'Unknown Artist'
    };
  }

  // 1. Strip audio extension
  let cleanName = rawFileName.replace(AUDIO_EXTENSIONS, '').trim();

  // 2. Strip bitrate / quality tags and social tags (e.g. (256k), [320kbps], #shorts, #shortvideo)
  cleanName = cleanName.replace(/\s*\(\d+k(bps)?\)/gi, '');
  cleanName = cleanName.replace(/\s*\[\d+k(bps)?\]/gi, '');
  cleanName = cleanName.replace(/#\w+/gi, '');

  // 3. Handle underscore-heavy filenames (common in YouTube / web downloads)
  if ((cleanName.match(/_/g) || []).length > 2) {
    cleanName = cleanName.replace(/_{2,}/g, ' - ');
    cleanName = cleanName.replace(/_/g, ' ');
  }

  // 4. Strip leading track number patterns like "01. ", "01 - ", "1. ", "01 "
  cleanName = cleanName.replace(/^\d+[\s\.\-_]+\s*/, '');

  // 5. Clean extra spaces
  cleanName = cleanName.replace(/\s+/g, ' ').trim();

  // 6. Match separators: " - ", " – ", " — "
  const separatorMatch = cleanName.match(/\s+[-–—]\s+/);

  if (separatorMatch && separatorMatch.index !== undefined) {
    const partA = cleanName.substring(0, separatorMatch.index).trim();
    const rest = cleanName.substring(separatorMatch.index + separatorMatch[0].length).trim();

    // Split remaining parts if chained by separators
    const otherParts = rest.split(/\s+[-–—]\s+/).map((p) => p.trim()).filter(Boolean);

    // If partA is very short (e.g. "KK") and otherParts exists, it might be Artist - Title
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

  // Fallback: title is the entire name, artist is "Unknown Artist"
  return {
    title: cleanName || 'Unknown Title',
    artist: 'Unknown Artist'
  };
}
