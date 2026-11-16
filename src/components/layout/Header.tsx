import { ArrowRight, Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  isReducedMotionPreferred,
  lockBodyScroll,
  trapFocusInElement,
} from '../../animations/core/animation-context';
import { ensureGsapRegistered, gsap } from '../../animations/core/gsap-config';
import { MOTION_DURATION, MOTION_EASE, MOTION_STAGGER } from '../../animations/core/motion-tokens';
import { PageTransitionLink } from '../../animations/components/PageTransitionLink';
import { BRAND_CONFIG } from '../../config/brand';
import { useStore } from '../../context/StoreContext';
import { LuxuryImage } from '../ui/LuxuryImage';
import { AnnouncementBar } from './AnnouncementBar';

export function Header() {
  const { pathname, search } = useLocation();
  const {
    cartCount,
    wishlistIds,
    user,
    isAdmin,
    collections,
    setCartDrawerOpen,
    setSearchOpen,
    isMobileMenuOpen,
    setMobileMenuOpen,
  } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [menuRendered, setMenuRendered] = useState(false);
  const [hoveredColIdx, setHoveredColIdx] = useState(0);

  const menuOverlayRef = useRef<HTMLDivElement | null>(null);
  const menuBgRef = useRef<HTMLDivElement | null>(null);

  const isHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname, search, setMobileMenuOpen]);

  // Choreographed Full-Screen Editorial Navigation Overlay (Open & Reverse Exit)
  useEffect(() => {
    const reduced = isReducedMotionPreferred();
    if (isMobileMenuOpen) {
      setMenuRendered(true);
    } else if (menuRendered) {
      if (reduced || !menuOverlayRef.current) {
        setMenuRendered(false);
        return;
      }
      ensureGsapRegistered();
      const overlay = menuOverlayRef.current;
      const items = overlay.querySelectorAll('.nav-stagger-item');
      const tl = gsap.timeline({
        onComplete: () => setMenuRendered(false),
      });
      tl.to(items, {
        y: -12,
        opacity: 0,
        stagger: { each: 0.03, from: 'end' },
        duration: 0.2,
        ease: MOTION_EASE.exit,
      });
      tl.to(
        overlay,
        {
          opacity: 0,
          duration: 0.24,
          ease: MOTION_EASE.exit,
        },
        '-=0.1'
      );
      return () => {
        tl.kill();
      };
    }
  }, [isMobileMenuOpen, menuRendered]);

  useEffect(() => {
    if (!menuRendered || !isMobileMenuOpen) return;
    const unlock = lockBodyScroll();
    const untrap = trapFocusInElement(menuOverlayRef.current);

    if (!isReducedMotionPreferred() && menuOverlayRef.current) {
      ensureGsapRegistered();
      const overlay = menuOverlayRef.current;
      const items = overlay.querySelectorAll('.nav-stagger-item');
      const preview = overlay.querySelector('.nav-preview-card');

      const tl = gsap.timeline();
      tl.fromTo(
        overlay,
        { opacity: 0 },
        { opacity: 1, duration: 0.28, ease: MOTION_EASE.navigation }
      );
      if (menuBgRef.current) {
        tl.fromTo(
          menuBgRef.current,
          { scaleY: 0, transformOrigin: 'top center' },
          { scaleY: 1, duration: 0.36, ease: MOTION_EASE.editorial },
          0
        );
      }
      if (items.length > 0) {
        tl.fromTo(
          items,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: MOTION_STAGGER.navigation,
            duration: MOTION_DURATION.standard * 0.8,
            ease: MOTION_EASE.editorial,
            clearProps: 'transform,opacity',
          },
          '-=0.18'
        );
      }
      if (preview) {
        tl.fromTo(
          preview,
          { opacity: 0, scale: 1.04 },
          {
            opacity: 1,
            scale: 1,
            duration: MOTION_DURATION.editorial * 0.75,
            ease: MOTION_EASE.editorial,
            clearProps: 'transform,opacity',
          },
          '-=0.35'
        );
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      untrap();
      unlock();
    };
  }, [menuRendered, isMobileMenuOpen, setMobileMenuOpen]);

  const headerSolid = !isHome || scrolled || isMobileMenuOpen;
  const activePreviewCollection = collections[hoveredColIdx] ?? collections[0];

  return (
    <>
      <div className="sticky top-0 z-40">
        <AnnouncementBar />
        <header
          className={`transition-colors duration-300 border-b ${
            headerSolid
              ? 'bg-[#F5EEE5]/95 text-[#35151F] border-[#35151F]/14'
              : 'bg-[#F5EEE5]/88 text-[#35151F] border-transparent'
          }`}
        >
          <div className="max-w-[1440px] mx-auto px-3 sm:px-8 h-16 md:h-20 flex items-center justify-between gap-2 sm:gap-8">
            {/* Zone 1: Brand Wordmark */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={isMobileMenuOpen}
                className="lg:hidden p-2 -ml-1.5 text-[#35151F] hover:text-[#8B2635] transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>
              <PageTransitionLink
                to="/"
                className="font-display text-lg sm:text-2xl tracking-[0.09em] sm:tracking-[0.14em] text-[#35151F] whitespace-nowrap shrink-0"
              >
                {BRAND_CONFIG.wordmark}
              </PageTransitionLink>
            </div>

            {/* Zone 2: Concise Primary Navigation */}
            <nav
              aria-label="Primary navigation"
              className="hidden lg:flex items-center gap-8 text-[13px] tracking-[0.04em] text-[#35151F]"
            >
              {BRAND_CONFIG.navigation.primary.map((item) => {
                const active =
                  pathname + search === item.href ||
                  (item.href === '/shop' && pathname === '/shop' && !search);
                return (
                  <PageTransitionLink
                    key={item.label}
                    to={item.href}
                    className={`whitespace-nowrap shrink-0 py-1 border-b transition-colors ${
                      active
                        ? 'border-[#8B2635] text-[#35151F] font-medium'
                        : 'border-transparent text-[#35151F]/80 hover:text-[#8B2635] hover:border-[#D6B88C]'
                    }`}
                  >
                    {item.label}
                  </PageTransitionLink>
                );
              })}
            </nav>

            {/* Zone 3: Shopping Utility Controls */}
            <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search garments"
                className="p-2 text-[#35151F] hover:text-[#8B2635] transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
              >
                <Search className="w-[18px] h-[18px]" strokeWidth={1.6} />
              </button>

              <PageTransitionLink
                to="/wishlist"
                aria-label={`Saved wishlist (${wishlistIds.length} items)`}
                className="relative p-2 text-[#35151F] hover:text-[#8B2635] transition-colors min-h-[48px] min-w-[48px] hidden sm:flex items-center justify-center"
              >
                <Heart className="w-[18px] h-[18px]" strokeWidth={1.6} />
                {wishlistIds.length > 0 && (
                  <span className="ml-1 text-[11px] tabular-nums text-[#8B2635] font-medium">
                    {wishlistIds.length}
                  </span>
                )}
              </PageTransitionLink>

              <PageTransitionLink
                to={isAdmin ? '/admin' : '/account'}
                aria-label={user ? 'Account overview' : 'Sign in or view orders'}
                className="p-2 text-[#35151F] hover:text-[#8B2635] transition-colors min-h-[48px] min-w-[48px] hidden sm:flex items-center justify-center"
              >
                <User className="w-[18px] h-[18px]" strokeWidth={1.6} />
              </PageTransitionLink>

              <button
                type="button"
                onClick={() => setCartDrawerOpen(true)}
                aria-label={`Shopping bag with ${cartCount} items`}
                data-testid="header-bag-button"
                className="px-2 sm:px-3 py-2 text-[#35151F] hover:text-[#8B2635] transition-colors min-h-[48px] flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0"
              >
                <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.6} />
                <span className="text-xs font-medium tabular-nums">Bag ({cartCount})</span>
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Full-Screen Editorial Navigation Overlay */}
      {menuRendered && (
        <div
          ref={menuOverlayRef}
          role="dialog"
          aria-modal="true"
          aria-label="Editorial navigation"
          className="fixed inset-0 z-50 text-[#F5EEE5] flex flex-col justify-between overflow-y-auto"
        >
          <div
            ref={menuBgRef}
            aria-hidden="true"
            className="fixed inset-0 bg-[#35151F] -z-10"
          />

          <div className="max-w-[1440px] w-full mx-auto px-6 py-6 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-[#D6B88C]/25 pb-4 nav-stagger-item">
              <span className="font-display text-2xl tracking-[0.14em] text-[#F5EEE5]">
                {BRAND_CONFIG.wordmark}
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation menu"
                className="p-2 text-[#F5EEE5] hover:text-[#D6B88C] min-h-[48px] min-w-[48px] flex items-center justify-center"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 py-8 items-center">
              <nav className="lg:col-span-7 flex flex-col gap-4">
                {BRAND_CONFIG.navigation.primary.map((item, idx) => (
                  <PageTransitionLink
                    key={item.label}
                    to={item.href}
                    onMouseEnter={() => setHoveredColIdx(idx % Math.max(1, collections.length))}
                    onClick={() => setMobileMenuOpen(false)}
                    className="nav-stagger-item font-display text-4xl sm:text-5xl text-[#F5EEE5] hover:text-[#D6B88C] transition-colors inline-flex items-center justify-between border-b border-[#D6B88C]/20 pb-3"
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="w-5 h-5 opacity-70" />
                  </PageTransitionLink>
                ))}

                <div className="nav-stagger-item pt-4 grid grid-cols-2 gap-3 text-sm">
                  <PageTransitionLink
                    to="/wishlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[48px] flex items-center text-[#F5EEE5]/85 hover:text-[#D6B88C]"
                  >
                    Saved Pieces ({wishlistIds.length})
                  </PageTransitionLink>
                  <PageTransitionLink
                    to="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[48px] flex items-center text-[#F5EEE5]/85 hover:text-[#D6B88C]"
                  >
                    Account &amp; Orders
                  </PageTransitionLink>
                  <PageTransitionLink
                    to="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[48px] flex items-center text-[#F5EEE5]/85 hover:text-[#D6B88C]"
                  >
                    Our Story
                  </PageTransitionLink>
                  <PageTransitionLink
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="min-h-[48px] flex items-center text-[#D6B88C] hover:text-[#FFFFFF]"
                  >
                    Atelier Operations
                  </PageTransitionLink>
                </div>
              </nav>

              {activePreviewCollection && (
                <div className="hidden lg:block lg:col-span-5 nav-preview-card">
                  <div className="aspect-[4/5] rounded-[18px] bg-[#240D14] overflow-hidden border border-[#D6B88C]/30">
                    <LuxuryImage
                      src={activePreviewCollection.heroImage}
                      alt={activePreviewCollection.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.12em] text-[#D6B88C]">
                    {activePreviewCollection.season} · {activePreviewCollection.title}
                  </p>
                </div>
              )}
            </div>

            <div className="nav-stagger-item border-t border-[#D6B88C]/20 pt-4 text-xs text-[#D6B88C]/75 flex items-center justify-between">
              <span>{BRAND_CONFIG.tagline}</span>
              <span>{BRAND_CONFIG.supportEmail}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
