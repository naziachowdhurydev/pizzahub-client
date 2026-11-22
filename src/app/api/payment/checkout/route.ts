// Updated checkout endpoint – supports single order or combined payment
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Stripe secret – should be set in .env (no placeholder here)
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

/**
 * POST body shape:
 *   - orderId?: string               // single order identifier
 *   - total?: number                 // total amount for single order (fallback)
 *   - items?: Array<{ name, price, quantity, size? }>
 *   - orderIds?: string[]            // optional array of order IDs for combined payment
 *   - combinedTotal?: number         // optional total for combined payment (client supplied)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      total,
      items,
      orderIds,
      combinedTotal,
    } = body as {
      orderId?: string;
      total?: number;
      items?: Array<{ name: string; price: number; quantity: number; size?: string }>;
      orderIds?: string[];
      combinedTotal?: number;
    };

    if (!stripeSecretKey) {
      return NextResponse.json({ success: false, message: "Stripe secret key missing" }, { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey);
    const origin = request.headers.get("origin") || request.headers.get("referer") || "http://localhost:3000";

    // Determine line items and metadata
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const metadata: Record<string, string> = {};

    if (Array.isArray(orderIds) && orderIds.length > 0) {
      // Combined payment – create a single line item representing the aggregate amount.
      const amount = combinedTotal ?? (total ?? 0) * orderIds.length;
      lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `PizzaHub Combined Payment (${orderIds.length} orders)` },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ];
      metadata.orderIds = orderIds.join(",");
    } else if (Array.isArray(items) && items.length > 0) {
      lineItems = items.map((it) => ({
        price_data: {
          currency: "usd",
          product_data: { name: `${it.name}${it.size ? ` (${it.size})` : ""}` },
          unit_amount: Math.round(Number(it.price) * 100),
        },
        quantity: Math.max(1, Number(it.quantity)),
      }));
      if (orderId) metadata.orderId = orderId;
    } else {
      // Fallback generic line item
      lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `PizzaHub Order #${orderId?.slice(-6).toUpperCase() || "FOOD"}` },
            unit_amount: Math.round(Number(total ?? 10) * 100),
          },
          quantity: 1,
        },
      ];
      if (orderId) metadata.orderId = orderId;
    }

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment?orderId=${encodeURIComponent(orderId || "")}\u0026cancelled=true`,
      metadata,
    });

    return NextResponse.json({ success: true, url: session.url, sessionId: session.id });
  } catch (e) {
    console.error("Stripe checkout error:", e);
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
