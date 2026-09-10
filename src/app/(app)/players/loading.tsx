export default function PlayersLoading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-8 w-40 rounded-lg bg-surface-2" />
      <div className="flex gap-2">
        <div className="h-10 w-64 rounded-lg bg-surface-2" />
        <div className="h-9 w-40 rounded-lg bg-surface-2" />
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl bg-surface-2">
            <div className="aspect-[5/4] bg-surface" />
            <div className="space-y-2 p-3.5">
              <div className="h-4 w-3/4 rounded bg-surface" />
              <div className="h-3 w-1/2 rounded bg-surface" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
