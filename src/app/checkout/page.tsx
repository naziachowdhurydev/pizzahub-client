"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { DashboardAccess } from "@/components/dashboard-access";
import { apiFetch } from "@/lib/api";
import { notifyCartUpdated } from "@/lib/cart-events";

type CartItem = {
  productId: string;
  name: string;
  image: string;
  price: number;
  size: string;
  quantity: number;
  isAvailable: boolean;
  subtotal: number;
};

type CartResponse = {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
};

type SavedAddress = {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
};

type PlacedOrder = {
  _id: string;
  total: number;
};

function CheckoutContent() {
  const [cart, setCart] = useState<CartResponse>({ items: [], subtotal: 0, itemCount: 0 });
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<CartResponse>("/cart"),
      apiFetch<SavedAddress | null>("/customer/address"),
    ])
      .then(([savedCart, savedAddress]) => {
        if (!active) return;
        setCart(savedCart);
        if (savedAddress) {
          setDeliveryAddress(
            [
              savedAddress.fullName,
              savedAddress.street,
              savedAddress.city,
              savedAddress.postalCode,
            ]
              .filter(Boolean)
              .join(", "),
          );
          setPhone(savedAddress.phone);
        }
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message =
          error instanceof Error ? error.message : "Could not load checkout information.";
        toast.error(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const itemCount = useMemo(
    () => cart.items.reduce((total, item) => total + item.quantity, 0),
    [cart.items],
  );
  const subtotal = useMemo(
    () => cart.items.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart.items],
  );
  const orderTotal = subtotal + (itemCount > 0 ? 3 : 0);

  async function checkout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCheckingOut(true);
    try {
      const order = await apiFetch<PlacedOrder>("/orders/checkout", {
        method: "POST",
        body: JSON.stringify({
          deliveryAddress: deliveryAddress.trim(),
          phone: phone.trim(),
        }),
      });
      setPlacedOrder(order);
      setCart({ items: [], subtotal: 0, itemCount: 0 });
      notifyCartUpdated();
      toast.success("Your order was placed successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place your order.");
    } finally {
      setCheckingOut(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto grid min-h-[65vh] max-w-7xl place-items-center px-5 text-muted-foreground">
        Loading checkout...
      </main>
    );
  }

  if (placedOrder) {
    return (
      <main className="mx-auto min-h-[65vh] max-w-2xl px-5 py-16 text-center">
        <div className="rounded-3xl border border-green-500/30 bg-green-500/10 p-8">
          <h1 className="text-3xl font-black text-foreground">Order Confirmed!</h1>
          <p className="mt-3 text-lg font-semibold">
            Order #{placedOrder._id.slice(-6)} · ৳{placedOrder.total}
          </p>
          <p className="mt-2 text-muted-foreground">
            Your pizza is being prepared and will be delivered soon.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link
              href="/dashboard/customer"
              className="inline-flex rounded-xl bg-[#F26B4F] px-5 py-3 font-bold text-white shadow-sm transition hover:bg-[#D95338]"
            >
              Track your order
            </Link>
            <Link
              href="/menu"
              className="inline-flex rounded-xl border border-border px-5 py-3 font-semibold transition hover:border-[#F26B4F]"
            >
              Order more
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (cart.items.length === 0) {
    return (
      <main className="mx-auto min-h-[65vh] max-w-2xl px-5 py-16 text-center">
        <div className="rounded-3xl border border-dashed border-border p-8">
          <ShoppingBag className="mx-auto text-[#F26B4F]" size={42} />
          <h1 className="mt-4 text-2xl font-black">Your cart is empty</h1>
          <p className="mt-2 text-muted-foreground">
            Add your favourite pizzas to your cart before proceeding to checkout.
          </p>
          <Link
            href="/menu"
            className="mt-6 inline-flex rounded-xl bg-[#F26B4F] px-5 py-3 font-bold text-white shadow-sm"
          >
            Browse Menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[70vh] max-w-5xl px-5 py-12 md:px-8">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#F26B4F]">Checkout</p>
        <h1 className="mt-2 text-4xl font-black">Complete your order</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Delivery Information Form */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-black">Delivery Details</h2>
          <form onSubmit={checkout} id="checkout-form" className="mt-5 space-y-4">
            <label className="block text-sm font-semibold">
              Delivery address
              <textarea
                required
                rows={3}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Street name, building, apartment, city, postal code"
                className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-foreground outline-none transition focus:border-[#F26B4F]"
              />
            </label>

            <label className="block text-sm font-semibold">
              Contact phone number
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-foreground outline-none transition focus:border-[#F26B4F]"
              />
            </label>

            <button
              type="submit"
              disabled={checkingOut || cart.items.some((item) => !item.isAvailable)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F26B4F] py-3.5 font-bold text-white shadow-lg shadow-[#F26B4F]/15 transition hover:bg-[#D95338] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkingOut ? "Processing..." : `Place Order (৳${orderTotal})`}
              {!checkingOut && <ArrowRight size={18} />}
            </button>
          </form>
        </section>

        {/* Order Summary */}
        <aside className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-black">Order Summary</h2>
          <div className="mt-4 divide-y divide-border">
            {cart.items.map((item) => (
              <div key={`${item.productId}-${item.size}`} className="flex justify-between py-3 text-sm">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.size} × {item.quantity}
                  </p>
                </div>
                <p className="font-bold">৳{item.price * item.quantity}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal ({itemCount} items)</span>
              <span>৳{subtotal}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery Fee</span>
              <span>৳3</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-black text-foreground">
              <span>Total</span>
              <span>৳{orderTotal}</span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href="/cart"
              className="block text-center text-sm font-semibold text-[#F26B4F] hover:underline"
            >
              Modify items in cart
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <DashboardAccess role="customer">
      <CheckoutContent />
    </DashboardAccess>
  );
}
