import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BoutonAction } from "@/components/BoutonAction";
import { ChiffresHero, Hero } from "@/components/Hero";
import { JaugePlaces } from "@/components/Places";
import { themeCategorie } from "@/lib/couleurs";
import { attentesUtilisateur } from "@/lib/attente";
import { exigerUtilisateur } from "@/lib/auth";
import { formationDeSession } from "@/lib/catalogue";
import { aujourdhui, formatHeure, formatJourLong, formatPeriode } from "@/lib/dendreo/dates";
import { nettoyerHtml } from "@/lib/dendreo/html";
import { sessionParId } from "@/lib/dendreo/sessions";
import { LIEU } from "@/lib/lieu";
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

  const t = themeCategorie(formation?.categorie || session.categorie, session.idCategorie);

  return (
    <>
      <Hero
        surtitre={
          (formation?.categorie || session.categorie) && (
            <span className="chip" style={{ background: t.puce, color: t.couleur }}>
              {formation?.categorie || session.categorie}
            </span>
          )
        }
        titre={titre}
        sousTitre={
          <span className="first-letter:uppercase">
            Session {formatPeriode(session.debut, session.fin)}
          </span>
        }
      >
        <ChiffresHero
          items={[
            ["Créneaux", session.creneaux.length || ""],
            ["Lieu", LIEU.ville],
            ["Places", session.places.max > 0 ? `${session.places.inscrits}/${session.places.max}` : ""],
            ["Statut", estInscrit ? "Inscrit" : rang ? `Attente n°${rang}` : session.places.complet ? "Complet" : "Ouvert"],
          ]}
        />
      </Hero>

      <div className="mx-auto max-w-6xl space-y-6 px-4 pt-6">
      <Link href={formation ? `/formations/${formation.slug}` : "/formations"} className="inline-block text-sm font-semibold text-violet hover:underline">
        ← {formation ? "Revoir le programme de la formation" : "Toutes les formations"}
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <section>
              <h2 className="titre-section text-xl">Planning</h2>
              {session.creneaux.length === 0 ? (
                <p className="mt-3 rounded-2xl border border-line bg-surface-2 p-4 text-sm text-muted">Les créneaux seront communiqués prochainement.</p>
              ) : (
                <ol className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface-2">
                  {session.creneaux.map((c) => (
                    <li key={c.id} className="px-4 py-3 text-sm">
                      <p>
                        <span className="font-semibold first-letter:uppercase">{formatJourLong(c.debut)}</span>
                        <span className="text-muted">
                          {" · "}
                          {formatHeure(c.debut)} – {formatHeure(c.fin)}
                        </span>
                      </p>
                      {c.nom && <p className="mt-0.5 text-muted">{c.nom}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section>
              <h2 className="titre-section text-xl">Lieu</h2>
              <div className="mt-3 rounded-2xl border border-line bg-surface-2 p-4 text-sm">
                <p className="font-semibold">{LIEU.intitule}</p>
                <p className="text-muted">
                  {LIEU.adresse}
                  <br />
                  {LIEU.codePostal} {LIEU.ville}
                </p>
                <p className="mt-2 text-muted">
                  {LIEU.etage}
                  <br />
                  Code d&apos;accès : <span className="font-semibold text-ink">{LIEU.code}</span>
                </p>
              </div>
            </section>
          </div>

          {!formation?.fiche && session.descriptionHtml && (
            <section>
              <h2 className="titre-section text-xl">Présentation</h2>
              <div className="prose-fiche" dangerouslySetInnerHTML={{ __html: nettoyerHtml(session.descriptionHtml) }} />
            </section>
          )}
        </div>

        <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-6 lg:mt-10">
          <dl className="space-y-3 text-sm">
            {session.formateurs.length > 0 && (
              <div>
                <dt className="text-muted">Formateur{session.formateurs.length > 1 ? "s" : ""}</dt>
                <dd className="font-medium">{session.formateurs.join(", ")}</dd>
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
                  Vous êtes <strong>n°{rang}</strong> sur la liste d&apos;attente. En cas de désistement, l&apos;équipe formation pourra vous inscrire.
                </p>
                <BoutonAction action={quitterAttente} session={id} libelle="Quitter la liste d'attente" enCours="…" variante="secondary" />
              </div>
            ) : session.places.complet ? (
              <div className="space-y-3">
                <p className="text-sm text-muted">Cette session est complète. Rejoignez la liste d&apos;attente : en cas de désistement, l&apos;équipe formation pourra vous inscrire.</p>
                <BoutonAction action={rejoindreAttente} session={id} libelle="Rejoindre la liste d'attente" enCours="Inscription…" avecCommentaire />
              </div>
            ) : (
              <BoutonAction action={sInscrire} session={id} libelle="S'inscrire à cette session" enCours="Inscription en cours…" />
            )}
          </div>
        </aside>
      </div>
      </div>
    </>
  );
}
