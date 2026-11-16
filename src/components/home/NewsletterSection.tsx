import { useState } from 'react';
import { useStore } from '../../context/StoreContext';

export function NewsletterSection() {
  const { showToast } = useStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'err', text: data.error || 'Please verify your email address.' });
      } else if (data.status === 'already_subscribed') {
        setFeedback({ type: 'ok', text: 'Your email is already on our seasonal dispatch list.' });
      } else {
        setFeedback({
          type: 'ok',
          text: 'Welcome. You will receive collection notes and early seasonal releases.',
        });
        setEmail('');
        showToast('Newsletter subscription confirmed.', 'success');
      }
    } catch {
      setFeedback({ type: 'err', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-[#240D14] text-[#F5EEE5] py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-3 sm:px-8 text-center space-y-6">
        <p className="text-xs uppercase tracking-[0.16em] text-[#D6B88C]">
          The House Journal
        </p>
        <h2 className="editorial-section-title text-[#F5EEE5]">
          Quiet notes on cloth and form.
        </h2>
        <p className="text-sm sm:text-base text-[#F5EEE5]/80 max-w-xl mx-auto leading-relaxed">
          We send dispatches only when a new collection enters the atelier or when archival pieces return. No daily promotions.
        </p>

        <form
          onSubmit={handleSubmit}
          className="pt-4 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
        >
          <label htmlFor="home-newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="home-newsletter-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="flex-1 min-h-[48px] bg-[#35151F] border border-[#D6B88C]/30 rounded-[12px] px-4 py-3 text-sm text-[#F5EEE5] placeholder:text-[#D6B88C]/60 focus:border-[#D6B88C]"
          />
          <button
            type="submit"
            disabled={loading}
            className="min-h-[48px] bg-[#D6B88C] text-[#35151F] rounded-[12px] px-7 py-3 text-xs font-medium uppercase tracking-[0.1em] hover:bg-[#F5EEE5] transition-colors disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            {loading ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>

        {feedback && (
          <p
            className={`text-xs ${
              feedback.type === 'err' ? 'text-[#F5B0AB]' : 'text-[#D6B88C]'
            }`}
          >
            {feedback.text}
          </p>
        )}

        <p className="text-[11px] text-[#F5EEE5]/60">
          You may unsubscribe at any time. See our Privacy Policy for data handling details.
        </p>
      </div>
    </section>
  );
}
