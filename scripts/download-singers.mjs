import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SINGER_DIR = path.resolve(__dirname, '../public/singers');

if (!fs.existsSync(SINGER_DIR)) {
  fs.mkdirSync(SINGER_DIR, { recursive: true });
}

const ARTISTS_MAP = {
  'arijit-singh': 'Arijit Singh',
  'pawan-singh': 'Pawan Singh',
  'pritam': 'Pritam',
  'mithoon': 'Mithoon',
  'lata-mangeshkar': 'Lata Mangeshkar',
  'khesari-lal': 'Khesari Lal',
  'mukesh': 'Mukesh',
  'kishore-kumar': 'Kishore Kumar',
  'atif-aslam': 'Atif Aslam',
  'jubin-nautiyal': 'Jubin Nautiyal',
  'sachin-jigar': 'Sachin-Jigar',
  'alka-yagnik': 'Alka Yagnik',
  'sonu-nigam': 'Sonu Nigam',
  'udit-narayan': 'Udit Narayan',
  'kumar-sanu': 'Kumar Sanu',
  'shilpi-raj': 'Shilpi Raj',
  'neelkamal-singh': 'Neelkamal Singh',
  'b-praak': 'B Praak',
  'altaaf-sayyed': 'Altaaf Sayyed',
  'amaal-mallik': 'Amaal Mallik',
  'armaan-malik': 'Armaan Malik',
  'rito-riba': 'Rito Riba',
  'mohammed-rafi': 'Mohammed Rafi',
  'ar-rahman': 'A.R. Rahman',
  'vishal-shekhar': 'Vishal-Shekhar',
  'badshah': 'Badshah',
  'yo-yo-honey-singh': 'Yo Yo Honey Singh',
  'diljit-dosanjh': 'Diljit Dosanjh',
  'sidhu-moose-wala': 'Sidhu Moose Wala',
  'shreya-ghoshal': 'Shreya Ghoshal',
  'sunidhi-chauhan': 'Sunidhi Chauhan',
  'neha-kakkar': 'Neha Kakkar',
  'darshan-raval': 'Darshan Raval',
  'kk': 'K.K.',
  'guru-randhawa': 'Guru Randhawa'
};

async function downloadSinger(slug, query) {
  const destPath = path.join(SINGER_DIR, `${slug}.jpg`);
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 5000) {
    console.log(`✓ Already exists: ${slug}`);
    return;
  }

  try {
    const res = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.data || data.data.length === 0) {
      console.warn(`⚠ No artist found for: ${query}`);
      return;
    }

    const artist = data.data[0];
    // picture_big is 500x500 high resolution
    const imgUrl = artist.picture_big || artist.picture_medium;
    if (!imgUrl) {
      console.warn(`⚠ No picture for: ${query}`);
      return;
    }

    const imgRes = await fetch(imgUrl);
    if (!imgRes.ok) throw new Error(`Img HTTP ${imgRes.status}`);
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    fs.writeFileSync(destPath, buffer);
    console.log(`✓ Downloaded ${slug}.jpg (${(buffer.length / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error(`✗ Error downloading ${slug}:`, err.message);
  }
}

async function run() {
  console.log(`Starting singer photo download to ${SINGER_DIR}...`);
  for (const [slug, query] of Object.entries(ARTISTS_MAP)) {
    await downloadSinger(slug, query);
    // Be gentle to API
    await new Promise((r) => setTimeout(r, 120));
  }
  console.log('Finished downloading singer photos!');
}

run();

