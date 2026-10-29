import React from 'react';
import { AlertCircle, WifiOff, KeyRound, ServerOff, FolderX, RotateCw, Settings } from 'lucide-react';

export function ErrorState({ error, onRetry, onOpenConfig }) {
  if (!error) return null;

  const isOffline = error.code === 'OFFLINE' || !navigator.onLine;
  const isInvalidKey = error.code === 'INVALID_API_KEY';
  const isQuota = error.code === 'QUOTA_EXCEEDED';
  const isFolderNotFound = error.code === 'FOLDER_NOT_FOUND' || error.code === 'ACCESS_DENIED';
  const isEmptyFolder = error.code === 'EMPTY_FOLDER';

  let Icon = AlertCircle;
  let title = 'Something went wrong';
  let description = error.message || 'Unable to load songs from Google Drive.';
  let showConfigBtn = true;

  if (isOffline) {
    Icon = WifiOff;
    title = 'No Internet Connection';
    description = 'Please check your Wi-Fi or mobile data network. Your cached app shell and saved favorites are safe.';
    showConfigBtn = false;
  } else if (isInvalidKey) {
    Icon = KeyRound;
    title = 'Invalid Google Drive API Key';
    description = 'The API key provided is not valid or Google Drive API v3 has not been enabled for your Google Cloud project.';
  } else if (isQuota) {
    Icon = ServerOff;
    title = 'Drive API Quota Exceeded';
    description = 'The Google Drive API free quota (20,000 queries/day) has been reached. Please try again shortly or use your own API key.';
  } else if (isFolderNotFound) {
    Icon = FolderX;
    title = 'Folder Not Found or Restricted';
    description = 'Could not access the Drive folder. Make sure the folder is shared as "Anyone with the link can view".';
  } else if (isEmptyFolder) {
    Icon = FolderX;
    title = 'Drive Folder is Empty';
    description = 'No audio files (.mp3, .m4a, .flac, .wav) were found in this Google Drive folder. Upload songs to your folder and refresh.';
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 my-6 text-center rounded-2xl bg-[#171717] border border-[#282f2b] max-w-lg mx-auto shadow-xl">
      <div className="w-16 h-16 rounded-2xl bg-[#06110c] border border-[#A31C1B]/40 flex items-center justify-center text-[#A31C1B] mb-4 shadow-[0_0_20px_rgba(163,28,27,0.3)]">
        <Icon className="w-8 h-8" />
      </div>

      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-300 leading-relaxed mb-6">{description}</p>

      <div className="flex flex-wrap items-center justify-center gap-3 w-full">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#A31C1B] hover:bg-[#be2524] text-white font-medium text-sm transition-all duration-200 active:scale-95 shadow-lg shadow-[#A31C1B]/40"
          >
            <RotateCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        )}

        {showConfigBtn && onOpenConfig && (
          <button
            onClick={onOpenConfig}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#222222] hover:bg-[#282f2b] text-slate-200 font-medium text-sm transition-all duration-200 border border-[#282f2b]"
          >
            <Settings className="w-4 h-4" />
            <span>Check Settings</span>
          </button>
        )}
      </div>
    </div>
  );
}

