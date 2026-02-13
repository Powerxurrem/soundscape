import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sha256Hex, signEntitlementToken } from "@/lib/cryptoTokens";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { session_id, device_id } = await req.json();
    if (!session_id || !device_id) {
      return NextResponse.json({ error: "Missing session_id or device_id" }, { status: 400 });
    }

    const db = supabaseAdmin();
    const device_id_hash = sha256Hex(device_id);

    // 1) purchase must exist + be paid
    const { data: purchase, error: pErr } = await db
      .from("purchases")
      .select("stripe_session_id, credits, status")
      .eq("stripe_session_id", session_id)
      .maybeSingle();

    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
    if (!purchase || purchase.status !== "paid") {
      return NextResponse.json({ error: "Purchase not found or not paid" }, { status: 400 });
    }

    // 2) If already claimed, return a token for THIS device entitlement
    //    (we'll also ensure the device has an entitlement)
    const { data: existingClaim, error: cErr } = await db
      .from("claims")
      .select("entitlement_id")
      .eq("stripe_session_id", session_id)
      .maybeSingle();

    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

    // 3) Find or create entitlement for this device (one per device)
    const { data: existingEnt, error: entFindErr } = await db
      .from("entitlements")
      .select("id, credits_remaining")
      .eq("device_id_hash", device_id_hash)
      .maybeSingle();

    if (entFindErr) return NextResponse.json({ error: entFindErr.message }, { status: 500 });

    let entitlement_id = existingEnt?.id;

    if (!entitlement_id) {
      // Create entitlement for this device
      const { data: ent, error: insErr } = await db
        .from("entitlements")
        .insert({ device_id_hash, credits_remaining: 0 })
        .select("id, credits_remaining")
        .single();

      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

      entitlement_id = ent.id;
    }

    // If already claimed, don't add credits again
    if (existingClaim?.entitlement_id) {
      const token = signEntitlementToken({ entitlement_id, device_id_hash });
      return NextResponse.json({ token });
    }

    // 4) Add credits to device entitlement
    // Read current credits to avoid relying on client state
    const { data: entNow, error: entNowErr } = await db
      .from("entitlements")
      .select("credits_remaining")
      .eq("id", entitlement_id)
      .single();

    if (entNowErr) return NextResponse.json({ error: entNowErr.message }, { status: 500 });

    const newCredits = (entNow.credits_remaining ?? 0) + purchase.credits;

    const { error: updErr } = await db
      .from("entitlements")
      .update({ credits_remaining: newCredits })
      .eq("id", entitlement_id);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    // 5) Record claim (prevents double-claim)
    const { error: claimErr } = await db.from("claims").insert({
      stripe_session_id: session_id,
      entitlement_id,
    });

    if (claimErr) return NextResponse.json({ error: claimErr.message }, { status: 500 });

    const token = signEntitlementToken({ entitlement_id, device_id_hash });
    return NextResponse.json({ token });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Claim error" }, { status: 500 });
  }
}
