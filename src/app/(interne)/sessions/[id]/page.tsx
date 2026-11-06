import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BoutonAction } from "@/components/BoutonAction";
import { libelleMode } from "@/components/Mode";
import { BadgePlaces, JaugePlaces } from "@/components/Places";
import { attentesUtilisateur } from "@/lib/attente";
import { exigerUtilisateur } from "@/lib/auth";
import { formationDeSession } from "@/lib/catalogue";
import { aujourdhui, formatHeure, formatJourLong, formatPeriode } from "@/lib/dendreo/dates";
import { nettoyerHtml } from "@/lib/dendreo/html";
import { sessionParId } from "@/lib/dendreo/sessions";
import { idsSessionsInscrit } from "@/lib/mes-formations";
import { quitterAttente, rejoindreAttente, sInscrire, seDesinscrire } from "../../actions";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = await sessionParId((await params).id);
  return { title: s?.intitule ?? "Session" };
}

export default async function PageSession({ params }: Props) {
  const { id } = await params;
  const u = await exigerUtilisateur();
  const session = await sessionParId(id);
  if (!session) notFound();
  const [formation, inscrit, attentes] = await Promise.all([formationDeSession(id), idsSessionsInscrit(u), attentesUtilisateur(u.id)]);
  const estInscrit = inscrit.has(id);
  const rang = attentes.get(id);
  const commencee = session.debut.slice(0, 10) <= aujourdhui();
  const titre = formation?.titre ?? session.intitule;

  return (
    <article className="space-y-8">
      <Link href={formation ? `/formations/${formation.slug}` : "/formations"} className="text-sm text-muted hover:text-ink">
        ← {formation ? titre : "Toutes les formations"}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {session.categorie && <p className="text-sm font-medium text-accent">{session.categorie}</p>}
          <h1 className="mt-1 text-3xl font-semibold">{titre}</h1>
          <p className="mt-2 text-muted">
            Session {formatPeriode(session.debut, session.fin)}
            {session.numero && <span className="text-xs"> · {session.numero}</span>}
          </p>
        </div>
        <BadgePlaces places={session.places} />
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold">Planning</h2>
            {session.creneaux.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Les créneaux seront communiqués prochainement.</p>
            ) : (
              <ol className="mt-3 divide-y divide-line rounded-xl border border-line bg-surface">
                {session.creneaux.map((c) => {
                  const lieu = session.lieux.find((l) => l.id === c.idSalle);
                  return (
                    <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3 text-sm">
                      <span className="font-medium first-letter:uppercase">{formatJourLong(c.debut)}</span>
                      <span className="text-muted">
                        {formatHeure(c.debut)} – {formatHeure(c.fin)}
                        {lieu && ` · ${lieu.intitule}`}
                      </span>
                      {c.nom && <span className="w-full text-muted">{c.nom}</span>}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {session.lieux.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold">Lieu{session.lieux.length > 1 ? "x" : ""}</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {session.lieux.map((l) => (
                  <div key={l.id} className="card p-4 text-sm">
                    <p className="font-medium">{l.intitule}</p>
                    {l.elearning ? (
                      <p className="text-muted">À distance</p>
                    ) : (
                      <p className="text-muted">
                        {l.adresse}
                        {(l.codePostal || l.ville) && <><br />{l.codePostal} {l.ville}</>}
                      </p>
                    )}
                    {l.acces && <div className="prose-fiche mt-2 text-muted" dangerouslySetInnerHTML={{ __html: nettoyerHtml(l.acces) }} />}
                    {l.accueil && <p className="mt-2 text-muted">{l.accueil}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {!formation?.fiche && session.descriptionHtml && (
            <section>
              <h2 className="text-lg font-semibold">Présentation</h2>
              <div className="prose-fiche" dangerouslySetInnerHTML={{ __html: nettoyerHtml(session.descriptionHtml) }} />
            </section>
          )}
          {formation?.fiche && (
            <p className="text-sm">
              <Link href={`/formations/${formation.slug}`} className="text-accent hover:underline">Voir le programme complet de la formation →</Link>
            </p>
          )}
        </div>

        <aside className="card h-fit space-y-4 p-5">
          <dl className="space-y-3 text-sm">
            {session.formateurs.length > 0 && (
              <div>
                <dt className="text-muted">Formateur{session.formateurs.length > 1 ? "s" : ""}</dt>
                <dd className="font-medium">{session.formateurs.join(", ")}</dd>
              </div>
            )}
            {session.modes.length > 0 && (
              <div>
                <dt className="text-muted">Format</dt>
                <dd className="font-medium">{session.modes.map(libelleMode).join(", ")}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted">Places</dt>
              <dd className="mt-1"><JaugePlaces places={session.places} /></dd>
            </div>
          </dl>

          <div className="border-t border-line pt-4">
            {estInscrit ? (
              <div className="space-y-3">
                <p className="rounded-lg bg-ok-soft px-3 py-2 text-sm font-medium text-ok">Vous êtes inscrit à cette session.</p>
                {!commencee && (
                  <BoutonAction
                    action={seDesinscrire}
                    session={id}
                    libelle="Annuler mon inscription"
                    enCours="Annulation…"
                    variante="danger"
                    confirmation="Annuler votre inscription à cette session ?"
                  />
                )}
              </div>
            ) : commencee ? (
              <p className="text-sm text-muted">Cette session a commencé : les inscriptions sont closes.</p>
            ) : rang ? (
              <div className="space-y-3">
                <p className="rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
                  Vous êtes <strong>n°{rang}</strong> sur la liste d&apos;attente. L&apos;équipe formation vous contactera si une place se libère.
                </p>
                <BoutonAction action={quitterAttente} session={id} libelle="Quitter la liste d'attente" enCours="…" variante="secondary" />
              </div>
            ) : session.places.complet ? (
              <div className="space-y-3">
                <p className="text-sm text-muted">Cette session est complète. Inscrivez-vous sur la liste d&apos;attente pour être prévenu si une place se libère.</p>
                <BoutonAction action={rejoindreAttente} session={id} libelle="Rejoindre la liste d'attente" enCours="Inscription…" avecCommentaire />
              </div>
            ) : (
              <BoutonAction action={sInscrire} session={id} libelle="S'inscrire à cette session" enCours="Inscription en cours…" />
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}
