import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });

  const whsec = process.env.STRIPE_WEBHOOK_SECRET;
  if (!whsec) return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl) return NextResponse.json({ error: "Missing SUPABASE_URL" }, { status: 500 });
  if (!supabaseKey) return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });

  const rawBody = await req.text();

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" as any });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, whsec);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature failed: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const pack = session.metadata?.pack ?? "";
    const credits = Number(session.metadata?.credits ?? "");

    if (!pack || !Number.isFinite(credits) || credits <= 0) {
      return NextResponse.json({ error: "Missing/invalid session metadata" }, { status: 400 });
    }

    const stripe_session_id = session.id;
    const customer_email = session.customer_details?.email ?? null;

    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

    const { error } = await supabase.from("purchases").upsert(
      {
        stripe_session_id,
        pack,
        credits,
        status: "paid",
        customer_email,
      },
      { onConflict: "stripe_session_id" }
    );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
