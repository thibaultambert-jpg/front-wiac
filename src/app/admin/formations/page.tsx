import Link from "next/link";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Fiches formation" };

export default async function Fiches() {
  const db = supabaseAdmin();
  const [{ data: fiches }, { data: liens }, { data: modules }] = await Promise.all([
    db.from("formations").select("id, slug, titre, categorie, publiee, updated_at").order("ordre").order("titre"),
    db.from("formation_modules").select("id_module, formation_id"),
    db.from("modules_detectes").select("id_module, intitule"),
  ]);
  const noms = new Map((modules ?? []).map((m) => [String(m.id_module), String(m.intitule)]));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold">Fiches formation</h1>
        <Link href="/admin/formations/nouvelle" className="btn btn-primary">Nouvelle fiche</Link>
      </div>
      {(fiches ?? []).length === 0 ? (
        <p className="card p-8 text-center text-muted">
          Aucune fiche. Créez-en une depuis les <Link href="/admin/detectees" className="text-accent hover:underline">formations détectées</Link>.
        </p>
      ) : (
        <ul className="card divide-y divide-line">
          {(fiches ?? []).map((f) => {
            const mods = (liens ?? []).filter((l) => l.formation_id === f.id).map((l) => noms.get(String(l.id_module)) ?? `Module ${l.id_module}`);
            return (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <Link href={`/admin/formations/${f.id}`} className="font-medium hover:text-accent">{f.titre}</Link>
                  <p className="text-xs text-muted">
                    {f.categorie && `${f.categorie} · `}
                    {mods.length ? `Modules : ${mods.join(", ")}` : "Aucun module Dendreo lié"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {f.publiee ? <span className="badge bg-ok-soft text-ok">Publiée</span> : <span className="badge bg-surface-2 text-muted">Brouillon</span>}
                  {f.publiee && <Link href={`/formations/${f.slug}`} className="text-sm text-muted hover:text-ink">Voir ↗</Link>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
