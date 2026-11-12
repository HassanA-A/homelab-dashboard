"use client";

import { useEffect, useRef, useState } from "react";

type Detector = { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
declare global {
  interface Window {
    BarcodeDetector?: new (opts: { formats: string[] }) => Detector;
  }
}

/**
 * Camera barcode scanner. Uses the native BarcodeDetector (Chrome/Android) and falls back
 * to ZXing (needed for iOS Safari). Requires HTTPS (or localhost) for camera access.
 */
export function BarcodeScanner({ onDetected }: { onDetected: (code: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const cb = useRef(onDetected);
  cb.current = onDetected;

  useEffect(() => {
    let stopped = false;
    let stream: MediaStream | null = null;
    let zxingControls: { stop: () => void } | null = null;
    let raf = 0;

    const finish = (code: string) => {
      if (stopped) return;
      stopped = true;
      navigator.vibrate?.(50);
      cb.current(code);
    };

    (async () => {
      try {
        if (window.BarcodeDetector) {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          if (!video.current) return;
          video.current.srcObject = stream;
          await video.current.play();
          const det = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
          const tick = async () => {
            if (stopped || !video.current) return;
            try {
              const codes = await det.detect(video.current);
              if (codes[0]?.rawValue) return finish(codes[0].rawValue);
            } catch {
              /* frame not ready */
            }
            raf = requestAnimationFrame(tick);
          };
          tick();
        } else {
          const { BrowserMultiFormatReader } = await import("@zxing/browser");
          const reader = new BrowserMultiFormatReader();
          zxingControls = await reader.decodeFromConstraints({ video: { facingMode: "environment" } }, video.current!, (result) => {
            if (result) finish(result.getText());
          });
        }
      } catch (e) {
        setError(e instanceof Error && e.name === "NotAllowedError" ? "Camera permission denied." : "Camera unavailable on this device.");
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      zxingControls?.stop();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black">
        <video ref={video} className="h-full w-full object-cover" playsInline muted />
        <div className="pointer-events-none absolute inset-x-10 top-1/2 h-24 -translate-y-1/2 rounded-xl border-2 border-accent/70" />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (/^\d{6,14}$/.test(manual)) onDetected(manual);
        }}
      >
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          placeholder="Or type the barcode number"
          className="h-11 flex-1 rounded-xl bg-surface-2 px-3 text-base ring-1 ring-line outline-none focus:ring-accent/70 sm:text-sm"
        />
        <button className="rounded-xl bg-surface-3 px-4 text-sm">Look up</button>
      </form>
    </div>
  );
}
