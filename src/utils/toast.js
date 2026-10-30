/**
 * Lightweight, non-intrusive floating toast notification for SAS MUSIC
 */

export function showFloatingToast(message, type = 'info') {
  if (typeof document === 'undefined') return;

  const existingToast = document.getElementById('sas-floating-toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'sas-floating-toast';
  
  const isError = type === 'error';
  const dotColor = isError ? 'bg-[#A31C1B]' : 'bg-emerald-400';
  const borderColor = isError ? 'border-[#A31C1B]' : 'border-[#A31C1B]/60';

  toast.className = `fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#171717]/95 ${borderColor} border text-white text-xs font-medium shadow-[0_8px_30px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-all duration-300 pointer-events-none select-none flex items-center gap-2 animate-in fade-in zoom-in-95`;
  toast.innerHTML = `<span class="w-2 h-2 rounded-full ${dotColor} animate-pulse"></span><span>${message}</span>`;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, 10px)';
    setTimeout(() => toast.remove(), 350);
  }, 2800);
}

