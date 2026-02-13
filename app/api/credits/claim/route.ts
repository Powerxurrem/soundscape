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

    // 1) ensure purchase exists + is paid
    const { data: purchase, error: pErr } = await db
      .from("purchases")
      .select("stripe_session_id, credits, status")
      .eq("stripe_session_id", session_id)
      .maybeSingle();

    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });
    if (!purchase || purchase.status !== "paid") {
      return NextResponse.json({ error: "Purchase not found or not paid" }, { status: 400 });
    }

    // 2) prevent double-claim
    const { data: existingClaim, error: cErr } = await db
      .from("claims")
      .select("entitlement_id")
      .eq("stripe_session_id", session_id)
      .maybeSingle();

    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

    const device_id_hash = sha256Hex(device_id);

    // If already claimed, just return token for the original entitlement
    if (existingClaim?.entitlement_id) {
      const token = signEntitlementToken({
        entitlement_id: existingClaim.entitlement_id,
        device_id_hash,
      });
      return NextResponse.json({ token });
    }

    // 3) create entitlement and claim (transaction-ish)
    const { data: ent, error: eErr } = await db
      .from("entitlements")
      .insert({ device_id_hash, credits_remaining: purchase.credits })
      .select("id")
      .single();

    if (eErr) return NextResponse.json({ error: eErr.message }, { status: 500 });

    const { error: insClaimErr } = await db.from("claims").insert({
      stripe_session_id: session_id,
      entitlement_id: ent.id,
    });

    if (insClaimErr) return NextResponse.json({ error: insClaimErr.message }, { status: 500 });

    const token = signEntitlementToken({
      entitlement_id: ent.id,
      device_id_hash,
    });

    return NextResponse.json({ token });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Claim error" }, { status: 500 });
  }
}
