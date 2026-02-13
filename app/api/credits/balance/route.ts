import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service key on server only
);

const COOKIE_NAME = "soundscape_device_id";

function newDeviceId() {
  // simple + unique enough
  return crypto.randomUUID();
}

export async function POST() {
  const jar = await cookies();

  let deviceId = jar.get(COOKIE_NAME)?.value;

  // If missing, mint one and set cookie
  if (!deviceId) {
    deviceId = newDeviceId();
  }

  // Fetch credits for this deviceId (adjust table/column names)
  // Example assumes a `credits_balance` view/table keyed by device_id
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

  // Always set cookie (keeps it consistent + refreshes expiry)
  res.cookies.set({
    name: COOKIE_NAME,
    value: deviceId,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return res;
}
