import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  Users,
  Copy,
  Share2,
  Crown,
  Headphones,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Disc,
  Music2,
  Sparkles,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { useSyncPlay } from '../../contexts/SyncPlayContext';
import { useAudio } from '../../contexts/AudioContext';
import { getSongGradientStyle } from '../../utils/artGenerator';
import { formatTime } from '../../utils/formatters';

export function SyncPlayModal() {
  const {
    isInRoom,
    isHost,
    roomCode,
    hostName,
    userName,
    setUserName,
    userId,
    connectionStatus,
    members,
    isSyncModalOpen,
    setIsSyncModalOpen,
    needsUserGesture,
    triggerAutoplayUnlock,
    measuredDriftMs,
    driftStatus,
    scheduledCountdownMs,
    clockOffset,
    estimatedRTT,
    createRoom,
    joinRoom,
    leaveRoom,
    closeRoom,
    copyRoomCode,
    copyShareLink
  } = useSyncPlay();

  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    nextTrack,
    previousTrack,
    volume,
    setVolume,
    isMuted,
    toggleMute
  } = useAudio();

  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'join'
  const [inputCode, setInputCode] = useState('');
  const [inputName, setInputName] = useState(userName || '');

  // Keep input name in sync with stored user name
  useEffect(() => {
    if (userName) setInputName(userName);
  }, [userName]);

  if (!isSyncModalOpen) return null;

  const handleCreate = (e) => {
    e.preventDefault();
    createRoom(inputName);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    joinRoom(inputCode, inputName);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isReconnecting = connectionStatus === 'RECONNECTING';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-fadeIn select-none">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#06110c] border border-[#A31C1B]/60 shadow-[0_20px_70px_rgba(0,0,0,0.9),_0_0_30px_rgba(163,28,27,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-[#A31C1B]/20 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between p-4 sm:p-5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#A31C1B]/20 border border-[#A31C1B]/60 flex items-center justify-center shadow-sm">
              <Radio className="w-5 h-5 text-[#fca5a5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-1.5">
                  SAS MUSIC <span className="text-[#fca5a5]">SyncPlay</span>
                </h2>
                {isInRoom && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isReconnecting ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isReconnecting ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
                    {isReconnecting ? 'Reconnecting' : 'Live Sync'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {isInRoom ? `Active Listening Room #${roomCode}` : 'Listen with friends in real-time, perfectly synchronized.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSyncModalOpen(false)}
            className="w-9 h-9 flex items-center justify-center rounded-full glass-card hover:bg-white/[0.1] text-slate-300 hover:text-white transition-all active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 no-scrollbar relative z-10">
          {/* Autoplay Unlock Banner */}
          {needsUserGesture && (
            <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-2.5 text-xs text-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span>Audio autoplay restricted by browser. Tap to tune into the live session!</span>
              </div>
              <button
                onClick={triggerAutoplayUnlock}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-[#A31C1B] hover:brightness-110 text-white text-xs font-black shadow-lg transition-all active:scale-95 flex-shrink-0"
              >
                Join & Start Listening
              </button>
            </div>
          )}

          {!isInRoom ? (
            /* LOBBY / NOT IN ROOM VIEW */
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="flex rounded-2xl bg-[#171717] p-1 border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    activeTab === 'create'
                      ? 'crimson-glow-btn text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Create Room
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('join')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    activeTab === 'join'
                      ? 'crimson-glow-btn text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Join Room
                </button>
              </div>

              {/* Display Name Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Your Display Name
                </label>
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="Enter your name or nickname"
                  maxLength={24}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#171717] border border-white/[0.1] focus:border-[#A31C1B] text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#A31C1B] transition-all"
                />
              </div>

              {activeTab === 'create' ? (
                /* CREATE ROOM TAB */
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#171717]/80 border border-white/[0.06] space-y-2.5">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      As the <span className="text-[#fca5a5] font-bold">Host</span>, you generate a 6-digit room code to share with friends. You control playback, seeking, and song choices.
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Sub-50ms live synchronization across all devices</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl crimson-glow-btn text-white text-sm font-bold shadow-lg transition-transform active:scale-98 flex items-center justify-center gap-2"
                  >
                    <Radio className="w-4 h-4" />
                    <span>Create Sync Room</span>
                  </button>
                </form>
              ) : (
                /* JOIN ROOM TAB */
                <form onSubmit={handleJoin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      6-Digit Room Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 749201"
                      className="w-full px-3.5 py-3 rounded-xl bg-[#171717] border border-white/[0.1] focus:border-[#A31C1B] text-white text-lg tracking-widest text-center font-mono placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-[#A31C1B] transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={inputCode.length !== 6}
                    className="w-full py-3 rounded-2xl crimson-glow-btn text-white text-sm font-bold shadow-lg transition-transform active:scale-98 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>Join Room</span>
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* ACTIVE ROOM VIEW */
            <div className="space-y-4">
              {/* Room Code & Invite Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#171717] to-[#0d2217] border border-[#A31C1B]/40 shadow-sm flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#fca5a5] tracking-wider">
                    Room Code
                  </p>
                  <p className="text-2xl font-black text-white tracking-widest font-mono mt-0.5">
                    {roomCode.slice(0, 3)} {roomCode.slice(3)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Host: <span className="text-white font-semibold">{hostName || (isHost ? userName : 'Host')}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyRoomCode}
                    className="p-2.5 rounded-xl glass-card hover:bg-white/[0.1] text-slate-200 hover:text-white transition-all active:scale-90"
                    title="Copy 6-digit code"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={copyShareLink}
                    className="px-3 py-2 rounded-xl crimson-glow-btn text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-md"
                    title="Copy shareable link"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                </div>
              </div>

              {/* Currently Playing Track */}
              {currentSong ? (
                <div className="p-3.5 rounded-2xl bg-[#171717] border border-white/[0.08] space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md relative overflow-hidden ${
                        isPlaying ? 'ring-2 ring-[#A31C1B]' : ''
                      }`}
                      style={getSongGradientStyle(currentSong.title, currentSong.artist)}
                    >
                      {isPlaying ? (
                        <Disc className="w-6 h-6 text-white animate-[spin_4s_linear_infinite]" />
                      ) : (
                        <Music2 className="w-6 h-6 text-white/90" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-bold text-white truncate">
                        {currentSong.title}
                      </p>
                      <p className="text-[11px] text-emerald-300 font-medium truncate mt-0.5">
                        {currentSong.artist}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {isHost ? '👑 You control playback' : `🎧 Synced with Host (${hostName || 'Host'})`}
                      </p>
                    </div>
                  </div>

                  {/* Scheduled Start Countdown Notification */}
                  {scheduledCountdownMs > 0 && (
                    <div className="px-3 py-1.5 rounded-xl bg-[#A31C1B]/20 border border-[#A31C1B]/50 flex items-center justify-between text-[11px] text-[#fca5a5] animate-pulse font-mono">
                      <span>⏳ Synchronizing playback buffer...</span>
                      <span>Starting in {scheduledCountdownMs}ms</span>
                    </div>
                  )}

                  {/* Real-time Drift & Clock Calibration Telemetry */}
                  <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-black/40 border border-white/[0.05] text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        Math.abs(measuredDriftMs) < 40 ? 'bg-emerald-400' : Math.abs(measuredDriftMs) < 300 ? 'bg-amber-400' : 'bg-[#A31C1B]'
                      }`} />
                      <span className="text-slate-300 font-semibold">
                        {isHost ? 'Host Master Clock' : `Drift: ${measuredDriftMs > 0 ? '+' : ''}${measuredDriftMs}ms`}
                      </span>
                    </span>
                    <span className="text-slate-400">
                      Offset: {clockOffset > 0 ? '+' : ''}{clockOffset}ms • RTT: {estimatedRTT}ms
                    </span>
                  </div>

                  {/* Synchronized Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#A31C1B] to-[#e2403f] transition-all duration-200"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Playback Controls (Host only) */}
                  {isHost ? (
                    <div className="flex items-center justify-center gap-4 pt-1">
                      <button
                        onClick={previousTrack}
                        className="p-2 rounded-full text-slate-300 hover:text-white transition-colors active:scale-90"
                        title="Previous"
                      >
                        <SkipBack className="w-5 h-5 fill-slate-300" />
                      </button>

                      <button
                        onClick={togglePlay}
                        className="w-11 h-11 rounded-full crimson-glow-btn text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                        title={isPlaying ? 'Pause for all' : 'Play for all'}
                      >
                        {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                      </button>

                      <button
                        onClick={nextTrack}
                        className="p-2 rounded-full text-slate-300 hover:text-white transition-colors active:scale-90"
                        title="Next"
                      >
                        <SkipForward className="w-5 h-5 fill-slate-300" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-1 px-1 text-xs text-slate-400">
                      <span className="italic">Host controls playback</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={toggleMute}
                          className="p-1 text-slate-400 hover:text-white transition-colors"
                          title="Toggle Mute"
                        >
                          {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-[#A31C1B]" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={isMuted ? 0 : volume}
                          onChange={(e) => setVolume(Number(e.target.value))}
                          className="w-20 h-1 accent-[#A31C1B] cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#171717] border border-white/[0.06] text-center space-y-1">
                  <p className="text-xs text-slate-300 font-medium">No track playing yet</p>
                  <p className="text-[11px] text-slate-500">
                    {isHost ? 'Pick any song from the library to start streaming for your room.' : 'Waiting for host to choose a song...'}
                  </p>
                </div>
              )}

              {/* Connected Listeners List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Listening Room ({members.length})</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Active & Synced</span>
                </div>

                <div className="rounded-2xl bg-[#171717] border border-white/[0.06] divide-y divide-white/[0.04] max-h-40 overflow-y-auto no-scrollbar">
                  {members.map((m) => {
                    const isSelf = m.userId === userId;
                    return (
                      <div key={m.userId} className="flex items-center justify-between p-2.5 px-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white shadow-sm flex-shrink-0"
                            style={{ backgroundColor: m.avatarColor || '#059669' }}
                          >
                            {m.userName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold text-white truncate max-w-[140px] sm:max-w-[200px]">
                            {m.userName} {isSelf && <span className="text-slate-400 font-normal">(You)</span>}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {m.isHost ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                              <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
                              <span>Host</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-medium">
                              <Headphones className="w-3 h-3" />
                              <span>Listening</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Room Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={leaveRoom}
                  className="flex-1 py-2.5 rounded-xl glass-card hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-4 h-4 text-slate-400" />
                  <span>Leave Room</span>
                </button>

                {isHost && (
                  <button
                    type="button"
                    onClick={closeRoom}
                    className="flex-1 py-2.5 rounded-xl bg-red-950/50 hover:bg-red-900/60 border border-red-700/50 text-red-200 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <X className="w-4 h-4 text-red-400" />
                    <span>Close Room</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

