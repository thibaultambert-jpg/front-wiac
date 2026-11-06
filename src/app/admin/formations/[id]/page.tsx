import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FormAction } from "@/components/FormAction";
import { FormulaireFiche } from "@/components/FormulaireFiche";
import type { Fiche } from "@/lib/catalogue";
import { supabaseAdmin } from "@/lib/supabase/server";
import { markdownVersHtml } from "@/lib/markdown";
import { estHtml, modulesDeFiche } from "@/lib/programme";
import { enregistrerFiche, lierModule, supprimerFiche } from "../../actions";

export const metadata: Metadata = { title: "Fiche formation" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditionFiche({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const nouvelle = id === "nouvelle";
  if (!nouvelle && !UUID.test(id)) notFound();
  const db = supabaseAdmin();
  let fiche: Fiche | null = null;
  let modulesDendreo: { id_module: string; intitule: string }[] = [];
  if (!nouvelle) {
    const { data } = await db.from("formations").select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    fiche = data as Fiche;
    const { data: liens } = await db.from("formation_modules").select("id_module, module:modules_detectes(intitule)").eq("formation_id", id);
    modulesDendreo = (liens ?? []).map((l) => {
      const m = Array.isArray(l.module) ? l.module[0] : l.module;
      return { id_module: String(l.id_module), intitule: String((m as { intitule?: string } | null)?.intitule ?? `Module ${l.id_module}`) };
    });
  }

  // Objectif saisi avant l'éditeur riche (Markdown) → converti en HTML pour l'éditeur.
  const objectifHtml = estHtml(fiche?.objectifs) ? fiche!.objectifs : markdownVersHtml(fiche?.objectifs);
  const modules = modulesDeFiche(fiche?.programme_modules);

  return (
    <div className="space-y-6">
      <Link href="/admin/formations" className="text-sm text-muted hover:text-ink">← Fiches</Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold">{fiche?.titre ?? "Nouvelle fiche"}</h1>
        {fiche?.publiee && <Link href={`/formations/${fiche.slug}`} className="btn btn-secondary btn-sm">Voir sur le portail ↗</Link>}
      </div>

      {fiche && (
        <section className="card p-5">
          <h2 className="font-semibold">Modules Dendreo liés</h2>
          <p className="mt-1 text-sm text-muted">Les sessions inter de ces modules s&apos;affichent sous cette fiche.</p>
          {modulesDendreo.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              Aucun. Liez des modules depuis les <Link href="/admin/detectees" className="text-accent hover:underline">formations détectées</Link>.
            </p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-2">
              {modulesDendreo.map((m) => (
                <li key={m.id_module} className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm">
                  {m.intitule}
                  <FormAction action={lierModule} champs={{ module: m.id_module, formation: "" }} libelle="Délier" />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <FormulaireFiche fiche={fiche} objectifHtml={objectifHtml} modules={modules} action={enregistrerFiche} />

      {fiche && (
        <section className="card border-danger/30 p-5">
          <h2 className="font-semibold text-danger">Supprimer la fiche</h2>
          <p className="mt-1 text-sm text-muted">Les modules liés réapparaîtront avec leur description Dendreo.</p>
          <div className="mt-3">
            <FormAction action={supprimerFiche} champs={{ id: fiche.id }} libelle="Supprimer" variante="danger" confirmation="Supprimer définitivement cette fiche ?" />
          </div>
        </section>
      )}
    </div>
  );
}
