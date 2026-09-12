export default function AssessmentLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-40 rounded-lg bg-surface-2" />
      <div className="h-9 w-48 rounded-lg bg-surface-2" />
      <div className="space-y-3">
        <div className="h-4 w-24 rounded bg-surface-2" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-surface-2" />
          ))}
        </div>
      </div>
    </div>
  );
}
