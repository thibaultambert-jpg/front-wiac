import Link from "next/link";
import { libelleMode } from "./Mode";
import { BadgePlaces, JaugePlaces } from "./Places";
import { formatHeure, formatPeriode } from "@/lib/dendreo/dates";
import type { Session } from "@/lib/dendreo/types";

export function ListeSessions({ sessions, inscrit, attentes }: { sessions: Session[]; inscrit: Set<string>; attentes: Map<string, number> }) {
  if (sessions.length === 0) {
    return <p className="rounded-2xl border border-line bg-surface-2 p-6 text-sm text-muted">Aucune session programmée pour le moment. Revenez bientôt !</p>;
  }
  return (
    <ul className="space-y-3">
      {sessions.map((s) => (
        <li key={s.id}>
          <Link href={`/sessions/${s.id}`} className="card flex flex-wrap items-center justify-between gap-3 p-4 transition hover:border-violet">
            <div className="space-y-1">
              <p className="font-semibold first-letter:uppercase">{formatPeriode(s.debut, s.fin)}</p>
              <p className="text-sm text-muted">
                {s.creneaux.length > 0 && `${s.creneaux.length} créneau${s.creneaux.length > 1 ? "x" : ""} · ${formatHeure(s.creneaux[0].debut)}–${formatHeure(s.creneaux[0].fin)}`}
                {s.modes.length > 0 && ` · ${s.modes.map(libelleMode).join(", ")}`}
                {s.lieux[0] && ` · ${s.lieux[0].intitule}${s.lieux[0].ville ? `, ${s.lieux[0].ville}` : ""}`}
              </p>
              <JaugePlaces places={s.places} />
            </div>
            <div className="flex items-center gap-3">
              {inscrit.has(s.id) ? (
                <span className="badge bg-ok-soft text-ok">Inscrit</span>
              ) : attentes.has(s.id) ? (
                <span className="badge bg-warn-soft text-warn">Liste d&apos;attente · n°{attentes.get(s.id)}</span>
              ) : (
                <BadgePlaces places={s.places} />
              )}
              <span className="text-sm font-semibold text-violet">Voir →</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
