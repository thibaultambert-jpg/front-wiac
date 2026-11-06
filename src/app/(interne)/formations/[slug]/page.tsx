import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ListeSessions } from "@/components/ListeSessions";
import { attentesUtilisateur } from "@/lib/attente";
import { exigerUtilisateur } from "@/lib/auth";
import { formationParSlug } from "@/lib/catalogue";
import { nettoyerHtml } from "@/lib/dendreo/html";
import { markdownVersHtml } from "@/lib/markdown";
import { idsSessionsInscrit } from "@/lib/mes-formations";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const f = await formationParSlug((await params).slug);
  return { title: f?.titre ?? "Formation" };
}

function Section({ titre, html }: { titre: string; html: string }) {
  if (!html) return null;
  return (
    <section>
      <h2 className="text-lg font-semibold">{titre}</h2>
      <div className="prose-fiche" dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}

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
  // Sans fiche BO : description Dendreo de la prochaine session.
  const descriptionDendreo = fiche ? "" : nettoyerHtml(formation.sessions[0]?.descriptionHtml);

  const infos = [
    ["Durée", fiche?.duree],
    ["Public", fiche?.public_cible],
    ["Prérequis", fiche?.prerequis],
    ["Modalités", fiche?.modalites],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <article className="space-y-8">
      <Link href="/formations" className="text-sm text-muted hover:text-ink">← Toutes les formations</Link>

      <header className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div>
          {formation.categorie && <p className="text-sm font-medium text-accent">{formation.categorie}</p>}
          <h1 className="mt-1 text-3xl font-semibold">{formation.titre}</h1>
          {fiche?.resume && <p className="mt-3 text-lg text-muted">{fiche.resume}</p>}
        </div>
        {fiche?.visuel_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fiche.visuel_url} alt="" className="h-44 w-full rounded-xl object-cover" />
        )}
      </header>

      {infos.length > 0 && (
        <dl className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {infos.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">{k}</dt>
              <dd className="mt-1 text-sm">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          {fiche ? (
            <>
              <Section titre="Présentation" html={markdownVersHtml(fiche.contenu)} />
              <Section titre="Objectifs" html={markdownVersHtml(fiche.objectifs)} />
              <Section titre="Programme" html={markdownVersHtml(fiche.programme)} />
            </>
          ) : (
            <Section titre="Présentation" html={descriptionDendreo || "<p>Programme détaillé à venir.</p>"} />
          )}
        </div>
        <aside className="space-y-3">
          <h2 className="text-lg font-semibold">Sessions à venir</h2>
          <ListeSessions sessions={formation.sessions} inscrit={inscrit} attentes={attentes} />
        </aside>
      </div>
    </article>
  );
}
