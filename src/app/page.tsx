import Link from "next/link";
import {
  ArrowRight,
  Flame,
  Clock3,
  Truck,
  ShieldCheck,
  Heart,
  Smartphone,
  BadgeCheck,
  ShoppingCart,
  SlidersHorizontal,
} from "lucide-react";
import { ProductGrid } from "@/components/product-grid";
import { HeroCopy } from "@/components/home/hero-copy";
import { HeroVisual } from "@/components/home/hero-visual";
import { Reveal } from "@/components/home/reveal";
import { getProducts } from "@/lib/api";
import type { Product } from "@/types";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Quality ingredients",
    text: "Fresh dough, rich sauces and hand-picked toppings in every pizza we make.",
  },
  {
    icon: Clock3,
    title: "30-min delivery",
    text: "Hot and ready when you are. Our riders bring the flavour straight to your door.",
  },
  {
    icon: Heart,
    title: "Made with love",
    text: "Hand-stretched and baked to order — because great pizza is always personal.",
  },
  {
    icon: Smartphone,
    title: "Easy ordering",
    text: "Browse, customise and check out in a few taps. No phone calls, no hassle.",
  },
];

const steps = [
  {
    icon: ShoppingCart,
    title: "Pick your pizza",
    text: "Browse the menu and choose the pizzas you are craving.",
  },
  {
    icon: SlidersHorizontal,
    title: "Make it yours",
    text: "Choose your size, add favourites and save them to your wishlist.",
  },
  {
    icon: Truck,
    title: "Enjoy at home",
    text: "Check out securely and follow your order all the way to your door.",
  },
];

export default async function HomePage() {
  let products: Product[] = [];
  try {
    products = await getProducts();
  } catch {
    /* API may not be started yet */
  }

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_35%,rgba(249,115,22,0.18),transparent_45%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-14 sm:py-20 md:grid-cols-2 md:gap-8 md:px-8 lg:py-28">
          <HeroCopy />
          <HeroVisual />
        </div>
      </section>

      <div className="overflow-hidden border-b border-border bg-orange-500 text-black">
        <div className="marquee-track flex w-max py-3 text-xs font-black uppercase tracking-[0.2em] sm:py-3.5 sm:text-sm">
          {[0, 1].map((copy) => (
            <span key={copy} className="flex shrink-0 items-center gap-8 pr-8">
              Fresh dough <span aria-hidden="true">✦</span> Baked to order{" "}
              <span aria-hidden="true">✦</span> 30-minute delivery{" "}
              <span aria-hidden="true">✦</span> Made with love{" "}
              <span aria-hidden="true">✦</span>
            </span>
          ))}
        </div>
      </div>

      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:py-20 md:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-500">
              The PizzaHub difference
            </p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl lg:text-4xl">Why Choose PizzaHub?</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              We put care into every slice — from the ingredients we pick to the moment it
              lands at your door.
            </p>
          </Reveal>

          <div className="mt-9 grid gap-6 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ icon: Icon, title, text }, index) => (
              <Reveal key={title} delay={index * 0.07} y={18}>
                <div className="group h-full rounded-2xl border border-border bg-card p-6 text-center transition hover:-translate-y-1 hover:border-orange-500/50 hover:shadow-lg">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-orange-500/10 text-orange-500 transition group-hover:bg-orange-500 group-hover:text-white">
                    <Icon size={26} />
                  </span>
                  <h3 className="mt-5 text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal
            delay={0.28}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 border-t border-border pt-8 text-sm font-semibold text-muted-foreground"
          >
            <span className="flex items-center gap-2">
              <BadgeCheck size={18} className="text-orange-500" /> 100% fresh, never frozen
            </span>
            <span className="flex items-center gap-2">
              <Flame size={18} className="text-orange-500" /> Baked to order
            </span>
            <span className="flex items-center gap-2">
              <Truck size={18} className="text-orange-500" /> Free delivery on large orders
            </span>
          </Reveal>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:py-20 md:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-500">
              Simple from start to slice
            </p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl lg:text-4xl">How PizzaHub Works</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Three easy steps stand between you and a hot, fresh pizza.
            </p>
          </Reveal>

          <div className="mt-9 grid gap-6 md:mt-12 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, index) => (
              <Reveal key={title} delay={index * 0.09} y={18}>
                <div className="relative h-full overflow-hidden rounded-2xl border border-border bg-card p-7">
                  <span className="absolute -right-1 -top-4 text-7xl font-black text-orange-500/10">
                    0{index + 1}
                  </span>
                  <span className="relative grid h-12 w-12 place-items-center rounded-xl bg-orange-500/10 text-orange-500">
                    <Icon size={24} />
                  </span>
                  <h3 className="relative mt-5 text-lg font-bold">{title}</h3>
                  <p className="relative mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:py-20 md:px-8">
        <Reveal className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-500">
              Made for sharing
            </p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl lg:text-4xl">Popular picks</h2>
          </div>
          <Link
            href="/menu"
            className="hidden items-center gap-2 text-sm font-semibold text-orange-400 hover:text-orange-300 sm:flex"
          >
            Full menu <ArrowRight size={16} />
          </Link>
        </Reveal>

        <Reveal delay={0.08}>
          {products.length ? (
            <ProductGrid products={products.slice(0, 4)} />
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted p-8 text-center sm:p-10">
              <p className="text-lg font-bold">Your menu is getting ready.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Start the server and run <code className="text-orange-400">npm run seed:data</code>{" "}
                to load demo pizzas.
              </p>
            </div>
          )}
        </Reveal>
      </section>
    </main>
  );
}
