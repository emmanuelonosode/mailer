export const AUTH_COOKIE_NAME = "hasker_admin_session";

const SESSION_NAMESPACE = "hasker-admin-session-v1";

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD?.trim() ?? "";
}

export function isAuthConfigured(): boolean {
  return getAdminPassword().length > 0;
}

export async function createSessionToken(password: string): Promise<string> {
  const payload = new TextEncoder().encode(`${SESSION_NAMESPACE}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", payload);
  return toHex(digest);
}

export async function getExpectedSessionToken(): Promise<string | null> {
  const password = getAdminPassword();
  if (!password) return null;
  return createSessionToken(password);
}

export async function isValidPasswordAttempt(password: string): Promise<boolean> {
  const expected = await getExpectedSessionToken();
  if (!expected) return false;
  const actual = await createSessionToken(password);
  return actual === expected;
}
