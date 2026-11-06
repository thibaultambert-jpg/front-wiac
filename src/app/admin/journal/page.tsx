import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Journal" };

const LIBELLES: Record<string, string> = {
  inscription: "Inscription",
  desinscription: "Désinscription",
  attente_ajout: "Ajout en liste d'attente",
  attente_retrait: "Retrait de la liste d'attente",
  attente_promotion: "Promotion depuis l'attente",
  attente_reordonnee: "Liste d'attente réordonnée",
  fiche_enregistree: "Fiche enregistrée",
  fiche_supprimee: "Fiche supprimée",
  module_lie: "Module lié",
  module_delie: "Module délié",
  module_ignore: "Module ignoré / réactivé",
  synchronisation: "Synchronisation Dendreo",
};

const DATE = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" });

export default async function Journal({ searchParams }: { searchParams: Promise<{ action?: string }> }) {
  const { action } = await searchParams;
  let req = supabaseAdmin().from("journal").select("*").order("created_at", { ascending: false }).limit(200);
  if (action && LIBELLES[action]) req = req.eq("action", action);
  const { data } = await req;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold">Journal</h1>
        <form method="get" className="flex gap-2">
          <select name="action" defaultValue={action ?? ""} className="input py-1.5" aria-label="Type d'action">
            <option value="">Toutes les actions</option>
            {Object.entries(LIBELLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" type="submit">Filtrer</button>
        </form>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
            <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Par</th><th className="px-4 py-3">Concerne</th><th className="px-4 py-3">Session</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {(data ?? []).map((j) => (
              <tr key={j.id}>
                <td className="whitespace-nowrap px-4 py-2.5 text-muted">{DATE.format(new Date(j.created_at))}</td>
                <td className="px-4 py-2.5">{LIBELLES[j.action] ?? j.action}</td>
                <td className="px-4 py-2.5 text-muted">{j.acteur_email}</td>
                <td className="px-4 py-2.5 text-muted">{j.cible_email ?? ""}</td>
                <td className="px-4 py-2.5 text-muted">{j.id_action_de_formation ?? ""}</td>
              </tr>
            ))}
            {(data ?? []).length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-muted">Aucune entrée.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
