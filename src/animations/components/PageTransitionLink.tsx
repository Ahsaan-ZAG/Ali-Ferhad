import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { RouteTransitionStyle } from '../transitions/route-transition';
import { usePageTransition } from './PageTransitionProvider';

interface PageTransitionLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
  transitionStyle?: RouteTransitionStyle;
  captureImageSelector?: string;
  imageUrl?: string;
  imageAlt?: string;
}

export function PageTransitionLink({
  to,
  transitionStyle,
  captureImageSelector,
  imageUrl,
  imageAlt,
  onClick,
  replace,
  children,
  ...rest
}: PageTransitionLinkProps) {
  const { navigateWithTransition } = usePageTransition();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;

    // Allow new-tab, download, or modifier clicks natively
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }

    // Hash-only or external links pass through natively
    if (to.startsWith('#') || /^(https?:|mailto:|tel:)/i.test(to)) {
      return;
    }

    e.preventDefault();

    let imagePayload;
    if (imageUrl) {
      const imgEl =
        (captureImageSelector
          ? document.querySelector<HTMLElement>(captureImageSelector)
          : e.currentTarget.querySelector<HTMLElement>('img')) ??
        e.currentTarget;
      const rect = imgEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        imagePayload = {
          imageUrl,
          alt: imageAlt ?? '',
          rect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
        };
      }
    }

    void navigateWithTransition(to, {
      style: transitionStyle,
      imagePayload,
      replace,
    });
  };

  return (
    <Link to={to} replace={replace} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}
