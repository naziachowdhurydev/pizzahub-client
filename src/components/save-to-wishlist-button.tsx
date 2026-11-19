"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

export function SaveToWishlistButton({ productId }: { productId: string }) {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;
  const role = (user as (typeof user & { role?: string }) | null)?.role;
  const [saving, setSaving] = useState(false);

  if (isPending || role !== "customer") return null;

  async function save() {
    setSaving(true);
    try {
      await apiFetch<void>(`/customer/wishlist/${productId}`, { method: "POST" });
      toast.success("Pizza saved to your wishlist.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this pizza.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={save}
      disabled={saving}
      aria-label="Save pizza to wishlist"
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:border-[#F26B4F] hover:text-[#F26B4F] disabled:opacity-60"
    >
      <Heart size={14} />
      {saving ? "Saving..." : "Save"}
    </button>
  );
}
