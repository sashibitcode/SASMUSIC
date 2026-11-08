import React from 'react';
import {
  X,
  RotateCw,
  Music,
  Radio,
  Command,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useDrive } from '../../contexts/DriveContext';
import { AuthSettingsSection } from '../auth/AuthControls';
import { VipSettingsSection } from './VipSettingsSection';

export function SettingsModal({ isOpen, onClose }) {
  const { songs, isLoading, refreshLibrary } = useDrive();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Click outside backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-[#171717] border border-[#282f2b] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#282f2b] bg-[#121614]/80">
          <h3 className="text-base font-bold text-white tracking-wide">
            Settings
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors active:scale-95"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto no-scrollbar">
          {/* Section 0: User Authentication */}
          <AuthSettingsSection />

          {/* Section 1: Library */}
          <div className="rounded-2xl p-4 bg-[#121614]/60 border border-[#282f2b] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-[#A31C1B]" />
                <h4 className="text-xs font-semibold text-slate-300">
                  Music Library
                </h4>
              </div>
              <span className="text-xs text-slate-400">
                {isLoading ? 'Syncing...' : `${songs.length} songs`}
              </span>
            </div>

            <button
              onClick={refreshLibrary}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl glass-card hover:border-[#A31C1B]/40 text-xs font-medium text-slate-200 transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 text-[#A31C1B] ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Syncing...' : 'Sync Library'}</span>
            </button>
          </div>

          {/* Section 2: Special VIP Offline Collection ("For You ❤️") */}
          <VipSettingsSection songs={songs} />

          {/* Section 3: Audio Quality */}
          <div className="rounded-2xl p-4 bg-[#121614]/60 border border-[#282f2b] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#A31C1B]" />
                <h4 className="text-xs font-semibold text-slate-300">
                  Audio Quality
                </h4>
              </div>
              <span className="text-xs font-semibold text-emerald-400">
                320 kbps High Fidelity
              </span>
            </div>
          </div>

          {/* Section 4: Developer & Brand */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-[#121614] to-[#161a18] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-slate-300" />
                <h4 className="text-xs font-semibold text-slate-200">
                  Developer & Brand
                </h4>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/15">
                @sashibitcode
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Creator:</span>
              <span className="font-semibold text-white">Shashikant Raj</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Role:</span>
              <span className="text-slate-300 font-medium">Data Analyst & Full Stack Developer</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://sashibitcode.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-black/40 hover:bg-white/10 border border-white/10 hover:border-white/20 text-xs font-medium text-slate-200 transition-colors"
              >
                <span>Portfolio</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
              <a
                href="https://github.com/sashibitcode"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-black/40 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-colors"
              >
                <span>GitHub</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Section 5: Keyboard Shortcuts (Desktop) */}
          <div className="hidden sm:block rounded-2xl p-4 bg-[#121614]/60 border border-[#282f2b] space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Command className="w-4 h-4 text-[#A31C1B]" />
              <h4 className="text-xs font-semibold text-slate-300">
                Shortcuts
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/30">
                <span className="text-slate-400">Play / Pause</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-200 font-mono text-[10px]">Space</kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/30">
                <span className="text-slate-400">Seek 5s</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-200 font-mono text-[10px]">← / →</kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/30">
                <span className="text-slate-400">Mute</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-200 font-mono text-[10px]">M</kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/30">
                <span className="text-slate-400">Upload</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-200 font-mono text-[10px]">Shift + U</kbd>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#282f2b] bg-[#121614]/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>SAS Music • v1.0.0</span>
          <a
            href="https://sashibitcode.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-medium"
          >
            <span>By Shashikant Raj (<span className="text-slate-300 font-mono">@sashibitcode</span>)</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
}
