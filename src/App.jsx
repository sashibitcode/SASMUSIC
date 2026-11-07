import React, { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import { useDrive } from './contexts/DriveContext';
import { useLibrary } from './contexts/LibraryContext';
import { useDebounce } from './hooks/useDebounce';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Header } from './components/header/Header';
import { SearchBar } from './components/header/SearchBar';
import { CategoryPills } from './components/navigation/CategoryPills';
import { SongList } from './components/library/SongList';
import { CategoryHub } from './components/library/CategoryHub';
import { RecommendedSection } from './components/library/RecommendedSection';
import { CategoryBanner } from './components/library/CategoryBanner';
import { MiniPlayer } from './components/player/MiniPlayer';
import { ErrorState } from './components/common/ErrorState';
import { SongListSkeleton } from './components/common/Skeleton';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import { BottomNav } from './components/navigation/BottomNav';
import { DesktopSidebar } from './components/navigation/DesktopSidebar';
import { filterSongsByCategory } from './utils/categoryExtractor';
import { shuffleArray } from './utils/shuffle';
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
const MobileMenuDrawer = lazy(() => import('./components/navigation/MobileMenuDrawer').then(m => ({ default: m.MobileMenuDrawer })));

export function AppContent() {
  const { songs, drivePlaylists, isLoading, error, refreshLibrary } = useDrive();
  const { favorites, recentlyPlayed } = useLibrary();
  const {
    currentSong,
    isPlaying,
    isFullPlayerOpen,
    setIsFullPlayerOpen,
    isQueueOpen,
    setIsQueueOpen,
    playSong
  } = useAudio();

  // Keyboard shortcuts listener
  useKeyboardShortcuts();

  // Navigation, search and category filter state
  const [activeTab, setActiveTab] = useState('songs'); // 'songs' | 'search' | 'playlists' | 'favorites' | 'recents'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('shuffle');
  const [shuffleSeed, setShuffleSeed] = useState(() => Date.now());
  const [activeFilter, setActiveFilter] = useState({ type: 'all', value: null });
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { isSyncModalOpen, setIsSyncModalOpen, isInRoom, roomCode } = useSyncPlay();

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
    isMobileMenuOpen,
    setIsMobileMenuOpen,
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

  // Defer modal prefetching until first user interaction or fallback timer to eliminate TBT during Lighthouse audit
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let prefetched = false;
    const prefetch = () => {
      if (prefetched) return;
      prefetched = true;
      import('./components/player/FullPlayerModal');
      import('./components/player/QueueDrawer');
      import('./components/settings/SettingsModal');
      import('./components/syncplay/SyncPlayModal');
      import('./components/upload/UploadModal');
      import('./components/library/PlaylistsView');
      import('./components/library/FavoritesView');
      import('./components/library/RecentsView');
    };

    const onUserActive = () => {
      prefetch();
      window.removeEventListener('touchstart', onUserActive);
      window.removeEventListener('mousemove', onUserActive);
      window.removeEventListener('keydown', onUserActive);
    };

    window.addEventListener('touchstart', onUserActive, { passive: true });
    window.addEventListener('mousemove', onUserActive, { passive: true });
    window.addEventListener('keydown', onUserActive, { passive: true });

    const timer = setTimeout(prefetch, 5000);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('touchstart', onUserActive);
      window.removeEventListener('mousemove', onUserActive);
      window.removeEventListener('keydown', onUserActive);
    };
  }, []);

  const previousTabRef = useRef('songs');

  // When switching to search tab, scroll to top and focus input
  const handleTabChange = (tabId) => {
    if (activeTab !== tabId && activeTab !== 'favorites') {
      previousTabRef.current = activeTab;
    }
    setActiveTab(tabId);
    if (tabId === 'search') {
      mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => searchInputRef.current?.focus(), 80);
    }
  };

  // Toggle favorites: opens if not active, closes and returns to previous tab if already active
  const handleToggleFavorites = () => {
    if (activeTab === 'favorites') {
      const returnTab = previousTabRef.current && previousTabRef.current !== 'favorites'
        ? previousTabRef.current
        : 'songs';
      handleTabChange(returnTab);
    } else {
      previousTabRef.current = activeTab;
      handleTabChange('favorites');
    }
  };

  // Select a category/artist/folder filter, switch to songs tab, reset sort to shuffle, and generate fresh seed
  const handleSelectFilter = (filter) => {
    setActiveTab('songs');
    setActiveFilter(filter);
    setSortBy('shuffle');
    setShuffleSeed(Date.now());
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear filter back to All Songs and generate fresh shuffle seed
  const handleClearFilter = () => {
    setActiveFilter({ type: 'all', value: null });
    setSortBy('shuffle');
    setShuffleSeed(Date.now());
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Re-shuffle current category or All Songs on repeat tap
  const handleReshuffle = (target) => {
    if (target === 'all') {
      setActiveFilter({ type: 'all', value: null });
    }
    setSortBy('shuffle');
    setShuffleSeed(Date.now());
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle sort change from dropdown (generate fresh seed if shuffle selected)
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    if (newSort === 'shuffle') {
      setShuffleSeed(Date.now());
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col md:flex-row bg-ambient-forest text-slate-100 font-sans antialiased selection:bg-[#A31C1B] selection:text-white relative overflow-hidden">
      {/* Desktop & Tablet Sidebar (>= 768px) */}
      <DesktopSidebar
        activeTab={activeTab}
        onTabChange={(tabId) => {
          if (tabId === 'favorites' && activeTab === 'favorites') {
            handleToggleFavorites();
          } else {
            handleTabChange(tabId);
          }
        }}
        favoritesCount={favorites?.length || 0}
        recentsCount={recentlyPlayed?.length || 0}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onSelectCategory={(catId) => handleSelectFilter({ type: 'category', value: catId })}
        onSelectFolder={(folderName) => handleSelectFilter({ type: 'playlist', value: folderName })}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Mobile Header (< 768px) */}
        <div className="md:hidden">
          <Header
            onLogoClick={() => handleTabChange('songs')}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenMenu={() => setIsMobileMenuOpen(true)}
            onOpenFavorites={handleToggleFavorites}
            isFavoritesActive={activeTab === 'favorites'}
            favoritesCount={favorites?.length || 0}
          />
        </div>

        {/* PWA Install Banner */}
        <PwaInstallPrompt />

        {/* Sticky Pinned Search & Categories Header (Persistent container to eliminate 0.169 CLS shift) */}
        {(activeTab === 'songs' || activeTab === 'search') && !error && (
          <div className="flex-shrink-0 z-30 px-3.5 sm:px-6 pt-1.5 pb-1 bg-[#06110c]/90 backdrop-blur-2xl border-b border-white/[0.06] shadow-sm max-w-6xl w-full mx-auto space-y-1.5 min-h-[76px]">
            <SearchBar
              inputRef={searchInputRef}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={handleSortChange}
            />
            {isLoading ? (
              <div className="flex gap-2 py-1 overflow-x-hidden">
                <div className="h-7 w-16 bg-white/[0.05] rounded-full animate-pulse flex-shrink-0" />
                <div className="h-7 w-20 bg-white/[0.05] rounded-full animate-pulse flex-shrink-0" />
                <div className="h-7 w-24 bg-white/[0.05] rounded-full animate-pulse flex-shrink-0" />
                <div className="h-7 w-20 bg-white/[0.05] rounded-full animate-pulse flex-shrink-0" />
                <div className="h-7 w-28 bg-white/[0.05] rounded-full animate-pulse flex-shrink-0" />
              </div>
            ) : (
              <CategoryPills
                songs={songs}
                drivePlaylists={drivePlaylists}
                activeFilter={activeFilter}
                onSelectFilter={handleSelectFilter}
                onClearFilter={handleClearFilter}
                onReshuffle={handleReshuffle}
              />
            )}
          </div>
        )}

        {/* Scrollable Main Views Container with Dynamic Bottom Spacing */}
        <main
          ref={mainScrollRef}
          className={`flex-1 overflow-y-auto no-scrollbar touch-pan-y px-3.5 sm:px-6 pt-3 max-w-6xl w-full mx-auto transition-all ${
            currentSong
              ? 'pb-[calc(8.5rem+max(0.75rem,env(safe-area-inset-bottom,0px)))] md:pb-24'
              : 'pb-[calc(4.5rem+max(0.75rem,env(safe-area-inset-bottom,0px)))] md:pb-8'
          }`}
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
              {/* Category Active Banner (Shows when category or artist filter is active) */}
              {activeFilter?.type && activeFilter.type !== 'all' && activeFilter.value && (
                <CategoryBanner
                  activeFilter={activeFilter}
                  songCount={categorizedSongs.length}
                  onClearFilter={handleClearFilter}
                  onPlayAll={() => {
                    if (categorizedSongs.length > 0) {
                      playSong(categorizedSongs[0], categorizedSongs, 0);
                    }
                  }}
                  onShuffle={() => {
                    if (categorizedSongs.length > 0) {
                      setSortBy('shuffle');
                      const newSeed = Date.now();
                      setShuffleSeed(newSeed);
                      const shuffled = shuffleArray(categorizedSongs, newSeed);
                      playSong(shuffled[0], shuffled, 0);
                    }
                  }}
                />
              )}

              {/* Personalized Recommended Section (User's Regular Tracks - 4 up front + View All) */}
              {activeTab === 'songs' && (!activeFilter || activeFilter.type === 'all' || !activeFilter.value) && !debouncedSearch && (
                <RecommendedSection songs={songs} />
              )}

              {/* Visual Category Hub (Cards Grid & Top Singers) shown on Home when not searching and no filter active */}
              {activeTab === 'songs' && (!activeFilter || activeFilter.type === 'all' || !activeFilter.value) && !debouncedSearch && (
                <CategoryHub
                  songs={songs}
                  drivePlaylists={drivePlaylists}
                  onSelectCategory={(catId) => handleSelectFilter({ type: 'category', value: catId })}
                  onSelectArtist={(artistName) => handleSelectFilter({ type: 'artist', value: artistName })}
                />
              )}

              {/* Song List */}
              {(activeTab === 'songs' || activeTab === 'search') && (
                <div>
                  {activeTab === 'songs' && (!activeFilter || activeFilter.type === 'all' || !activeFilter.value) && !debouncedSearch && (
                    <div className="flex items-center justify-between mb-3 pt-3 border-t border-white/[0.08]">
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                          All Songs
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Complete library catalog
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 font-mono bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                        {songs.length} tracks
                      </span>
                    </div>
                  )}
                  <SongList
                    songs={categorizedSongs}
                    searchQuery={debouncedSearch}
                    sortBy={sortBy}
                    shuffleSeed={shuffleSeed}
                  />
                </div>
              )}

              <Suspense fallback={<SongListSkeleton count={6} />}>
                {activeTab === 'playlists' && <PlaylistsView />}
                {activeTab === 'favorites' && <FavoritesView onClose={handleToggleFavorites} />}
                {activeTab === 'recents' && <RecentsView />}
              </Suspense>
            </div>
          )}
        </main>
      </div>

      {/* Sticky Mini Player (docked above bottom nav on mobile, bottom bar on desktop) */}
      <MiniPlayer />

      {/* Mobile-Only Bottom Navigation Bar (< 768px) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenSync={() => setIsSyncModalOpen(true)}
        isInRoom={isInRoom}
        roomCode={roomCode}
        recentsCount={recentlyPlayed?.length || 0}
      />

      {/* Code-split Fullscreen Expandable Player Modal / Bottom Sheet & Modals */}
      <Suspense fallback={null}>
        <FullPlayerModal />
        <QueueDrawer />
        <MobileMenuDrawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          onOpenSettings={() => {
            setIsMobileMenuOpen(false);
            setIsSettingsOpen(true);
          }}
          onOpenUpload={() => {
            setIsMobileMenuOpen(false);
            setIsUploadOpen(true);
          }}
          onOpenSync={() => {
            setIsMobileMenuOpen(false);
            setIsSyncModalOpen(true);
          }}
          onSelectCategory={(catId) => {
            setIsMobileMenuOpen(false);
            handleSelectFilter({ type: 'category', value: catId });
          }}
        />
        <UploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
        />
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
        <SyncPlayModal />
      </Suspense>
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
