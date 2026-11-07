import React from 'react';
import { Users, Crown, Headphones } from 'lucide-react';
import { useSyncPlay } from '../../contexts/SyncPlayContext';

export function SyncStatusBadge({ className = '', showDetails = true }) {
  const { isInRoom, isHost, roomCode, members, setIsSyncModalOpen, connectionStatus, measuredDriftMs } = useSyncPlay();

  if (!isInRoom) return null;

  const isReconnecting = connectionStatus === 'RECONNECTING';
  const absDrift = Math.abs(measuredDriftMs);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setIsSyncModalOpen(true);
      }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all select-none border ${
        isReconnecting
          ? 'bg-amber-950/80 border-amber-500/50 text-amber-200 animate-pulse'
          : 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/50 text-white shadow-[0_0_12px_rgba(52,211,153,0.3)]'
      } ${className}`}
      title="Click to open group session controls"
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            isReconnecting ? 'bg-amber-400' : 'bg-emerald-400'
          }`}
        />
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isReconnecting ? 'bg-amber-500' : 'bg-emerald-400'
          }`}
        />
      </span>

      <Users className="w-3.5 h-3.5 text-emerald-300" />

      <span className="tracking-wide">
        With Friends #{roomCode}
      </span>

      {showDetails && (
        <>
          <span className="text-white/40">•</span>
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 font-medium">
            {isHost ? (
              <>
                <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>Host</span>
              </>
            ) : (
              <>
                <Headphones className="w-3 h-3 text-emerald-300" />
                <span>{absDrift < 40 ? 'Synced (±20ms)' : `${measuredDriftMs > 0 ? '+' : ''}${measuredDriftMs}ms`}</span>
              </>
            )}
          </span>

          {members.length > 1 && (
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] text-slate-300 font-extrabold">
              {members.length}
            </span>
          )}
        </>
      )}
    </button>
  );
}

