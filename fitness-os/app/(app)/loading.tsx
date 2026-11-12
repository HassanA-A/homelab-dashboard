export default function Loading() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="h-6 w-40 animate-pulse rounded bg-surface-2" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-surface" />
    </div>
  );
}
