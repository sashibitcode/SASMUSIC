# SAS Music 🎵

[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Production-ready, ad-free mobile-native Progressive Web App (PWA) music streaming player powered directly by a Google Drive folder. No backend server, no database, and no login required.

> **भाषा चुनें / Choose Language:**
> - [English Documentation](#english-documentation)
> - [हिन्दी (Hindi Documentation)](#-hindi-documentation)

---

# English Documentation

## 🌟 Key Highlights & Features

- **📱 Native Mobile Experience**:
  - Single-column layout on phones with smooth bottom navigation bar (`Home`, `Search`, `Library`, `Favorites`).
  - Sleek collapsible mini-player resting right above navigation with zero content overlap.
  - Full-screen player slides up like a native iOS/Android sheet.
  - Sidebar navigation on tablets and desktop screens (`320px` to `1440px+` responsive design).
  - Proper viewport sizing using `100dvh` and notch safe-area insets (`env(safe-area-inset-bottom)`).

- **👆 Intuitive Touch Gestures**:
  - **Swipe Down** on the full-screen player to smoothly collapse back to mini-player.
  - **Swipe Left / Right** on album artwork to instantly skip to the next or previous track.
  - **Swipe Left** on any track in the queue to dismiss/remove it from Up Next.
  - **Pull to Refresh** at the top of song list to sync with Google Drive.

- **🎨 Luxury Dark Aesthetic**:
  - Pure Deep Black (`#000000`) background with subtle dark charcoal cards (`#121212`).
  - Rich Forest Green (`#06110c`) with vibrant emerald glow for the currently playing track.
  - Crimson Red (`#A31C1B`) for brand highlights, action buttons, progress bars, and active tabs.
  - Official transparent PNG logo with refined edge blending.

- **🛡️ 4-Layer Zero-Duplicate Engine**:
  - Comprehensive multi-layer deduplication guarantees no song ever appears twice:
    1. Drive File ID deduplication.
    2. Normalized title & artist pattern matching (`name - artist` vs `artist - name`).
    3. Clean filename and punctuation stripping.
    4. Smart cache reconciliation.

- **🔊 Google Drive Audio Streaming**:
  - Streams `.mp3`, `.m4a`, `.flac`, `.wav`, `.aac`, `.ogg` directly using the Google Drive v3 API.
  - Auto-syncs on launch, on pull-to-refresh, and automatically every 60 seconds.
  - Automatically turns Google Drive subfolders into categorized playlists.

- **📲 Native Lock Screen & Background Playback**:
  - Full **Media Session API** integration (Song title, Artist, Album Artwork, Progress, Play, Pause, Next, Previous, and Seek controls).
  - Background playback remains uninterrupted when the phone is locked or other apps are opened.

- **🔒 Privacy-First Architecture**:
  - Zero server-side tracking, zero analytics trackers, zero advertisements.
  - Google Drive credentials remain strictly local (`.env` or browser `localStorage`). Never committed to source control.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- A Google account to create a Drive folder and API key

### 2. Local Installation

```bash
# 1. Clone the repository
git clone https://github.com/sashibitcode/SASMUSIC.git
cd SASMUSIC

# 2. Install dependencies
npm install

# 3. Create your local environment file
cp .env.example .env

# 4. Start the development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## ⚙️ Google Drive Setup Guide

### Step 1: Create a Public Google Drive Music Folder
1. Go to [Google Drive](https://drive.google.com).
2. Click **+ New** > **New folder** and name it (e.g. `SAS Music`).
3. Right-click the folder and select **Share** > **Share**.
4. Under **General access**, change **Restricted** to **"Anyone with the link"**.
5. Keep the role set to **Viewer** and click **Done**.
6. The share URL looks like:
   ```
   https://drive.google.com/drive/folders/1a2B3c4D5e6F7g8H9i0JkLmNoPqRsTuVw
   ```
   The string between `/folders/` and `?` is your **Folder ID** (`1a2B3c4D5e6F7g8H9i0JkLmNoPqRsTuVw`).

### Step 2: Get a Google Drive API Key
1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown at the top and click **New Project** (e.g., `SAS Music`).
3. Navigate to **APIs & Services** > **Library**.
4. Search for **Google Drive API** and click **Enable**.
5. Navigate to **APIs & Services** > **Credentials**.
6. Click **+ CREATE CREDENTIALS** > **API key**.
7. Copy your generated API Key (starts with `AIzaSy...`).

> **Security Tip**: Click the pencil icon next to your API key in Google Cloud Console, select **Websites (HTTP referrers)**, and restrict the key to your domain (e.g., `https://your-app.vercel.app/*` and `http://localhost:*`).

### Step 3: Configure SAS Music

#### Method A: Inside the App UI (Fastest)
1. Launch the app in your browser.
2. Tap the **Settings (gear icon)** at the top right.
3. Paste your **Folder ID** and **API Key**, then tap **Save & Connect**.
4. Your music will load instantly!

#### Method B: Local `.env` File (For Developers)
In your local root directory, create a `.env` file (copied from `.env.example`):
```env
VITE_DRIVE_FOLDER_ID=your_google_drive_folder_id_here
VITE_DRIVE_API_KEY=your_google_drive_api_key_here
```

---

## 📱 How to Install on Mobile Devices (PWA)

### On Android (Chrome / Edge / Brave):
1. Open the web app in Chrome.
2. A bottom banner will offer **"Install SAS Music App"** — tap **Install**.
3. Or tap the **3 dots menu (⋮)** in the browser > tap **"Install app"** or **"Add to Home screen"**.

### On iPhone & iPad (Safari):
1. Open the web app in **Safari**.
2. Tap the **Share** button (box with an upward arrow) in the bottom bar.
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **"Add"** at the top right. The SAS Music app icon will appear on your iOS home screen!

---

## ☁️ Deployment

### Deploy to Vercel (One-Click)
1. Push your code to your GitHub repository.
2. Log into [Vercel](https://vercel.com) and click **Add New...** > **Project**.
3. Select your GitHub repository.
4. Under **Environment Variables**, add:
   - `VITE_DRIVE_FOLDER_ID` = `your_folder_id`
   - `VITE_DRIVE_API_KEY` = `your_api_key`
5. Click **Deploy**. Your app will be live with high-speed CDN and free HTTPS.

---
---

# 🇮🇳 हिन्दी (Hindi Documentation)

## 🌟 मुख्य विशेषताएं और खूबियां

- **📱 असली मोबाइल ऐप जैसा अनुभव (Native Mobile Feel)**:
  - फोन के लिए सिंगल-कॉलम लेआउट और बॉटम नेविगेशन बार (`Home`, `Search`, `Library`, `Favorites`)।
  - नेविगेशन बार के ठीक ऊपर मिनी-प्लेयर जो किसी भी गाने या बटन को छुपाता नहीं है।
  - फुल-स्क्रीन प्लेयर जो नीचे से ऊपर स्मूथली स्लाइड होता है।
  - टैबलेट और कंप्यूटर पर ऑटोमैटिक साइडबार लेआउट।
  - `100dvh` और नॉच सेफ-एरिया (`safe-area-inset-bottom`) सपोर्ट।

- **👆 आसान टच जेस्चर (Touch Gestures)**:
  - **नीचे स्वाइप करें (Swipe Down)**: फुल-स्क्रीन प्लेयर को बंद करके वापस मिनी प्लेयर पर आने के लिए।
  - **बाएं/दाएं स्वाइप करें (Swipe Left/Right)**: एल्बम आर्ट पर स्वाइप करके अगला या पिछला गाना बदलें।
  - **बाएं स्वाइप करें (Swipe Left)**: कतार (Queue) से किसी भी गाने को हटाने के लिए।
  - **पुल-टू-रिफ्रेश (Pull to Refresh)**: गानों की लिस्ट को ऊपर खींचकर तुरंत गूगल ड्राइव से सिंक करें।

- **🎨 लक्ज़री डार्क थीम**:
  - डीप ब्लैक (`#000000`) बैकग्राउंड और चारकोल कार्ड्स (`#121212`)।
  - बज रहे गाने के लिए खास फॉरेस्ट ग्रीन (`#06110c`) और एमराल्ड ग्लो।
  - ब्रांड बटन, टैब और प्रोग्रेस बार के लिए क्रिमसन रेड (`#A31C1B`)।
  - क्लीन ट्रांसपेरेंट लोगो।

- **🛡️ 4-लेयर ज़ीरो-डुप्लिकेट इंजन**:
  - डुप्लिकेट गानों को पूरी तरह रोकने के लिए 4-स्तरीय फ़िल्टर (Drive ID, नाम और आर्टिस्ट का ऑटो नॉर्मलाइजेशन)।

- **🔊 गूगल ड्राइव से सीधा स्ट्रीमिंग**:
  - `.mp3`, `.m4a`, `.flac`, `.wav`, `.aac`, `.ogg` गानों को बिना किसी रुकावट के सीधे गूगल ड्राइव v3 API से बजाता है।
  - ड्राइव के सब-फ़ोल्डर्स को अपने आप प्लेलिस्ट में बदल देता है।

- **📲 बैकग्राउंड प्लेबैक व लॉक-स्क्रीन कंट्रोल**:
  - मीडिया सेशन API सपोर्ट — फोन लॉक रहने पर या दूसरा ऐप चलाने पर भी गाना बैकग्राउंड में चलता रहेगा।
  - लॉक स्क्रीन से ही गाना बदलें, पॉज़ करें या फॉरवर्ड करें।

- **🔒 100% प्राइवेसी और सुरक्षा**:
  - कोई विज्ञापन नहीं, कोई ट्रैकिंग नहीं। आपकी API की और फ़ोल्डर आईडी केवल आपके ब्राउज़र या लोकल `.env` में सुरक्षित रहती है।

---

## ⚙️ गूगल ड्राइव सेटअप गाइड

### चरण 1: गूगल ड्राइव में पब्लिक फ़ोल्डर बनाएं
1. [Google Drive](https://drive.google.com) खोलें।
2. **+ New** > **New folder** पर क्लिक करें और नाम दें (जैसे: `SAS Music`)।
3. फ़ोल्डर पर राइट-क्लिक करें और **Share** > **Share** चुनें।
4. **General access** में **Restricted** को बदलकर **"Anyone with the link"** (जिसके पास भी लिंक है) करें।
5. रोल को **Viewer** रखें और **Done** दबाएं।
6. कॉपी किए गए लिंक में `/folders/` के बाद का कोड आपका **Folder ID** है:
   ```
   https://drive.google.com/drive/folders/1a2B3c4D5e6F7g8H9i0JkLmNoPqRsTuVw
   ```
   (`1a2B3c4D5e6F7g8H9i0JkLmNoPqRsTuVw` आपका फ़ोल्डर आईडी है)

### चरण 2: Google Drive API Key प्राप्त करें
1. [Google Cloud Console](https://console.cloud.google.com/) खोलें।
2. ऊपर दिए प्रोजेक्ट ड्रॉपडाउन से नया प्रोजेक्ट बनाएं (`SAS Music`)।
3. साइडबार से **APIs & Services** > **Library** में जाएं और **Google Drive API** सर्च करके **Enable** करें।
4. **APIs & Services** > **Credentials** में जाएं।
5. **+ CREATE CREDENTIALS** > **API key** चुनें।
6. आपकी नई API Key स्क्रीन पर दिख जाएगी (`AIzaSy...` से शुरू होने वाली)।

### चरण 3: ऐप में कनेक्ट करें
1. ऐप को खोलें और ऊपर दिए **Settings (गियर आइकन)** पर क्लिक करें।
2. अपनी **Folder ID** और **API Key** पेस्ट करके **Save & Connect** दबाएं।
3. आपके सभी गाने तुरंत लोड हो जाएंगे!

---

## 📱 फोन में ऐप की तरह कैसे इंस्टॉल करें (PWA)

### एंड्रॉइड (Chrome / Brave / Edge):
1. वेबसाइट को Chrome में खोलें।
2. स्क्रीन पर नीचे **"Install SAS Music App"** का बटन दिखेगा, **Install** पर टैप करें।
3. या ब्राउज़र के **3 डॉट्स (⋮)** पर क्लिक करके **"Install app"** / **"Add to Home screen"** चुनें।

### iPhone / iPad (Safari):
1. वेबसाइट को **Safari** में खोलें।
2. नीचे दिए **Share** बटन (तीर वाला बॉक्स) पर टैप करें।
3. नीचे स्क्रॉल करके **"Add to Home Screen"** चुनें और ऊपर दाईं ओर **"Add"** दबाएं।

---

## 💻 लोकल डेवलपमेंट (Local Run)

```bash
# रिपॉजिटरी क्लोन करें
git clone https://github.com/sashibitcode/SASMUSIC.git
cd SASMUSIC

# डिपेंडेंसीज इंस्टॉल करें
npm install

# डेवलपमेंट सर्वर चालू करें
npm run dev

# प्रोडक्शन बिल्ड तैयार करें
npm run build
```

---

## 📄 License
MIT License. Open-source, free, and built with ❤️ for seamless music streaming.
