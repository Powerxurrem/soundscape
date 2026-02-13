import crypto from "crypto";

function b64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export function sha256Hex(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export function signEntitlementToken(payload: object) {
  const secret = process.env.CREDITS_TOKEN_SECRET!;
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.createHmac("sha256", secret).update(body).digest());
  return `${body}.${sig}`;
}

export function verifyEntitlementToken<T = any>(token: string): T | null {
  const secret = process.env.CREDITS_TOKEN_SECRET!;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expected = b64url(crypto.createHmac("sha256", secret).update(body).digest());

  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }

  try {
    const json = Buffer.from(body.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}
