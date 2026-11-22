"use client";

import { MapPin, Phone, Pizza, Package } from "lucide-react";
import type { PaymentOrderDetails } from "./types";

export function OrderSummaryCard({ order }: { order: PaymentOrderDetails }) {
  const shortId = order.orderId ? order.orderId.slice(-6).toUpperCase() : "PIZZA";

  return (
    <aside className="rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#F26B4F]">
            Order Review
          </span>
          <h2 className="text-xl font-black">Order #{shortId}</h2>
        </div>
        <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold capitalize text-[#F26B4F]">
          {order.status || "Pending Payment"}
        </span>
      </div>

      {/* Customer Delivery Snapshot */}
      <div className="mt-4 space-y-2 rounded-2xl bg-muted/40 p-4 text-xs">
        <div className="flex items-start gap-2">
          <MapPin size={15} className="mt-0.5 shrink-0 text-[#F26B4F]" />
          <span className="leading-relaxed">
            <strong className="text-foreground">Deliver to: </strong>
            {order.deliveryAddress || "Address provided at checkout"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Phone size={15} className="shrink-0 text-[#F26B4F]" />
          <span>
            <strong className="text-foreground">Phone: </strong>
            {order.phone || "Not specified"}
          </span>
        </div>
      </div>

      {/* Itemized Pizzas */}
      <div className="mt-5 max-h-72 space-y-3 overflow-y-auto pr-1 divide-y divide-border/60">
        {order.items.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No items in this order.
          </div>
        ) : (
          order.items.map((item) => (
            <div
              key={item.itemId || item.name}
              className="flex items-center justify-between gap-3 pt-3 first:pt-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-12 w-12 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                    <Pizza size={20} />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.size} × {item.quantity}
                  </p>
                </div>
              </div>
              <p className="shrink-0 font-bold text-foreground">
                ৳{item.subtotal || item.price * item.quantity}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Pricing Calculation Breakdown */}
      <div className="mt-6 space-y-2.5 border-t border-border pt-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Items Subtotal</span>
          <span>৳{order.subtotal}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Delivery Fee</span>
          <span>৳{order.deliveryFee}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Estimated Taxes / Handling</span>
          <span className="text-xs font-semibold text-green-600 dark:text-green-400">
            Included (৳0)
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4 text-lg font-black text-foreground">
          <span>Total to Pay</span>
          <span className="text-2xl text-[#F26B4F]">৳{order.total}</span>
        </div>
      </div>
    </aside>
  );
}
