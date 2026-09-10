export default function AppLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded-lg bg-surface-2" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-surface-2" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-surface-2" />
    </div>
  );
}
