import { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { CustomCursor } from './animations/components/CustomCursor';
import { PageTransitionLink } from './animations/components/PageTransitionLink';
import {
  PageTransitionProvider,
  usePageTransition,
} from './animations/components/PageTransitionProvider';
import { ScrollProgress } from './animations/components/ScrollProgress';
import { CartDrawer } from './components/cart/CartDrawer';
import { ToastContainer } from './components/feedback/ToastContainer';
import { Footer } from './components/layout/Footer';
import { Header } from './components/layout/Header';
import { QuickViewModal } from './components/product/QuickViewModal';
import { SearchOverlay } from './components/search/SearchOverlay';
import { WishlistDrawer } from './components/wishlist/WishlistDrawer';
import { StoreProvider } from './context/StoreContext';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CollectionDetailPage } from './pages/CollectionDetailPage';
import { AboutPage, ContactPage, LegalPage } from './pages/EditorialPages';
import { HomePage } from './pages/HomePage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { SearchPage } from './pages/SearchPage';
import { ShopPage } from './pages/ShopPage';
import { WishlistPage } from './pages/WishlistPage';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, hash]);
  return null;
}

function NotFoundPage() {
  return (
    <div className="bg-[#F3EFE7] min-h-[70vh] flex items-center justify-center px-6 py-24">
      <div className="max-w-lg text-center space-y-6">
        <p className="text-xs uppercase tracking-[0.14em] text-[#77716A]">404 — Page Not Found</p>
        <h1 className="editorial-section-title text-[#111111]">
          This silhouette is no longer on view.
        </h1>
        <p className="text-sm text-[#77716A] leading-relaxed">
          The page you requested may have moved between seasonal editions. Return to the main gallery or explore all garments.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <PageTransitionLink
            to="/"
            className="bg-[#111111] text-[#F5F1EA] px-7 py-3.5 text-xs uppercase tracking-[0.1em]"
          >
            Return Home
          </PageTransitionLink>
          <PageTransitionLink
            to="/shop"
            className="border border-[#111111] text-[#111111] px-7 py-3.5 text-xs uppercase tracking-[0.1em]"
          >
            Browse Catalog
          </PageTransitionLink>
        </div>
      </div>
    </div>
  );
}

function AppShell() {
  const { registerPageContainer } = usePageTransition();

  return (
    <>
      <ScrollToTop />
      <ScrollProgress />
      <CustomCursor />
      <div className="min-h-screen flex flex-col bg-[#F3EFE7] text-[#171717] overflow-x-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:bg-[#111111] focus:text-[#F5F1EA] focus:px-4 focus:py-2 focus:text-xs"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main-content" ref={registerPageContainer} className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/collections/:slug" element={<CollectionDetailPage />} />
            <Route path="/products/:slug" element={<ProductDetailPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/account/orders/:id" element={<OrderDetailPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<LegalPage type="privacy" />} />
            <Route path="/terms" element={<LegalPage type="terms" />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
        <CartDrawer />
        <WishlistDrawer />
        <QuickViewModal />
        <SearchOverlay />
        <ToastContainer />
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <PageTransitionProvider>
          <AppShell />
        </PageTransitionProvider>
      </StoreProvider>
    </BrowserRouter>
  );
}

