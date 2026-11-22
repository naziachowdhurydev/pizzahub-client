"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProductDetails } from "@/components/product-details";
import { getAuthenticatedProduct, getAuthenticatedProducts } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import type { Product } from "@/types";

export function ProductDetailsAccess({ slug }: { slug: string }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const isAuthenticated = Boolean(session?.user);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isPending) return;
    if (!isAuthenticated) {
      const callbackUrl = `/menu/${encodeURIComponent(slug)}`;
      router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }

    let active = true;
    async function loadProduct() {
      try {
        const [loadedProduct, products] = await Promise.all([
          getAuthenticatedProduct(slug),
          getAuthenticatedProducts(),
        ]);
        if (!active) return;
        if (!loadedProduct) {
          setError("This product could not be found.");
          return;
        }
        setProduct(loadedProduct);
        setRelatedProducts(
          products.filter((item) => item._id !== loadedProduct._id).slice(0, 4),
        );
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load product details.",
          );
        }
      }
    }

    void loadProduct();
    return () => {
      active = false;
    };
  }, [isAuthenticated, isPending, router, slug]);

  if (!isPending && !isAuthenticated) {
    return (
      <main className="mx-auto grid min-h-[50vh] max-w-7xl place-items-center px-5 py-14 text-center">
        <p className="text-muted-foreground">Redirecting to log in...</p>
      </main>
    );
  }

  if (product) {
    return (
      <ProductDetails product={product} relatedProducts={relatedProducts} />
    );
  }

  return (
    <main className="mx-auto grid min-h-[50vh] max-w-7xl place-items-center px-5 py-14 text-center">
      <p className="text-muted-foreground">
        {error || (isPending ? "Checking your sign-in..." : "Redirecting to log in...")}
      </p>
    </main>
  );
}
