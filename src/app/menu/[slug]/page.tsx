import { ProductDetailsAccess } from "@/components/product-details-access";

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProductDetailsAccess slug={slug} />;
}
