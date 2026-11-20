"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, MapPin, PackageCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { DashboardAccess } from "@/components/dashboard-access";
import { apiFetch } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import type { Product } from "@/types";

type Order = {
  _id: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    status?: string;
  }>;
};

type Address = {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
};

type VendorApplication = {
  _id: string;
  storeName: string;
  description: string;
  status: "pending" | "approved" | "rejected";
};

const emptyAddress: Address = {
  fullName: "",
  phone: "",
  street: "",
  city: "",
  postalCode: "",
};

const sections = [
  { id: "orders", label: "My Orders", icon: PackageCheck },
  { id: "wishlist", label: "My Wishlist", icon: Heart },
  { id: "address", label: "My Address", icon: MapPin },
  { id: "profile", label: "My Profile", icon: UserRound },
] as const;

type Section = (typeof sections)[number]["id"];

function CustomerDashboardContent() {
  const { data: session } = authClient.useSession();
  const [section, setSection] = useState<Section>("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [application, setApplication] = useState<VendorApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savingApplication, setSavingApplication] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<Order[]>("/orders/my"),
      apiFetch<Product[]>("/customer/wishlist"),
      apiFetch<Address | null>("/customer/address"),
      apiFetch<VendorApplication | null>("/customer/vendor-application"),
    ])
      .then(([myOrders, savedPizzas, savedAddress, vendorApplication]) => {
        if (!active) return;
        setOrders(myOrders);
        setWishlist(savedPizzas);
        setAddress(savedAddress ?? emptyAddress);
        setApplication(vendorApplication);
        if (vendorApplication) {
          setStoreName(vendorApplication.storeName);
          setStoreDescription(vendorApplication.description);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          toast.error(
            error instanceof Error ? error.message : "Could not load your dashboard.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function saveAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingAddress(true);
    try {
      const saved = await apiFetch<Address>("/customer/address", {
        method: "PUT",
        body: JSON.stringify(address),
      });
      setAddress(saved);
      toast.success("Delivery information saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your address.");
    } finally {
      setSavingAddress(false);
    }
  }

  async function removeFromWishlist(product: Product) {
    try {
      await apiFetch<void>(`/customer/wishlist/${product._id}`, {
        method: "DELETE",
      });
      setWishlist((current) => current.filter((item) => item._id !== product._id));
      toast.success(`${product.name} removed from your wishlist.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update wishlist.");
    }
  }

  async function submitApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingApplication(true);
    try {
      const submitted = await apiFetch<VendorApplication>(
        "/vendors/apply",
        {
          method: "POST",
          body: JSON.stringify({ storeName, description: storeDescription }),
        },
      );
      setApplication(submitted);
      toast.success("Vendor application submitted for review.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not submit the application.",
      );
    } finally {
      setSavingApplication(false);
    }
  }

  if (loading) {
    return <p className="py-16 text-center text-muted-foreground">Loading your dashboard...</p>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="h-fit rounded-2xl border border-border bg-card p-3">
        <nav aria-label="Customer dashboard sections" className="grid gap-1">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              aria-current={section === id ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                section === id
                  ? "bg-orange-500/10 text-[#F26B4F]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        {section === "orders" && (
          <section>
            <h2 className="text-2xl font-black">My Orders</h2>
            <p className="mt-1 text-muted-foreground">Order history and current status.</p>
            {orders.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
                <p className="font-semibold">No orders yet</p>
                <Link href="/menu" className="mt-3 inline-block font-semibold text-[#F26B4F]">
                  Browse the menu
                </Link>
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {orders.map((order) => (
                  <article key={order._id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold">Order #{order._id.slice(-6)}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold capitalize text-[#F26B4F]">
                        {order.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">
                      {order.items.map((item, index) => (
                        <li key={`${item.name}-${index}`} className="flex flex-wrap justify-between gap-2">
                          <span>{item.name} × {item.quantity}</span>
                          {item.status && (
                            <span className="capitalize">{item.status.replaceAll("_", " ")}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 font-bold">৳{order.total}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {section === "wishlist" && (
          <section>
            <h2 className="text-2xl font-black">My Wishlist</h2>
            <p className="mt-1 text-muted-foreground">Pizzas you’ve saved for later.</p>
            {wishlist.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
                <p className="font-semibold">Your wishlist is empty</p>
                <p className="mt-2 text-sm text-muted-foreground">Save a pizza from the menu to find it here.</p>
                <Link href="/menu" className="mt-3 inline-block font-semibold text-[#F26B4F]">
                  Browse the menu
                </Link>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {wishlist.map((product) => (
                  <article key={product._id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold">{product.name}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{product.category}</p>
                      </div>
                      <span className="font-bold text-[#F26B4F]">৳{product.price}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void removeFromWishlist(product)}
                      className="mt-4 rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:border-red-400 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {section === "address" && (
          <section>
            <h2 className="text-2xl font-black">My Address</h2>
            <p className="mt-1 text-muted-foreground">Delivery information for your orders.</p>
            <form onSubmit={saveAddress} className="mt-6 grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
              {(
                [
                  ["fullName", "Full name"],
                  ["phone", "Phone"],
                  ["street", "Street address"],
                  ["city", "City"],
                  ["postalCode", "Postal code"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="grid gap-2 text-sm font-semibold">
                  {label}
                  <input
                    required
                    value={address[key]}
                    onChange={(event) =>
                      setAddress((current) => ({ ...current, [key]: event.target.value }))
                    }
                    className="rounded-xl border border-border bg-background px-3 py-2.5 font-normal outline-none focus:border-[#F26B4F]"
                  />
                </label>
              ))}
              <button
                disabled={savingAddress}
                className="w-fit rounded-xl bg-[#F26B4F] px-5 py-3 font-bold text-white disabled:opacity-60 sm:col-span-2"
              >
                {savingAddress ? "Saving..." : "Save delivery information"}
              </button>
            </form>
          </section>
        )}

        {section === "profile" && (
          <section>
            <h2 className="text-2xl font-black">My Profile</h2>
            <p className="mt-1 text-muted-foreground">Account details and vendor application.</p>
            <div className="mt-6 rounded-2xl border border-border bg-card p-5">
              <p className="font-bold">{session?.user.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{session?.user.email}</p>
              <Link href="/profile" className="mt-4 inline-block text-sm font-semibold text-[#F26B4F]">
                View account details
              </Link>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-card p-5">
              <h3 className="text-lg font-bold">Want to sell on PizzaHub?</h3>
              {application && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Application status: <span className="font-bold capitalize text-foreground">{application.status}</span>
                </p>
              )}
              {application?.status === "approved" ? (
                <Link href="/dashboard/vendor" className="mt-4 inline-flex font-semibold text-[#F26B4F]">
                  Open vendor dashboard
                </Link>
              ) : (
                <form onSubmit={submitApplication} className="mt-4 grid gap-3">
                  <input
                    required
                    value={storeName}
                    onChange={(event) => setStoreName(event.target.value)}
                    placeholder="Store name"
                    className="rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-[#F26B4F]"
                  />
                  <textarea
                    required
                    rows={3}
                    value={storeDescription}
                    onChange={(event) => setStoreDescription(event.target.value)}
                    placeholder="Tell us about your store"
                    className="resize-y rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-[#F26B4F]"
                  />
                  <button
                    disabled={savingApplication || application?.status === "pending"}
                    className="w-fit rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:border-[#F26B4F] disabled:opacity-60"
                  >
                    {savingApplication
                      ? "Submitting..."
                      : application?.status === "pending"
                        ? "Awaiting review"
                        : application?.status === "rejected"
                          ? "Resubmit application"
                          : "Apply to become a vendor"}
                  </button>
                </form>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default function CustomerDashboardPage() {
  return (
    <DashboardAccess role="customer">
      <main className="mx-auto min-h-[70vh] max-w-7xl px-5 py-12 md:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#F26B4F]">Your PizzaHub account</p>
        <h1 className="mt-2 text-4xl font-black">Customer dashboard</h1>
        <div className="mt-8">
          <CustomerDashboardContent />
        </div>
      </main>
    </DashboardAccess>
  );
}
