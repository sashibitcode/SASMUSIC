# SAS Music 🎵

[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A production-ready, ad-free, mobile-native Progressive Web App (PWA) music streaming player powered directly by a public Google Drive folder. No backend server, no database, and no login required.

---

## 🌟 Features

### 📱 Native Mobile App Feel
- **Responsive Layout**: Designed mobile-first. Smoothly scales from small mobile screens (`320px`) to desktop monitors (`1440px+`).
- **Mobile Bottom Navigation**: Dedicated tabs for `Home`, `Search`, `Library`, and `Favorites`.
- **Desktop Sidebar**: Automatically adapts to a full desktop sidebar layout on larger screens and tablets.
- **Floating Mini Player**: Rests neatly above the bottom navigation without covering songs or content.
- **Bottom-Sheet Full Player**: Smooth animated slide-up player mirroring native iOS and Android music apps.
- **Modern Viewport & Notch Support**: Full `100dvh` support to prevent layout jump from mobile address bars, plus `env(safe-area-inset-bottom)` for notched devices.

### 👆 Touch & Gesture Controls
- **Swipe Down to Collapse**: Swipe down on the full-screen player header or artwork to smoothly return to the mini-player.
- **Swipe to Change Tracks**: Swipe left or right on the album artwork to skip to the next or previous song.
- **Swipe to Remove**: Swipe left on any song in the Up Next queue to dismiss it.
- **Pull to Refresh**: Pull down at the top of the song list to instantly check Google Drive for newly added songs.

### 🎨 Luxury Dark Aesthetic
- **Pure Black Foundation (`#000000`)**: Deep blacks with subtle charcoal surface cards (`#121212`).
- **Forest Green Playing Indicator (`#06110c`)**: Distinct ambient glow highlighting the active playing track.
- **Crimson Red Accents (`#A31C1B`)**: Brand buttons, animated visualizer bars, active tabs, and seek scrubber.
- **Transparent Brand Logo**: Clean, de-matted vector and PNG logo integration.

### 🛡️ 4-Layer Zero-Duplicate Engine
- Multi-tier filtering guarantees duplicate files are never shown:
  1. **Drive File ID Matching**: Removes duplicate API file references.
  2. **Filename Normalization**: Handles common naming variations (`Song - Artist` vs `Artist - Song`).
  3. **Punctuation & Clean Title Matching**: Strips trailing timestamps, extra spaces, and special symbols.
  4. **State Reconciliation**: Merges updates cleanly during background syncs.

### 🔊 Google Drive Audio Streaming
- Direct streaming for `.mp3`, `.m4a`, `.flac`, `.wav`, `.aac`, and `.ogg` files via Google Drive API v3.
- Automatic playlist creation from Google Drive subfolders.
- Background sync on launch, pull-to-refresh, and periodic updates every 60 seconds.

### 📲 Lock Screen & Background Playback
- **Media Session API**: Displays title, artist, generated album artwork, and scrubber on your phone's lock screen and smartwatch.
- Controls include Play, Pause, Next Track, Previous Track, and Seek.
- Plays continuously when the phone screen is locked or while multitasking in other apps.

### 🔒 100% Privacy & Security
- Zero ads, zero trackers, and zero external analytics.
- Your Google Drive credentials remain client-side (stored in browser `localStorage` or your private `.env` file). No secrets are ever sent to an intermediary server or committed to git.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0 or higher recommended)
- A Google account to set up a Google Drive folder and API key

### Installation

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

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ⚙️ Google Drive Setup Guide

### 1. Create a Public Google Drive Folder
1. Go to [Google Drive](https://drive.google.com).
2. Click **+ New** > **New folder** (e.g. `SAS Music`).
3. Right-click the folder and select **Share** > **Share**.
4. Under **General access**, change **Restricted** to **"Anyone with the link"**.
5. Set the role to **Viewer** and click **Done**.
6. Copy the share link. It looks like:
   ```
   https://drive.google.com/drive/folders/1a2B3c4D5e6F7g8H9i0JkLmNoPqRsTuVw
   ```
   The characters between `/folders/` and any `?` query parameter is your **Folder ID** (`1a2B3c4D5e6F7g8H9i0JkLmNoPqRsTuVw`).

### 2. Generate a Google Drive API Key
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Select or create a new project (e.g., `SAS Music`).
3. From the navigation menu, go to **APIs & Services** > **Library**.
4. Search for **Google Drive API** and click **Enable**.
5. Go to **APIs & Services** > **Credentials**.
6. Click **+ CREATE CREDENTIALS** at the top and select **API key**.
7. Copy your new API key (starts with `AIzaSy...`).

> **Security Recommendation**: Click the pencil icon next to your API key in Google Cloud Console, select **Websites (HTTP referrers)**, and add your domain (e.g., `https://your-domain.vercel.app/*` and `http://localhost:*`). Under **API restrictions**, restrict the key to **Google Drive API**.

### 3. Connect to SAS Music

#### Method A: Directly via Web App Settings (Instant)
1. Open the app in your browser.
2. Click the **Settings (gear icon)** at the top right.
3. Paste your **Folder ID** and **API Key**, then click **Save & Connect**.
4. Your songs will load immediately!

#### Method B: Local `.env` File (For Developers)
Open your `.env` file in the project root and add:
```env
VITE_DRIVE_FOLDER_ID=your_google_drive_folder_id_here
VITE_DRIVE_API_KEY=your_google_drive_api_key_here
```

---

## 📱 Mobile Installation (PWA)

### On Android (Chrome / Brave / Edge)
1. Open the web app in your browser.
2. Tap the **"Install SAS Music App"** banner at the bottom.
3. Or tap the **three dots menu (⋮)** in Chrome and select **"Install app"** or **"Add to Home screen"**.

### On iPhone & iPad (Safari)
1. Open the web app in **Safari**.
2. Tap the **Share** button (box with an upward arrow) in the toolbar.
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **"Add"** in the top right corner. The SAS Music icon will appear on your home screen with a native standalone window.

---

## 📁 Uploading Music & Creating Playlists

1. Open your shared folder on Google Drive.
2. Upload audio files formatted as `Title - Artist.mp3` (e.g., `Blinding Lights - The Weeknd.mp3`).
3. **Subfolder Playlists**: Create subfolders inside your main folder (e.g., `Workout`, `Chill`, `Lo-Fi`). SAS Music automatically detects subfolders and organizes them into playlists.
4. Newly added songs appear automatically on the next background sync or by tapping **Refresh** / using pull-to-refresh.

---

## ☁️ Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your code to your GitHub repository.
2. Log into [Vercel](https://vercel.com) and import your `SASMUSIC` repository.
3. Under **Environment Variables**, set:
   - `VITE_DRIVE_FOLDER_ID` = `your_folder_id`
   - `VITE_DRIVE_API_KEY` = `your_api_key`
4. Click **Deploy**. Your app will be live with high-speed global edge caching and free SSL.

### Deploy to Netlify
1. Connect your repository on [Netlify](https://www.netlify.com/).
2. Set the build command to `npm run build` and publish directory to `dist`.
3. Add the environment variables `VITE_DRIVE_FOLDER_ID` and `VITE_DRIVE_API_KEY`.
4. Deploy!

---

## 🛠️ Project Structure

```
SAS PLAYER/
├── public/                 # Static assets, PWA icons, transparent logos
│   ├── favicon.svg
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   └── sas-music-logo.png
├── src/
│   ├── components/
│   │   ├── common/         # Modals, PWA prompts, logo components
│   │   ├── header/         # Header bar, search bar
│   │   ├── library/        # SongList, SongRow, PlaylistsView, FavoritesView
│   │   ├── navigation/     # BottomNav (mobile), DesktopSidebar
│   │   └── player/         # MiniPlayer, FullPlayerModal, ProgressBar, QueueDrawer
│   ├── contexts/           # AudioContext, DriveContext, LibraryContext
│   ├── hooks/              # useSwipeGesture, usePullToRefresh, useKeyboardShortcuts
│   ├── services/           # driveService (v3 API), mediaSession (lock screen)
│   ├── utils/              # songParser, formatters, artGenerator
│   ├── config.js           # Client-side configuration loader
│   ├── index.css           # Tailwind custom styles, animations & theme mesh
│   └── main.jsx            # Application entry point & PWA registration
├── .env.example            # Environment variables template
├── .gitignore              # Privacy rules (excludes .env, node_modules, dist)
├── index.html              # HTML shell with mobile meta tags & Apple touch tags
├── tailwind.config.js      # Custom theme color definitions & animations
└── vite.config.js          # Vite configuration with VitePWA plugin
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE). Built with ❤️ for seamless, tracker-free music streaming.
