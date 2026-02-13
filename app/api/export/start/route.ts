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

function costForDurationMin(durationMin: number) {
  // same logic as UI
  return Math.max(1, Math.round(durationMin / 5));
}

export async function POST(req: Request) {
  const jar = await cookies();
  let deviceId = jar.get(COOKIE_NAME)?.value;
  if (!deviceId) deviceId = newDeviceId();

  const body = await req.json().catch(() => ({}));
  const durationMin = Number(body.durationMin);
  const seed = typeof body.seed === "string" ? body.seed : null;

  // lock allowed durations for v1
  if (![5, 15, 30].includes(durationMin)) {
    return NextResponse.json({ error: "Invalid duration" }, { status: 400 });
  }

  const creditsCost = costForDurationMin(durationMin);

  // read current balance
  const { data: bal, error: balErr } = await supabase
    .from("credits_balance")
    .select("credits")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (balErr) return NextResponse.json({ error: balErr.message }, { status: 500 });

  const credits = Number(bal?.credits ?? 0);
  if (credits < creditsCost) {
    return NextResponse.json(
      { error: "Insufficient credits", credits, creditsCost },
      { status: 402 }
    );
  }

  // reserve credits
  const { data: job, error: insErr } = await supabase
    .from("export_jobs")
    .insert({
      device_id: deviceId,
      credits: creditsCost,
      duration_min: durationMin,
      seed,
      status: "reserved",
    })
    .select("id")
    .single();

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  const res = NextResponse.json({
    jobId: job.id,
    creditsCost,
  });

  // ensure cookie exists
  res.cookies.set({
    name: COOKIE_NAME,
    value: deviceId,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    // optional if you ever bounce between www/non-www:
    // domain: ".soundscape.run",
  });

  return res;
}
