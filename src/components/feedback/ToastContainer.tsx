import { X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export function ToastContainer() {
  const { toasts, dismissToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2.5rem)]"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center justify-between gap-3 px-4 py-3 text-xs border rounded-[14px] shadow-lg ${
            toast.tone === 'error'
              ? 'bg-[#8B2635] text-[#FFFFFF] border-[#D6B88C]/40'
              : toast.tone === 'success'
              ? 'bg-[#35151F] text-[#F5EEE5] border-[#D6B88C]/50'
              : 'bg-[#FFFFFF] text-[#35151F] border-[#35151F]/20'
          }`}
        >
          <span>{toast.title}</span>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            className="opacity-75 hover:opacity-100 min-h-[36px] min-w-[36px] flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
