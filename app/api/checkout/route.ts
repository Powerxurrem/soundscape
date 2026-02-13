import Stripe from "stripe";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(key, { apiVersion: "2024-06-20" as any });
}

function getPriceIdByPack() {
  const map: Record<string, string | undefined> = {
    trial: process.env.STRIPE_PRICE_TRIAL,
    starter: process.env.STRIPE_PRICE_STARTER,
    creator: process.env.STRIPE_PRICE_CREATOR,
    studio: process.env.STRIPE_PRICE_STUDIO,
  };

  for (const [k, v] of Object.entries(map)) {
    if (!v) throw new Error(`Missing env var: STRIPE_PRICE_${k.toUpperCase()}`);
  }
  return map as Record<string, string>;
}

const CREDITS_BY_PACK: Record<string, number> = {
  trial: 1,
  starter: 5,
  creator: 10,
  studio: 25,
};

export async function POST(req: Request) {
  try {
    const stripe = getStripe();
    const PRICE_ID_BY_PACK = getPriceIdByPack();

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

      customer_creation: "always",
      billing_address_collection: "auto",
      phone_number_collection: { enabled: false },

      metadata: {
        product: "soundscape",
        pack,
        credits: String(credits),
      },

      client_reference_id: `soundscape_${pack}_${Date.now()}`,

      success_url: `${origin}/pricing?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=1`,
      automatic_tax: { enabled: true },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Checkout error" },
      { status: 500 }
    );
  }
}
