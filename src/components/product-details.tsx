"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Clock3, ShoppingBag, Star } from "lucide-react";
import { toast } from "sonner";
import { ProductGrid } from "@/components/product-grid";
import { SaveToWishlistButton } from "@/components/save-to-wishlist-button";
import { apiFetch } from "@/lib/api";
import {
  CART_UPDATED_EVENT,
  notifyCartUpdated,
} from "@/lib/cart-events";
import { authClient } from "@/lib/auth-client";
import type { Product } from "@/types";

type CartItemRef = {
  productId: string;
  size: string;
  quantity: number;
};

export function ProductDetails({
  product: initialProduct,
  relatedProducts,
}: {
  product: Product;
  relatedProducts: Product[];
}) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const sessionUser = session?.user;
  const user = sessionUser as
    | (typeof sessionUser & { id?: string; role?: string })
    | null;
  const role = user?.role ?? (user ? "customer" : null);
  const userId = user?.id;
  const [product, setProduct] = useState(initialProduct);
  const [size, setSize] = useState(initialProduct.sizes[0] ?? "Regular");
  const [quantity, setQuantity] = useState(1);
  const [savingCart, setSavingCart] = useState(false);
  const savingCartRef = useRef(false);
  const [cartItems, setCartItems] = useState<CartItemRef[]>([]);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [savingOrder, setSavingOrder] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [price, setPrice] = useState(String(initialProduct.price));
  const [available, setAvailable] = useState(initialProduct.isAvailable);
  const [featured, setFeatured] = useState(initialProduct.isFeatured);

  const canUseCart = !isPending && !!userId && role === "customer";

  useEffect(() => {
    let active = true;

    if (!canUseCart) return;

    async function loadCart() {
      try {
        const cart = await apiFetch<{ items: CartItemRef[] }>("/cart");
        if (active) setCartItems(cart.items ?? []);
      } catch {
        if (active) setCartItems([]);
      }
    }

    void loadCart();
    const handleCartUpdate = () => void loadCart();
    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdate);

    return () => {
      active = false;
      window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdate);
    };
  }, [canUseCart]);

  const existingCartItem = canUseCart
    ? cartItems.find(
        (item) => item.productId === product._id && item.size === size,
      )
    : undefined;
  const isExistingItem = Boolean(existingCartItem);

  const isVendorOwner =
    role === "vendor" &&
    Boolean(user?.id) &&
    product.vendorId === user?.id;

  async function addToCart() {
    if (savingCartRef.current) return;
    savingCartRef.current = true;
    setSavingCart(true);
    try {
      await apiFetch<{ itemCount: number }>("/cart/items", {
        method: "POST",
        body: JSON.stringify({
          productId: product._id,
          size,
          quantity,
        }),
      });
      setCartItems((current) => [
        ...current.filter(
          (item) => item.productId !== product._id || item.size !== size,
        ),
        { productId: product._id, size, quantity },
      ]);
      setAddedToCart(true);
      toast.success(
        isExistingItem
          ? `${product.name} updated in your cart.`
          : `${product.name} added to your cart.`,
      );
      notifyCartUpdated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add this pizza to your cart.");
    } finally {
      savingCartRef.current = false;
      setSavingCart(false);
    }
  }

  async function placeOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingOrder(true);
    try {
      const order = await apiFetch<{ _id: string }>("/orders", {
        method: "POST",
        body: JSON.stringify({
          items: [{ productId: product._id, size, quantity }],
          deliveryAddress: deliveryAddress.trim(),
          phone: phone.trim(),
        }),
      });
      setPlacedOrderId(order._id);
      setShowOrderForm(false);
      toast.success(`${product.name} ordered! Proceeding to payment...`);
      router.push(`/payment?orderId=${order._id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place your order.");
    } finally {
      setSavingOrder(false);
    }
  }

  async function saveProductDetails() {
    const newPrice = Number(price);
    if (!Number.isFinite(newPrice) || newPrice <= 0) {
      toast.error("Enter a price greater than zero.");
      return;
    }

    setSavingDetails(true);
    try {
      const path =
        role === "admin"
          ? `/admin/products/${product._id}`
          : `/vendor/products/${product._id}`;
      const changes =
        role === "admin"
          ? { price: newPrice, isAvailable: available, isFeatured: featured }
          : { price: newPrice, isAvailable: available };
      const updated = await apiFetch<Product>(path, {
        method: "PUT",
        body: JSON.stringify(changes),
      });
      setProduct(updated);
      setPrice(String(updated.price));
      setAvailable(updated.isAvailable);
      setFeatured(updated.isFeatured);
      toast.success("Product details updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update product.");
    } finally {
      setSavingDetails(false);
    }
  }

  return (
    <main className="mx-auto min-h-[70vh] max-w-7xl px-5 py-10 md:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-[#F26B4F]">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/menu" className="hover:text-[#F26B4F]">Menu</Link>
        <span aria-hidden="true">/</span>
        <span className="truncate text-foreground">{product.name}</span>
      </nav>

      <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
          <img
            src={product.image}
            alt={product.name}
            className="aspect-[4/3] w-full object-cover"
          />
          {product.isFeatured && (
            <span className="absolute left-5 top-5 rounded-full bg-orange-500 px-4 py-2 text-xs font-black text-black">
              CUSTOMER FAVOURITE
            </span>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#F26B4F]">
            {product.category}
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
            {product.name}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Star size={16} className="fill-amber-400 text-amber-400" />
              {Number(product.rating || 0).toFixed(1)} rating
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 size={16} />
              Freshly prepared
            </span>
            <span className={`inline-flex items-center gap-1.5 font-semibold ${product.isAvailable ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
              <Check size={16} />
              {product.isAvailable ? "Available to order" : "Currently unavailable"}
            </span>
          </div>

          <p className="mt-6 text-base leading-7 text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-7 flex items-end justify-between border-b border-border pb-6">
            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="mt-1 text-3xl font-black text-[#F26B4F]">৳{product.price}</p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1.5 text-sm font-semibold">
              {product.category}
            </span>
          </div>

          <div className="mt-6">
            <p className="text-sm font-bold">Choose a size</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.sizes.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={size === option}
                  onClick={() => {
                    setSize(option);
                    setAddedToCart(false);
                  }}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    size === option
                      ? "border-[#F26B4F] bg-orange-500/10 text-[#F26B4F]"
                      : "border-border hover:border-[#F26B4F]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {role === "customer" && product.isAvailable && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-xl border border-border">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                  onClick={() => {
                    setQuantity((current) => Math.max(1, current - 1));
                    setAddedToCart(false);
                  }}
                  className="px-3 py-2.5 text-lg disabled:opacity-40"
                >
                  −
                </button>
                <span className="min-w-8 text-center font-semibold">{quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={quantity >= 20}
                  onClick={() => {
                    setQuantity((current) => Math.min(20, current + 1));
                    setAddedToCart(false);
                  }}
                  className="px-3 py-2.5 text-lg disabled:opacity-40"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                disabled={savingCart}
                onClick={() => void addToCart()}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold text-white transition disabled:opacity-60 ${
                  addedToCart
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-[#F26B4F] hover:bg-[#D95338]"
                }`}
              >
                <ShoppingBag size={18} />
                {savingCart
                  ? "Adding..."
                  : addedToCart
                    ? "Added to Cart"
                    : isExistingItem
                      ? "Update Cart"
                      : "Add to Cart"}
              </button>
              <button
                type="button"
                onClick={() => setShowOrderForm((current) => !current)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#F26B4F] px-5 py-3 font-bold text-[#F26B4F] transition hover:bg-orange-500/10"
              >
                Order now
              </button>
              <SaveToWishlistButton productId={product._id} />
            </div>
          )}

          {role === "customer" && showOrderForm && (
            <form
              onSubmit={placeOrder}
              className="mt-4 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2"
            >
              <h2 className="font-bold sm:col-span-2">Delivery details</h2>
              <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
                Delivery address
                <input
                  required
                  value={deliveryAddress}
                  onChange={(event) => setDeliveryAddress(event.target.value)}
                  placeholder="Street, city, postal code"
                  className="rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-[#F26B4F]"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
                Phone number
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
                disabled={savingOrder}
                className="rounded-xl bg-[#F26B4F] px-5 py-3 font-bold text-white disabled:opacity-60 sm:col-span-2"
              >
                {savingOrder ? "Placing order..." : `Place order · ৳${product.price * quantity}`}
              </button>
            </form>
          )}

          {placedOrderId && (
            <p className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm">
              Order #{placedOrderId.slice(-6)} placed.{" "}
              <Link href="/dashboard/customer" className="font-bold text-[#F26B4F]">
                Track your order
              </Link>
            </p>
          )}

          {!isPending && !user && (
            <Link href="/login" className="mt-6 inline-flex w-fit rounded-xl border border-border px-5 py-3 font-semibold hover:border-[#F26B4F]">
              Log in to order or save this pizza
            </Link>
          )}

          {role === "vendor" && !isVendorOwner && (
            <p className="mt-6 rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">
              This marketplace item isn’t owned by your store. Visit your vendor dashboard to manage your products.
              <Link href="/dashboard/vendor" className="ml-1 font-semibold text-[#F26B4F]">Open dashboard</Link>
            </p>
          )}
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <article className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-black">About this pizza</h2>
          <p className="mt-3 leading-7 text-muted-foreground">{product.description}</p>
          {product.ingredients && product.ingredients.length > 0 && (
            <div className="mt-5">
              <h3 className="font-bold">Ingredients</h3>
              <p className="mt-2 text-sm text-muted-foreground">{product.ingredients.join(", ")}</p>
            </div>
          )}
          {product.allergens && product.allergens.length > 0 && (
            <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <h3 className="font-bold text-amber-700 dark:text-amber-300">Allergen information</h3>
              <p className="mt-1 text-sm">{product.allergens.join(", ")}</p>
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl font-black">Product details</h2>
          <dl className="mt-4 grid gap-4 text-sm">
            <div className="flex justify-between gap-4 border-b border-border pb-3">
              <dt className="text-muted-foreground">Category</dt>
              <dd className="font-semibold">{product.category}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border pb-3">
              <dt className="text-muted-foreground">Available sizes</dt>
              <dd className="text-right font-semibold">{product.sizes.join(", ") || "Standard"}</dd>
            </div>
            {product.preparationTime && (
              <div className="flex justify-between gap-4 border-b border-border pb-3">
                <dt className="text-muted-foreground">Preparation time</dt>
                <dd className="font-semibold">{product.preparationTime}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Availability</dt>
              <dd className="font-semibold">{product.isAvailable ? "In menu" : "Temporarily unavailable"}</dd>
            </div>
          </dl>
        </article>
      </section>

      {(role === "admin" || isVendorOwner) && (
        <section className="mt-8 rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">
                {role === "admin" ? "Administrator controls" : "Your product controls"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {role === "admin"
                  ? "Update platform menu details and listing status."
                  : "Edit your product price or remove it from the menu temporarily."}
              </p>
            </div>
            {role === "admin" && (
              <Link href="/admin" className="text-sm font-semibold text-[#F26B4F]">
                Open product manager
              </Link>
            )}
            {isVendorOwner && (
              <Link href="/dashboard/vendor" className="text-sm font-semibold text-[#F26B4F]">
                Open full product manager
              </Link>
            )}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-2 text-sm font-semibold">
              Price (৳)
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="rounded-xl border border-border bg-background px-3 py-2.5 outline-none focus:border-[#F26B4F]"
              />
            </label>
            <label className="flex items-center gap-3 self-end rounded-xl border border-border px-4 py-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={available}
                onChange={(event) => setAvailable(event.target.checked)}
                className="accent-[#F26B4F]"
              />
              Available in menu
            </label>
            {role === "admin" && (
              <label className="flex items-center gap-3 self-end rounded-xl border border-border px-4 py-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(event) => setFeatured(event.target.checked)}
                  className="accent-[#F26B4F]"
                />
                Featured item
              </label>
            )}
            <button
              type="button"
              disabled={savingDetails}
              onClick={() => void saveProductDetails()}
              className="self-end rounded-xl bg-[#F26B4F] px-5 py-3 font-bold text-white disabled:opacity-60"
            >
              {savingDetails ? "Saving..." : "Save product"}
            </button>
          </div>

          {role === "admin" && (
            <dl className="mt-5 grid gap-2 border-t border-border pt-4 text-xs text-muted-foreground sm:grid-cols-3">
              <div><dt>Product ID</dt><dd className="mt-1 break-all">{product._id}</dd></div>
              <div><dt>Vendor ID</dt><dd className="mt-1 break-all">{product.vendorId || "Platform menu"}</dd></div>
              <div><dt>Slug</dt><dd className="mt-1 break-all">{product.slug}</dd></div>
            </dl>
          )}
        </section>
      )}

      {relatedProducts.length > 0 && (
        <section className="mt-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#F26B4F]">More to enjoy</p>
              <h2 className="mt-2 text-2xl font-black">You might also like</h2>
            </div>
            <Link href="/menu" className="inline-flex items-center gap-2 text-sm font-semibold text-[#F26B4F]">
              <ArrowLeft size={16} className="rotate-180" />
              Full menu
            </Link>
          </div>
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </main>
  );
}
