import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/product/ProductCard';
import { useStore } from '../context/StoreContext';
import { filterAndSortProducts } from '../lib/commerce';

export function SearchPage() {
  const { products } = useStore();
  const [params, setParams] = useSearchParams();
  const initial = params.get('q') ?? '';
  const [term, setTerm] = useState(initial);

  const results = useMemo(() => {
    if (!initial.trim()) return [];
    return filterAndSortProducts(products, { search: initial.trim() });
  }, [products, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParams(term.trim() ? { q: term.trim() } : {}, { replace: true });
  };

  return (
    <div className="bg-[#F5EEE5] min-h-screen py-12 md:py-20">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-8 space-y-10">
        <div className="border-b border-[#35151F]/14 pb-8 space-y-5">
          <p className="text-xs uppercase tracking-[0.14em] text-[#8B2635] font-medium">Catalog Search</p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <label htmlFor="search-page-input" className="sr-only">
              Search garments
            </label>
            <input
              id="search-page-input"
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search silhouettes, cloth, or collections..."
              className="flex-1 min-h-[48px] bg-[#FFFFFF] border border-[#35151F]/18 rounded-[12px] px-4 py-3 text-sm text-[#35151F]"
            />
            <button
              type="submit"
              className="min-h-[48px] bg-[#35151F] text-[#F5EEE5] rounded-[12px] px-6 py-3 text-xs font-medium uppercase tracking-[0.1em] hover:bg-[#8B2635] transition-colors"
            >
              Search
            </button>
          </form>
          {initial.trim() && (
            <p className="text-sm text-[#6D595E] tabular-nums">
              {results.length} matching garment(s) for “{initial}”
            </p>
          )}
        </div>

        {!initial.trim() ? (
          <p className="text-sm text-[#6D595E]">
            Enter a garment name, fibre (cashmere, merino, silk), or category to search.
          </p>
        ) : results.length === 0 ? (
          <div className="py-16 px-6 rounded-[18px] bg-[#FFFFFF] border border-[#35151F]/14 text-center space-y-4 max-w-xl mx-auto">
            <h2 className="font-display text-3xl text-[#35151F]">No matching garments found</h2>
            <Link
              to="/shop"
              className="inline-flex items-center justify-center min-h-[48px] bg-[#35151F] text-[#F5EEE5] rounded-[12px] px-6 py-3 text-xs uppercase tracking-[0.1em]"
            >
              Browse Complete Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
