import { NextResponse } from "next/server";
import { verifyEntitlementToken, sha256Hex } from "@/lib/cryptoTokens";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { token, device_id } = await req.json();
    if (!token || !device_id) {
      return NextResponse.json({ credits: 0 }, { status: 200 });
    }

    const payload = verifyEntitlementToken<{ entitlement_id: string; device_id_hash: string }>(token);
    if (!payload?.entitlement_id || !payload?.device_id_hash) {
      return NextResponse.json({ credits: 0 }, { status: 200 });
    }

    const device_id_hash = sha256Hex(device_id);
    if (device_id_hash !== payload.device_id_hash) {
      return NextResponse.json({ credits: 0 }, { status: 200 });
    }

    const db = supabaseAdmin();
    const { data, error } = await db
      .from("entitlements")
      .select("credits_remaining")
      .eq("id", payload.entitlement_id)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ credits: data?.credits_remaining ?? 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Balance error" }, { status: 500 });
  }
}
