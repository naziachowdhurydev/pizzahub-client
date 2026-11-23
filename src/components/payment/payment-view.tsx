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
import { CheckoutSkeleton } from "@/components/skeletons";
import { apiFetch } from "@/lib/api";
import { PaymentMethods } from "./payment-methods";
import { OrderSummaryCard } from "./order-summary-card";
import { StripeCheckoutModal } from "./stripe-checkout-modal";
import type { PaymentMethod, PaymentOrderDetails } from "./types";

// Demo fallback – shown when no real order data is available.
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
      image:
        "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=300&q=80",
      price: 450,
      quantity: 1,
      subtotal: 450,
    },
    {
      itemId: "item_2",
      name: "Four Cheese Margherita",
      size: "Regular",
      image:
        "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=300&q=80",
      price: 300,
      quantity: 1,
      subtotal: 300,
    },
  ],
};

/**
 * PaymentView supports:
 *   - a single order (orderIds omitted or length===1)
 *   - multiple orders for combined payment (orderIds array > 1)
 */
export function PaymentView({ orderIds }: { orderIds?: string[] }) {
  const router = useRouter();
  const [orders, setOrders] = useState<PaymentOrderDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("stripe");
  const [stripeModalOpen, setStripeModalOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Load orders – if orderIds provided, fetch each; otherwise fallback to the latest pending order.
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        if (orderIds && orderIds.length > 0) {
          const fetched = await Promise.all(
            orderIds.map((id) => apiFetch<PaymentOrderDetails>(`/orders/${id}`).catch(() => null)),
          );
          const valid = fetched.filter(Boolean) as PaymentOrderDetails[];
          if (active) setOrders(valid);
        } else {
          const myOrders = await apiFetch<PaymentOrderDetails[]>("/orders/my");
          const pending = myOrders.find((o) => o.status === "pending") ?? myOrders[0] ?? fallbackDemoOrder;
          if (active) setOrders([pending]);
        }
      } catch {
        if (active) setOrders([fallbackDemoOrder]);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [orderIds]);

  const aggregateTotal = orders.reduce((sum, o) => sum + (o.total ?? o.subtotal), 0);

  async function handlePayAll() {
    if (!orders.length) return;
    setProcessingPayment(true);
    try {
      const response = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderIds: orders.map((o) => o.orderId), combinedTotal: aggregateTotal }),
      });
      const result = await response.json();
      if (result.success && result.url) {
        window.location.href = result.url;
        return;
      }
      toast.error(result.message ?? "Unable to start Stripe checkout");
    } finally {
      setProcessingPayment(false);
    }
  }

  async function handlePaySingle(order: PaymentOrderDetails) {
    setProcessingPayment(true);
    try {
      const response = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.orderId, total: order.total, items: order.items }),
      });
      const result = await response.json();
      if (result.success && result.url) {
        window.location.href = result.url;
        return;
      }
      toast.error(result.message ?? "Unable to start Stripe checkout");
    } finally {
      setProcessingPayment(false);
    }
  }

  if (loading) {
    return <CheckoutSkeleton label="Loading payment details..." />;
  }

  return (
    <main className="mx-auto min-h-[75vh] max-w-6xl px-5 py-10 md:px-8">
      {/* Header */}
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F26B4F]">Final Step</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Complete Your Payment</h1>
        <p className="mt-2 text-sm text-muted-foreground">Choose a payment method and confirm your order(s).</p>
      </header>

      {/* Order summary list */}
      <section className="mb-6 space-y-4">
        {orders.map((order) => (
          <OrderSummaryCard key={order.orderId} order={order} />
        ))}
        {orders.length > 1 && (
          <div className="mt-4 text-right">
            <p className="font-medium">
              Combined total: <span className="text-lg">${aggregateTotal.toFixed(2)}</span>
            </p>
            <button
              disabled={processingPayment}
              className="mt-2 rounded bg-[#F26B4F] px-4 py-2 font-semibold text-white hover:bg-[#d15c3e]"
              onClick={handlePayAll}
            >
              Pay All (${aggregateTotal.toFixed(2)})
            </button>
          </div>
        )}
      </section>

      {/* Payment method selector */}
      <PaymentMethods selectedMethod={selectedMethod} onSelectMethod={setSelectedMethod} />

      {/* Single-order pay button – shown when only one order */}
      {orders.length === 1 && (
        <button
          disabled={processingPayment}
          className="mt-4 w-full rounded bg-[#F26B4F] px-4 py-3 font-semibold text-white hover:bg-[#d15c3e]"
          onClick={() => handlePaySingle(orders[0])}
        >
          Pay ${orders[0].total?.toFixed(2) ?? orders[0].subtotal?.toFixed(2)}
        </button>
      )}
    </main>
  );
}
