"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#0a0b0d", color: "#eceef2", fontFamily: "system-ui", padding: 32 }}>
        <h1>Something went wrong.</h1>
        <button onClick={reset} style={{ marginTop: 16 }}>Try again</button>
      </body>
    </html>
  );
}
