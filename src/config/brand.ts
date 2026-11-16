import { CurrencyCode } from '../types/ecommerce';

export interface BrandConfig {
  name: string;
  wordmark: string;
  tagline: string;
  statement: string;
  supportEmail: string;
  adminEmails: string[];
  defaultCurrency: CurrencyCode;
  currencies: { code: CurrencyCode; symbol: string; rateFromUsd: number; label: string }[];
  navigation: {
    primary: { label: string; href: string }[];
    footerShopping: { label: string; href: string }[];
    footerSupport: { label: string; href: string }[];
    footerLegal: { label: string; href: string }[];
    social: { label: string; href: string }[];
  };
}

export const BRAND_CONFIG: BrandConfig = {
  name: 'ALI & FERHAD',
  wordmark: 'ALI & FERHAD',
  tagline: 'Futuristic minimalism in sculpted natural fibre.',
  statement:
    'Founded on quiet architectural precision, Ali & Ferhad bridges fluid natural tailoring with sculpted modernist form—crafted in Mongolian cashmere, high-twist virgin wool, and liquid mulberry silk.',
  supportEmail: 'concierge@aliandferhad.example',
  adminEmails: ['ahsaanahmed0002@gmail.com'],
  defaultCurrency: 'USD',
  currencies: [
    { code: 'USD', symbol: '$', rateFromUsd: 1, label: 'United States (USD)' },
    { code: 'EUR', symbol: '€', rateFromUsd: 0.92, label: 'Europe (EUR)' },
    { code: 'GBP', symbol: '£', rateFromUsd: 0.79, label: 'United Kingdom (GBP)' },
  ],
  navigation: {
    primary: [
      { label: 'Shop', href: '/shop' },
      { label: 'Women', href: '/shop?gender=Women' },
      { label: 'Men', href: '/shop?gender=Men' },
      { label: 'Collections', href: '/collections/autumn-architecture' },
      { label: 'New Arrivals', href: '/shop?tag=new-arrival' },
    ],
    footerShopping: [
      { label: 'New Arrivals', href: '/shop?tag=new-arrival' },
      { label: 'Collections', href: '/collections/autumn-architecture' },
      { label: 'All Products', href: '/shop' },
      { label: 'Best Sellers', href: '/shop?sort=best-selling' },
    ],
    footerSupport: [
      { label: 'Contact', href: '/contact' },
      { label: 'Our Story', href: '/about' },
      { label: 'Order Lookup', href: '/account' },
      { label: 'Returns & Care', href: '/contact#returns' },
    ],
    footerLegal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms & Conditions', href: '/terms' },
    ],
    social: [
      { label: 'Instagram', href: '#instagram' },
      { label: 'Pinterest', href: '#pinterest' },
    ],
  },
};
