"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoaderCircle, Package, Star, Tags, Utensils } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import type { Product } from "@/types";

type ProductChanges = Partial<
  Pick<Product, "price" | "isAvailable" | "isFeatured">
>;

export default function AdminPage() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const user = session?.user;
  const isAdmin =
    (user as (typeof user & { role?: string }) | null)?.role === "admin";
  const [products, setProducts] = useState<Product[]>([]);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    if (sessionPending || !isAdmin) return;
    apiFetch<Product[]>("/admin/products")
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const message =
          cause instanceof Error ? cause.message : "Could not load products.";
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAdmin, sessionPending]);

  async function updateProduct(product: Product, changes: ProductChanges) {
    setSavingId(product._id);
    try {
      const updated = await apiFetch<Product>(
        `/admin/products/${product._id}`,
        {
          method: "PUT",
          body: JSON.stringify(changes),
        },
      );
      setProducts((current) =>
        current.map((item) => (item._id === product._id ? updated : item)),
      );
      if (changes.price !== undefined) {
        setPriceDrafts((current) => {
          const next = { ...current };
          delete next[product._id];
          return next;
        });
      }
      toast.success(`${product.name} updated.`);
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Could not update product.",
      );
    } finally {
      setSavingId(null);
    }
  }

  if (sessionPending || (isAdmin && loading)) {
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-7xl items-center justify-center px-5">
        <p className="flex items-center gap-3 text-muted-foreground">
          <LoaderCircle className="animate-spin" size={20} />
          Loading dashboard...
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto grid min-h-[65vh] max-w-3xl place-items-center px-5 py-16 text-center">
        <div>
          <h1 className="text-3xl font-black">Admin access required</h1>
          <p className="mt-3 text-muted-foreground">Log in with an administrator account to manage the menu.</p>
          <Link href="/login" className="mt-6 inline-flex rounded-xl bg-[#F26B4F] px-5 py-3 font-bold text-white">
            Log in
          </Link>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto grid min-h-[65vh] max-w-3xl place-items-center px-5 py-16 text-center">
        <div>
          <h1 className="text-3xl font-black">You don’t have admin access</h1>
          <p className="mt-3 text-muted-foreground">This dashboard is only available to PizzaHub administrators.</p>
          <Link href="/menu" className="mt-6 inline-flex rounded-xl border border-border px-5 py-3 font-semibold">
            Back to menu
          </Link>
        </div>
      </main>
    );
  }

  const availableCount = products.filter((product) => product.isAvailable).length;
  const featuredCount = products.filter((product) => product.isFeatured).length;
  const categoryCount = new Set(products.map((product) => product.category)).size;

  function savePrice(product: Product) {
    const rawPrice = priceDrafts[product._id] ?? String(product.price);
    const price = Number(rawPrice);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Enter a price greater than zero.");
      return;
    }
    void updateProduct(product, { price });
  }

  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl px-5 py-12 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#F26B4F]">PizzaHub management</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Admin dashboard</h1>
          <p className="mt-2 text-muted-foreground">Manage menu prices and availability. Updates appear on the menu.</p>
        </div>
        <Link href="/menu" className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:border-[#F26B4F]">
          View customer menu
        </Link>
      </div>

      <section aria-label="Menu summary" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Menu items", value: products.length, icon: Package },
          { label: "Available", value: availableCount, icon: Utensils },
          { label: "Featured", value: featuredCount, icon: Star },
          { label: "Categories", value: categoryCount, icon: Tags },
        ].map(({ label, value, icon: Icon }) => (
          <article key={label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <Icon size={19} className="text-[#F26B4F]" />
            </div>
            <p className="mt-3 text-3xl font-black">{value}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold">Menu products</h2>
          <p className="mt-1 text-sm text-muted-foreground">Edit a price and save, or change a product’s availability or featured status.</p>
        </div>

        {error ? (
          <p role="alert" className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
        ) : products.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">No products found. Run <code className="text-[#D95338]">npm run seed:data</code> in the server folder to add demo menu data.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="px-5 py-3 font-semibold">Price</th>
                  <th className="px-5 py-3 font-semibold">Availability</th>
                  <th className="px-5 py-3 font-semibold">Featured</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E3DC]">
                {products.map((product) => {
                  const saving = savingId === product._id;
                  return (
                    <tr key={product._id} className="align-middle">
                      <td className="px-5 py-4">
                        <Link href={`/menu/${product.slug}`} className="font-bold hover:text-[#F26B4F]">
                          {product.name}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">{product.category}</p>
                      </td>
                      <td className="px-5 py-4">
                        <form
                          className="flex items-center gap-2"
                          onSubmit={(event) => {
                            event.preventDefault();
                            savePrice(product);
                          }}
                        >
                          <label className="sr-only" htmlFor={`price-${product._id}`}>Price for {product.name}</label>
                          <span className="text-muted-foreground">৳</span>
                          <input
                            id={`price-${product._id}`}
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={priceDrafts[product._id] ?? String(product.price)}
                            onChange={(event) =>
                              setPriceDrafts((current) => ({
                                ...current,
                                [product._id]: event.target.value,
                              }))
                            }
                            className="w-28 rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-[#F26B4F] focus:ring-2 focus:ring-[#F26B4F]/15"
                          />
                        </form>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.isAvailable ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" : "bg-muted text-muted-foreground"}`}>
                          {product.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </td>
                      <td className="px-5 py-4">{product.isFeatured ? "Yes" : "No"}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={savingId !== null}
                            onClick={() => savePrice(product)}
                            className="rounded-lg bg-[#F26B4F] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#D95338] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {saving ? "Saving..." : "Save price"}
                          </button>
                          <button
                            type="button"
                            disabled={savingId !== null}
                            onClick={() => void updateProduct(product, { isAvailable: !product.isAvailable })}
                            className="rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:border-[#F26B4F] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {product.isAvailable ? "Disable" : "Enable"}
                          </button>
                          <button
                            type="button"
                            disabled={savingId !== null}
                            onClick={() => void updateProduct(product, { isFeatured: !product.isFeatured })}
                            className="rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:border-[#F26B4F] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {product.isFeatured ? "Unfeature" : "Feature"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
