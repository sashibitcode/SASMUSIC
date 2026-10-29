/**
 * Procedural album art generator
 * Creates vibrant, unique gradients and visual accents derived deterministically
 * from the song's title and artist strings using the 3-color palette:
 * Forest Green (#06110c), Charcoal Black (#171717), and Crimson Red (#A31C1B).
 */

const PALETTES = [
  { from: '#A31C1B', via: '#171717', to: '#06110c', accent: '#e2403f' }, // Crimson to Forest
  { from: '#7f1413', via: '#A31C1B', to: '#143326', accent: '#f87171' }, // Ruby to Emerald
  { from: '#171717', via: '#A31C1B', to: '#0c1f17', accent: '#ef4444' }, // Charcoal core
  { from: '#A31C1B', via: '#2b0908', to: '#06110c', accent: '#fca5a5' }, // Deep Scarlet
  { from: '#143326', via: '#171717', to: '#A31C1B', accent: '#34d399' }, // Forest to Crimson
  { from: '#be2524', via: '#171717', to: '#040b08', accent: '#fb7185' }, // Charcoal Crimson
  { from: '#0c1f17', via: '#A31C1B', to: '#171717', accent: '#4ade80' }, // Forest Fire
  { from: '#A31C1B', via: '#450a0a', to: '#06110c', accent: '#f43f5e' }, // Crimson Eclipse
];

function hashString(str) {
  let hash = 0;
  if (!str || str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getSongPalette(title = '', artist = '') {
  const seed = `${title}:${artist}`;
  const index = hashString(seed) % PALETTES.length;
  return PALETTES[index];
}

export function getSongGradientStyle(title = '', artist = '') {
  const palette = getSongPalette(title, artist);
  const angle = (hashString(title) % 360);
  return {
    background: `linear-gradient(${angle}deg, ${palette.from} 0%, ${palette.via} 50%, ${palette.to} 100%)`
  };
}

export function generateArtworkDataUri(title = 'SAS Music', artist = 'SAS') {
  const palette = getSongPalette(title, artist);
  const cleanTitle = (title || 'SAS Music').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 32);
  const cleanArtist = (artist || 'SAS').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').slice(0, 32);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${palette.from}"/>
        <stop offset="50%" stop-color="${palette.via}"/>
        <stop offset="100%" stop-color="${palette.to}"/>
      </linearGradient>
      <radialGradient id="vignette" cx="50%" cy="50%" r="50%">
        <stop offset="35%" stop-color="#06110c" stop-opacity="0"/>
        <stop offset="100%" stop-color="#06110c" stop-opacity="0.85"/>
      </radialGradient>
    </defs>
    <rect width="512" height="512" fill="url(#g)"/>
    <rect width="512" height="512" fill="url(#vignette)"/>
    
    <!-- Stylized Vinyl Grooves with Crimson Tone -->
    <circle cx="256" cy="220" r="140" stroke="#A31C1B" stroke-width="1.5" stroke-opacity="0.35" fill="none"/>
    <circle cx="256" cy="220" r="100" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.15" fill="none"/>
    <circle cx="256" cy="220" r="60" stroke="#A31C1B" stroke-width="2" stroke-opacity="0.4" fill="none"/>
    <circle cx="256" cy="220" r="28" fill="#171717" fill-opacity="0.9"/>
    <circle cx="256" cy="220" r="10" fill="#A31C1B"/>

    <!-- Track Info Overlay -->
    <rect x="24" y="380" width="464" height="100" rx="20" fill="#171717" fill-opacity="0.9" stroke="#282f2b" stroke-width="1.5"/>
    <text x="256" y="422" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="700" font-size="24" fill="#ffffff">${cleanTitle}</text>
    <text x="256" y="456" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="500" font-size="16" fill="#fca5a5">${cleanArtist}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
