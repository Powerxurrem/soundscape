// app/api/export/complete/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const COOKIE_NAME = "soundscape_device_id";

export async function POST(req: Request) {
  const deviceId = (await cookies()).get(COOKIE_NAME)?.value;
  if (!deviceId) {
    return NextResponse.json({ error: "Missing device id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({} as any));
  const jobId = String(body.jobId ?? "").trim();
  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }

  // Try to transition reserved -> completed
  const { data: updated, error: updErr } = await supabase
    .from("export_jobs")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("device_id", deviceId)
    .eq("status", "reserved")
    .select("id")
    .maybeSingle();

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  // If we updated, we’re done.
  if (updated?.id) {
    return NextResponse.json({ ok: true });
  }

  // Idempotency: if it’s already completed, return ok.
  const { data: existing, error: readErr } = await supabase
    .from("export_jobs")
    .select("status")
    .eq("id", jobId)
    .eq("device_id", deviceId)
    .maybeSingle();

  if (readErr) {
    return NextResponse.json({ error: readErr.message }, { status: 500 });
  }

  if (existing?.status === "completed") {
    return NextResponse.json({ ok: true });
  }

  // If it was canceled or missing, treat as a client/state error
  return NextResponse.json(
    { error: "Export job not in reservable state", status: existing?.status ?? null },
    { status: 409 }
  );
}
