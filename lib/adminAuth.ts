import { createHmac, timingSafeEqual } from "node:crypto";

export type AdminRole = "super_admin" | "admin";

export interface AdminSession {
  username: string;
  role: AdminRole;
  expiresAt: number;
}

const SESSION_TTL_SECONDS = 60 * 60 * 24;

function getSessionSecret(): string | null {
  return (
    process.env.ADMIN_SESSION_SECRET ??
    process.env.ADMIN_PASSWORD ??
    process.env.SUPER_ADMIN_PASSWORD ??
    null
  );
}

export function createAdminSessionToken(username: string, role: AdminRole): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;

  const payload: AdminSession = {
    username,
    role,
    expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export function verifyAdminSessionToken(token?: string): AdminSession | null {
  const secret = getSessionSecret();
  if (!secret || !token) return null;

  const [encodedPayload, encodedSignature, extra] = token.split(".");
  if (!encodedPayload || !encodedSignature || extra !== undefined) return null;

  const expectedSignature = createHmac("sha256", secret).update(encodedPayload).digest();
  let providedSignature: Buffer;
  try {
    providedSignature = Buffer.from(encodedSignature, "base64url");
  } catch {
    return null;
  }
  if (
    providedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(providedSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<AdminSession>;
    if (
      typeof payload.username !== "string" ||
      (payload.role !== "admin" && payload.role !== "super_admin") ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return payload as AdminSession;
  } catch {
    return null;
  }
}
