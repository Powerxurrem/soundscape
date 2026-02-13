import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
});

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
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

    const { error } = await supabaseAdmin.from("purchases").upsert(
      {
        stripe_session_id,
        pack,
        credits,
        status: "paid",
        customer_email,
      },
      { onConflict: "stripe_session_id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
