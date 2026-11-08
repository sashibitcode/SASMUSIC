import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Download, RefreshCw, Trash2, CheckCircle2, Sparkles } from 'lucide-react';
import { isVipUnlocked, unlockVip, lockVip, getVipFolderName } from '../../utils/vipConfig';
import { manualSyncVipFolder, getVipStatus } from '../../services/vipAutoSync';
import { clearAudioCache } from '../../services/audioCache';
import { showFloatingToast } from '../../utils/toast';

export function VipSettingsSection({ songs = [] }) {
  const [unlocked, setUnlocked] = useState(isVipUnlocked());
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(null);

  const status = getVipStatus(songs);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const success = unlockVip(passcode);
    if (success) {
      setUnlocked(true);
      setPasscode('');
      showFloatingToast('Unlocked! Downloading collection in background...', 'success');

      // Immediately start downloading all songs automatically without needing any button!
      setIsSyncing(true);
      setSyncProgress({ current: 0, total: status.totalSongs || 1, percent: 0 });
      try {
        await manualSyncVipFolder(songs, (p) => {
          setSyncProgress(p);
        });
      } catch (err) {
        showFloatingToast('Auto-download interrupted. Check your network.', 'error');
      } finally {
        setIsSyncing(false);
        setSyncProgress(null);
      }
    } else {
      setErrorMsg('Incorrect passcode. Please try again.');
    }
  };

  const handleLock = () => {
    lockVip();
    setUnlocked(false);
    showFloatingToast('Private space hidden.', 'info');
  };

  const handleClearOffline = async () => {
    if (confirm('Clear all offline downloaded audio from this device?')) {
      await clearAudioCache();
      showFloatingToast('Offline storage cleared.', 'info');
    }
  };

  if (!unlocked) {
    return (
      <div className="rounded-2xl p-4 bg-[#121614]/60 border border-[#282f2b] space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-400" />
          <h4 className="text-xs font-semibold text-slate-300">
            Private Space
          </h4>
        </div>
        <p className="text-[11px] text-slate-400">
          Enter passcode to unlock your private collection.
        </p>

        <form onSubmit={handleUnlock} className="flex gap-2">
          <input
            type="password"
            value={passcode}
            onChange={(e) => {
              setPasscode(e.target.value);
              setErrorMsg('');
            }}
            placeholder="Enter passcode"
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-500/50"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors active:scale-95 flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Unlock</span>
          </button>
        </form>

        {errorMsg && (
          <p className="text-[11px] text-rose-400 font-medium">{errorMsg}</p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1a1215] to-[#121614] border border-rose-500/30 space-y-3 shadow-lg shadow-rose-950/20">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-rose-400" />
        <h4 className="text-xs font-bold text-white tracking-wide">
          {getVipFolderName()} Collection
        </h4>
      </div>

      {/* Info status */}
      <div className="bg-black/30 rounded-xl p-2.5 border border-white/5 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Target Folder:</span>
          <span className="text-white font-medium">{getVipFolderName()}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Offline Status:</span>
          <span className="text-emerald-400 font-medium flex items-center gap-1">
            {status.downloadedCount >= status.totalSongs && status.totalSongs > 0 && (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            {status.totalSongs === 0
              ? 'Folder empty on Drive'
              : `${status.downloadedCount} / ${status.totalSongs} downloaded`}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 pt-1 border-t border-white/5">
          ✨ Jab bhi Drive me naya gaana aayega, internet connect hote hi automatically download ho jayega.
        </p>
      </div>

      {/* Status or Progress */}
      {isSyncing && syncProgress ? (
        <div className="space-y-1.5 p-2.5 bg-black/40 rounded-xl border border-rose-500/20">
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span className="truncate max-w-[200px] flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 text-rose-400 animate-spin" />
              <span>{syncProgress.currentSongTitle || 'Downloading...'}</span>
            </span>
            <span className="font-mono text-rose-400 font-bold">
              {syncProgress.percent}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-emerald-400 transition-all duration-200"
              style={{ width: `${syncProgress.percent}%` }}
            />
          </div>
        </div>
      ) : status.isComplete ? (
        <div className="flex items-center gap-2 p-2.5 bg-emerald-950/20 rounded-xl border border-emerald-500/30 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>Saare gaane phone me offline ready hain (0 net needed)!</span>
        </div>
      ) : null}

      {/* Action Row */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={handleClearOffline}
          disabled={isSyncing}
          className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl glass-card hover:border-white/20 text-slate-400 hover:text-white text-[11px] font-medium transition-all active:scale-95 disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Clear Offline Storage</span>
        </button>

        <button
          onClick={handleLock}
          className="text-[11px] text-slate-500 hover:text-slate-400 flex items-center gap-1 transition-colors py-1 px-2"
        >
          <Unlock className="w-3 h-3" />
          <span>Hide Collection</span>
        </button>
      </div>
    </div>
  );
}

