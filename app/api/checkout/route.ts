import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
});

const PRICE_ID_BY_PACK: Record<string, string> = {
  trial: process.env.STRIPE_PRICE_TRIAL!,     // 1 credit €3
  starter: process.env.STRIPE_PRICE_STARTER!, // 5 credits €10
  creator: process.env.STRIPE_PRICE_CREATOR!, // 10 credits €18
  studio: process.env.STRIPE_PRICE_STUDIO!,   // 25 credits €35
};

const CREDITS_BY_PACK: Record<string, number> = {
  trial: 1,
  starter: 5,
  creator: 10,
  studio: 25,
};

for (const [k, v] of Object.entries(PRICE_ID_BY_PACK)) {
  if (!v) throw new Error(`Missing env var for price: ${k}`);
}

export async function POST(req: Request) {
  try {
    const { pack } = await req.json();

    const price = PRICE_ID_BY_PACK[pack];
    const credits = CREDITS_BY_PACK[pack];

    if (!price || !credits) {
      return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
    }

    const origin =
  process.env.SITE_URL ??
  req.headers.get("origin") ??
  "http://localhost:3000";


    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price, quantity: 1 }],

      // Stripe collects email in Checkout and creates a Customer
      customer_creation: "always",
      billing_address_collection: "auto",
      phone_number_collection: { enabled: false },

      // ✅ makes payments easy to audit + power future webhook logic
      metadata: {
        product: "soundscape",
        pack,
        credits: String(credits),
      },

      // ✅ visible on the Session for quick lookup
      client_reference_id: `soundscape_${pack}_${Date.now()}`,

      success_url: `${origin}/pricing?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=1`,
      automatic_tax: { enabled: true },

      // Optional: only enable if you truly want invoices
      // invoice_creation: { enabled: true },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Checkout error" },
      { status: 500 }
    );
  }
}
