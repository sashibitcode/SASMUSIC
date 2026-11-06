import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Lock, Upload, FileAudio, CheckCircle2, AlertCircle, 
  Eye, EyeOff, RotateCw, Music, ShieldCheck, Sparkles 
} from 'lucide-react';
import { parseSongFileName } from '../../utils/songParser';
import { useDrive } from '../../contexts/DriveContext';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_EXTENSIONS = ['.mp3', '.m4a', '.aac', '.wav'];

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 MB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function UploadModal({ isOpen, onClose }) {
  const { refreshLibrary } = useDrive();

  // Fresh token per upload - requires password every single time
  const [token, setToken] = useState(null);

  // UI Step: 'AUTH' | 'FORM' | 'UPLOADING' | 'SUCCESS' | 'ERROR'
  const [step, setStep] = useState('AUTH');

  // Password state
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState('');

  // File & Metadata state
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [confirmedOriginal, setConfirmedOriginal] = useState(false);
  const [formError, setFormError] = useState('');

  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');

  const xhrRef = useRef(null);
  const fileInputRef = useRef(null);

  // Always reset to password screen every single time the modal is opened
  useEffect(() => {
    if (isOpen) {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('sas_upload_token');
      }
      setToken(null);
      setStep('AUTH');
      setPassword('');
      setFile(null);
      setTitle('');
      setArtist('');
      setConfirmedOriginal(false);
      setUploadProgress(0);
      setAuthError('');
      setFormError('');
      setUploadError('');
    } else {
      // Abort any in-flight upload if closed
      if (xhrRef.current) {
        xhrRef.current.abort();
        xhrRef.current = null;
      }
      setToken(null);
      setStep('AUTH');
      setPassword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle password submission
  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsVerifying(true);
    setAuthError('');

    try {
      const res = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() })
      });

      const data = await res.json();

      if (res.ok && data.token) {
        setToken(data.token);
        setPassword('');
        setStep('FORM');
      } else {
        setAuthError(data.error || 'Wrong password');
      }
    } catch (err) {
      setAuthError('Connection error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle file selection
  const handleFileChange = (selectedFile) => {
    setFormError('');
    if (!selectedFile) return;

    const extMatch = selectedFile.name.match(/\.([a-z0-9]+)$/i);
    const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : '';

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFormError(`Invalid format (${ext || 'unknown'}). Supported: .mp3, .m4a, .aac, .wav`);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFormError(`File is too large (${formatBytes(selectedFile.size)}). Maximum limit is 50 MB.`);
      return;
    }

    setFile(selectedFile);

    // Auto-parse Title and Artist from filename
    const parsed = parseSongFileName(selectedFile.name);
    setTitle(parsed.title || '');
    setArtist(parsed.artist === 'Unknown Artist' ? '' : parsed.artist);
  };

  // Start direct Google Drive resumable upload
  const handleStartUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setFormError('Please select an audio file first.');
      return;
    }

    if (!title.trim() || !artist.trim()) {
      setFormError('Please specify both a Song Title and Artist.');
      return;
    }

    if (!confirmedOriginal) {
      setFormError('You must confirm permission or original ownership to proceed.');
      return;
    }

    setStep('UPLOADING');
    setUploadProgress(0);
    setUploadedBytes(0);
    setTotalBytes(file.size);
    setUploadError('');

    try {
      // 1. Get resumable upload session from backend
      const sessionRes = await fetch('/api/upload-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          artist: artist.trim(),
          originalFileName: file.name,
          mimeType: file.type || 'audio/mpeg',
          fileSize: file.size
        })
      });

      if (sessionRes.status === 401) {
        // Expired token -> return to password gate
        sessionStorage.removeItem('sas_upload_token');
        setToken(null);
        setStep('AUTH');
        setAuthError('Your upload session expired. Please re-enter password.');
        return;
      }

      const sessionData = await sessionRes.json();
      if (!sessionRes.ok || !sessionData.uploadUrl) {
        throw new Error(sessionData.error || 'Failed to initialize upload session');
      }

      setUploadedFileName(sessionData.fileName);

      // 2. Upload directly to Google Drive via XMLHttpRequest for granular progress tracking
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.open('PUT', sessionData.uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type || 'audio/mpeg');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(pct);
          setUploadedBytes(event.loaded);
          setTotalBytes(event.total);
        }
      };

      xhr.onload = () => {
        xhrRef.current = null;
        if (xhr.status === 200 || xhr.status === 201) {
          setStep('SUCCESS');
          // Automatically refresh the public library!
          refreshLibrary();
        } else {
          setUploadError(`Drive rejected upload (HTTP ${xhr.status}). Please try again.`);
          setStep('ERROR');
        }
      };

      xhr.onerror = () => {
        xhrRef.current = null;
        setUploadError('Network connection interrupted. Please verify your connection and retry.');
        setStep('ERROR');
      };

      xhr.onabort = () => {
        xhrRef.current = null;
        setStep('FORM');
      };

      xhr.send(file);
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
      setStep('ERROR');
    }
  };

  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setStep('FORM');
  };

  const handleResetForAnother = () => {
    setFile(null);
    setTitle('');
    setArtist('');
    setConfirmedOriginal(false);
    setUploadProgress(0);
    setToken(null);
    setPassword('');
    setStep('AUTH');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#171717] border border-white/[0.08] p-6 shadow-2xl overflow-hidden text-slate-100">
        {/* Ambient atmospheric red glow */}
        <div className="absolute -top-24 -right-24 w-52 h-52 bg-[#A31C1B]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#06110c] border border-[#A31C1B]/40 flex items-center justify-center text-[#A31C1B]">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wide">Upload Track</h3>
              <p className="text-xs text-slate-400">Add audio to library</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: PASSWORD GATE */}
        {step === 'AUTH' && (
          <form onSubmit={handleVerifyPassword} className="mt-5 space-y-4">
            <div className="text-center py-2">
              <div className="w-11 h-11 mx-auto rounded-full bg-[#06110c] border border-white/[0.08] flex items-center justify-center text-slate-300 mb-2 shadow-md">
                <Lock className="w-4 h-4 text-[#A31C1B]" />
              </div>
              <h4 className="text-sm font-semibold text-white">Passkey Required</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Enter creator passkey to unlock uploads.
              </p>
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter passkey..."
                  autoFocus
                  className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl bg-[#222222] border border-white/[0.08] text-white placeholder-slate-500 focus:outline-none focus:border-[#A31C1B] focus:ring-1 focus:ring-[#A31C1B]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {authError && (
                <div className="flex items-center gap-1.5 mt-2 text-rose-400 text-xs animate-shake">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-[#222222] hover:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVerifying || !password.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#A31C1B] hover:bg-[#be2524] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-[#A31C1B]/30"
              >
                {isVerifying ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Unlock</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: FILE SELECTION & METADATA FORM */}
        {step === 'FORM' && (
          <form onSubmit={handleStartUpload} className="mt-4 space-y-3.5">
            {/* File drop zone / picker */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.m4a,.aac,.wav,audio/*"
                onChange={(e) => handleFileChange(e.target.files[0])}
                className="hidden"
              />

              {!file ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-white/[0.12] hover:border-[#A31C1B]/60 rounded-2xl p-5 text-center transition-all bg-[#222222]/50 hover:bg-[#222222] group"
                >
                  <FileAudio className="w-9 h-9 mx-auto text-slate-400 group-hover:text-[#A31C1B] transition-colors mb-2" />
                  <p className="text-xs font-semibold text-white">Tap to select an audio file</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">MP3, M4A, AAC, WAV (Max 50 MB)</p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#06110c] border border-white/[0.08]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Music className="w-4 h-4 text-[#A31C1B] flex-shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-400">{formatBytes(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setTitle('');
                      setArtist('');
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* Editable Title & Artist */}
            {file && (
              <div className="space-y-3 animate-fadeIn">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Song Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Blinding Lights"
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#222222] border border-white/[0.08] text-white placeholder-slate-500 focus:outline-none focus:border-[#A31C1B] focus:ring-1 focus:ring-[#A31C1B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Artist / Band
                  </label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="e.g. The Weeknd"
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#222222] border border-white/[0.08] text-white placeholder-slate-500 focus:outline-none focus:border-[#A31C1B] focus:ring-1 focus:ring-[#A31C1B]"
                  />
                </div>

                {/* Filename Preview */}
                <div className="p-2.5 rounded-lg bg-[#222222]/60 border border-white/[0.04] text-[11px] text-slate-400">
                  <span className="text-slate-500">File format: </span>
                  <span className="text-emerald-400 font-mono">
                    {title.trim() || 'Title'} - {artist.trim() || 'Artist'}
                    {file.name.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() || '.mp3'}
                  </span>
                </div>

                {/* Mandatory legal confirmation */}
                <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={confirmedOriginal}
                    onChange={(e) => setConfirmedOriginal(e.target.checked)}
                    className="mt-0.5 rounded border-white/[0.1] text-[#A31C1B] focus:ring-[#A31C1B] focus:ring-offset-0 bg-[#222222] cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-300 leading-tight select-none">
                    I confirm this song is my original work or I have permission to upload it.
                  </span>
                </label>
              </div>
            )}

            {formError && (
              <div className="flex items-center gap-1.5 text-rose-400 text-xs animate-shake">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-[#222222] hover:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!file || !title.trim() || !artist.trim() || !confirmedOriginal}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#A31C1B] hover:bg-[#be2524] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-[#A31C1B]/30"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Song</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: UPLOADING WITH PROGRESS BAR */}
        {step === 'UPLOADING' && (
          <div className="mt-5 space-y-5 text-center py-4">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-white/[0.08]" />
              <div 
                className="absolute inset-0 rounded-full border-2 border-[#A31C1B] border-t-transparent animate-spin" 
              />
              <Upload className="w-6 h-6 text-[#A31C1B] animate-pulse" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-white">Uploading Song...</h4>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-sm mx-auto">
                {uploadedFileName || `${title} - ${artist}`}
              </p>
            </div>

            {/* Progress bar container */}
            <div className="space-y-1.5 max-w-md mx-auto">
              <div className="w-full h-2.5 rounded-full bg-[#222222] overflow-hidden border border-white/[0.04]">
                <div 
                  className="h-full bg-gradient-to-r from-[#A31C1B] to-rose-500 rounded-full transition-all duration-150 shadow-[0_0_10px_rgba(163,28,27,0.7)]"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 px-0.5">
                <span>{formatBytes(uploadedBytes)} of {formatBytes(totalBytes)}</span>
                <span className="font-semibold text-white">{uploadProgress}%</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleCancelUpload}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-[#222222] hover:bg-white/[0.06] transition-colors"
              >
                Cancel Upload
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS SCREEN */}
        {step === 'SUCCESS' && (
          <div className="mt-5 space-y-4 text-center py-4 animate-fadeIn">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-base font-bold text-white">Uploaded!</h4>
              <p className="text-xs text-emerald-400 mt-1 font-medium">
                Your song is now live in the library.
              </p>
              <p className="text-[11px] text-slate-400 mt-1 truncate max-w-xs mx-auto">
                {uploadedFileName}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-3">
              <button
                type="button"
                onClick={handleResetForAnother}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#222222] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
              >
                Upload Another
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#A31C1B] hover:bg-[#be2524] shadow-lg shadow-[#A31C1B]/30 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: ERROR SCREEN */}
        {step === 'ERROR' && (
          <div className="mt-5 space-y-4 text-center py-4 animate-fadeIn">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-base font-bold text-white">Upload Failed</h4>
              <p className="text-xs text-rose-300 mt-1 leading-relaxed max-w-sm mx-auto">
                {uploadError || 'An error occurred during upload. Please try again.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-[#222222] transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setStep('FORM')}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#A31C1B] hover:bg-[#be2524] transition-all"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

