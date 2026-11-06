import Link from "next/link";
import type { Metadata } from "next";
import { BadgePlaces } from "@/components/Places";
import { comptesAttente } from "@/lib/attente";
import { formatPeriode } from "@/lib/dendreo/dates";
import { sessionsAVenir, sessionsParIds } from "@/lib/dendreo/sessions";

export const metadata: Metadata = { title: "Listes d'attente" };

export default async function ListesAttente() {
  const comptes = await comptesAttente();
  const aVenir = await sessionsAVenir();
  const connues = new Set(aVenir.map((s) => s.id));
  const autres = await sessionsParIds([...comptes.keys()].filter((id) => !connues.has(id)));
  const sessions = [...aVenir, ...autres].filter((s) => comptes.has(s.id) || s.places.complet).sort((a, b) => (comptes.get(b.id) ?? 0) - (comptes.get(a.id) ?? 0) || a.debut.localeCompare(b.debut));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Listes d&apos;attente</h1>
        <p className="mt-1 text-sm text-muted">Sessions complètes ou avec des personnes en attente.</p>
      </div>
      {sessions.length === 0 ? (
        <p className="card p-8 text-center text-muted">Aucune session complète ni liste d&apos;attente.</p>
      ) : (
        <ul className="card divide-y divide-line">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link href={`/admin/attente/${s.id}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-surface-2">
                <div>
                  <p className="font-medium">{s.intitule}</p>
                  <p className="text-sm text-muted">{formatPeriode(s.debut, s.fin)} · {s.places.inscrits}/{s.places.max || "∞"} inscrits</p>
                </div>
                <div className="flex items-center gap-3">
                  <BadgePlaces places={s.places} />
                  <span className={`badge ${comptes.get(s.id) ? "bg-warn-soft text-warn" : "bg-surface-2 text-muted"}`}>
                    {comptes.get(s.id) ?? 0} en attente
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
