import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChiffresHero, Hero } from "@/components/Hero";
import { ListeSessions } from "@/components/ListeSessions";
import { libelleMode } from "@/components/Mode";
import { libelleNiveau } from "@/components/Niveau";
import { AccordeonProgramme } from "@/components/AccordeonProgramme";
import { SectionNumerotee } from "@/components/SectionNumerotee";
import { attentesUtilisateur } from "@/lib/attente";
import { exigerUtilisateur } from "@/lib/auth";
import { formationParSlug } from "@/lib/catalogue";
import { themeCategorie } from "@/lib/couleurs";
import { formatPeriode } from "@/lib/dendreo/dates";
import { nettoyerHtml } from "@/lib/dendreo/html";
import { decouperProgramme, markdownVersHtml } from "@/lib/markdown";
import { estHtml, modulesDeFiche } from "@/lib/programme";
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

  // Sans fiche BO : description Dendreo de la prochaine session.
  const presentation = fiche ? "" : nettoyerHtml(prochaine?.descriptionHtml);
  const objectifs = !fiche?.objectifs ? "" : estHtml(fiche.objectifs) ? nettoyerHtml(fiche.objectifs) : markdownVersHtml(fiche.objectifs);
  let modules = modulesDeFiche(fiche?.programme_modules).map((m) => ({ ...m, contenu: nettoyerHtml(m.contenu) }));
  if (modules.length === 0 && fiche?.programme) {
    modules = (decouperProgramme(fiche.programme) ?? []).map((m) => ({ titre: m.titre, sous_titre: "", contenu: m.html }));
  }
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
            ["Format", modes.map(libelleMode).join(", ")],
            ["Participants", participants],
            ["Modules", modules.length || ""],
            ["Sessions à venir", formation.sessions.length],
          ]}
        />
      </Hero>

      <div className="mx-auto max-w-5xl px-4 pb-24">
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
