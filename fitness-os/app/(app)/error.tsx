"use client";

import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md p-8 text-center">
      <h2 className="text-lg font-semibold">Couldn&apos;t load this page</h2>
      <p className="mt-2 text-sm text-muted">{error.message || "An unexpected error occurred."} Your data hasn&apos;t been lost.</p>
      <Button className="mt-6" onClick={reset}>Try again</Button>
    </div>
  );
}
