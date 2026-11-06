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
    <dl className="flex flex-wrap gap-y-3">
      {visibles.map(([k, v]) => (
        <div key={k} className="border-r border-white/30 pr-5 mr-5 last:mr-0 last:border-r-0">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-white/70">{k}</dt>
          <dd className="text-sm font-bold">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
