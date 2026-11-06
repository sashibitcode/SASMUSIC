import { dark } from '@clerk/themes';

export const getClerkKey = () => {
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem('sas_clerk_pub_key');
    if (localKey && localKey.trim().startsWith('pk_')) {
      return localKey.trim();
    }
  }
  return (
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
    import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    'pk_test_Y29tcGxldGUtYXBoaWQtMjg5Ni5jbGVyay5hY2NvdW50cy5kZXYk'
  ).trim();
};

export const CLERK_PUBLISHABLE_KEY = getClerkKey();
export const IS_CLERK_CONFIGURED = Boolean(
  CLERK_PUBLISHABLE_KEY && CLERK_PUBLISHABLE_KEY.startsWith('pk_')
);

export const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: '#A31C1B',
    colorBackground: '#121614',
    colorInputBackground: '#1c221e',
    colorInputText: '#ffffff',
    colorText: '#ffffff',
    colorTextSecondary: '#94a3b8',
    borderRadius: '0.85rem'
  },
  elements: {
    card: 'border border-[#282f2b] shadow-2xl bg-[#121614]',
    formButtonPrimary: 'bg-[#A31C1B] hover:bg-[#851615] text-white font-semibold transition-all shadow-md active:scale-95',
    headerTitle: 'text-white font-bold tracking-wide',
    headerSubtitle: 'text-slate-400 text-xs',
    socialButtonsBlockButton: 'border-[#282f2b] bg-[#171c19] hover:bg-white/5 text-white transition-colors',
    socialButtonsBlockButtonText: 'text-white font-medium text-xs',
    dividerLine: 'bg-white/10',
    dividerText: 'text-slate-500 text-xs',
    formFieldLabel: 'text-slate-300 text-xs font-medium',
    formFieldInput: 'bg-[#1c221e] border-[#282f2b] text-white focus:border-[#A31C1B]',
    footerActionLink: 'text-[#fca5a5] hover:text-[#f87171] font-medium'
  }
};
