import React, { useState, useEffect } from 'react';
import { Sparkles, Send, CheckCircle2, Clock, Music, AlertCircle, Loader2 } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { showFloatingToast } from '../../utils/toast';

export function SongRequestCard({ searchQuery = '', onClearSearch }) {
  const { user, isSignedIn } = useUser();
  const [songTitle, setSongTitle] = useState(searchQuery);
  const [requesterName, setRequesterName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(600); // 10 minutes in seconds

  // Keep input synced if searchQuery changes
  useEffect(() => {
    if (searchQuery && !isSuccess) {
      setSongTitle(searchQuery);
    }
  }, [searchQuery, isSuccess]);

  // Pre-fill requester name if signed in via Clerk
  useEffect(() => {
    if (isSignedIn && user) {
      setRequesterName(user.fullName || user.firstName || 'Music Lover');
    }
  }, [isSignedIn, user]);

  // 10-Minute live timer after request is sent
  useEffect(() => {
    let timer;
    if (isSuccess && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSuccess, countdown]);

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!songTitle || !songTitle.trim()) {
      setErrorMessage('Kripya gaane ka naam daalein');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/request-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songName: songTitle.trim(),
          userName: requesterName.trim() || (isSignedIn ? user?.fullName : 'Guest Listener'),
          userEmail: isSignedIn ? user?.primaryEmailAddress?.emailAddress : 'Guest'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request bhejne me dikkat aayi');
      }

      setIsSuccess(true);
      showFloatingToast('Song request bhej diya gaya hai! ⚡', 'success');
    } catch (err) {
      setErrorMessage(err.message || 'Server error. Kripya thodi der me dobara try karein.');
      showFloatingToast(err.message || 'Request failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto my-6 rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#1c1212]/95 via-[#141a16]/95 to-[#0b140f]/95 border border-[#A31C1B]/40 shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl text-left relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Background ambient crimson glow */}
      <div className="absolute -top-12 -right-12 w-44 h-44 bg-[#A31C1B]/15 rounded-full blur-3xl pointer-events-none" />

      {isSuccess ? (
        /* Success Confirmation View */
        <div className="text-center py-4 space-y-3 relative z-10 animate-in fade-in duration-300">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div>
            <h4 className="text-base sm:text-lg font-bold text-white tracking-wide">
              Request Bhej Diya Gaya Hai! 🎉
            </h4>
            <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
              Aapka request <span className="text-[#fca5a5] font-semibold font-mono">"{songTitle}"</span> Shashikant ji (Admin) ko Telegram par mil gaya hai.
            </p>
          </div>

          {/* 10-Min Live Countdown Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/40 border border-[#A31C1B]/35 shadow-inner">
            <Clock className="w-4 h-4 text-[#fca5a5] animate-pulse" />
            <span className="text-xs font-semibold text-slate-200">
              Expected addition in:{' '}
              <span className="font-mono font-bold text-[#fca5a5]">
                ~{formatCountdown(countdown)}
              </span>
            </span>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                setIsSuccess(false);
                setSongTitle('');
                setCountdown(600);
                onClearSearch?.();
              }}
              className="px-4 py-2 rounded-xl glass-card hover:border-[#A31C1B]/40 text-xs font-medium text-slate-300 hover:text-white transition-all active:scale-95"
            >
              Doosra gaana search karein
            </button>
          </div>
        </div>
      ) : (
        /* Request Input Form View */
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {/* Card Header & 10-Min Promise */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#A31C1B]/20 border border-[#A31C1B]/35 text-[#fca5a5] flex items-center justify-center flex-shrink-0 shadow-sm">
                <Music className="w-5 h-5 text-[#fca5a5]" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center gap-1.5">
                  <span>Song nahi mila? Request karein!</span>
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                  Request bhejte hi hum ise turant library me add kar denge.
                </p>
              </div>
            </div>

            <span className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#A31C1B]/20 text-[#fca5a5] border border-[#A31C1B]/40 shadow-sm flex items-center gap-1 whitespace-nowrap">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Within 10 Mins ⚡</span>
            </span>
          </div>

          {/* Song Title Input */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-slate-300">
              Gaane ka Naam / Movie / Singer:
            </label>
            <div className="relative">
              <input
                type="text"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder="Jaise: Chaleya - Jawan ya Pawan Singh..."
                className="w-full bg-[#06110c]/80 border border-white/15 focus:border-[#A31C1B] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all focus:ring-1 focus:ring-[#A31C1B]/50"
                maxLength={120}
                required
              />
            </div>
          </div>

          {/* User Name (Optional for guests, pre-filled for Clerk users) */}
          {!isSignedIn && (
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-slate-400">
                Aapka Naam (Optional):
              </label>
              <input
                type="text"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                placeholder="Aapka naam..."
                className="w-full bg-[#06110c]/60 border border-white/10 focus:border-white/20 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 outline-none"
                maxLength={60}
              />
            </div>
          )}

          {/* Error notice if any */}
          {errorMessage && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/25 px-3 py-2 rounded-xl">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Send Request Button */}
          <button
            type="submit"
            disabled={isSubmitting || !songTitle.trim()}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl crimson-glow-btn text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#A31C1B]/25 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Admin ko bhej rahe hain...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send Request (Add within 10 Mins)</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
