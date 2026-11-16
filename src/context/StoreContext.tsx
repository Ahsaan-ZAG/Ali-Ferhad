import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  CartItemInput,
  CartPricingSummary,
  Collection,
  CurrencyCode,
  DeliveryMethod,
  Product,
  SiteSettings,
} from '../types/ecommerce';
import { auth, db, googleProvider, testFirestoreConnection } from '../lib/firebase';
import { BRAND_CONFIG } from '../config/brand';

export interface ToastMessage {
  id: string;
  title: string;
  tone: 'neutral' | 'success' | 'error';
}

interface StoreContextValue {
  products: Product[];
  collections: Collection[];
  settings: SiteSettings;
  catalogLoading: boolean;
  refreshCatalog: () => Promise<void>;

  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;

  user: User | null;
  authLoading: boolean;
  isAdmin: boolean;
  getIdToken: () => Promise<string | null>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;

  cartItems: CartItemInput[];
  cartSummary: CartPricingSummary;
  cartLoading: boolean;
  couponCode: string;
  setCouponCode: (code: string) => void;
  deliveryMethod: DeliveryMethod;
  setDeliveryMethod: (method: DeliveryMethod) => void;
  addToCart: (productId: string, sku: string, quantity?: number) => void;
  updateCartQuantity: (sku: string, quantity: number) => void;
  removeFromCart: (sku: string) => void;
  clearCart: () => void;
  cartCount: number;

  wishlistIds: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;

  isCartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  isWishlistDrawerOpen: boolean;
  setWishlistDrawerOpen: (open: boolean) => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  quickViewProduct: Product | null;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
  closeAllOverlays: () => void;

  toasts: ToastMessage[];
  showToast: (title: string, tone?: 'neutral' | 'success' | 'error') => void;
  dismissToast: (id: string) => void;
}

const DEFAULT_SETTINGS: SiteSettings = {
  brandName: BRAND_CONFIG.name,
  announcementText:
    'Autumn Architecture 2026 is now live — complimentary insured shipping on orders over $1,000.',
  announcementLink: '/collections/autumn-architecture',
  freeShippingThresholdCents: 100000,
  standardShippingCents: 2500,
  expressShippingCents: 6500,
  supportEmail: BRAND_CONFIG.supportEmail,
};

const EMPTY_SUMMARY: CartPricingSummary = {
  lines: [],
  subtotalCents: 0,
  discountCents: 0,
  shippingCents: 0,
  totalCents: 0,
  appliedCouponCode: null,
  couponMessage: null,
  errors: [],
};

const GUEST_CART_KEY = 'mf_guest_cart_v1';
const GUEST_WISHLIST_KEY = 'mf_guest_wishlist_v1';
const CURRENCY_KEY = 'mf_currency_v1';

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem(CURRENCY_KEY) as CurrencyCode | null;
      if (saved === 'USD' || saved === 'EUR' || saved === 'GBP') return saved;
    } catch {
      // ignore
    }
    return 'USD';
  });

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [cartItems, setCartItems] = useState<CartItemInput[]>(() => {
    try {
      const raw = localStorage.getItem(GUEST_CART_KEY);
      if (raw) return JSON.parse(raw) as CartItemInput[];
    } catch {
      // ignore
    }
    return [];
  });

  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(GUEST_WISHLIST_KEY);
      if (raw) return JSON.parse(raw) as string[];
    } catch {
      // ignore
    }
    return [];
  });

  const [couponCode, setCouponCode] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('standard');
  const [cartSummary, setCartSummary] = useState<CartPricingSummary>(EMPTY_SUMMARY);
  const [cartLoading, setCartLoading] = useState(false);

  const [isCartDrawerOpen, setCartDrawerOpenState] = useState(false);
  const [isSearchOpen, setSearchOpenState] = useState(false);
  const [isWishlistDrawerOpen, setWishlistDrawerOpenState] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpenState] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const idTokenRef = useRef<string | null>(null);

  const closeAllOverlays = useCallback(() => {
    setCartDrawerOpenState(false);
    setSearchOpenState(false);
    setWishlistDrawerOpenState(false);
    setMobileMenuOpenState(false);
    setQuickViewProduct(null);
  }, []);

  const setCartDrawerOpen = useCallback((open: boolean) => {
    if (open) {
      setSearchOpenState(false);
      setWishlistDrawerOpenState(false);
      setMobileMenuOpenState(false);
      setQuickViewProduct(null);
    }
    setCartDrawerOpenState(open);
  }, []);

  const setSearchOpen = useCallback((open: boolean) => {
    if (open) {
      setCartDrawerOpenState(false);
      setWishlistDrawerOpenState(false);
      setMobileMenuOpenState(false);
      setQuickViewProduct(null);
    }
    setSearchOpenState(open);
  }, []);

  const setWishlistDrawerOpen = useCallback((open: boolean) => {
    if (open) {
      setCartDrawerOpenState(false);
      setSearchOpenState(false);
      setMobileMenuOpenState(false);
      setQuickViewProduct(null);
    }
    setWishlistDrawerOpenState(open);
  }, []);

  const setMobileMenuOpen = useCallback((open: boolean) => {
    if (open) {
      setCartDrawerOpenState(false);
      setSearchOpenState(false);
      setWishlistDrawerOpenState(false);
      setQuickViewProduct(null);
    }
    setMobileMenuOpenState(open);
  }, []);

  const openQuickView = useCallback((product: Product) => {
    setCartDrawerOpenState(false);
    setSearchOpenState(false);
    setWishlistDrawerOpenState(false);
    setMobileMenuOpenState(false);
    setQuickViewProduct(product);
  }, []);

  const closeQuickView = useCallback(() => {
    setQuickViewProduct(null);
  }, []);

  const showToast = useCallback(
    (title: string, tone: 'neutral' | 'success' | 'error' = 'neutral') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, title, tone }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(CURRENCY_KEY, c);
    } catch {
      // ignore
    }
  }, []);

  const refreshCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const [prodRes, colRes, setRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/collections'),
        fetch('/api/settings'),
      ]);
      if (prodRes.ok) {
        const data = await prodRes.json();
        setProducts(data.products ?? []);
      }
      if (colRes.ok) {
        const data = await colRes.json();
        setCollections(data.collections ?? []);
      }
      if (setRes.ok) {
        const data = await setRes.json();
        if (data.settings) setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to load storefront catalog:', err);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    void testFirestoreConnection();
    void refreshCatalog();
  }, [refreshCatalog]);

  // Auth listener + Firestore user profile / cart / wishlist merge
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
      if (nextUser) {
        try {
          idTokenRef.current = await nextUser.getIdToken();
          // Ensure user document exists in Firestore
          const userRef = doc(db, 'users', nextUser.uid);
          await setDoc(
            userRef,
            {
              uid: nextUser.uid,
              email: nextUser.email ?? '',
              displayName: nextUser.displayName ?? '',
              role: BRAND_CONFIG.adminEmails.includes((nextUser.email ?? '').toLowerCase())
                ? 'admin'
                : 'customer',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );

          // Merge guest cart & wishlist with Firestore
          const remoteCartSnap = await getDocs(collection(db, 'users', nextUser.uid, 'cart'));
          const remoteCart: CartItemInput[] = remoteCartSnap.docs.map((d) => {
            const data = d.data();
            return {
              productId: String(data.productId),
              sku: String(data.sku),
              quantity: Number(data.quantity) || 1,
            };
          });

          setCartItems((localItems) => {
            const merged = new Map<string, CartItemInput>();
            for (const item of remoteCart) merged.set(item.sku, item);
            for (const item of localItems) {
              const existing = merged.get(item.sku);
              if (existing) {
                merged.set(item.sku, {
                  ...existing,
                  quantity: Math.min(10, existing.quantity + item.quantity),
                });
              } else {
                merged.set(item.sku, item);
              }
            }
            const list = Array.from(merged.values());
            for (const item of list) {
              void setDoc(doc(db, 'users', nextUser.uid, 'cart', item.sku), {
                userId: nextUser.uid,
                productId: item.productId,
                sku: item.sku,
                quantity: item.quantity,
                updatedAt: serverTimestamp(),
              });
            }
            return list;
          });

          const remoteWishSnap = await getDocs(collection(db, 'users', nextUser.uid, 'wishlist'));
          const remoteWishIds = remoteWishSnap.docs.map((d) => d.id);
          setWishlistIds((localWish) => {
            const combined = Array.from(new Set([...remoteWishIds, ...localWish]));
            for (const pid of localWish) {
              if (!remoteWishIds.includes(pid)) {
                void setDoc(doc(db, 'users', nextUser.uid, 'wishlist', pid), {
                  userId: nextUser.uid,
                  productId: pid,
                  addedAt: serverTimestamp(),
                });
              }
            }
            return combined;
          });
        } catch (err) {
          console.error('Error syncing authenticated user state:', err);
        }
      } else {
        idTokenRef.current = null;
      }
    });

    return () => unsubscribe();
  }, []);

  // Persist guest cart & wishlist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(wishlistIds));
    } catch {
      // ignore
    }
  }, [wishlistIds]);

  // Server-authoritative cart validation whenever items, coupon, or delivery changes
  useEffect(() => {
    if (cartItems.length === 0) {
      setCartSummary(EMPTY_SUMMARY);
      return;
    }
    let cancelled = false;
    setCartLoading(true);

    fetch('/api/cart/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cartItems,
        couponCode: couponCode || null,
        deliveryMethod,
      }),
    })
      .then((r) => r.json())
      .then((data: CartPricingSummary) => {
        if (!cancelled && data && Array.isArray(data.lines)) {
          setCartSummary(data);
        }
      })
      .catch((err) => {
        console.error('Cart validation error:', err);
      })
      .finally(() => {
        if (!cancelled) setCartLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cartItems, couponCode, deliveryMethod]);

  const getIdToken = useCallback(async () => {
    if (!auth.currentUser) return null;
    const token = await auth.currentUser.getIdToken();
    idTokenRef.current = token;
    return token;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast('Welcome to Ali & Ferhad.', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign-in cancelled.';
      showToast(msg, 'error');
    }
  }, [showToast]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    showToast('You have signed out.', 'neutral');
  }, [showToast]);

  const addToCart = useCallback(
    (productId: string, sku: string, quantity = 1) => {
      setCartItems((prev) => {
        const existing = prev.find((i) => i.sku === sku);
        const nextQty = existing ? Math.min(10, existing.quantity + quantity) : quantity;
        const next = existing
          ? prev.map((i) => (i.sku === sku ? { ...i, quantity: nextQty } : i))
          : [...prev, { productId, sku, quantity: nextQty }];

        if (auth.currentUser) {
          void setDoc(doc(db, 'users', auth.currentUser.uid, 'cart', sku), {
            userId: auth.currentUser.uid,
            productId,
            sku,
            quantity: nextQty,
            updatedAt: serverTimestamp(),
          });
        }
        return next;
      });
      setCartDrawerOpen(true);
      showToast('Added to shopping bag.', 'success');
    },
    [showToast, setCartDrawerOpen]
  );

  const updateCartQuantity = useCallback((sku: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((i) => i.sku !== sku));
      if (auth.currentUser) {
        void deleteDoc(doc(db, 'users', auth.currentUser.uid, 'cart', sku));
      }
      return;
    }
    const clamped = Math.min(10, quantity);
    setCartItems((prev) => {
      const target = prev.find((i) => i.sku === sku);
      if (target && auth.currentUser) {
        void setDoc(doc(db, 'users', auth.currentUser.uid, 'cart', sku), {
          userId: auth.currentUser.uid,
          productId: target.productId,
          sku,
          quantity: clamped,
          updatedAt: serverTimestamp(),
        });
      }
      return prev.map((i) => (i.sku === sku ? { ...i, quantity: clamped } : i));
    });
  }, []);

  const removeFromCart = useCallback(
    (sku: string) => {
      setCartItems((prev) => prev.filter((i) => i.sku !== sku));
      if (auth.currentUser) {
        void deleteDoc(doc(db, 'users', auth.currentUser.uid, 'cart', sku));
      }
      showToast('Removed from shopping bag.', 'neutral');
    },
    [showToast]
  );

  const clearCart = useCallback(() => {
    setCartItems((prev) => {
      if (auth.currentUser) {
        for (const item of prev) {
          void deleteDoc(doc(db, 'users', auth.currentUser.uid, 'cart', item.sku));
        }
      }
      return [];
    });
    setCouponCode('');
  }, []);

  const toggleWishlist = useCallback(
    (productId: string) => {
      setWishlistIds((prev) => {
        const exists = prev.includes(productId);
        if (exists) {
          if (auth.currentUser) {
            void deleteDoc(doc(db, 'users', auth.currentUser.uid, 'wishlist', productId));
          }
          showToast('Removed from saved pieces.', 'neutral');
          return prev.filter((id) => id !== productId);
        } else {
          if (auth.currentUser) {
            void setDoc(doc(db, 'users', auth.currentUser.uid, 'wishlist', productId), {
              userId: auth.currentUser.uid,
              productId,
              addedAt: serverTimestamp(),
            });
          }
          showToast('Saved to wishlist.', 'success');
          return [...prev, productId];
        }
      });
    },
    [showToast]
  );

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const isAdmin = Boolean(
    user?.email && BRAND_CONFIG.adminEmails.includes(user.email.toLowerCase())
  );

  return (
    <StoreContext.Provider
      value={{
        products,
        collections,
        settings,
        catalogLoading,
        refreshCatalog,
        currency,
        setCurrency,
        user,
        authLoading,
        isAdmin,
        getIdToken,
        signInWithGoogle,
        signOut,
        cartItems,
        cartSummary,
        cartLoading,
        couponCode,
        setCouponCode,
        deliveryMethod,
        setDeliveryMethod,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        wishlistIds,
        toggleWishlist,
        isWishlisted,
        isCartDrawerOpen,
        setCartDrawerOpen,
        isSearchOpen,
        setSearchOpen,
        isWishlistDrawerOpen,
        setWishlistDrawerOpen,
        isMobileMenuOpen,
        setMobileMenuOpen,
        quickViewProduct,
        openQuickView,
        closeQuickView,
        closeAllOverlays,
        toasts,
        showToast,
        dismissToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
