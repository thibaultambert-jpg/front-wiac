import Link from "next/link";
import type { Metadata } from "next";
import { comptesAttente } from "@/lib/attente";
import { catalogue } from "@/lib/catalogue";
import { formatPeriode } from "@/lib/dendreo/dates";
import { supabaseAdmin } from "@/lib/supabase/server";
import { indicateurs, lignesSessions, parMois } from "@/lib/tableau-de-bord";

export const metadata: Metadata = { title: "Tableau de bord" };

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)} %`);
const MOIS = new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" });

function Kpi({ label, valeur, note }: { label: string; valeur: string | number; note?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{valeur}</p>
      {note && <p className="text-xs text-muted">{note}</p>}
    </div>
  );
}

export default async function TableauDeBord() {
  const depuis = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 5, 1)).toISOString();
  const [formations, attente, { data: journal }] = await Promise.all([
    catalogue(),
    comptesAttente(),
    supabaseAdmin().from("journal").select("created_at, action").in("action", ["inscription", "desinscription"]).gte("created_at", depuis),
  ]);
  const sessions = formations.flatMap((f) => f.sessions).sort((a, b) => a.debut.localeCompare(b.debut));
  const lignes = lignesSessions(sessions, attente);
  const k = indicateurs(lignes);
  const inscriptionsMois = parMois((journal ?? []).filter((j) => j.action === "inscription").map((j) => j.created_at), 6);
  const maxMois = Math.max(1, ...inscriptionsMois.map((m) => m.total));

  // Demande par formation : personnes en attente cumulées (signal pour ouvrir une session).
  const demande = formations
    .map((f) => ({ slug: f.slug, titre: f.titre, attente: f.sessions.reduce((t, s) => t + (attente.get(s.id) ?? 0), 0), complets: f.sessions.filter((s) => s.places.complet).length, sessions: f.sessions.length }))
    .filter((d) => d.attente > 0)
    .sort((a, b) => b.attente - a.attente)
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
        <a href="/admin/export" className="btn btn-secondary btn-sm">Exporter les sessions (CSV)</a>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Sessions inter à venir" valeur={k.sessions} note={`${k.completes} complète${k.completes > 1 ? "s" : ""}`} />
        <Kpi label="Remplissage moyen" valeur={pct(k.remplissageMoyen)} note={`${k.placesRestantes} place${k.placesRestantes > 1 ? "s" : ""} restante${k.placesRestantes > 1 ? "s" : ""}`} />
        <Kpi label="En liste d'attente" valeur={k.enAttente} />
        <Kpi label="Sous le minimum" valeur={k.sousMinimum} note="sessions à risque" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-semibold">Inscriptions via le portail</h2>
          <p className="text-xs text-muted">6 derniers mois</p>
          <ul className="mt-4 space-y-2">
            {inscriptionsMois.map((m) => (
              <li key={m.mois} className="flex items-center gap-3 text-sm">
                <span className="w-10 text-muted">{MOIS.format(new Date(`${m.mois}-01T00:00:00Z`))}</span>
                <div className="h-3 flex-1 overflow-hidden rounded bg-surface-2">
                  <div className="h-full rounded bg-accent" style={{ width: `${(m.total / maxMois) * 100}%` }} />
                </div>
                <span className="w-8 text-right tabular-nums">{m.total}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="font-semibold">Demande non satisfaite</h2>
          <p className="text-xs text-muted">Formations avec le plus de personnes en attente : candidates à une nouvelle session</p>
          {demande.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Aucune liste d&apos;attente pour le moment.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line text-sm">
              {demande.map((d) => (
                <li key={d.slug} className="flex items-center justify-between gap-3 py-2">
                  <Link href={`/formations/${d.slug}`} className="hover:text-accent">{d.titre}</Link>
                  <span className="text-muted tabular-nums">
                    <strong className="text-warn">{d.attente}</strong> en attente · {d.complets}/{d.sessions} complète{d.complets > 1 ? "s" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Sessions à venir</h2>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Remplissage</th>
                <th className="px-4 py-3 text-center">Attente</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {lignes.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 font-medium">{l.intitule}</td>
                  <td className="px-4 py-3 text-muted">{formatPeriode(l.debut, l.fin)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded bg-surface-2" aria-hidden>
                        <div className={`h-full ${l.remplissage !== null && l.remplissage >= 1 ? "bg-danger" : "bg-accent"}`} style={{ width: `${Math.min(100, (l.remplissage ?? 0) * 100)}%` }} />
                      </div>
                      <span className="tabular-nums">{l.inscrits}/{l.max || "∞"}</span>
                      {l.sousMinimum && <span className="badge bg-warn-soft text-warn">min. {l.min}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">{l.attente || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/attente/${l.id}`} className="text-accent hover:underline">Gérer</Link>
                  </td>
                </tr>
              ))}
              {lignes.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted">Aucune session inter à venir.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
