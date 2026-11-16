import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import { Observer } from 'gsap/Observer';
import { useGSAP } from '@gsap/react';
import { MOTION_DURATION, MOTION_EASE } from './motion-tokens';

let registered = false;

export function ensureGsapRegistered(): void {
  if (registered || typeof window === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger, Flip, Observer, useGSAP);
  gsap.defaults({
    ease: MOTION_EASE.entrance,
    duration: MOTION_DURATION.standard,
  });
  ScrollTrigger.config({
    ignoreMobileResize: true,
    limitCallbacks: true,
  });
  registered = true;
}

export function refreshScrollTriggers(): void {
  if (typeof window === 'undefined') return;
  ensureGsapRegistered();
  window.requestAnimationFrame(() => {
    ScrollTrigger.refresh();
  });
}

export { gsap, ScrollTrigger, Flip, Observer, useGSAP };
