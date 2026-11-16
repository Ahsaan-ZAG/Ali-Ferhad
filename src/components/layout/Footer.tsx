import { useState } from 'react';
import { PageTransitionLink } from '../../animations/components/PageTransitionLink';
import { BRAND_CONFIG } from '../../config/brand';
import { useStore } from '../../context/StoreContext';
import { CurrencyCode } from '../../types/ecommerce';

export function Footer() {
  const { currency, setCurrency, showToast } = useStore();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setStatusNote(null);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusNote(data.error || 'Please enter a valid email address.');
      } else if (data.status === 'already_subscribed') {
        setStatusNote('This address is already receiving our seasonal dispatches.');
      } else {
        setStatusNote('Thank you. Your address has been added to our journal.');
        setEmail('');
        showToast('Subscribed to Ali & Ferhad dispatches.', 'success');
      }
    } catch {
      setStatusNote('Unable to connect right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#35151F] text-[#F5EEE5] border-t border-[#D6B88C]/20">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-[#D6B88C]/20">
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-5">
            <PageTransitionLink to="/" className="font-display text-2xl tracking-[0.14em] text-[#F5EEE5] inline-block">
              {BRAND_CONFIG.wordmark}
            </PageTransitionLink>
            <p className="text-sm text-[#F5EEE5]/75 leading-relaxed max-w-sm">
              {BRAND_CONFIG.statement}
            </p>
            <div className="pt-2">
              <label htmlFor="footer-currency" className="block text-xs text-[#D6B88C]/80 mb-2">
                Region & Currency
              </label>
              <select
                id="footer-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="min-h-[48px] bg-[#240D14] border border-[#D6B88C]/30 rounded-[12px] text-[#F5EEE5] text-xs px-3.5 py-2.5 focus:border-[#D6B88C]"
              >
                {BRAND_CONFIG.currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Shopping */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xs tracking-[0.12em] uppercase text-[#D6B88C]">Shopping</h3>
            <ul className="space-y-2.5 text-sm text-[#F5EEE5]/82">
              {BRAND_CONFIG.navigation.footerShopping.map((link) => (
                <li key={link.label}>
                  <PageTransitionLink to={link.href} className="hover:text-[#D6B88C] transition-colors">
                    {link.label}
                  </PageTransitionLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Client Care */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xs tracking-[0.12em] uppercase text-[#D6B88C]">Client Care</h3>
            <ul className="space-y-2.5 text-sm text-[#F5EEE5]/82">
              {BRAND_CONFIG.navigation.footerSupport.map((link) => (
                <li key={link.label}>
                  <PageTransitionLink to={link.href} className="hover:text-[#D6B88C] transition-colors">
                    {link.label}
                  </PageTransitionLink>
                </li>
              ))}
              <li>
                <PageTransitionLink to="/admin" className="hover:text-[#D6B88C] transition-colors">
                  Atelier Admin
                </PageTransitionLink>
              </li>
            </ul>
          </div>

          {/* Legal & Social */}
          <div className="md:col-span-4 space-y-4">
            <h3 className="text-xs tracking-[0.12em] uppercase text-[#D6B88C]">
              Private Dispatches
            </h3>
            <p className="text-sm text-[#F5EEE5]/75">
              Receive seasonal collection previews and private atelier notes.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
              <label htmlFor="footer-newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-newsletter-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1 min-h-[48px] bg-[#240D14] border border-[#D6B88C]/30 rounded-[12px] px-3.5 py-2.5 text-sm text-[#F5EEE5] placeholder:text-[#D6B88C]/55 focus:border-[#D6B88C]"
              />
              <button
                type="submit"
                disabled={submitting}
                className="min-h-[48px] bg-[#D6B88C] text-[#35151F] rounded-[12px] px-5 py-2.5 text-xs font-medium tracking-wide hover:bg-[#F5EEE5] transition-colors disabled:opacity-60 whitespace-nowrap shrink-0"
              >
                {submitting ? 'Saving...' : 'Subscribe'}
              </button>
            </form>
            {statusNote && <p className="text-xs text-[#D6B88C]">{statusNote}</p>}
            <div className="pt-3 flex flex-wrap gap-5 text-xs text-[#F5EEE5]/65">
              {BRAND_CONFIG.navigation.footerLegal.map((link) => (
                <PageTransitionLink key={link.label} to={link.href} className="hover:text-[#F5EEE5] transition-colors">
                  {link.label}
                </PageTransitionLink>
              ))}
              {BRAND_CONFIG.navigation.social.map((link) => (
                <a key={link.label} href={link.href} className="hover:text-[#F5EEE5] transition-colors">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#D6B88C]/75">
          <p>© {new Date().getFullYear()} {BRAND_CONFIG.name}. Configurable House Identity.</p>
          <p>Client Concierge: {BRAND_CONFIG.supportEmail}</p>
        </div>
      </div>
    </footer>
  );
}
