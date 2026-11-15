import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChiffresHero, Hero } from "@/components/Hero";
import { BarreSessions } from "@/components/BarreSessions";
import { BoutonAction } from "@/components/BoutonAction";
import { ListeSessions } from "@/components/ListeSessions";
import { libelleNiveau } from "@/components/Niveau";
import { AccordeonProgramme } from "@/components/AccordeonProgramme";
import { SectionNumerotee } from "@/components/SectionNumerotee";
import { attentesUtilisateur } from "@/lib/attente";
import { exigerUtilisateur } from "@/lib/auth";
import { formationParSlug } from "@/lib/catalogue";
import { themeCategorie } from "@/lib/couleurs";
import { formatPeriode } from "@/lib/dendreo/dates";
import { nettoyerHtml } from "@/lib/dendreo/html";
import { markdownVersHtml } from "@/lib/markdown";
import { estHtml, modulesDeFiche } from "@/lib/programme";
import { estInteresse } from "@/lib/interets";
import { idsSessionsInscrit } from "@/lib/mes-formations";
import { signalerInteret } from "../../actions";

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
  const sansSession = formation.sessions.length === 0;
  const [inscrit, attentes, interesse] = await Promise.all([
    idsSessionsInscrit(u).catch(() => new Set<string>()),
    attentesUtilisateur(u.id).catch(() => new Map<string, number>()),
    sansSession && formation.fiche ? estInteresse(formation.fiche.id, u.id).catch(() => false) : Promise.resolve(false),
  ]);
  const fiche = formation.fiche;
  const t = themeCategorie(formation.categorie, formation.idCategorie);
  const prochaine = formation.sessions[0];
  const participants = prochaine && prochaine.places.max > 0 ? (prochaine.places.min > 0 ? `${prochaine.places.min} à ${prochaine.places.max} personnes` : `${prochaine.places.max} max.`) : "";

  // Sans fiche BO : description Dendreo de la prochaine session.
  const presentation = fiche ? "" : nettoyerHtml(prochaine?.descriptionHtml);
  const objectifs = !fiche?.objectifs ? "" : estHtml(fiche.objectifs) ? nettoyerHtml(fiche.objectifs) : markdownVersHtml(fiche.objectifs);
  const modules = modulesDeFiche(fiche?.programme_modules).map((m) => ({ ...m, contenu: nettoyerHtml(m.contenu) }));
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
            ["Niveau", libelleNiveau(fiche?.niveau ?? "")],
            ["Participants", participants],
            ["Modules", modules.length || ""],
            ["Sessions à venir", formation.sessions.length || "Aucune"],
          ]}
        />
      </Hero>

      <div className="mx-auto max-w-5xl px-4 pb-4">
        <Link href="/formations" className="mt-6 inline-block text-sm text-muted hover:text-violet">← Toutes les formations</Link>

        {objectifs && (
          <SectionNumerotee numero={++n} titre="Objectif">
            <div className="border-l-4 border-turquoise pl-4 [&_p:first-child]:font-semibold [&_p:first-child]:text-ink">
              <Html html={objectifs} />
            </div>
          </SectionNumerotee>
        )}

        {presentation && (
          <SectionNumerotee numero={++n} titre="Présentation">
            <Html html={presentation} />
          </SectionNumerotee>
        )}

        {modules.length > 0 && (
          <SectionNumerotee numero={++n} titre="Programme" sousTitre={`${modules.length} module${modules.length > 1 ? "s" : ""}`}>
            <AccordeonProgramme modules={modules} />
          </SectionNumerotee>
        )}

        <SectionNumerotee numero={++n} titre="Sessions" sousTitre={sansSession ? undefined : "Choisissez une date"} id="sessions">
          {sansSession ? (
            <div className="rounded-2xl border border-line bg-surface-2 p-5">
              <p className="font-semibold">Pas de session programmée pour le moment.</p>
              {formation.fiche && (
                <>
                  <p className="mt-1 text-sm text-muted">
                    {interesse
                      ? "Vous avez signalé votre intérêt : l'équipe formation en tient compte pour programmer les prochaines sessions."
                      : "Signalez votre intérêt : l'équipe formation s'en sert pour programmer les prochaines sessions."}
                  </p>
                  <div className="mt-4">
                    <BoutonAction
                      action={signalerInteret}
                      session={formation.fiche.id}
                      libelle={interesse ? "Je ne suis plus intéressé(e)" : "La formation m'intéresse"}
                      enCours="…"
                      variante={interesse ? "secondary" : "primary"}
                    />
                  </div>
                </>
              )}
            </div>
          ) : (
            <ListeSessions sessions={formation.sessions} inscrit={inscrit} attentes={attentes} />
          )}
        </SectionNumerotee>
      </div>

      {prochaine && <BarreSessions titre={formation.titre} sousTitre={`Prochaine session ${formatPeriode(prochaine.debut, prochaine.fin)}`} />}
    </>
  );
}
