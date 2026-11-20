import { notFound } from "next/navigation";
import { ProductDetails } from "@/components/product-details";
import { getProduct, getProducts } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const relatedProducts = (await getProducts())
    .filter((item) => item._id !== product._id)
    .slice(0, 4);

  return (
    <ProductDetails
      key={product._id}
      product={product}
      relatedProducts={relatedProducts}
    />
  );
}
