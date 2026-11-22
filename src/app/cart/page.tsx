"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { notifyCartUpdated } from "@/lib/cart-events";
import { dashboardPathForRole } from "@/lib/roles";

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

const emptyCart: CartResponse = { items: [], subtotal: 0, itemCount: 0 };

export default function CartPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const user = session?.user;
  const role = (user as (typeof user & { role?: string }) | null)?.role ?? "customer";
  const [cart, setCart] = useState<CartResponse>(emptyCart);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);

  useEffect(() => {
    if (!sessionPending && !user) {
      router.replace("/login?callbackUrl=%2Fcart");
    }
  }, [sessionPending, user, router]);

  useEffect(() => {
    let active = true;
    if (sessionPending || !user || role !== "customer") return;

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
          error instanceof Error ? error.message : "Could not load your cart.";
        toast.error(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [role, sessionPending, user]);

  const itemCount = useMemo(
    () => cart.items.reduce((total, item) => total + item.quantity, 0),
    [cart.items],
  );
  const subtotal = useMemo(
    () => cart.items.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart.items],
  );
  const orderTotal = subtotal + (itemCount > 0 ? 3 : 0);

  async function updateQuantity(item: CartItem, quantity: number) {
    if (quantity < 1 || quantity > 20) return;
    const key = `${item.productId}-${item.size}`;
    setUpdating(key);
    try {
      await apiFetch<void>(`/cart/items/${item.productId}`, {
        method: "PATCH",
        body: JSON.stringify({ size: item.size, quantity }),
      });
      setCart((current) => ({
        ...current,
        items: current.items.map((entry) =>
          entry.productId === item.productId && entry.size === item.size
            ? { ...entry, quantity, subtotal: entry.price * quantity }
            : entry,
        ),
      }));
      notifyCartUpdated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update quantity.");
    } finally {
      setUpdating(null);
    }
  }

  async function removeItem(item: CartItem) {
    const key = `${item.productId}-${item.size}`;
    setUpdating(key);
    try {
      await apiFetch<void>(
        `/cart/items/${item.productId}?size=${encodeURIComponent(item.size)}`,
        { method: "DELETE" },
      );
      setCart((current) => ({
        ...current,
        items: current.items.filter(
          (entry) =>
            entry.productId !== item.productId || entry.size !== item.size,
        ),
      }));
      notifyCartUpdated();
      toast.success(`${item.name} removed from your cart.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove item.");
    } finally {
      setUpdating(null);
    }
  }

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
      setCart(emptyCart);
      notifyCartUpdated();
      toast.success("Order created! Proceeding to payment...");
      router.push(`/payment?orderId=${order._id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place your order.");
    } finally {
      setCheckingOut(false);
    }
  }

  if (sessionPending) {
    return (
      <main className="mx-auto grid min-h-[65vh] max-w-7xl place-items-center px-5 text-muted-foreground">
        Loading your cart...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto grid min-h-[65vh] max-w-3xl place-items-center px-5 py-16 text-center">
        <div>
          <h1 className="text-3xl font-black">Log in to view your cart</h1>
          <p className="mt-3 text-muted-foreground">Redirecting to login...</p>
          <Link href="/login?callbackUrl=%2Fcart" className="mt-6 inline-flex rounded-xl bg-[#F26B4F] px-5 py-3 font-bold text-white">
            Log in
          </Link>
        </div>
      </main>
    );
  }

  if (role !== "customer") {
    return (
      <main className="mx-auto grid min-h-[65vh] max-w-3xl place-items-center px-5 py-16 text-center">
        <div>
          <h1 className="text-3xl font-black">Customer cart</h1>
          <p className="mt-3 text-muted-foreground">Ordering is available from a customer account.</p>
          <Link href={`/dashboard/${role === "admin" || role === "vendor" ? role : "customer"}`} className="mt-6 inline-flex rounded-xl border border-border px-5 py-3 font-semibold">
            Go to your dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto grid min-h-[65vh] max-w-7xl place-items-center px-5 text-muted-foreground">
        Loading your cart...
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl px-5 py-12 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#F26B4F]">Your order</p>
          <h1 className="mt-2 text-4xl font-black">Shopping cart</h1>
          <p className="mt-2 text-muted-foreground">
            {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
          </p>
        </div>
        <Link href="/menu" className="text-sm font-semibold text-[#F26B4F]">
          Continue shopping
        </Link>
      </div>

      {placedOrder && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-5">
          <p className="font-semibold">
            Order #{placedOrder._id.slice(-6)} placed successfully · ৳{placedOrder.total}
          </p>
          <Link href="/dashboard/customer" className="font-bold text-[#F26B4F]">
            Track your order
          </Link>
        </div>
      )}

      {cart.items.length === 0 ? (
        <section className="mt-8 rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <ShoppingBag className="mx-auto text-[#F26B4F]" size={38} />
          <h2 className="mt-4 text-2xl font-black">
            {placedOrder ? "Your cart is clear" : "Your cart is empty"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {placedOrder
              ? "Your order is on its way to the kitchen."
              : "Add a pizza from the menu and it will show up here."}
          </p>
          <Link href="/menu" className="mt-6 inline-flex rounded-xl bg-[#F26B4F] px-5 py-3 font-bold text-white">
            Explore menu
          </Link>
        </section>
      ) : (
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px]">
          <section aria-label="Items in your cart" className="grid gap-4">
            {cart.items.map((item) => {
              const key = `${item.productId}-${item.size}`;
              const busy = updating === key;
              return (
                <article key={key} className="flex flex-wrap gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-nowrap">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-28 w-full rounded-xl object-cover sm:h-28 sm:w-36"
                  />
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <h2 className="text-lg font-bold">{item.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.size} · ৳{item.price} each
                      </p>
                      {!item.isAvailable && (
                        <p className="mt-2 text-sm font-semibold text-red-500">
                          Currently unavailable
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center rounded-xl border border-border">
                        <button
                          type="button"
                          aria-label={`Decrease ${item.name} quantity`}
                          disabled={busy || item.quantity <= 1}
                          onClick={() => void updateQuantity(item, item.quantity - 1)}
                          className="p-2.5 disabled:opacity-40"
                        >
                          <Minus size={15} />
                        </button>
                        <span className="min-w-8 text-center text-sm font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label={`Increase ${item.name} quantity`}
                          disabled={busy || item.quantity >= 20}
                          onClick={() => void updateQuantity(item, item.quantity + 1)}
                          className="p-2.5 disabled:opacity-40"
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                      <p className="min-w-20 text-right font-black">৳{item.price * item.quantity}</p>
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        disabled={busy}
                        onClick={() => void removeItem(item)}
                        className="rounded-lg p-2 text-red-500 transition hover:bg-red-500/10 disabled:opacity-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-xl font-black">Order summary</h2>
            <div className="mt-5 flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
              <span className="font-semibold">৳{subtotal}</span>
            </div>
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery fee</span>
              <span className="font-semibold">৳3</span>
            </div>
            <div className="mt-4 flex justify-between border-t border-border pt-4 text-lg font-black">
              <span>Total</span>
              <span>৳{orderTotal}</span>
            </div>

            <form onSubmit={checkout} className="mt-6 grid gap-3">
              <h3 className="font-bold">Delivery information</h3>
              <label className="grid gap-1.5 text-sm font-medium">
                Address
                <textarea
                  required
                  rows={3}
                  value={deliveryAddress}
                  onChange={(event) => setDeliveryAddress(event.target.value)}
                  placeholder="Street, city, postal code"
                  className="resize-y rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-[#F26B4F]"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Phone
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Your contact number"
                  className="rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-[#F26B4F]"
                />
              </label>
              <button
                type="submit"
                disabled={checkingOut || cart.items.some((item) => !item.isAvailable)}
                className="mt-2 rounded-xl bg-[#F26B4F] px-5 py-3 font-bold text-white transition hover:bg-[#D95338] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checkingOut ? "Placing order..." : "Place order"}
              </button>
              <Link
                href="/checkout"
                className="block text-center text-xs font-semibold text-[#F26B4F] hover:underline"
              >
                Go to full checkout page →
              </Link>
              {cart.items.some((item) => !item.isAvailable) && (
                <p className="text-sm text-red-500">
                  Remove unavailable products before placing your order.
                </p>
              )}
            </form>
          </aside>
        </div>
      )}
    </main>
  );
}
