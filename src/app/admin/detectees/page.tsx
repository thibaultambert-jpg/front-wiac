import Link from "next/link";
import type { Metadata } from "next";
import { FormAction } from "@/components/FormAction";
import { SelectLiaison } from "@/components/SelectLiaison";
import { sessionsAVenir } from "@/lib/dendreo/sessions";
import { supabaseAdmin } from "@/lib/supabase/server";
import { creerFicheDepuisModule, ignorerModule, lancerSynchronisation, lierModule } from "../actions";

export const metadata: Metadata = { title: "Formations détectées" };

type Module = { id_module: string; intitule: string; numero_complet: string; categorie: string; catalogue: boolean; ignore: boolean; vu_le: string };

const ONGLETS = [
  ["a_traiter", "À traiter"],
  ["liees", "Liées"],
  ["ignorees", "Ignorées"],
  ["toutes", "Toutes"],
] as const;

export default async function Detectees({ searchParams }: { searchParams: Promise<{ onglet?: string }> }) {
  const { onglet = "a_traiter" } = await searchParams;
  const db = supabaseAdmin();
  const [{ data: modules }, { data: liens }, { data: fiches }, sessions] = await Promise.all([
    db.from("modules_detectes").select("*").order("intitule"),
    db.from("formation_modules").select("id_module, formation_id"),
    db.from("formations").select("id, titre, publiee").order("titre"),
    sessionsAVenir().catch(() => []),
  ]);
  const lien = new Map((liens ?? []).map((l) => [String(l.id_module), String(l.formation_id)]));
  const nbSessions = new Map<string, number>();
  for (const s of sessions) for (const m of s.modules) nbSessions.set(m.id, (nbSessions.get(m.id) ?? 0) + 1);

  const tous = (modules ?? []) as Module[];
  const filtre = (m: Module) =>
    onglet === "liees" ? lien.has(m.id_module) : onglet === "ignorees" ? m.ignore : onglet === "toutes" ? true : !m.ignore && !lien.has(m.id_module);
  // Les modules avec des sessions inter à venir d'abord.
  const liste = tous.filter(filtre).sort((a, b) => (nbSessions.get(b.id_module) ?? 0) - (nbSessions.get(a.id_module) ?? 0) || a.intitule.localeCompare(b.intitule, "fr"));
  const aTraiterAvecSessions = tous.filter((m) => !m.ignore && !lien.has(m.id_module) && nbSessions.has(m.id_module)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Formations détectées dans Dendreo</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Reliez chaque module Dendreo à une fiche pour afficher votre contenu sur le portail. Un module non relié reste visible avec sa
            description Dendreo ; un module ignoré est masqué du portail.
          </p>
        </div>
        <FormAction action={async () => { "use server"; return lancerSynchronisation(); }} champs={{}} libelle="Synchroniser avec Dendreo" enCours="Synchronisation…" variante="primary" taille="md" />
      </div>

      {aTraiterAvecSessions > 0 && (
        <p className="rounded-lg bg-warn-soft px-4 py-3 text-sm text-warn">
          {aTraiterAvecSessions} module{aTraiterAvecSessions > 1 ? "s" : ""} avec des sessions inter à venir n&apos;{aTraiterAvecSessions > 1 ? "ont" : "a"} pas encore de fiche.
        </p>
      )}

      <nav className="flex gap-2 text-sm">
        {ONGLETS.map(([k, l]) => (
          <Link key={k} href={`/admin/detectees?onglet=${k}`} className={`rounded-md px-3 py-1.5 ${onglet === k ? "bg-accent-soft font-medium text-accent" : "text-muted hover:text-ink"}`}>
            {l}
          </Link>
        ))}
      </nav>

      {tous.length === 0 ? (
        <p className="card p-8 text-center text-muted">Aucun module : lancez une première synchronisation.</p>
      ) : liste.length === 0 ? (
        <p className="card p-8 text-center text-muted">Rien dans cet onglet.</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Module Dendreo</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3 text-center">Sessions inter à venir</th>
                <th className="px-4 py-3">Fiche</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {liste.map((m) => (
                <tr key={m.id_module} className={m.ignore ? "opacity-60" : ""}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{m.intitule}</p>
                    <p className="text-xs text-muted">
                      {m.numero_complet}
                      {!m.catalogue && " · hors catalogue"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted">{m.categorie}</td>
                  <td className="px-4 py-3 text-center">{nbSessions.get(m.id_module) ?? "—"}</td>
                  <td className="w-64 px-4 py-3">
                    <SelectLiaison action={lierModule} idModule={m.id_module} valeur={lien.get(m.id_module) ?? ""} fiches={(fiches ?? []).map((f) => ({ id: f.id, titre: `${f.titre}${f.publiee ? "" : " (brouillon)"}` }))} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {!lien.has(m.id_module) && <FormAction action={creerFicheDepuisModule} champs={{ module: m.id_module }} libelle="Créer une fiche" variante="primary" />}
                      <FormAction action={ignorerModule} champs={{ module: m.id_module, ignore: m.ignore ? "0" : "1" }} libelle={m.ignore ? "Réactiver" : "Ignorer"} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
