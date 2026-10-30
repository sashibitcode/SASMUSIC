import React, { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import { useDrive } from './contexts/DriveContext';
import { useLibrary } from './contexts/LibraryContext';
import { useDebounce } from './hooks/useDebounce';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Header } from './components/header/Header';
import { SearchBar } from './components/header/SearchBar';
import { CategoryPills } from './components/navigation/CategoryPills';
import { SongList } from './components/library/SongList';
import { MiniPlayer } from './components/player/MiniPlayer';
import { ErrorState } from './components/common/ErrorState';
import { SongListSkeleton } from './components/common/Skeleton';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import { BottomNav } from './components/navigation/BottomNav';
import { DesktopSidebar } from './components/navigation/DesktopSidebar';
import { filterSongsByCategory } from './utils/categoryExtractor';
import { useAudio } from './contexts/AudioContext';
import { useSyncPlay } from './contexts/SyncPlayContext';
import { usePwaBackHandler } from './hooks/usePwaBackHandler';

// Code-split secondary views & overlay modals for ultra-fast initial load & 90+ Lighthouse score
const PlaylistsView = lazy(() => import('./components/library/PlaylistsView').then(m => ({ default: m.PlaylistsView })));
const FavoritesView = lazy(() => import('./components/library/FavoritesView').then(m => ({ default: m.FavoritesView })));
const RecentsView = lazy(() => import('./components/library/RecentsView').then(m => ({ default: m.RecentsView })));
const FullPlayerModal = lazy(() => import('./components/player/FullPlayerModal').then(m => ({ default: m.FullPlayerModal })));
const QueueDrawer = lazy(() => import('./components/player/QueueDrawer').then(m => ({ default: m.QueueDrawer })));
const UploadModal = lazy(() => import('./components/upload/UploadModal').then(m => ({ default: m.UploadModal })));
const SettingsModal = lazy(() => import('./components/settings/SettingsModal').then(m => ({ default: m.SettingsModal })));
const SyncPlayModal = lazy(() => import('./components/syncplay/SyncPlayModal').then(m => ({ default: m.SyncPlayModal })));

export function AppContent() {
  const { songs, drivePlaylists, isLoading, error, refreshLibrary } = useDrive();
  const { favorites, recentlyPlayed } = useLibrary();
  const {
    isPlaying,
    isFullPlayerOpen,
    setIsFullPlayerOpen,
    isQueueOpen,
    setIsQueueOpen
  } = useAudio();

  // Keyboard shortcuts listener
  useKeyboardShortcuts();

  // Navigation, search and category filter state
  const [activeTab, setActiveTab] = useState('songs'); // 'songs' | 'search' | 'playlists' | 'favorites' | 'recents'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [activeFilter, setActiveFilter] = useState({ type: 'all', value: null });
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { isSyncModalOpen, setIsSyncModalOpen, isInRoom } = useSyncPlay();

  // Auto-detect ?room=123456 in URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam && /^\d{6}$/.test(roomParam) && !isInRoom) {
        setIsSyncModalOpen(true);
      }
    }
  }, [isInRoom, setIsSyncModalOpen]);

  // Intelligent PWA back gesture and Android hardware back button handler
  usePwaBackHandler({
    activeTab,
    setActiveTab,
    isFullPlayerOpen,
    setIsFullPlayerOpen,
    isQueueOpen,
    setIsQueueOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isUploadOpen,
    setIsUploadOpen,
    isSyncModalOpen,
    setIsSyncModalOpen,
    isPlaying
  });

  const searchInputRef = useRef(null);
  const mainScrollRef = useRef(null);
  const debouncedSearch = useDebounce(searchQuery, 160);

  // Filter songs by active category/artist/genre filter
  const categorizedSongs = useMemo(() => {
    return filterSongsByCategory(songs, activeFilter);
  }, [songs, activeFilter]);

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

  // Idle prefetch secondary views and overlay modals for instantaneous user response
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefetch = () => {
        import('./components/player/FullPlayerModal');
        import('./components/player/QueueDrawer');
        import('./components/settings/SettingsModal');
        import('./components/syncplay/SyncPlayModal');
        import('./components/upload/UploadModal');
        import('./components/library/PlaylistsView');
        import('./components/library/FavoritesView');
        import('./components/library/RecentsView');
      };

      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(prefetch);
      } else {
        setTimeout(prefetch, 2000);
      }
    }
  }, []);

  // When switching to search tab, scroll to top and focus input
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'search') {
      mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => searchInputRef.current?.focus(), 80);
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

        {/* Sticky Pinned Search & Categories Header */}
        {(activeTab === 'songs' || activeTab === 'search') && !error && !isLoading && (
          <div className="flex-shrink-0 z-30 px-3.5 sm:px-6 pt-2 pb-1.5 bg-[#06110c]/90 backdrop-blur-2xl border-b border-white/[0.06] shadow-sm max-w-6xl w-full mx-auto space-y-2">
            <SearchBar
              inputRef={searchInputRef}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
            <CategoryPills
              songs={songs}
              drivePlaylists={drivePlaylists}
              activeFilter={activeFilter}
              onSelectFilter={setActiveFilter}
              onClearFilter={() => setActiveFilter({ type: 'all', value: null })}
            />
          </div>
        )}

        {/* Scrollable Main Views Container */}
        <main
          ref={mainScrollRef}
          className="flex-1 overflow-y-auto no-scrollbar touch-pan-y px-3.5 sm:px-6 pt-3 pb-36 md:pb-28 max-w-6xl w-full mx-auto"
        >
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
                  songs={categorizedSongs}
                  searchQuery={debouncedSearch}
                  sortBy={sortBy}
                />
              )}

              <Suspense fallback={<SongListSkeleton count={6} />}>
                {activeTab === 'playlists' && <PlaylistsView />}
                {activeTab === 'favorites' && <FavoritesView />}
                {activeTab === 'recents' && <RecentsView />}
              </Suspense>
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

      {/* Code-split Fullscreen Expandable Player Modal / Bottom Sheet & Modals */}
      <Suspense fallback={null}>
        <FullPlayerModal />
        <QueueDrawer />
        <UploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
        />
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onOpenUpload={() => setIsUploadOpen(true)}
        />
        <SyncPlayModal />
      </Suspense>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
