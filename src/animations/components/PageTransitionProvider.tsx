import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isReducedMotionPreferred } from '../core/animation-context';
import { ensureGsapRegistered } from '../core/gsap-config';
import { animatePageEnter } from '../transitions/page-enter';
import { animatePageExit } from '../transitions/page-exit';
import {
  ImageRevealPayload,
  resolveRouteTransition,
  RouteTransitionDescriptor,
  RouteTransitionStyle,
} from '../transitions/route-transition';
import { PageTransitionOverlay } from './PageTransitionOverlay';

export interface NavigateTransitionOptions {
  style?: RouteTransitionStyle;
  imagePayload?: ImageRevealPayload;
  replace?: boolean;
}

interface PageTransitionContextValue {
  isTransitioning: boolean;
  activeDescriptor: RouteTransitionDescriptor;
  overlayPhase: 'idle' | 'entering' | 'exiting';
  navigateWithTransition: (to: string, options?: NavigateTransitionOptions) => Promise<void>;
  registerPageContainer: (el: HTMLElement | null) => void;
}

const DEFAULT_DESCRIPTOR: RouteTransitionDescriptor = {
  style: 'editorial-fade',
  curtainTone: 'ivory',
  direction: 'forward',
};

const PageTransitionContext = createContext<PageTransitionContextValue | null>(null);

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [overlayPhase, setOverlayPhase] = useState<'idle' | 'entering' | 'exiting'>('idle');
  const [activeDescriptor, setActiveDescriptor] =
    useState<RouteTransitionDescriptor>(DEFAULT_DESCRIPTOR);

  const pageContainerRef = useRef<HTMLElement | null>(null);
  const descriptorRef = useRef<RouteTransitionDescriptor>(DEFAULT_DESCRIPTOR);
  const pendingInternalNavRef = useRef(false);
  const tokenRef = useRef(0);

  useEffect(() => {
    ensureGsapRegistered();
  }, []);

  const registerPageContainer = useCallback((el: HTMLElement | null) => {
    pageContainerRef.current = el;
  }, []);

  // Route entry choreography on every route change (direct load, Link click, browser Back/Forward)
  useEffect(() => {
    const reduced = isReducedMotionPreferred();
    const el = pageContainerRef.current;

    if (pendingInternalNavRef.current) {
      pendingInternalNavRef.current = false;
      setOverlayPhase('exiting');
      const tween = animatePageEnter(el, descriptorRef.current, reduced);
      const timer = window.setTimeout(() => {
        setOverlayPhase('idle');
        setIsTransitioning(false);
      }, reduced ? 20 : 520);

      return () => {
        window.clearTimeout(timer);
        tween?.kill();
      };
    } else {
      // Browser history popstate or initial mount: animate entry directly without blocking curtain
      setOverlayPhase('idle');
      setIsTransitioning(false);
      const tween = animatePageEnter(
        el,
        { style: 'editorial-fade', curtainTone: 'ivory', direction: 'forward' },
        reduced
      );
      return () => {
        tween?.kill();
      };
    }
  }, [location.pathname, location.search]);

  const navigateWithTransition = useCallback(
    async (to: string, options?: NavigateTransitionOptions) => {
      const currentFull = `${location.pathname}${location.search}`;
      if (to === currentFull) {
        window.scrollTo({ top: 0, behavior: isReducedMotionPreferred() ? 'auto' : 'smooth' });
        return;
      }

      // Support external links gracefully
      if (/^(https?:|mailto:|tel:)/i.test(to)) {
        window.location.assign(to);
        return;
      }

      const token = ++tokenRef.current;
      const reduced = isReducedMotionPreferred();
      const descriptor = resolveRouteTransition({
        fromPath: location.pathname,
        toPath: to,
        preferredStyle: options?.style,
        imagePayload: options?.imagePayload,
        reducedMotion: reduced,
      });

      descriptorRef.current = descriptor;
      setActiveDescriptor(descriptor);

      if (reduced) {
        pendingInternalNavRef.current = true;
        navigate(to, { replace: options?.replace });
        return;
      }

      setIsTransitioning(true);
      setOverlayPhase('entering');

      try {
        await Promise.all([
          animatePageExit(pageContainerRef.current, descriptor, false),
          new Promise<void>((r) =>
            window.setTimeout(r, descriptor.style === 'curtain' ? 240 : 180)
          ),
        ]);
      } finally {
        if (token === tokenRef.current) {
          pendingInternalNavRef.current = true;
          navigate(to, { replace: options?.replace });
        }
      }
    },
    [location.pathname, location.search, navigate]
  );

  return (
    <PageTransitionContext.Provider
      value={{
        isTransitioning,
        activeDescriptor,
        overlayPhase,
        navigateWithTransition,
        registerPageContainer,
      }}
    >
      {children}
      <PageTransitionOverlay
        phase={overlayPhase}
        descriptor={activeDescriptor}
      />
    </PageTransitionContext.Provider>
  );
}

export function usePageTransition() {
  const ctx = useContext(PageTransitionContext);
  if (!ctx) {
    throw new Error('usePageTransition must be used within PageTransitionProvider');
  }
  return ctx;
}
