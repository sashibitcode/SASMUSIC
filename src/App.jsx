import React, { useState, useEffect } from 'react';
import { useDrive } from './contexts/DriveContext';
import { useLibrary } from './contexts/LibraryContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Header } from './components/header/Header';
import { SongList } from './components/library/SongList';
import { SearchView } from './components/library/SearchView';
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
import { SettingsModal } from './components/settings/SettingsModal';
import { BottomNav } from './components/navigation/BottomNav';
import { DesktopSidebar } from './components/navigation/DesktopSidebar';

export function AppContent() {
  const { songs, isLoading, error, refreshLibrary } = useDrive();
  const { favorites, recentlyPlayed } = useLibrary();

  // Keyboard shortcuts listener
  useKeyboardShortcuts();

  // Navigation and modal state
  const [activeTab, setActiveTab] = useState('songs'); // 'songs' | 'search' | 'playlists' | 'favorites' | 'recents'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Desktop creator shortcut: Shift + U opens upload modal directly
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.shiftKey && (e.key === 'U' || e.key === 'u')) {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          e.preventDefault();
          setIsUploadOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Mobile Header (< 768px) */}
        <div className="md:hidden">
          <Header
            onLogoClick={() => handleTabChange('songs')}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        </div>

        {/* PWA Install Banner */}
        <PwaInstallPrompt />

        {/* Scrollable Main Views Container */}
        <main className="flex-1 overflow-y-auto no-scrollbar touch-pan-y px-3.5 sm:px-6 pt-3 pb-36 md:pb-28 max-w-6xl w-full mx-auto">
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
              {activeTab === 'songs' && (
                <SongList
                  songs={songs}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                />
              )}

              {activeTab === 'search' && (
                <SearchView
                  songs={songs}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
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
        recentsCount={recentlyPlayed.length}
      />

      {/* Fullscreen Expandable Player Modal / Bottom Sheet */}
      <FullPlayerModal />

      {/* Slide-out Up Next Queue Drawer */}
      <QueueDrawer />

      {/* Upload Song Modal (Password-Protected) */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />

      {/* Settings & Creator Studio Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenUpload={() => setIsUploadOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
