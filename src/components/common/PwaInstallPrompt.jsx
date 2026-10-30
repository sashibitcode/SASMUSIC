import React, { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Check if running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) return;

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Wait 3 seconds after opening before showing banner
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (isIosDevice && !isStandalone) {
      setTimeout(() => setShowPrompt(true), 4000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <>
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-md p-3 rounded-2xl bg-[#171717]/95 backdrop-blur-xl border border-[#A31C1B]/50 shadow-2xl flex items-center justify-between gap-3 animate-slideDown">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#A31C1B] flex items-center justify-center text-white shadow-md shadow-[#A31C1B]/40 flex-shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Install SAS Music</p>
            <p className="text-xs text-slate-400">Fast, ad-free & works offline</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleInstallClick}
            className="min-h-[44px] px-4 rounded-xl text-xs font-bold bg-[#A31C1B] hover:bg-[#be2524] text-white transition-all shadow-md active:scale-95"
            aria-label="Install app"
          >
            Install
          </button>
          <button
            onClick={() => setShowPrompt(false)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white transition-colors active:scale-90"
            aria-label="Dismiss install banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-[#171717] border border-[#282f2b] p-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#06110c] border border-[#A31C1B]/40 text-[#A31C1B] mx-auto flex items-center justify-center mb-3">
              <Share className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Install on iOS</h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              1. Tap the <strong className="text-[#fca5a5]">Share</strong> icon at the bottom of Safari.<br />
              2. Scroll down and tap <strong className="text-[#fca5a5]">"Add to Home Screen"</strong>.<br />
              3. Tap <strong className="text-[#fca5a5]">"Add"</strong> in the top right.
            </p>
            <button
              onClick={() => {
                setShowIosGuide(false);
                setShowPrompt(false);
              }}
              className="w-full min-h-[44px] py-2.5 rounded-xl bg-[#A31C1B] hover:bg-[#be2524] text-white text-xs font-bold shadow-md active:scale-95 transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}

