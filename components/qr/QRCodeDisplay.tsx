"use client";
import { useState, useEffect } from "react";
import { QRPayload } from "@/lib/qr/qrTypes";
import { generateQRCodeDataURL } from "@/lib/qr/qrGenerator";

interface QRCodeDisplayProps {
  payload: QRPayload;
  size?: number;
  className?: string;
}

export function QRCodeDisplay({ payload, size = 260, className = "" }: QRCodeDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    generateQRCodeDataURL(payload, size)
      .then((url) => {
        if (active) {
          setDataUrl(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("QR Render Error:", err);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [payload, size]);

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        className="relative bg-white rounded-2xl p-3 border-2 border-[#1E2A4A]/10 shadow-lg flex items-center justify-center overflow-hidden"
        style={{ width: size + 24, height: size + 24 }}
      >
        {loading || !dataUrl ? (
          <div className="flex flex-col items-center justify-center gap-2 w-full h-full">
            <div className="w-8 h-8 rounded-full border-3 border-[#E8A33D] border-t-transparent animate-spin" />
            <p className="text-[11px] text-[#33363D]/60 font-mono">Generating dynamic QR…</p>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt="Dynamic Attendance QR Code"
            className="w-full h-full object-contain select-none"
            draggable={false}
          />
        )}
      </div>

      <div className="flex items-center gap-2 text-xs font-mono text-[#33363D]/60">
        <span className="w-2 h-2 rounded-full bg-[#4C7A5E] animate-ping" />
        <span>Token #{payload.tokenIndex} · Active</span>
      </div>
    </div>
  );
}
