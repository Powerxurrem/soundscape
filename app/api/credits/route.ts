import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const COOKIE_NAME = "soundscape_device_id";

function newDeviceId() {
  return crypto.randomUUID();
}

// GET so the UI can fetch it safely
export async function GET() {
  const jar = await cookies(); // ✅ MUST await

  let deviceId = jar.get(COOKIE_NAME)?.value;
  if (!deviceId) deviceId = newDeviceId();

  const { data, error } = await supabase
    .from("credits_balance")
    .select("credits")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const res = NextResponse.json({
    deviceId,
    credits: data?.credits ?? 0,
  });

  res.cookies.set({
    name: COOKIE_NAME,
    value: deviceId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production", // ✅ don't force secure on localhost
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return res;
}
