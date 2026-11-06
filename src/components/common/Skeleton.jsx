import React from 'react';

export function SongRowSkeleton() {
  return (
    <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#171717]/80 animate-pulse border border-[#282f2b]/80 mb-2">
      <div className="w-12 h-12 rounded-lg bg-[#222222] flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-[#282f2b] rounded-md w-3/5" />
        <div className="h-3 bg-[#222222] rounded-md w-2/5" />
      </div>
      <div className="w-10 h-3 bg-[#222222] rounded-md hidden sm:block" />
      <div className="w-8 h-8 rounded-full bg-[#222222]" />
    </div>
  );
}

export function SongListSkeleton({ count = 8 }) {
  return (
    <div className="space-y-2 py-2">
      {Array.from({ length: count }).map((_, index) => (
        <SongRowSkeleton key={index} />
      ))}
    </div>
  );
}

