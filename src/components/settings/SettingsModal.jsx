import React from 'react';
import {
  X,
  Upload,
  RotateCw,
  ShieldCheck,
  Music,
  Radio,
  Command,
  CheckCircle2,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { useDrive } from '../../contexts/DriveContext';

export function SettingsModal({ isOpen, onClose, onOpenUpload }) {
  const { songs, isLoading, refreshLibrary } = useDrive();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-[#171717] border border-[#282f2b] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#282f2b] bg-[#121614]/80">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Settings & Studio</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Player preferences and creator tools
            </p>
          </div>
          <button
            onClick={onClose}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors active:scale-95"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto no-scrollbar">
          {/* Section 1: Creator Studio (Admin Access) */}
          <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-[#1c1212] via-[#171717] to-[#0c1611] border border-[#A31C1B]/40 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#A31C1B]/20 flex items-center justify-center text-[#A31C1B] flex-shrink-0 border border-[#A31C1B]/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">Creator Studio</h4>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold bg-[#A31C1B]/20 text-[#fca5a5] px-2 py-0.5 rounded-full border border-[#A31C1B]/40">
                      Passkey Protected
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Authorized song upload to Google Drive library
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
              Upload new audio tracks directly to the official SAS Music cloud storage. Requires administrator authentication passkey.
            </p>

            <button
              onClick={() => {
                onClose();
                onOpenUpload();
              }}
              className="w-full mt-3.5 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl crimson-glow-btn text-white text-xs font-bold transition-all active:scale-95 shadow-md shadow-[#A31C1B]/30"
            >
              <Upload className="w-4 h-4" />
              <span>Launch Studio Uploader</span>
            </button>
          </div>

          {/* Section 2: Library & Sync */}
          <div className="rounded-2xl p-4 bg-[#121614]/60 border border-[#282f2b] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-[#A31C1B]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Cloud Library Sync
                </h4>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Connected
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Indexed Tracks:</span>
              <span className="font-semibold text-white">
                {isLoading ? 'Syncing...' : `${songs.length} tracks`}
              </span>
            </div>

            <button
              onClick={refreshLibrary}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl glass-card hover:border-[#A31C1B]/40 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 text-[#A31C1B] ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Syncing Drive...' : 'Force Sync Library Now'}</span>
            </button>
          </div>

          {/* Section 3: Audio Playback Quality */}
          <div className="rounded-2xl p-4 bg-[#121614]/60 border border-[#282f2b] space-y-2.5">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#A31C1B]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Audio Stream Quality
              </h4>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-400">Stream Source:</span>
              <span className="font-semibold text-slate-200">Google Drive Resumable Stream</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Audio Fidelity:</span>
              <span className="font-semibold text-emerald-400">Original Master (Up to 320 kbps)</span>
            </div>
          </div>

          {/* Section 4: Developer & Identity */}
          <div className="rounded-2xl p-4 bg-[#121614]/60 border border-[#282f2b] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#A31C1B]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Developer & Brand
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#A31C1B]/20 text-[#fca5a5] border border-[#A31C1B]/30 font-semibold">
                @sashibitcode
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Author:</span>
              <span className="font-semibold text-white">Shashikant Raj</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Job Title:</span>
              <span className="font-medium text-slate-300">Data Analyst & Full Stack Developer</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://sashibitcode.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-black/40 hover:bg-[#A31C1B]/20 border border-white/10 hover:border-[#A31C1B]/40 text-[11px] font-medium text-slate-200 transition-colors"
              >
                <span>Portfolio</span>
                <ExternalLink className="w-3 h-3 text-[#A31C1B]" />
              </a>
              <a
                href="https://github.com/sashibitcode"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-black/40 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-slate-200 transition-colors"
              >
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Section 5: Keyboard Shortcuts (Desktop) */}
          <div className="hidden sm:block rounded-2xl p-4 bg-[#121614]/60 border border-[#282f2b] space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Command className="w-4 h-4 text-[#A31C1B]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Desktop Shortcuts
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/30">
                <span className="text-slate-400">Play / Pause</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-200 font-mono text-[10px]">Space</kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/30">
                <span className="text-slate-400">Seek 5s</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-200 font-mono text-[10px]">← / →</kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/30">
                <span className="text-slate-400">Mute Toggle</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-200 font-mono text-[10px]">M</kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/30">
                <span className="text-slate-400">Creator Upload</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-200 font-mono text-[10px]">Shift + U</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#282f2b] bg-[#121614]/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>SAS Music • v1.0.0</span>
          <a
            href="https://sashibitcode.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-medium"
          >
            <span>By Shashikant Raj (<span className="text-[#A31C1B] font-mono">@sashibitcode</span>)</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

