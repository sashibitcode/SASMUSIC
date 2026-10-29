import React, { useState } from 'react';
import { useDrive } from './contexts/DriveContext';
import { useLibrary } from './contexts/LibraryContext';
import { useDebounce } from './hooks/useDebounce';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Header } from './components/header/Header';
import { SearchBar } from './components/header/SearchBar';
import { SongList } from './components/library/SongList';
import { PlaylistsView } from './components/library/PlaylistsView';
import { FavoritesView } from './components/library/FavoritesView';
import { RecentsView } from './components/library/RecentsView';
import { MiniPlayer } from './components/player/MiniPlayer';
import { FullPlayerModal } from './components/player/FullPlayerModal';
import { QueueDrawer } from './components/player/QueueDrawer';
import { ErrorState } from './components/common/ErrorState';
import { SongListSkeleton } from './components/common/Skeleton';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import { UploadModal } from './components/upload/UploadModal';
import { BottomNav } from './components/navigation/BottomNav';
import { DesktopSidebar } from './components/navigation/DesktopSidebar';

export function AppContent() {
  const { songs, isLoading, error, refreshLibrary } = useDrive();
  const { favorites, recentlyPlayed } = useLibrary();

  // Keyboard shortcuts listener
  useKeyboardShortcuts();

  // Navigation and search state
  const [activeTab, setActiveTab] = useState('songs'); // 'songs' | 'search' | 'playlists' | 'favorites' | 'recents'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 180);

  // When switching to search tab, ensure user can immediately type
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'songs' && activeTab === 'search') {
      // keep current search or reset
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col md:flex-row bg-ambient-forest text-slate-100 font-sans antialiased selection:bg-[#A31C1B] selection:text-white relative overflow-hidden">
      {/* Desktop & Tablet Sidebar (>= 768px) */}
      <DesktopSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        favoritesCount={favorites.length}
        recentsCount={recentlyPlayed.length}
        onUploadClick={() => setIsUploadOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Mobile Header (< 768px) */}
        <div className="md:hidden">
          <Header
            onLogoClick={() => handleTabChange('songs')}
            onUploadClick={() => setIsUploadOpen(true)}
          />
        </div>

        {/* PWA Install Banner */}
        <PwaInstallPrompt />

        {/* Scrollable Main Views Container */}
        <main className="flex-1 overflow-y-auto no-scrollbar touch-pan-y px-3.5 sm:px-6 pt-3 pb-36 md:pb-28 max-w-6xl w-full mx-auto">
          {/* Search Bar - Shown on 'songs' or 'search' tabs */}
          {(activeTab === 'songs' || activeTab === 'search') && !error && !isLoading && (
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              totalCount={songs.length}
            />
          )}

          {/* Dynamic Content Views */}
          {isLoading ? (
            <SongListSkeleton count={8} />
          ) : error ? (
            <ErrorState
              error={error}
              onRetry={refreshLibrary}
            />
          ) : (
            <div>
              {(activeTab === 'songs' || activeTab === 'search') && (
                <SongList
                  songs={songs}
                  searchQuery={debouncedSearch}
                  sortBy={sortBy}
                />
              )}

              {activeTab === 'playlists' && <PlaylistsView />}

              {activeTab === 'favorites' && <FavoritesView />}

              {activeTab === 'recents' && <RecentsView />}
            </div>
          )}
        </main>
      </div>

      {/* Floating Mini Player (docked above bottom nav on mobile, bottom bar on desktop) */}
      <MiniPlayer />

      {/* Mobile-Only Bottom Navigation Bar (< 768px) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        favoritesCount={favorites.length}
        onUploadClick={() => setIsUploadOpen(true)}
      />

      {/* Fullscreen Expandable Player Modal / Bottom Sheet */}
      <FullPlayerModal />

      {/* Slide-out Up Next Queue Drawer */}
      <QueueDrawer />

      {/* Upload Song Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
