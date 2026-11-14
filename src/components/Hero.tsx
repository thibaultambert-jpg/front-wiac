/** Bandeau violet de tête de page (suite du bandeau de navigation). */
export function Hero({ surtitre, titre, sousTitre, children }: { surtitre?: React.ReactNode; titre: React.ReactNode; sousTitre?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="bg-violet px-4 pb-12 pt-10 text-white sm:pt-14">
      <div className="mx-auto max-w-6xl">
        {surtitre && <div className="mb-3">{surtitre}</div>}
        <h1 className="max-w-4xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{titre}</h1>
        {sousTitre && <p className="mt-3 max-w-3xl text-white/80">{sousTitre}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}

/** Ligne de chiffres clés du bandeau (Durée | Niveau | …), séparés par un trait vertical. */
export function ChiffresHero({ items }: { items: [string, React.ReactNode][] }) {
  const visibles = items.filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (visibles.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:flex sm:flex-wrap">
      {visibles.map(([k, v]) => (
        <div key={k} className="rounded-xl bg-white/10 px-3 py-2 sm:mr-5 sm:rounded-none sm:border-r sm:border-white/30 sm:bg-transparent sm:px-0 sm:py-0 sm:pr-5 sm:last:mr-0 sm:last:border-r-0">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-white/70">{k}</dt>
          <dd className="text-sm font-bold">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
