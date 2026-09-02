/**
 * Capability-only WebAuthn hooks.
 *
 * No cryptography is implemented here. A passkey provider can be added later
 * with @simplewebauthn/server and @simplewebauthn/browser; until then callers
 * must keep password/Supabase auth as the supported fallback.
 */
export function isWebAuthnSupported(): boolean {
  return typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator?.credentials?.get === "function";
}

export async function getWebAuthnCapability(): Promise<{ supported: boolean; enabled: boolean; message: string }> {
  const supported = isWebAuthnSupported();
  try {
    const response = await fetch("/api/webauthn/status", { cache: "no-store" });
    const data = await response.json();
    return { supported, enabled: Boolean(data.enabled), message: data.message || "Use your normal account sign-in." };
  } catch {
    return { supported, enabled: false, message: "Passkeys are unavailable; use your normal account sign-in." };
  }
}
