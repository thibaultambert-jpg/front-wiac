import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChiffresHero, Hero } from "@/components/Hero";
import { ListeSessions } from "@/components/ListeSessions";
import { libelleMode } from "@/components/Mode";
import { libelleNiveau } from "@/components/Niveau";
import { Encadre, SectionNumerotee } from "@/components/SectionNumerotee";
import { attentesUtilisateur } from "@/lib/attente";
import { exigerUtilisateur } from "@/lib/auth";
import { formationParSlug } from "@/lib/catalogue";
import { themeCategorie } from "@/lib/couleurs";
import { formatPeriode } from "@/lib/dendreo/dates";
import { nettoyerHtml } from "@/lib/dendreo/html";
import { decouperProgramme, markdownVersHtml } from "@/lib/markdown";
import { idsSessionsInscrit } from "@/lib/mes-formations";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const f = await formationParSlug((await params).slug);
  return { title: f?.titre ?? "Formation" };
}

const Html = ({ html }: { html: string }) => <div className="prose-fiche" dangerouslySetInnerHTML={{ __html: html }} />;

export default async function PageFormation({ params }: Props) {
  const { slug } = await params;
  const u = await exigerUtilisateur();
  const formation = await formationParSlug(slug);
  if (!formation) notFound();
  const [inscrit, attentes] = await Promise.all([
    idsSessionsInscrit(u).catch(() => new Set<string>()),
    attentesUtilisateur(u.id).catch(() => new Map<string, number>()),
  ]);
  const fiche = formation.fiche;
  const t = themeCategorie(formation.categorie, formation.idCategorie);
  const prochaine = formation.sessions[0];
  const modes = [...new Set(formation.sessions.flatMap((s) => s.modes))];
  const participants = prochaine && prochaine.places.max > 0 ? (prochaine.places.min > 0 ? `${prochaine.places.min} à ${prochaine.places.max} personnes` : `${prochaine.places.max} max.`) : "";

  const presentation = fiche ? markdownVersHtml(fiche.contenu) : nettoyerHtml(prochaine?.descriptionHtml);
  const objectifs = fiche ? markdownVersHtml(fiche.objectifs) : "";
  const modules = fiche ? decouperProgramme(fiche.programme) : null;
  const programmeHtml = fiche && !modules ? markdownVersHtml(fiche.programme) : "";
  let n = 0;

  return (
    <>
      <Hero
        surtitre={
          t.libelle && (
            <span className="chip" style={{ background: t.puce, color: t.couleur }}>
              {formation.categorie || t.libelle}
            </span>
          )
        }
        titre={formation.titre}
        sousTitre={fiche?.resume}
      >
        <ChiffresHero
          items={[
            ["Durée", fiche?.duree],
            ["Niveau", libelleNiveau(fiche?.niveau ?? "")],
            ["Format", modes.map(libelleMode).join(", ")],
            ["Participants", participants],
            ["Sessions à venir", formation.sessions.length],
          ]}
        />
      </Hero>

      <div className="mx-auto max-w-5xl px-4 pb-24">
        <Link href="/formations" className="mt-6 inline-block text-sm text-muted hover:text-violet">← Toutes les formations</Link>

        {(presentation || objectifs) && (
          <SectionNumerotee numero={++n} titre="Objectif">
            {objectifs && (
              <div className="mb-4 border-l-4 border-turquoise pl-4 text-[15px] font-semibold text-ink">
                <Html html={objectifs} />
              </div>
            )}
            {presentation && <Html html={presentation} />}
          </SectionNumerotee>
        )}

        {fiche && (fiche.public_cible || fiche.prerequis) && (
          <SectionNumerotee numero={++n} titre="Pour qui">
            <div className="grid gap-3 sm:grid-cols-2">
              {fiche.public_cible && <Encadre titre="Public cible">{fiche.public_cible}</Encadre>}
              {fiche.prerequis && <Encadre titre="Prérequis">{fiche.prerequis}</Encadre>}
            </div>
          </SectionNumerotee>
        )}

        {(modules || programmeHtml) && (
          <SectionNumerotee numero={++n} titre="Programme" sousTitre={modules ? `${modules.length} module${modules.length > 1 ? "s" : ""}${fiche?.duree ? ` · ${fiche.duree}` : ""}` : undefined}>
            {modules ? (
              <div className="space-y-3">
                {modules.map((m, i) => (
                  <details key={i} className="group rounded-2xl border border-line bg-surface-2 open:bg-white">
                    <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4">
                      <span className="text-2xl font-extrabold text-violet/25">{String(i + 1).padStart(2, "0")}</span>
                      <span className="flex-1 font-semibold">{m.titre}</span>
                      <span className="text-muted transition group-open:rotate-180" aria-hidden>⌄</span>
                    </summary>
                    {m.html && <div className="px-5 pb-5"><Html html={m.html} /></div>}
                  </details>
                ))}
              </div>
            ) : (
              <Html html={programmeHtml} />
            )}
          </SectionNumerotee>
        )}

        {fiche?.modalites && (
          <SectionNumerotee numero={++n} titre="Modalités">
            <Encadre titre="Rythme & accès">{fiche.modalites}</Encadre>
          </SectionNumerotee>
        )}

        <SectionNumerotee numero={++n} titre="Sessions" sousTitre="Choisissez une date" id="sessions">
          <ListeSessions sessions={formation.sessions} inscrit={inscrit} attentes={attentes} />
        </SectionNumerotee>
      </div>

      {prochaine && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{formation.titre}</p>
              <p className="text-xs text-muted first-letter:uppercase">Prochaine session {formatPeriode(prochaine.debut, prochaine.fin)}</p>
            </div>
            <a href="#sessions" className="btn btn-primary btn-sm shrink-0">Choisir une session</a>
          </div>
        </div>
      )}
    </>
  );
}
