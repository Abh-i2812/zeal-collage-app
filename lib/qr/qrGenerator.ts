// lib/qr/qrGenerator.ts
// ─────────────────────────────────────────────────────────────────────
// Real QR Code Generation using the `qrcode` library
// ─────────────────────────────────────────────────────────────────────
import QRCode from "qrcode";
import { QRPayload } from "./qrTypes";

/** Convert payload to standard JSON string */
export function stringifyQRPayload(payload: QRPayload): string {
  return JSON.stringify(payload);
}

/** Generate a scannable Base64 PNG Data URL */
export async function generateQRCodeDataURL(
  payload: QRPayload | string,
  size = 320
): Promise<string> {
  const text = typeof payload === "string" ? payload : stringifyQRPayload(payload);
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: size,
      margin: 2,
      color: {
        dark: "#1E2A4A", // ZCOER Ink Navy
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    });
    return dataUrl;
  } catch (err) {
    console.error("Failed to generate QR code data URL:", err);
    throw err;
  }
}

/** Generate inline SVG representation if needed */
export async function generateQRCodeSVG(
  payload: QRPayload | string,
  size = 320
): Promise<string> {
  const text = typeof payload === "string" ? payload : stringifyQRPayload(payload);
  try {
    const svg = await QRCode.toString(text, {
      type: "svg",
      width: size,
      margin: 2,
      color: {
        dark: "#1E2A4A",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    });
    return svg;
  } catch (err) {
    console.error("Failed to generate QR SVG:", err);
    throw err;
  }
}
