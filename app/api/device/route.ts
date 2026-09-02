import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body.deviceId !== "string" || body.deviceId.length < 8 || body.deviceId.length > 200) {
    return NextResponse.json({ error: "A valid device id is required." }, { status: 400 });
  }
  const response = NextResponse.json({ success: true });
  response.cookies.set("zcoer_device_id", body.deviceId, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", maxAge: 60 * 60 * 24 * 365, path: "/",
  });
  return response;
}
