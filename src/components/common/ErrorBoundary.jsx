import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Logo } from './Logo';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[SAS Music ErrorBoundary] Caught unhandled exception:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHardReset = () => {
    try {
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
      localStorage.removeItem('sas_current_song');
      localStorage.removeItem('sas_audio_queue');
      localStorage.removeItem('sas_queue_index');
    } catch (_) {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#06110c] text-white flex flex-col items-center justify-center p-4 selection:bg-[#A31C1B]">
          <div className="max-w-md w-full glass-card p-6 rounded-2xl border border-white/10 text-center flex flex-col items-center shadow-2xl relative overflow-hidden">
            <div className="absolute -inset-1 bg-[#A31C1B]/15 blur-2xl pointer-events-none" />
            
            <Logo className="h-10 w-auto mb-6 relative z-10" />

            <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-4 text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-bold mb-2 text-white">Something went wrong</h2>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              We encountered an unexpected interface error. Tap reload below to refresh the music player.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#A31C1B] hover:bg-[#851615] text-white font-semibold text-sm transition-all shadow-lg shadow-[#A31C1B]/30 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Player
              </button>
              <button
                onClick={this.handleHardReset}
                className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 font-semibold text-xs transition-all active:scale-95"
              >
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
