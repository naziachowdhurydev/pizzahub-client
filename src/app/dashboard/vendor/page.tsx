"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { BarChart3, ClipboardList, Package, RefreshCw, Store } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DashboardAccess } from "@/components/dashboard-access";
import { apiFetch } from "@/lib/api";
import type { Product } from "@/types";

type VendorOrder = {
  _id: string;
  status: string;
  createdAt?: string;
  customerName: string;
  deliveryAddress: string;
  phone: string;
  vendorTotal: number;
  items: Array<{
    itemId: string;
    productId: string;
    name: string;
    size: string;
    image: string;
    price: number;
    quantity: number;
    subtotal: number;
    status: string;
  }>;
};

type VendorOrderStatus =
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "rejected";

const vendorStatusTransitions: Record<string, VendorOrderStatus[]> = {
  pending: ["confirmed", "rejected"],
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
  isAvailable: boolean;
};

const emptyProduct: ProductForm = {
  name: "",
  slug: "",
  description: "",
  category: "",
  price: "",
  image: "",
  isAvailable: true,
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
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);
  const [removingProductId, setRemovingProductId] = useState("");
  const [savingStore, setSavingStore] = useState(false);
  const [refreshingOrders, setRefreshingOrders] = useState(false);
  const [savingOrderItem, setSavingOrderItem] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"all" | VendorOrderStatus>("all");
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

  async function refreshOrders() {
    setRefreshingOrders(true);
    try {
      setOrders(await apiFetch<VendorOrder[]>("/vendor/orders"));
      toast.success("Orders are up to date.");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not refresh orders.");
    } finally {
      setRefreshingOrders(false);
    }
  }

  function editProduct(product: Product) {
    setEditingId(product._id);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description,
      category: product.category,
      price: String(product.price),
      image: product.image,
      isAvailable: product.isAvailable,
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
      const { isAvailable, ...productFields } = form;
      const saved = await apiFetch<Product>(
        editingId ? `/vendor/products/${editingId}` : "/vendor/products",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify({
            ...productFields,
            price,
            ...(editingId ? { isAvailable } : {}),
          }),
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

  async function removeProduct() {
    const product = productToDelete;
    if (!product) return;
    setRemovingProductId(product._id);
    try {
      await apiFetch<void>(`/vendor/products/${product._id}`, {
        method: "DELETE",
      });
      setProducts((current) => current.filter((item) => item._id !== product._id));
      if (editingId === product._id) resetProductForm();
      setProductToDelete(null);
      toast.success(`${product.name} was removed from your store.`);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not remove product.");
    } finally {
      setRemovingProductId("");
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
    const key = `${order._id}:${item.itemId}`;
    setSavingOrderItem(key);
    try {
      const updated = await apiFetch<VendorOrder>(
        `/vendor/orders/${order._id}/items/${item.itemId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
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

  const filteredOrders = orders.filter(
    (order) =>
      orderStatusFilter === "all" ||
      order.items.some((item) => item.status === orderStatusFilter),
  );

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
              {editingId && (
                <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.isAvailable}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isAvailable: event.target.checked,
                      }))
                    }
                    className="accent-[#F26B4F]"
                  />
                  Available in menu
                </label>
              )}
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
                      <button type="button" onClick={() => setProductToDelete(product)} className="rounded-lg border border-red-500/30 px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-500/10">Remove</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {section === "orders" && (
          <section>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Orders</h2>
                <p className="mt-1 text-muted-foreground">Only orders containing your products are shown.</p>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <label className="grid gap-1.5 text-sm font-semibold">
                  Filter by status
                  <select
                    value={orderStatusFilter}
                    onChange={(event) =>
                      setOrderStatusFilter(event.target.value as "all" | VendorOrderStatus)
                    }
                    className="rounded-xl border border-border bg-background px-3 py-2 font-normal capitalize"
                  >
                    <option value="all">All order history</option>
                    {[
                      "pending",
                      "confirmed",
                      "preparing",
                      "out_for_delivery",
                      "delivered",
                      "rejected",
                      "cancelled",
                    ].map((status) => (
                      <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  disabled={refreshingOrders}
                  onClick={() => void refreshOrders()}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold hover:border-[#F26B4F] disabled:opacity-60"
                >
                  <RefreshCw size={16} className={refreshingOrders ? "animate-spin" : ""} />
                  {refreshingOrders ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>
            {orders.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">No orders for your products yet.</p>
            ) : filteredOrders.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
                No orders match this status.
              </p>
            ) : (
              <div className="mt-6 grid gap-3">
                {filteredOrders.map((order) => (
                  <article key={order._id} className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex flex-wrap justify-between gap-2">
                      <div>
                        <h3 className="font-bold">Order #{order._id.slice(-6)}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {order.createdAt ? new Date(order.createdAt).toLocaleString() : "Date unavailable"}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#F26B4F]/10 px-3 py-1 text-xs font-bold capitalize text-[#F26B4F]">
                        {order.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-2 rounded-xl bg-muted/50 p-4 text-sm sm:grid-cols-2">
                      <p><span className="text-muted-foreground">Customer: </span>{order.customerName || "Customer"}</p>
                      <p><span className="text-muted-foreground">Phone: </span>{order.phone || "Not provided"}</p>
                      <p className="sm:col-span-2"><span className="text-muted-foreground">Delivery address: </span>{order.deliveryAddress || "Not provided"}</p>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {order.items.map((item) => {
                        const currentStatus = item.status;
                        const nextStatuses = vendorStatusTransitions[currentStatus] ?? [];
                        const key = `${order._id}:${item.itemId}`;
                        return (
                          <div key={item.itemId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
                            <div className="flex min-w-0 items-center gap-3">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  width={56}
                                  height={56}
                                  unoptimized
                                  className="h-14 w-14 rounded-lg object-cover"
                                />
                              ) : (
                                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-muted">
                                  <Package size={20} className="text-muted-foreground" />
                                </span>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold">{item.name} · {item.size} × {item.quantity}</p>
                                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  <span className="rounded-full bg-muted px-2 py-1 font-semibold capitalize text-foreground">
                                    {currentStatus.replaceAll("_", " ")}
                                  </span>
                                  <span>৳{item.subtotal}</span>
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {currentStatus === "pending" ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={savingOrderItem === key}
                                    onClick={() =>
                                      void updateOrderItemStatus(order, item, "confirmed")
                                    }
                                    className="rounded-lg bg-green-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
                                  >
                                    {savingOrderItem === key ? "Saving..." : "Accept"}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={savingOrderItem === key}
                                    onClick={() =>
                                      void updateOrderItemStatus(order, item, "rejected")
                                    }
                                    className="rounded-lg border border-red-500/30 px-3 py-2 text-sm font-semibold text-red-600 disabled:opacity-60"
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : nextStatuses.length > 0 ? (
                                <select
                                  value={currentStatus}
                                  disabled={savingOrderItem === key}
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
                              ) : (
                                <span className="rounded-full bg-muted px-3 py-2 text-xs font-semibold capitalize text-muted-foreground">
                                  {currentStatus.replaceAll("_", " ")}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-sm font-bold">Your items total: ৳{order.vendorTotal}</p>
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
      <ConfirmDialog
        open={productToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !removingProductId) setProductToDelete(null);
        }}
        itemName={productToDelete?.name ?? ""}
        description="This product will be removed from your store and can no longer be ordered."
        pending={removingProductId === productToDelete?._id}
        onConfirm={() => void removeProduct()}
      />
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
