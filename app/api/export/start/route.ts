// app/api/export/start/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const COOKIE_NAME = "soundscape_device_id";
const newDeviceId = () => crypto.randomUUID();

export async function POST(req: Request) {
  const jar = await cookies();
  let deviceId = jar.get(COOKIE_NAME)?.value;
  const hadCookie = !!deviceId;
  if (!deviceId) deviceId = newDeviceId();

  const body = await req.json().catch(() => ({} as any));
  const durationMin = Number(body.durationMin);
  const seed = typeof body.seed === "string" ? body.seed : null;

  const idempotencyKey =
    typeof body.idempotencyKey === "string" && body.idempotencyKey.trim().length > 0
      ? body.idempotencyKey.trim()
      : null;

  if (!idempotencyKey) {
    return NextResponse.json({ error: "Missing idempotencyKey" }, { status: 400 });
  }

  // lock allowed durations for v1
  if (![5, 15, 30, 60].includes(durationMin)) {
    return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
  }

  // Atomic reserve (race-proof) + idempotent via (device_id, idempotency_key) unique index
  const { data, error } = await supabase.rpc("reserve_export_job", {
    p_device_id: deviceId,
    p_duration_min: durationMin,
    p_seed: seed,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    const msg = error.message ?? "Unknown error";

    if (msg.includes("INSUFFICIENT_CREDITS")) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
    }
    if (msg.includes("INVALID_DURATION")) {
      return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
    }

    return NextResponse.json({ error: msg }, { status: 500 });
  }

const row = Array.isArray(data) ? data[0] : (data as any);

if (!row || !row.job_id) {
  console.error("reserve_export_job returned no row:", { data });
  return NextResponse.json(
    { error: "reserve_export_job returned no row", data },
    { status: 500 }
  );
}

const res = NextResponse.json({
  jobId: row.job_id,
  creditsCost: row.credits_cost,
});


  // ensure cookie exists (and keep it refreshed)
  // NOTE: secure must be false on localhost http
  res.cookies.set({
    name: COOKIE_NAME,
    value: deviceId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return res;
}
