import React from 'react';
import { Upload } from 'lucide-react';
import { Logo } from '../common/Logo';

export function Header({ onLogoClick, onUploadClick }) {
  return (
    <header className="sticky top-0 z-20 bg-[#06110c]/85 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.7)] px-4 sm:px-6 py-3 pt-safe">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Official Brand Logo */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-[#A31C1B]/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          <Logo
            className="h-8 sm:h-9 w-auto relative z-10"
            onClick={onLogoClick}
          />
        </div>

        {/* Upload Action Button */}
        {onUploadClick && (
          <button
            onClick={onUploadClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-semibold text-white bg-[#A31C1B] hover:bg-[#be2524] transition-all active:scale-95 shadow-md shadow-[#A31C1B]/30 select-none"
            aria-label="Upload Song"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>
        )}
      </div>
    </header>
  );
}
