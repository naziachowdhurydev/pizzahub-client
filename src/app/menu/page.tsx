import { ProductGrid } from "@/components/product-grid";
import { getProducts } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  let products = [];
  let error = "";
  try { products = await getProducts(); } catch { error = "Could not connect to the PizzaHub API. Start the server and seed demo data."; }
  return <main className="mx-auto min-h-[65vh] max-w-7xl px-5 py-14 md:px-8">
    <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-500">The good stuff</p>
    <h1 className="mt-2 text-4xl font-black">Our menu</h1>
    <p className="mt-3 text-stone-400">Freshly made favourites, served hot.</p>
    <div className="mt-9">{error ? <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">{error}</p> : <ProductGrid products={products}/>}</div>
  </main>;
}
