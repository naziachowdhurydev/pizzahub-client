"use client";

import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useWishlist } from "@/components/wishlist-provider";

export function SaveToWishlistButton({ productId }: { productId: string }) {
  const { canUseWishlist, isSaved, toggleProduct, pendingId, loading } =
    useWishlist();
  const saved = isSaved(productId);
  const busy = pendingId === productId;

  if (!canUseWishlist) return null;

  async function toggle() {
    try {
      const nextSaved = await toggleProduct(productId);
      toast.success(
        nextSaved
          ? "Pizza saved to your wishlist."
          : "Pizza removed from your wishlist.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update your wishlist.",
      );
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={busy || loading}
      aria-label={saved ? "Remove pizza from wishlist" : "Save pizza to wishlist"}
      aria-pressed={saved}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-60 ${
        saved
          ? "border-green-500 bg-green-500/10 text-green-600 hover:border-green-500 hover:bg-green-500/20 dark:text-green-400"
          : "border-border hover:border-[#F26B4F] hover:text-[#F26B4F]"
      }`}
    >
      <Heart
        size={14}
        fill={saved ? "currentColor" : "none"}
        className={saved ? "text-green-600 dark:text-green-400" : undefined}
      />
      {busy ? (saved ? "Removing..." : "Saving...") : saved ? "Saved" : "Save"}
    </button>
  );
}
