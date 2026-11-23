import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { BadgePlaces, JaugePlaces } from "@/components/Places";
import { exigerUtilisateur } from "@/lib/auth";
import { aujourdhui, formatHeure, formatJour, formatPeriode } from "@/lib/dendreo/dates";
import { estFormateur, mesInterventions } from "@/lib/formateur";
import { LIEU } from "@/lib/lieu";

export const metadata: Metadata = { title: "Mes interventions" };

export default async function MesInterventions() {
  const u = await exigerUtilisateur();
  if (!(await estFormateur(u))) redirect("/mes-formations");
  const sessions = await mesInterventions(u);
  const jour = aujourdhui();

  return (
    <>
      <Hero
        surtitre={<p className="eyebrow">Espace formateur</p>}
        titre={<>Mes <span className="text-turquoise">interventions</span></>}
        sousTitre={`Bonjour ${u.prenom || ""}, retrouvez les sessions INTER que vous animez, leur planning et leurs inscrits.`}
      />
      <div className="mx-auto max-w-5xl space-y-4 px-4 pt-10">
        <h2 className="titre-section text-xl">Sessions à venir</h2>
        {sessions.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface-2 p-6 text-sm text-muted">Aucune session INTER à venir ne vous est affectée dans Dendreo.</p>
        ) : (
          <ul className="space-y-4">
            {sessions.map((s) => {
              const enCours = s.debut.slice(0, 10) <= jour;
              const coAnimateurs = s.formateurs.length > 1 ? s.formateurs : [];
              return (
                <li key={s.id} className="card space-y-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <Link href={`/sessions/${s.id}`} className="text-lg font-semibold hover:text-violet">{s.intitule}</Link>
                      <p className="text-sm text-muted first-letter:uppercase">
                        {formatPeriode(s.debut, s.fin)} · {LIEU.intitule}, {LIEU.ville}
                        {s.categorie && ` · ${s.categorie}`}
                      </p>
                      {coAnimateurs.length > 0 && <p className="text-sm text-muted">Co-animée avec : {coAnimateurs.join(", ")}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {enCours && <span className="badge bg-accent-soft text-accent">En cours</span>}
                      <BadgePlaces places={s.places} />
                    </div>
                  </div>

                  {s.creneaux.length > 0 && (
                    <ol className="divide-y divide-line rounded-2xl border border-line bg-surface-2 text-sm">
                      {s.creneaux.map((c) => (
                        <li key={c.id} className={`flex flex-wrap gap-x-2 px-4 py-2 ${c.fin.slice(0, 10) < jour ? "text-muted line-through" : ""}`}>
                          <span className="font-semibold first-letter:uppercase">{formatJour(c.debut)}</span>
                          <span className="text-muted">
                            {formatHeure(c.debut)} – {formatHeure(c.fin)}
                          </span>
                          {c.nom && <span>· {c.nom}</span>}
                        </li>
                      ))}
                    </ol>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <JaugePlaces places={s.places} />
                      {s.places.min > 0 && s.places.inscrits < s.places.min && (
                        <span className="badge bg-warn-soft text-warn">Sous le minimum ({s.places.min})</span>
                      )}
                    </div>
                    <Link href={`/sessions/${s.id}`} className="text-sm font-semibold text-violet hover:underline">
                      Détail et liste des inscrits →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
