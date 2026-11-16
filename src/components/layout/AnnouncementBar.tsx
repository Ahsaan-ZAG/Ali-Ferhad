import { X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';

export function AnnouncementBar() {
  const { settings } = useStore();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !settings.announcementText) return null;

  return (
    <div className="bg-[#35151F] text-[#F5EEE5] text-xs px-4 py-2 flex items-center justify-between border-b border-[#D6B88C]/20">
      <div className="w-6 shrink-0" aria-hidden="true" />
      <Link
        to={settings.announcementLink || '/shop'}
        className="text-center tracking-wide hover:text-[#D6B88C] transition-colors truncate max-w-[85vw]"
      >
        {settings.announcementText}
      </Link>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
        className="p-1 text-[#D6B88C]/75 hover:text-[#F5EEE5] transition-colors shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
