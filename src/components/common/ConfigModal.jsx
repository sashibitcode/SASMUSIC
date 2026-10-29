import React, { useState } from 'react';
import { X, Key, Folder, Check, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { useDrive } from '../../contexts/DriveContext';

export function ConfigModal({ isOpen, onClose }) {
  const { config, updateConfig, isDemo, toggleDemoMode } = useDrive();
  const [folderId, setFolderId] = useState(config.folderId === 'PASTE_FOLDER_ID_HERE' ? '' : config.folderId);
  const [apiKey, setApiKey] = useState(config.apiKey === 'PASTE_API_KEY_HERE' ? '' : config.apiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    updateConfig(folderId, apiKey);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleClear = () => {
    setFolderId('');
    setApiKey('');
    updateConfig('', '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#171717] border border-[#282f2b] p-6 shadow-2xl overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#A31C1B]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#282f2b]">
          <div className="flex items-center gap-3">
            <img src="/sas-music-logo.png?v=2" alt="SAS Music" className="h-6 w-auto object-contain" />
            <div className="h-4 w-[1px] bg-[#282f2b]" />
            <div>
              <h3 className="text-sm font-bold text-white">Google Drive Setup</h3>
              <p className="text-[11px] text-slate-400">Configure your public audio stream folder</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#222222] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Mode Banner */}
        <div className="mt-4 p-3.5 rounded-xl bg-[#06110c] border border-[#A31C1B]/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-[#A31C1B] flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[#fca5a5]">Test with Demo Songs</p>
              <p className="text-[11px] text-slate-400">Preview player without your own Drive credentials</p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleDemoMode}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              isDemo
                ? 'bg-[#A31C1B] text-white shadow-md shadow-[#A31C1B]/40'
                : 'bg-[#222222] text-slate-300 hover:text-white border border-[#282f2b]'
            }`}
          >
            {isDemo ? 'Demo Active' : 'Switch to Demo'}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Google Drive Folder ID
            </label>
            <div className="relative">
              <Folder className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                placeholder="e.g. 1a2B3c4D5e6F7g8H9..."
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-[#222222] border border-[#282f2b] text-white placeholder-slate-600 focus:outline-none focus:border-[#A31C1B] focus:ring-1 focus:ring-[#A31C1B]"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              From the folder URL: drive.google.com/drive/folders/<strong>[FOLDER_ID]</strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Google Drive API v3 Key
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="e.g. AIzaSyB..."
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-[#222222] border border-[#282f2b] text-white placeholder-slate-600 focus:outline-none focus:border-[#A31C1B] focus:ring-1 focus:ring-[#A31C1B]"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Obtained from Google Cloud Console with Google Drive API enabled.
            </p>
          </div>

          {/* Security recommendation */}
          <div className="p-2.5 rounded-lg bg-[#06110c] border border-[#282f2b] flex items-start gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Tip:</strong> Restrict your Google API key to your website domain (HTTP referrers) in Google Cloud Console for enhanced security.
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
            >
              Reset to Defaults
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-[#222222] hover:bg-[#282f2b] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#A31C1B] hover:bg-[#be2524] transition-all active:scale-95 shadow-lg shadow-[#A31C1B]/40"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save & Connect</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
