import { ArrowRight, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  isReducedMotionPreferred,
  lockBodyScroll,
  trapFocusInElement,
} from '../../animations/core/animation-context';
import { ensureGsapRegistered, gsap } from '../../animations/core/gsap-config';
import { MOTION_DURATION, MOTION_EASE, MOTION_STAGGER } from '../../animations/core/motion-tokens';
import { usePageTransition } from '../../animations/components/PageTransitionProvider';
import { useStore } from '../../context/StoreContext';
import { deriveProductCardState } from '../../lib/cardTokens';
import { filterAndSortProducts, formatMoney } from '../../lib/commerce';
import { LineItemLuxuryCard } from '../cards/LineItemLuxuryCard';

const RECENT_KEY = 'mf_recent_searches_v1';

export function SearchOverlay() {
  const { isSearchOpen, setSearchOpen, products, currency } = useStore();
  const [query, setQuery] = useState('');
  const [rendered, setRendered] = useState(false);
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) return JSON.parse(raw) as string[];
    } catch {
      // ignore
    }
    return [];
  });
  const inputRef = useRef<HTMLInputElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const { navigateWithTransition } = usePageTransition();

  useEffect(() => {
    const reduced = isReducedMotionPreferred();
    if (isSearchOpen) {
      setRendered(true);
    } else if (rendered) {
      if (reduced || !overlayRef.current) {
        setRendered(false);
        return;
      }
      ensureGsapRegistered();
      gsap.to(overlayRef.current, {
        opacity: 0,
        y: -10,
        duration: MOTION_DURATION.ui,
        ease: MOTION_EASE.exit,
        onComplete: () => setRendered(false),
      });
    }
  }, [isSearchOpen, rendered]);

  useEffect(() => {
    if (!rendered || !isSearchOpen) return;
    const unlock = lockBodyScroll();
    const untrap = trapFocusInElement(overlayRef.current);

    if (!isReducedMotionPreferred() && overlayRef.current) {
      ensureGsapRegistered();
      const overlay = overlayRef.current;
      gsap.fromTo(
        overlay,
        { opacity: 0, y: -12 },
        {
          opacity: 1,
          y: 0,
          duration: MOTION_DURATION.standard * 0.72,
          ease: MOTION_EASE.editorial,
          clearProps: 'transform,opacity',
        }
      );
      const cards = overlay.querySelectorAll('.search-card-item');
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { y: 12, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: MOTION_STAGGER.tight,
            duration: MOTION_DURATION.standard * 0.65,
            ease: MOTION_EASE.editorial,
            clearProps: 'transform,opacity',
          }
        );
      }
    }

    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => {
      window.clearTimeout(focusTimer);
      untrap();
      unlock();
    };
  }, [rendered, isSearchOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key === 'Escape' && isSearchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSearchOpen, setSearchOpen]);

  const matches = useMemo(() => {
    if (!query.trim()) return products.slice(0, 4);
    return filterAndSortProducts(products, { search: query.trim() }).slice(0, 6);
  }, [products, query]);

  const commitSearch = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    const updated = [clean, ...recent.filter((r) => r.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
    setRecent(updated);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    setSearchOpen(false);
    void navigateWithTransition(`/search?q=${encodeURIComponent(clean)}`);
  };

  if (!rendered) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Search garments"
      className="fixed inset-0 z-50 bg-[#240D14]/96 backdrop-blur-md text-[#F5EEE5] overflow-y-auto"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8 md:py-12">
        <div className="flex items-center justify-between border-b border-[#D6B88C]/25 pb-5 gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              commitSearch(query);
            }}
            className="flex-1 flex items-center gap-4 min-w-0"
          >
            <Search className="w-5 h-5 text-[#D6B88C] shrink-0" />
            <label htmlFor="overlay-search-input" className="sr-only">
              Search Ali &amp; Ferhad catalog
            </label>
            <input
              id="overlay-search-input"
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search coats, cashmere, silk, tailoring..."
              className="w-full bg-transparent text-xl sm:text-3xl font-display text-[#F5EEE5] placeholder:text-[#F5EEE5]/45 focus:outline-none"
            />
          </form>
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            aria-label="Close search overlay"
            className="p-2 text-[#F5EEE5] hover:text-[#D6B88C] min-h-[48px] min-w-[48px] rounded-[12px] border border-[#D6B88C]/25 flex items-center justify-center shrink-0 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recent & Quick Suggestions */}
        <div className="py-4 flex flex-wrap items-center gap-3 text-xs text-[#F5EEE5]/65 border-b border-[#D6B88C]/15">
          <span>Suggested:</span>
          {['Cashmere', 'Blazer', 'Silk', 'Merino', 'Trench'].map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setQuery(term)}
              className="min-h-[48px] px-2 text-[#F5EEE5] hover:text-[#D6B88C] transition-colors underline underline-offset-4"
            >
              {term}
            </button>
          ))}
          {recent.length > 0 && (
            <>
              <span aria-hidden="true" className="text-[#D6B88C]/35">/</span>
              <span>Recent:</span>
              {recent.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => commitSearch(r)}
                  className="min-h-[48px] px-2 text-[#D6B88C] hover:text-[#F5EEE5] transition-colors"
                >
                  {r}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setRecent([]);
                  localStorage.removeItem(RECENT_KEY);
                }}
                className="ml-auto min-h-[48px] px-2 text-[#F5EEE5]/60 hover:text-[#F5EEE5]"
              >
                Clear history
              </button>
            </>
          )}
        </div>

        {/* Results */}
        <div className="pt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs uppercase tracking-[0.14em] text-[#D6B88C]">
              {query.trim() ? `Matching Pieces (${matches.length})` : 'Selected Silhouettes'}
            </h3>
            {query.trim() && (
              <button
                type="button"
                onClick={() => commitSearch(query)}
                className="min-h-[48px] px-2 inline-flex items-center gap-2 text-xs text-[#D6B88C] hover:text-[#F5EEE5]"
              >
                View all results <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {matches.length === 0 ? (
            <div className="py-12 text-center space-y-3 rounded-[20px] border border-[#D6B88C]/20 bg-[#35151F]/40">
              <p className="font-display text-2xl text-[#F5EEE5]">No matching garments found</p>
              <p className="text-sm text-[#F5EEE5]/70 px-4">
                Try searching by material (cashmere, merino, silk) or silhouette (coat, blazer, trousers).
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {matches.map((p) => {
                const state = deriveProductCardState(p);
                return (
                  <div key={p.id} className="search-card-item">
                    <LineItemLuxuryCard
                      darkSurface
                      to={`/products/${p.slug}`}
                      title={p.name}
                      subtitle={
                        p.editionLabel ? `${p.category} · ${p.editionLabel}` : `${p.category} · ${p.gender}`
                      }
                      priceText={formatMoney(p.priceCents, currency)}
                      compareAtText={
                        state.hasDiscount && p.compareAtPriceCents
                          ? formatMoney(p.compareAtPriceCents, currency)
                          : null
                      }
                      imageUrl={p.images[0]?.url ?? ''}
                      imageAlt={p.name}
                      onNavigate={() => setSearchOpen(false)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
