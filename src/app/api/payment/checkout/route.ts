import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey =
  process.env.STRIPE_SECRET_KEY ||
  "sk_test_51UeTsc7xywTho9ZNB84PVm8qcXMGAB7hW6gilUztxvq67I8DouBYZpdQzw1kiNLmzpAO2kV165tJ5SgltD5Ccee700naNnNf4y";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, total, items } = body as {
      orderId?: string;
      total?: number;
      items?: Array<{ name: string; price: number; quantity: number; size?: string }>;
    };

    if (!stripeSecretKey || stripeSecretKey.includes("placeholder")) {
      return NextResponse.json(
        {
          success: false,
          message: "Stripe secret key is not configured.",
        },
        { status: 400 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    // Calculate line items for Stripe Checkout
    const origin =
      request.headers.get("origin") ||
      request.headers.get("referer") ||
      "http://localhost:3000";

    const formattedLineItems =
      Array.isArray(items) && items.length > 0
        ? items.map((item) => ({
            price_data: {
              currency: "usd",
              product_data: {
                name: `${item.name}${item.size ? ` (${item.size})` : ""}`,
              },
              // In Stripe, unit_amount is in cents (multiply ৳ or $ by 100)
              unit_amount: Math.round(Number(item.price || 1) * 100),
            },
            quantity: Math.max(1, Number(item.quantity || 1)),
          }))
        : [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `PizzaHub Order #${orderId ? orderId.slice(-6).toUpperCase() : "FOOD"}`,
                },
                unit_amount: Math.round(Number(total || 10) * 100),
              },
              quantity: 1,
            },
          ];

    const session = await stripe.checkout.sessions.create({
      line_items: formattedLineItems,
      mode: "payment",
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&orderId=${encodeURIComponent(orderId || "")}`,
      cancel_url: `${origin}/payment?orderId=${encodeURIComponent(orderId || "")}&cancelled=true`,
      metadata: {
        orderId: orderId || "unknown",
      },
    });

    return NextResponse.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Stripe Checkout Session creation failed:", error);
    const message = error instanceof Error ? error.message : "Payment session creation failed.";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
