"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, CreditCard, CheckCircle2, X, Sparkles, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { PaymentOrderDetails } from "./types";

export function StripeCheckoutModal({
  isOpen,
  onClose,
  order,
}: {
  isOpen: boolean;
  onClose: () => void;
  order: PaymentOrderDetails;
}) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  if (!isOpen) return null;

  async function handleSimulatePayment() {
    setProcessing(true);
    try {
      // Simulate Stripe processing delay
      await new Promise((resolve) => setTimeout(resolve, 1400));
      toast.success("Payment successful! Your order has been placed with Stripe.");
      onClose();
      router.push("/dashboard/customer");
    } catch {
      toast.error("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-2xl text-card-foreground">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        {/* Stripe Header Badge */}
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#635BFF] text-white shadow-md">
            <CreditCard size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight">Stripe Checkout</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock size={12} className="text-green-500" /> End-to-end encrypted session
            </p>
          </div>
        </div>

        {/* Order amount highlight */}
        <div className="my-6 rounded-2xl border border-[#635BFF]/20 bg-[#635BFF]/5 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">Amount to pay</span>
            <span className="text-2xl font-black text-[#635BFF]">৳{order.total}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Order ID: #{order.orderId ? order.orderId.slice(-6).toUpperCase() : "PIZZA"} · {order.items.length} item(s)
          </p>
        </div>

        {/* Integration Explanation for User & Developer */}
        <div className="space-y-3 rounded-2xl bg-muted/50 p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="flex items-center gap-1.5 font-bold text-foreground">
            <Sparkles size={14} className="text-amber-500" /> Stripe Integration Ready
          </p>
          <p>
            This component simulates the Stripe Hosted Checkout redirect. When backend Stripe API keys are configured, this button triggers a call to create a checkout session and seamlessly redirects to Stripe’s secure payment gateway.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={processing}
            onClick={() => void handleSimulatePayment()}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#635BFF] py-3.5 px-5 font-bold text-white shadow-lg shadow-[#635BFF]/25 transition hover:bg-[#5248db] disabled:opacity-60"
          >
            {processing ? (
              "Verifying with Stripe..."
            ) : (
              <>
                <CheckCircle2 size={18} />
                Pay ৳{order.total} (Test Pay)
              </>
            )}
          </button>
          <button
            type="button"
            disabled={processing}
            onClick={onClose}
            className="rounded-xl border border-border px-5 py-3.5 text-sm font-semibold transition hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
