import { NextResponse } from "next/server";

export async function GET() {
  const enabled = process.env.NEXT_PUBLIC_WEBAUTHN_ENABLED === "1";
  return NextResponse.json({
    supported: false,
    enabled: false,
    message: enabled
      ? "Passkey provider is not configured yet; use your normal account sign-in."
      : "Passkeys are not enabled for this deployment; use your normal account sign-in.",
  });
}
