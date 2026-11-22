"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { apiFetch } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { notifyWishlistUpdated } from "@/lib/wishlist-events";

type WishlistProduct = { _id: string };

type WishlistContextValue = {
  canUseWishlist: boolean;
  isSaved: (productId: string) => boolean;
  toggleProduct: (productId: string) => Promise<boolean>;
  pendingId: string | null;
  loading: boolean;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);
const EMPTY_PRODUCT_IDS: ReadonlySet<string> = new Set<string>();

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const sessionUser = session?.user;
  const userId = sessionUser?.id;
  const role = (sessionUser as (typeof sessionUser & { role?: string }) | null)?.role;
  const canUseWishlist =
    !isPending && !!userId && (role ?? "customer") === "customer";

  const [productIds, setProductIds] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pendingRef = useRef(new Set<string>());

  useEffect(() => {
    let active = true;

    if (!canUseWishlist) return;

    async function loadWishlist() {
      setLoading(true);
      try {
        const items = await apiFetch<WishlistProduct[]>("/customer/wishlist");
        if (active) setProductIds(new Set(items.map((item) => item._id)));
      } catch {
        if (active) setProductIds(new Set<string>());
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadWishlist();

    return () => {
      active = false;
    };
  }, [canUseWishlist, userId]);

  const visibleProductIds = canUseWishlist ? productIds : EMPTY_PRODUCT_IDS;

  const toggleProduct = useCallback(
    async (productId: string) => {
      if (!canUseWishlist) return false;

      const wasSaved = visibleProductIds.has(productId);
      if (pendingRef.current.has(productId)) return wasSaved;

      pendingRef.current.add(productId);
      setPendingId(productId);

      try {
        const path = `/customer/wishlist/${encodeURIComponent(productId)}`;
        const updated = wasSaved
          ? await apiFetch<WishlistProduct[]>(path, { method: "DELETE" })
          : await apiFetch<WishlistProduct[]>(path, { method: "POST" });

        // The backend returns the persisted wishlist, so the UI always
        // reflects the database after save/remove.
        setProductIds(new Set(updated.map((item) => item._id)));
        notifyWishlistUpdated();
        return !wasSaved;
      } finally {
        pendingRef.current.delete(productId);
        setPendingId((current) => (current === productId ? null : current));
      }
    },
    [canUseWishlist, visibleProductIds],
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      canUseWishlist,
      isSaved: (productId) => visibleProductIds.has(productId),
      toggleProduct,
      pendingId,
      loading,
    }),
    [canUseWishlist, visibleProductIds, toggleProduct, pendingId, loading],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used inside WishlistProvider");
  }
  return context;
}
