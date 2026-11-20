"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, ClipboardList, Package, Store } from "lucide-react";
import { toast } from "sonner";
import { DashboardAccess } from "@/components/dashboard-access";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/types";

type VendorOrder = {
  _id: string;
  status: string;
  createdAt: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    status: string;
  }>;
};

type VendorOrderStatus =
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

const vendorStatusTransitions: Record<string, VendorOrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};

type SalesSummary = {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  unitsSold: number;
  revenue: number;
};

type StoreSettings = {
  storeName: string;
  description: string;
  phone: string;
  address: string;
};

type ProductForm = {
  name: string;
  slug: string;
  description: string;
  category: string;
  price: string;
  image: string;
};

const emptyProduct: ProductForm = {
  name: "",
  slug: "",
  description: "",
  category: "",
  price: "",
  image: "",
};

const emptyStore: StoreSettings = {
  storeName: "",
  description: "",
  phone: "",
  address: "",
};

const sections = [
  { id: "products", label: "My Products", icon: Package },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "sales", label: "Sales", icon: BarChart3 },
  { id: "settings", label: "Store Settings", icon: Store },
] as const;

type Section = (typeof sections)[number]["id"];

function VendorDashboardContent() {
  const [section, setSection] = useState<Section>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [sales, setSales] = useState<SalesSummary>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    unitsSold: 0,
    revenue: 0,
  });
  const [store, setStore] = useState<StoreSettings>(emptyStore);
  const [form, setForm] = useState<ProductForm>(emptyProduct);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingStore, setSavingStore] = useState(false);
  const [savingOrderItem, setSavingOrderItem] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<Product[]>("/vendor/products"),
      apiFetch<VendorOrder[]>("/vendor/orders"),
      apiFetch<SalesSummary>("/vendor/sales"),
      apiFetch<StoreSettings>("/vendor/store"),
    ])
      .then(([vendorProducts, vendorOrders, summary, settings]) => {
        if (!active) return;
        setProducts(vendorProducts);
        setOrders(vendorOrders);
        setSales(summary);
        setStore(settings);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const message =
          cause instanceof Error ? cause.message : "Could not load vendor dashboard.";
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function editProduct(product: Product) {
    setEditingId(product._id);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      category: product.category,
      price: String(product.price),
      image: product.image,
    });
    setSection("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetProductForm() {
    setEditingId(null);
    setForm(emptyProduct);
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const price = Number(form.price);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Enter a price greater than zero.");
      return;
    }

    setSavingProduct(true);
    try {
      const saved = await apiFetch<Product>(
        editingId ? `/vendor/products/${editingId}` : "/vendor/products",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify({ ...form, price }),
        },
      );
      setProducts((current) =>
        editingId
          ? current.map((product) => (product._id === editingId ? saved : product))
          : [saved, ...current],
      );
      resetProductForm();
      toast.success(editingId ? "Product updated." : "Product added.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not save product.");
    } finally {
      setSavingProduct(false);
    }
  }

  async function removeProduct(product: Product) {
    if (!window.confirm(`Remove ${product.name} from your store?`)) return;
    try {
      await apiFetch<void>(`/vendor/products/${product._id}`, {
        method: "DELETE",
      });
      setProducts((current) => current.filter((item) => item._id !== product._id));
      toast.success("Product removed.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not remove product.");
    }
  }

  async function saveStore(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingStore(true);
    try {
      const saved = await apiFetch<StoreSettings>("/vendor/store", {
        method: "PUT",
        body: JSON.stringify(store),
      });
      setStore(saved);
      toast.success("Store settings saved.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not save store settings.");
    } finally {
      setSavingStore(false);
    }
  }

  async function updateOrderItemStatus(
    order: VendorOrder,
    item: VendorOrder["items"][number],
    status: VendorOrderStatus,
  ) {
    const key = `${order._id}:${item.productId}`;
    setSavingOrderItem(key);
    try {
      const updated = await apiFetch<VendorOrder>(
        `/vendor/orders/${order._id}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ productId: item.productId, status }),
        },
      );
      setOrders((current) =>
        current.map((entry) => (entry._id === updated._id ? updated : entry)),
      );
      toast.success("Order item status updated.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not update order status.");
    } finally {
      setSavingOrderItem("");
    }
  }

  if (loading) {
    return <p className="py-16 text-center text-muted-foreground">Loading your store...</p>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="h-fit rounded-2xl border border-border bg-card p-3">
        <nav aria-label="Vendor dashboard sections" className="grid gap-1">
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
        {error && <p role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">{error}</p>}

        {section === "products" && (
          <section>
            <h2 className="text-2xl font-black">My Products</h2>
            <p className="mt-1 text-muted-foreground">Add, edit and remove pizzas from your store.</p>
            <form onSubmit={saveProduct} className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
              <h3 className="font-bold sm:col-span-2">{editingId ? "Edit pizza" : "Add a pizza"}</h3>
              <input required placeholder="Pizza name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-[#F26B4F]" />
              <input required placeholder="Slug (e.g. veggie-delight)" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} className="rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-[#F26B4F]" />
              <input required placeholder="Category" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-[#F26B4F]" />
              <input required type="number" min="0.01" step="0.01" placeholder="Price" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} className="rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-[#F26B4F]" />
              <input required type="url" placeholder="Image URL" value={form.image} onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))} className="rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-[#F26B4F] sm:col-span-2" />
              <textarea required rows={2} placeholder="Description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="resize-y rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-[#F26B4F] sm:col-span-2" />
              <div className="flex gap-2 sm:col-span-2">
                <button disabled={savingProduct} className="rounded-xl bg-[#F26B4F] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                  {savingProduct ? "Saving..." : editingId ? "Save changes" : "Add product"}
                </button>
                {editingId && <button type="button" onClick={resetProductForm} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold">Cancel</button>}
              </div>
            </form>

            {products.length === 0 ? (
              <p className="mt-5 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">Your store has no products yet.</p>
            ) : (
              <div className="mt-5 grid gap-3">
                {products.map((product) => (
                  <article key={product._id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
                    <div>
                      <h3 className="font-bold">
                        <Link href={`/menu/${product.slug}`} className="hover:text-[#F26B4F]">
                          {product.name}
                        </Link>
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">{product.category} · ৳{product.price} · {product.isAvailable ? "Available" : "Unavailable"}</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => editProduct(product)} className="rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:border-[#F26B4F]">Edit</button>
                      <button type="button" onClick={() => void removeProduct(product)} className="rounded-lg border border-red-500/30 px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-500/10">Remove</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {section === "orders" && (
          <section>
            <h2 className="text-2xl font-black">Orders</h2>
            <p className="mt-1 text-muted-foreground">Orders that include products from your store.</p>
            {orders.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">No orders for your products yet.</p>
            ) : (
              <div className="mt-6 grid gap-3">
                {orders.map((order) => (
                  <article key={order._id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex flex-wrap justify-between gap-2">
                      <h3 className="font-bold">Order #{order._id.slice(-6)}</h3>
                      <span className="text-sm font-semibold capitalize text-[#F26B4F]">{order.status.replaceAll("_", " ")}</span>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {order.items.map((item, index) => {
                        const currentStatus = item.status || order.status;
                        const nextStatuses = vendorStatusTransitions[currentStatus] ?? [];
                        const key = `${order._id}:${item.productId}`;
                        return (
                          <div key={`${item.productId}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/50 p-3">
                            <div>
                              <p className="font-semibold">{item.name} × {item.quantity}</p>
                              <p className="text-xs capitalize text-muted-foreground">{currentStatus.replaceAll("_", " ")}</p>
                            </div>
                            <select
                              value={currentStatus}
                              disabled={savingOrderItem === key || nextStatuses.length === 0}
                              onChange={(event) =>
                                void updateOrderItemStatus(
                                  order,
                                  item,
                                  event.target.value as VendorOrderStatus,
                                )
                              }
                              aria-label={`Status for ${item.name}`}
                              className="rounded-lg border border-border bg-background px-3 py-2 text-sm capitalize disabled:opacity-60"
                            >
                              <option value={currentStatus}>{currentStatus.replaceAll("_", " ")}</option>
                              {nextStatuses.map((status) => (
                                <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-sm font-bold">Your items: ৳{order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {section === "sales" && (
          <section>
            <h2 className="text-2xl font-black">Sales</h2>
            <p className="mt-1 text-muted-foreground">Revenue counts delivered orders only.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Gross revenue", `৳${sales.revenue}`],
                ["Orders", sales.totalOrders],
                ["Delivered", sales.completedOrders],
                ["Units sold", sales.unitsSold],
              ].map(([label, value]) => (
                <article key={label} className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-3 text-2xl font-black">{value}</p>
                </article>
              ))}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Orders awaiting fulfillment: {sales.pendingOrders}</p>
          </section>
        )}

        {section === "settings" && (
          <section>
            <h2 className="text-2xl font-black">Store Settings</h2>
            <p className="mt-1 text-muted-foreground">Manage your store information.</p>
            <form onSubmit={saveStore} className="mt-6 grid gap-4 rounded-2xl border border-border bg-card p-5">
              {(
                [
                  ["storeName", "Store name"],
                  ["description", "Description"],
                  ["phone", "Phone"],
                  ["address", "Store address"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="grid gap-2 text-sm font-semibold">
                  {label}
                  {key === "description" || key === "address" ? (
                    <textarea
                      required
                      rows={key === "description" ? 3 : 2}
                      value={store[key]}
                      onChange={(event) => setStore((current) => ({ ...current, [key]: event.target.value }))}
                      className="resize-y rounded-xl border border-border bg-background px-3 py-2.5 font-normal outline-none focus:border-[#F26B4F]"
                    />
                  ) : (
                    <input
                      required
                      value={store[key]}
                      onChange={(event) => setStore((current) => ({ ...current, [key]: event.target.value }))}
                      className="rounded-xl border border-border bg-background px-3 py-2.5 font-normal outline-none focus:border-[#F26B4F]"
                    />
                  )}
                </label>
              ))}
              <button disabled={savingStore} className="w-fit rounded-xl bg-[#F26B4F] px-5 py-3 font-bold text-white disabled:opacity-60">
                {savingStore ? "Saving..." : "Save store settings"}
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}

export default function VendorDashboardPage() {
  return (
    <DashboardAccess role="vendor">
      <main className="mx-auto min-h-[70vh] max-w-7xl px-5 py-12 md:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#F26B4F]">PizzaHub partner</p>
        <h1 className="mt-2 text-4xl font-black">Vendor dashboard</h1>
        <div className="mt-8">
          <VendorDashboardContent />
        </div>
      </main>
    </DashboardAccess>
  );
}
