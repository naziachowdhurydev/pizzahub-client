import Link from "next/link";
import { CheckCircle2, ShoppingBag, ArrowRight } from "lucide-react";
import { DashboardAccess } from "@/components/dashboard-access";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; orderId?: string }>;
}) {
  const params = await searchParams;
  const orderId = params.orderId;
  const shortId = orderId ? orderId.slice(-6).toUpperCase() : "CONFIRMED";

  return (
    <DashboardAccess role="customer">
      <main className="mx-auto min-h-[70vh] max-w-2xl px-5 py-16 text-center">
        <div className="rounded-3xl border border-green-500/30 bg-green-500/10 p-8 sm:p-12 text-card-foreground shadow-xl">
          <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/30">
            <CheckCircle2 size={46} />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-600 dark:text-green-400">
            Payment Verified
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Order Confirmed!
          </h1>

          <p className="mt-3 text-base text-muted-foreground">
            Thank you! Your payment was processed successfully via Stripe. Your fresh pizza is now being prepared in the kitchen.
          </p>

          <div className="my-6 inline-block rounded-2xl bg-card border border-border px-5 py-3 shadow-sm text-sm">
            <span className="text-muted-foreground font-medium">Order Reference: </span>
            <strong className="font-bold text-foreground">#{shortId}</strong>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard/customer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#F26B4F] px-6 py-3.5 font-bold text-white shadow-lg shadow-[#F26B4F]/20 transition hover:bg-[#E85C40]"
            >
              Track Order Status <ArrowRight size={18} />
            </Link>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 font-semibold transition hover:border-[#F26B4F]"
            >
              <ShoppingBag size={18} /> Browse Menu
            </Link>
          </div>
        </div>
      </main>
    </DashboardAccess>
  );
}
