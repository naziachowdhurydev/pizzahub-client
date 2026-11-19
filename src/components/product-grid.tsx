import type { Product } from "@/types";
export function ProductGrid({ products }: { products: Product[] }) {
  if (!products.length) return <p className="rounded-xl border border-border p-8 text-center text-muted-foreground">No pizzas found yet. Add demo data from the server.</p>;
  return <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map(p => <article key={p._id} className="group overflow-hidden rounded-2xl border border-border bg-card text-card-foreground transition hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-950/20">
    <div className="relative overflow-hidden"><img src={p.image} alt={p.name} className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"/>{p.isFeatured && <span className="absolute left-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-xs font-black text-black">POPULAR</span>}</div>
    <div className="p-5"><div className="flex items-start justify-between gap-3"><h3 className="text-lg font-bold">{p.name}</h3><span className="whitespace-nowrap font-black text-orange-400">৳{p.price}</span></div><p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{p.description}</p><div className="mt-4 flex items-center justify-between text-xs text-muted-foreground"><span>{p.category}</span><span>★ {p.rating?.toFixed(1) ?? "4.8"}</span></div></div>
  </article>)}</div>;
}
