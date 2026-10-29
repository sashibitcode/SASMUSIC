/**
 * Formats seconds into mm:ss or hh:mm:ss
 */
export function formatTime(seconds) {
  if (isNaN(seconds) || seconds === null || seconds === undefined || seconds < 0) {
    return '0:00';
  }

  const sec = Math.floor(seconds);
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const remainingSeconds = sec % 60;

  const paddedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;

  if (hours > 0) {
    const paddedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${minutes}:${paddedSeconds}`;
}

/**
 * Formats raw byte sizes to human-readable string (MB, KB, GB)
 */
export function formatFileSize(bytes) {
  if (!bytes || isNaN(bytes)) return '';
  const num = Number(bytes);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Formats date string into readable short date
 */
export function formatDate(isoDate) {
  if (!isoDate) return '';
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return '';
  }
}

