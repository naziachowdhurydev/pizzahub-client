"use client";

import { CreditCard, Banknote, Smartphone, ShieldCheck, CheckCircle2 } from "lucide-react";
import type { PaymentMethod } from "./types";

export function PaymentMethods({
  selectedMethod,
  onSelectMethod,
}: {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
}) {
  return (
    <section aria-label="Choose payment method" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black tracking-tight">Select Payment Method</h2>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400">
          <ShieldCheck size={16} /> 256-Bit SSL Encrypted
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-1">
        {/* Stripe Option */}
        <button
          type="button"
          onClick={() => onSelectMethod("stripe")}
          className={`relative flex w-full flex-col items-start rounded-2xl border p-5 text-left transition ${
            selectedMethod === "stripe"
              ? "border-[#F26B4F] bg-[#F26B4F]/5 shadow-md ring-2 ring-[#F26B4F]/20"
              : "border-border bg-card hover:border-[#F26B4F]/50 hover:bg-muted/30"
          }`}
        >
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`grid h-11 w-11 place-items-center rounded-xl transition ${
                  selectedMethod === "stripe"
                    ? "bg-[#F26B4F] text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <CreditCard size={22} />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-foreground">Credit or Debit Card</p>
                  <span className="rounded-full bg-[#635BFF]/15 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-[#635BFF]">
                    Stripe
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Visa, Mastercard, American Express, Apple Pay
                </p>
              </div>
            </div>
            {selectedMethod === "stripe" ? (
              <CheckCircle2 size={22} className="text-[#F26B4F]" />
            ) : (
              <span className="h-5 w-5 rounded-full border border-border" />
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 text-xs text-muted-foreground">
            <span className="inline-block rounded bg-muted px-2 py-0.5 font-medium">
              Direct checkout via Stripe
            </span>
            <span className="text-[11px] font-semibold text-orange-600 dark:text-orange-400">
              ⚡ Instant order confirmation
            </span>
          </div>
        </button>

        {/* Cash On Delivery Option */}
        <button
          type="button"
          onClick={() => onSelectMethod("cod")}
          className={`relative flex w-full flex-col items-start rounded-2xl border p-5 text-left transition ${
            selectedMethod === "cod"
              ? "border-[#F26B4F] bg-[#F26B4F]/5 shadow-md ring-2 ring-[#F26B4F]/20"
              : "border-border bg-card hover:border-[#F26B4F]/50 hover:bg-muted/30"
          }`}
        >
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`grid h-11 w-11 place-items-center rounded-xl transition ${
                  selectedMethod === "cod"
                    ? "bg-[#F26B4F] text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Banknote size={22} />
              </span>
              <div>
                <p className="font-bold text-foreground">Cash on Delivery (COD)</p>
                <p className="text-xs text-muted-foreground">
                  Pay cash directly to the courier when your order arrives
                </p>
              </div>
            </div>
            {selectedMethod === "cod" ? (
              <CheckCircle2 size={22} className="text-[#F26B4F]" />
            ) : (
              <span className="h-5 w-5 rounded-full border border-border" />
            )}
          </div>
        </button>

        {/* Digital Wallet Option */}
        <button
          type="button"
          onClick={() => onSelectMethod("wallet")}
          className={`relative flex w-full flex-col items-start rounded-2xl border p-5 text-left transition ${
            selectedMethod === "wallet"
              ? "border-[#F26B4F] bg-[#F26B4F]/5 shadow-md ring-2 ring-[#F26B4F]/20"
              : "border-border bg-card hover:border-[#F26B4F]/50 hover:bg-muted/30"
          }`}
        >
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`grid h-11 w-11 place-items-center rounded-xl transition ${
                  selectedMethod === "wallet"
                    ? "bg-[#F26B4F] text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Smartphone size={22} />
              </span>
              <div>
                <p className="font-bold text-foreground">Mobile & Digital Banking</p>
                <p className="text-xs text-muted-foreground">
                  bKash, Nagad, Rocket, or UPAY
                </p>
              </div>
            </div>
            {selectedMethod === "wallet" ? (
              <CheckCircle2 size={22} className="text-[#F26B4F]" />
            ) : (
              <span className="h-5 w-5 rounded-full border border-border" />
            )}
          </div>
        </button>
      </div>
    </section>
  );
}
