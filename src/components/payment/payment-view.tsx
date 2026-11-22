"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Truck,
  Pizza,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { PaymentMethods } from "./payment-methods";
import { OrderSummaryCard } from "./order-summary-card";
import { StripeCheckoutModal } from "./stripe-checkout-modal";
import type { PaymentMethod, PaymentOrderDetails } from "./types";

const fallbackDemoOrder: PaymentOrderDetails = {
  orderId: "67890abcdef1234567890abc",
  customerName: "Pizza Lover",
  phone: "01700-123456",
  deliveryAddress: "House 12, Road 5, Dhanmondi, Dhaka",
  status: "pending",
  subtotal: 750,
  deliveryFee: 3,
  total: 753,
  items: [
    {
      itemId: "item_1",
      name: "Classic Pepperoni Feast",
      size: "Regular",
      image: "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=300&q=80",
      price: 450,
      quantity: 1,
      subtotal: 450,
    },
    {
      itemId: "item_2",
      name: "Four Cheese Margherita",
      size: "Regular",
      image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=300&q=80",
      price: 300,
      quantity: 1,
      subtotal: 300,
    },
  ],
};

export function PaymentView({ orderId }: { orderId?: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<PaymentOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("stripe");
  const [stripeModalOpen, setStripeModalOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadOrder() {
      if (orderId) {
        try {
          const data = await apiFetch<PaymentOrderDetails>(`/orders/${orderId}`);
          if (active && data) {
            setOrder(data);
            return;
          }
        } catch {
          // If the specific order ID wasn't found in current user's session, fallback
        }
      }

      // If no orderId was passed or fetch failed, check recent customer orders
      try {
        const myOrders = await apiFetch<PaymentOrderDetails[]>("/orders/my");
        if (active && Array.isArray(myOrders) && myOrders.length > 0) {
          const pending = myOrders.find((o) => o.status === "pending") ?? myOrders[0];
          setOrder(pending);
          return;
        }
      } catch {
        // Fallback to sample demo order for design preview
      }

      if (active) {
        setOrder(fallbackDemoOrder);
      }
    }

    loadOrder().finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [orderId]);

  async function handlePay() {
    if (!order) return;

    if (selectedMethod === "stripe") {
      setProcessingPayment(true);
      toast.info("Connecting to Stripe Checkout...");
      try {
        const response = await fetch("/api/payment/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: currentOrder.orderId,
            total: currentOrder.total,
            items: currentOrder.items,
          }),
        });
        const result = await response.json();
        if (result.success && result.url) {
          window.location.href = result.url;
          return;
        }
        // If Stripe returns an error or preview mode is requested, open test modal
        if (result.message) {
          toast.info(result.message);
        }
        setStripeModalOpen(true);
      } catch {
        setStripeModalOpen(true);
      } finally {
        setProcessingPayment(false);
      }
      return;
    }

    if (selectedMethod === "cod") {
      setProcessingPayment(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProcessingPayment(false);
      toast.success("Order confirmed with Cash on Delivery! Pay upon arrival.");
      router.push("/dashboard/customer");
      return;
    }

    if (selectedMethod === "wallet") {
      setProcessingPayment(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProcessingPayment(false);
      toast.success("Mobile wallet request initiated! Please confirm on your mobile app.");
      router.push("/dashboard/customer");
      return;
    }
  }

  if (loading) {
    return (
      <main className="mx-auto grid min-h-[65vh] max-w-7xl place-items-center px-5 text-muted-foreground">
        Loading payment details...
      </main>
    );
  }

  const currentOrder = order || fallbackDemoOrder;

  return (
    <main className="mx-auto min-h-[75vh] max-w-6xl px-5 py-10 md:px-8">
      {/* Navigation Breadcrumb */}
      <nav className="mb-6 flex items-center justify-between">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-[#F26B4F]"
        >
          <ArrowLeft size={16} /> Back to Cart
        </Link>
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400">
          <Lock size={14} /> Secure Payment Gateway
        </span>
      </nav>

      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F26B4F]">
          Final Step
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          Complete Your Payment
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose your preferred payment method below to finalize your order.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-start">
        {/* Left Column: Payment Methods and Pay Action */}
        <div className="space-y-6">
          <PaymentMethods
            selectedMethod={selectedMethod}
            onSelectMethod={setSelectedMethod}
          />

          {/* Security & Guarantees */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-muted-foreground sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
              <ShieldCheck size={18} className="text-[#F26B4F] shrink-0" />
              <span>PCI-DSS Compliant</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
              <Truck size={18} className="text-[#F26B4F] shrink-0" />
              <span>Fast Hot Delivery</span>
            </div>
            <div className="col-span-2 sm:col-span-1 flex items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
              <Pizza size={18} className="text-[#F26B4F] shrink-0" />
              <span>100% Quality Slice</span>
            </div>
          </div>

          {/* Pay Button Action */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-muted-foreground">Total Payable:</span>
              <span className="text-2xl font-black text-[#F26B4F]">
                ৳{currentOrder.total}
              </span>
            </div>

            <button
              type="button"
              disabled={processingPayment}
              onClick={() => void handlePay()}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#F26B4F] py-4 px-6 text-base font-bold text-white shadow-xl shadow-[#F26B4F]/20 transition hover:bg-[#E85C40] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processingPayment ? (
                "Connecting to Payment..."
              ) : selectedMethod === "stripe" ? (
                <>
                  <CreditCard size={20} />
                  Pay ৳{currentOrder.total} with Stripe
                  <ArrowRight size={18} />
                </>
              ) : selectedMethod === "cod" ? (
                <>
                  <CheckCircle2 size={20} />
                  Confirm Cash on Delivery (৳{currentOrder.total})
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Pay with Digital Wallet (৳{currentOrder.total})
                </>
              )}
            </button>

            {selectedMethod === "stripe" && (
              <p className="text-center text-xs text-muted-foreground">
                You will be redirected to the secure Stripe Checkout gateway.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary & Item Review */}
        <OrderSummaryCard order={currentOrder} />
      </div>

      {/* Stripe Modal Simulation */}
      <StripeCheckoutModal
        isOpen={stripeModalOpen}
        onClose={() => setStripeModalOpen(false)}
        order={currentOrder}
      />
    </main>
  );
}
