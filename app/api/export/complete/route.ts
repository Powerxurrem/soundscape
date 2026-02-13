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
  if (!deviceId) return NextResponse.json({ error: "Missing device id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const jobId = String(body.jobId ?? "");

  if (!jobId) return NextResponse.json({ error: "Missing jobId" }, { status: 400 });

  const { error } = await supabase
    .from("export_jobs")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", jobId)
    .eq("device_id", deviceId)
    .eq("status", "reserved");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
