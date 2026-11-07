import React from 'react';
import { LogIn, User, Key, ShieldCheck, LogOut } from 'lucide-react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  UserButton,
  useUser
} from '@clerk/clerk-react';
import { IS_CLERK_CONFIGURED } from '../../config/clerkConfig';
import { showFloatingToast } from '../../utils/toast';

/**
 * Header Authentication Trigger / User Avatar + Direct Log Out Button
 */
export function AuthHeaderButton() {
  if (!IS_CLERK_CONFIGURED) {
    return (
      <button
        onClick={() => {
          showFloatingToast('Add VITE_CLERK_PUBLISHABLE_KEY in .env to enable login', 'info');
        }}
        className="h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-full flex items-center justify-center gap-1.5 bg-[#A31C1B]/80 hover:bg-[#A31C1B] text-white text-[11px] sm:text-xs font-semibold shadow-sm transition-all active:scale-95 border border-[#A31C1B]/40"
        title="Clerk Authentication Setup"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Sign In</span>
      </button>
    );
  }

  return (
    <>
      <SignedOut>
        <SignInButton mode="modal">
          <button
            className="h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-full flex items-center justify-center gap-1.5 bg-[#A31C1B] hover:bg-[#851615] text-white text-[11px] sm:text-xs font-semibold shadow-sm transition-all active:scale-95 border border-[#A31C1B]/50"
            aria-label="Sign In"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </SignInButton>
      </SignedOut>

      <SignedIn>
        {/* Profile Avatar with Popover Profile Menu (Exit icon removed from top header) */}
        <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border border-white/20 hover:border-[#A31C1B]/60 transition-all bg-[#06110c] shadow-sm flex-shrink-0">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: 'w-7.5 h-7.5 rounded-full',
                userButtonPopoverCard: 'bg-[#121614] border border-[#282f2b] text-white shadow-2xl',
                userButtonPopoverFooter: 'hidden'
              }
            }}
          />
        </div>
      </SignedIn>
    </>
  );
}

function SidebarUserProfile() {
  const { user } = useUser();
  const displayName = user?.fullName || user?.firstName || user?.username || 'Music Lover';
  const displayEmail = user?.primaryEmailAddress?.emailAddress || '';

  return (
    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#06110c]/80 border border-white/[0.08] shadow-sm">
      <div className="flex items-center gap-2.5 min-w-0">
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: 'w-8 h-8 rounded-full border border-[#A31C1B]/40',
              userButtonPopoverCard: 'bg-[#121614] border border-[#282f2b] text-white shadow-2xl',
              userButtonPopoverFooter: 'hidden'
            }
          }}
        />
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-slate-100 truncate">
            {displayName}
          </span>
          {displayEmail && (
            <span className="text-[10px] text-slate-400 truncate font-mono">
              {displayEmail}
            </span>
          )}
        </div>
      </div>

      {/* Direct Logout Icon Button */}
      <SignOutButton>
        <button
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </SignOutButton>
    </div>
  );
}

/**
 * Desktop Sidebar User Profile Widget
 */
export function AuthSidebarProfile() {
  if (!IS_CLERK_CONFIGURED) {
    return (
      <button
        onClick={() => {
          showFloatingToast('Add VITE_CLERK_PUBLISHABLE_KEY in .env to enable login', 'info');
        }}
        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#06110c]/80 border border-white/[0.08] hover:border-[#A31C1B]/50 transition-all group text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#A31C1B]/20 flex items-center justify-center text-[#fca5a5] border border-[#A31C1B]/30">
            <User className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
              Sign In
            </span>
            <span className="text-[10px] text-slate-400">
              Personalized Library
            </span>
          </div>
        </div>
        <LogIn className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#A31C1B] transition-colors" />
      </button>
    );
  }

  return (
    <>
      <SignedIn>
        <SidebarUserProfile />
      </SignedIn>

      <SignedOut>
        <SignInButton mode="modal">
          <button className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#06110c]/80 border border-white/[0.08] hover:border-[#A31C1B]/50 transition-all group text-left cursor-pointer">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#A31C1B]/20 flex items-center justify-center text-[#fca5a5] border border-[#A31C1B]/30">
                <User className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                  Sign In
                </span>
                <span className="text-[10px] text-slate-400">
                  Cloud Profile & Perks
                </span>
              </div>
            </div>
            <LogIn className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#A31C1B] transition-colors" />
          </button>
        </SignInButton>
      </SignedOut>
    </>
  );
}

function SettingsUserStatus() {
  const { user } = useUser();
  const displayName = user?.fullName || user?.firstName || 'Logged In';
  const displayEmail = user?.primaryEmailAddress?.emailAddress || '';

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: 'w-9 h-9 rounded-full border border-[#A31C1B]/50',
              userButtonPopoverCard: 'bg-[#121614] border border-[#282f2b] text-white shadow-2xl',
              userButtonPopoverFooter: 'hidden'
            }
          }}
        />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-white truncate">{displayName}</span>
          <span className="text-xs text-slate-400 truncate font-mono">{displayEmail}</span>
        </div>
      </div>

      {/* Direct Sign Out Button inside Settings */}
      <SignOutButton>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-semibold transition-all active:scale-95 flex-shrink-0"
          title="Sign Out of Clerk"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </SignOutButton>
    </div>
  );
}

/**
 * Settings Modal Account Section
 */
export function AuthSettingsSection() {
  if (!IS_CLERK_CONFIGURED) {
    return (
      <div className="rounded-2xl p-4 bg-[#121614] border border-[#282f2b] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0 border border-amber-500/30">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Clerk Authentication</h4>
              <p className="text-xs text-slate-400">Set key to enable user accounts</p>
            </div>
          </div>
          <span className="text-[10px] font-medium bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
            Pending Key
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Add <code className="text-[#fca5a5] bg-black/40 px-1 py-0.5 rounded">VITE_CLERK_PUBLISHABLE_KEY</code> in your <code className="text-white">.env</code> file from <a href="https://dashboard.clerk.com" target="_blank" rel="noreferrer" className="text-white underline hover:text-[#fca5a5]">clerk.com</a>.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 bg-gradient-to-br from-[#1c1414] via-[#171717] to-[#0c1611] border border-[#A31C1B]/30 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#A31C1B]/20 flex items-center justify-center text-[#fca5a5] flex-shrink-0 border border-[#A31C1B]/30">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">User Account</h4>
            <p className="text-xs text-slate-400">Clerk Authentication Profile</p>
          </div>
        </div>
      </div>

      <SignedIn>
        <SettingsUserStatus />
      </SignedIn>

      <SignedOut>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-300">You are browsing as a Guest.</span>
          <SignInButton mode="modal">
            <button className="px-3 py-1.5 rounded-xl bg-[#A31C1B] hover:bg-[#851615] text-white text-xs font-semibold shadow-sm transition-all active:scale-95">
              Sign In
            </button>
          </SignInButton>
        </div>
      </SignedOut>
    </div>
  );
}
