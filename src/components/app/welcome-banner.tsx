/**
 * Dashboard entry banner. Solid brand surface (sky gradient 500->800, white
 * text: 6.1:1 measured), not glass — glass is reserved for layers that float
 * over scrolling content.
 *
 * The figures are embedded here, as a divided strip, so the first thing seen
 * is the state of the academy and not a row of loose cards.
 */
export function WelcomeBanner({
  kicker,
  title,
  subtitle,
  stats,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  stats: { label: string; value: string | number }[];
}) {
  return (
    <section className="grain relative isolate overflow-hidden rounded-3xl px-6 py-7 text-banner-fg shadow-pop ring-1 ring-inset ring-white/10 sm:px-9 sm:py-8">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-br from-banner-from via-banner-via to-banner-to"
      />
      {/* Off-frame light source, top-right */}
      <div
        aria-hidden
        className="absolute -right-16 -top-32 -z-10 size-[26rem] rounded-full bg-white/18 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -left-24 -z-10 size-[22rem] rounded-full bg-banner-to/70 blur-3xl"
      />

      <p className="text-xs font-medium uppercase tracking-[0.2em] text-banner-fg-muted">
        {kicker}
      </p>

      <h1 className="mt-2.5 text-balance text-[1.7rem] font-semibold leading-tight tracking-tight sm:text-[2rem]">
        {title}{" "}
        <span aria-hidden className="drop-shadow-sm">
          👋
        </span>
      </h1>

      <p className="mt-2 max-w-xl text-pretty text-sm leading-relaxed text-banner-fg-muted">
        {subtitle}
      </p>

      {stats.length > 0 && (
        <dl className="-mx-6 mt-6 flex gap-0 overflow-x-auto px-6 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={
                i === 0
                  ? "shrink-0 pr-3 sm:pr-8"
                  : "shrink-0 border-l border-white/15 px-3 sm:px-8"
              }
            >
              <dd className="text-lg font-semibold tabular-nums sm:text-xl">
                {s.value}
              </dd>
              <dt className="mt-0.5 whitespace-nowrap text-[0.7rem] text-banner-fg-muted sm:text-xs">
                {s.label}
              </dt>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
