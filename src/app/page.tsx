import Link from "next/link";
import { ArrowRight, Flame, Clock3, Truck } from "lucide-react";
import { ProductGrid } from "@/components/product-grid";
import { getProducts } from "@/lib/api";

export default async function HomePage() {
  let products = [];
  try { products = await getProducts(); } catch { /* API may not be started yet */ }

  return (
    <main>
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_35%,rgba(249,115,22,0.18),transparent_45%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 md:grid-cols-2 md:px-8 md:py-28">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-400"><Flame size={16}/> HOT, FRESH & MADE WITH LOVE</p>
            <h1 className="max-w-xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl">GOOD TIMES<br/><span className="text-orange-500">ARE PIZZA</span><br/>TIMES.</h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-stone-400">Hand-stretched dough, rich sauces and generous toppings. Your next favourite slice is just a few clicks away.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/menu" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 font-bold text-black transition hover:-translate-y-0.5 hover:bg-orange-400">Explore menu <ArrowRight size={18}/></Link>
              <Link href="/register" className="rounded-xl border border-white/15 px-6 py-3.5 font-semibold transition hover:border-orange-500 hover:text-orange-400">Join PizzaHub</Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-7 text-sm text-stone-400">
              <span className="flex items-center gap-2"><Clock3 size={17} className="text-orange-500"/> 30 min delivery</span>
              <span className="flex items-center gap-2"><Truck size={17} className="text-orange-500"/> Fresh to your door</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute inset-8 rounded-full bg-orange-500/20 blur-3xl"/>
            <img className="relative aspect-square w-full rounded-full border border-orange-500/20 object-cover shadow-2xl shadow-orange-950/40" src="https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1100&q=85" alt="Fresh pepperoni pizza"/>
            <div className="absolute bottom-7 left-0 rounded-2xl border border-white/10 bg-[#1b1b1b]/95 p-4 shadow-xl">
              <p className="text-xs text-stone-400">CUSTOMER FAVOURITE</p><p className="mt-1 font-bold">Classic Pepperoni</p><p className="text-sm text-orange-400">From ৳650</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div><p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-500">Made for sharing</p><h2 className="mt-2 text-3xl font-black sm:text-4xl">Popular picks</h2></div>
          <Link href="/menu" className="hidden items-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300 sm:flex">Full menu <ArrowRight size={16}/></Link>
        </div>
        {products.length ? <ProductGrid products={products.slice(0, 4)} /> : <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center"><p className="text-lg font-bold">Your menu is getting ready.</p><p className="mt-2 text-sm text-stone-400">Start the server and run <code className="text-orange-400">npm run seed:data</code> to load demo pizzas.</p></div>}
      </section>
    </main>
  );
}
