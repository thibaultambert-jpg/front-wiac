import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ListeAttenteAdmin } from "@/components/ListeAttenteAdmin";
import { BadgePlaces, JaugePlaces } from "@/components/Places";
import { attenteSession } from "@/lib/attente";
import { formatPeriode } from "@/lib/dendreo/dates";
import { dendreo, sessionParId } from "@/lib/dendreo/sessions";
import { promouvoir, reordonnerAttente, retirerDeLAttente } from "../../actions";

export const metadata: Metadata = { title: "Liste d'attente" };

const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });

export default async function AttenteSession({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await sessionParId(id);
  if (!session) notFound();
  const [attente, laps] = await Promise.all([
    attenteSession(id),
    dendreo().list("laps.php", { id_action_de_formation: id, include: "participant" }).catch(() => []),
  ]);
  const inscrits = laps.map((l) => {
    const p = (l.participant ?? {}) as Record<string, unknown>;
    const nom = `${p.prenom ?? ""} ${p.nom ?? ""}`.trim();
    return { id: String(l.id_lap), nom: nom || (String(l.id_participant) === "0" ? "Participant non identifié" : `Participant ${l.id_participant}`), email: String(p.email ?? "") };
  });

  return (
    <div className="space-y-6">
      <Link href="/admin/attente" className="text-sm text-muted hover:text-ink">← Listes d&apos;attente</Link>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{session.intitule}</h1>
          <p className="mt-1 text-muted">{formatPeriode(session.debut, session.fin)} · {session.numero}</p>
          <div className="mt-2"><JaugePlaces places={session.places} /></div>
        </div>
        <div className="flex items-center gap-3">
          <BadgePlaces places={session.places} />
          <Link href={`/sessions/${id}`} className="btn btn-secondary btn-sm">Page de la session ↗</Link>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">En attente ({attente.length})</h2>
          <p className="text-sm text-muted">Glissez-déposez pour changer l&apos;ordre. « Inscrire » crée l&apos;inscription dans Dendreo et prévient la personne.</p>
          <ListeAttenteAdmin
            key={attente.map((l) => l.id).join()}
            idAdf={id}
            complet={session.places.complet}
            lignes={attente.map((l) => ({
              id: l.id,
              nom: `${l.profil?.prenom ?? ""} ${l.profil?.nom ?? ""}`.trim(),
              email: l.profil?.email ?? "",
              commentaire: l.commentaire,
              depuis: DATE.format(new Date(l.created_at)),
            }))}
            reordonner={reordonnerAttente}
            promouvoir={promouvoir}
            retirer={retirerDeLAttente}
          />
        </section>
        <aside className="space-y-3">
          <h2 className="text-lg font-semibold">Inscrits dans Dendreo ({inscrits.length})</h2>
          <p className="text-xs text-muted">Pour libérer une place, désinscrivez la personne dans Dendreo (ou elle-même depuis le portail).</p>
          <ul className="card divide-y divide-line text-sm">
            {inscrits.length === 0 && <li className="px-4 py-3 text-muted">Aucun inscrit.</li>}
            {inscrits.map((i) => (
              <li key={i.id} className="px-4 py-2.5">
                <p>{i.nom}</p>
                {i.email && <p className="text-xs text-muted">{i.email}</p>}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
