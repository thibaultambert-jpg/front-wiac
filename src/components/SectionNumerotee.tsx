/** Section « 01 Objectif » : numéro et titre à gauche, contenu à droite (fiche du site public). */
export function SectionNumerotee({ numero, titre, sousTitre, id, children }: { numero: number; titre: string; sousTitre?: string; id?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="grid scroll-mt-6 gap-4 border-b border-line py-10 last:border-b-0 md:grid-cols-[200px_1fr]">
      <div>
        <p className="text-xs font-bold text-turquoise-ink/70">{String(numero).padStart(2, "0")}</p>
        <h2 className="text-lg font-bold">{titre}</h2>
        {sousTitre && <p className="text-xs text-muted">{sousTitre}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export function Encadre({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-violet">{titre}</p>
      <div className="mt-2 text-sm text-ink/80">{children}</div>
    </div>
  );
}
