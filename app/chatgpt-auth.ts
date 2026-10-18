import { env } from "cloudflare:workers";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

// This module keeps the original exported function names for compatibility with
// app/page.tsx and app/api/records/route.ts. It no longer trusts ChatGPT headers.
export type ChatGPTUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

type AccessClaims = {
  iss?: unknown;
  aud?: unknown;
  sub?: unknown;
  email?: unknown;
  exp?: unknown;
  nbf?: unknown;
  iat?: unknown;
};
type JwkSet = { keys?: Array<JsonWebKey & { kid?: string; use?: string; alg?: string; kty?: string }> };

function accessConfiguration() {
  const bindings = env as unknown as Record<string, unknown>;
  const rawDomain = String(bindings.CF_ACCESS_TEAM_DOMAIN ?? "").trim().toLowerCase();
  const audience = String(bindings.CF_ACCESS_AUD ?? "").trim();
  const admins = String(bindings.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  // Only the trusted Cloudflare Access *.cloudflareaccess.com team domain is allowed.
  const domain = rawDomain.replace(/^https:\/\//, "").replace(/\/$/, "");
  if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain) || !audience || admins.length === 0) {
    return null;
  }
  return { domain, audience, admins };
}

function decodeBase64Url(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function decodeJson(input: string): unknown {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(input)));
}

async function verifyAccessJwt(jwt: string): Promise<ChatGPTUser | null> {
  const config = accessConfiguration();
  if (!config || jwt.length > 16000) return null;
  const parts = jwt.split(".");
  if (parts.length !== 3) return null;
  try {
    const header = decodeJson(parts[0]) as { alg?: unknown; kid?: unknown; typ?: unknown };
    const claims = decodeJson(parts[1]) as AccessClaims;
    if (header.alg !== "RS256" || typeof header.kid !== "string" || !header.kid) return null;
    if (claims.iss !== `https://${config.domain}`) return null;
    const audiences = typeof claims.aud === "string" ? [claims.aud] : claims.aud;
    if (!Array.isArray(audiences) || !audiences.includes(config.audience)) return null;
    const now = Math.floor(Date.now() / 1000);
    if (typeof claims.exp !== "number" || claims.exp <= now) return null;
    if (typeof claims.nbf === "number" && claims.nbf > now + 30) return null;
    if (typeof claims.iat === "number" && claims.iat > now + 30) return null;
    if (typeof claims.sub !== "string" || claims.sub.length === 0) return null;
    if (typeof claims.email !== "string") return null;
    const email = claims.email.trim().toLowerCase();
    if (!config.admins.includes(email)) return null;

    const response = await fetch(`https://${config.domain}/cdn-cgi/access/certs`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const jwks = (await response.json()) as JwkSet;
    const key = jwks.keys?.find((item) => item.kid === header.kid && item.kty === "RSA" && (!item.use || item.use === "sig"));
    if (!key) return null;
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      key,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const verified = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      publicKey,
      decodeBase64Url(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
    );
    if (!verified) return null;
    return { userId: claims.sub, displayName: email, email, fullName: null };
  } catch {
    return null;
  }
}

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const requestHeaders = await headers();
  const assertion = requestHeaders.get("cf-access-jwt-assertion");
  if (!assertion) return null;
  return verifyAccessJwt(assertion);
}

export async function requireChatGPTUser(_returnTo: string): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (!user) notFound(); // Fail closed; Cloudflare Access normally shows sign-in first.
  return user;
}

// Legacy links are retained for compatibility with any old UI imports.
export function chatGPTSignInPath(_returnTo: string): string {
  return "/";
}
export function chatGPTSignOutPath(_returnTo = "/"): string {
  return "/cdn-cgi/access/logout";
}
