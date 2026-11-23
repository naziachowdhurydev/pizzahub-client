import Link from "next/link";
import { ArrowLeft, Pizza, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="grid min-h-[75vh] place-items-center bg-background px-5 py-16">
      <section className="w-full max-w-xl rounded-3xl border border-border bg-card p-8 text-center text-card-foreground shadow-xl sm:p-12">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#F26B4F]/10 text-[#F26B4F]">
          <Pizza size={34} aria-hidden="true" />
        </div>

        <p className="mt-6 text-sm font-black uppercase tracking-[0.3em] text-[#F26B4F]">
          404
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          This page ran out of toppings
        </h1>
        <p className="mx-auto mt-3 max-w-md leading-7 text-muted-foreground">
          We couldn’t find what you were looking for. The link may have moved, or the page may
          not exist anymore.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F26B4F] px-6 py-3 font-bold text-white shadow-lg shadow-[#F26B4F]/15 transition hover:bg-[#E85C40]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Back to home
          </Link>
          <Link
            href="/menu"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3 font-bold transition hover:border-[#F26B4F] hover:text-[#F26B4F]"
          >
            <Search size={18} aria-hidden="true" />
            Browse the menu
          </Link>
        </div>
      </section>
    </main>
  );
}
