import Link from "next/link";
import type { Metadata } from "next";
import { Calendrier, type EvenementCalendrier } from "@/components/Calendrier";
import { CarteFormation } from "@/components/CarteFormation";
import { Hero } from "@/components/Hero";
import { attentesUtilisateur } from "@/lib/attente";
import { exigerUtilisateur } from "@/lib/auth";
import { catalogue, type FormationCatalogue } from "@/lib/catalogue";
import { couleurCategorie, themeCategorie } from "@/lib/couleurs";
import { versIsoLocal } from "@/lib/dendreo/dates";
import { texteBrut } from "@/lib/dendreo/html";
import { idsSessionsInscrit } from "@/lib/mes-formations";

export const metadata: Metadata = { title: "Formations" };

type Filtres = { vue?: string; dispo?: string };

/** Seul filtre conservé : sessions avec des places disponibles. */
function filtrer(liste: FormationCatalogue[], f: Filtres): FormationCatalogue[] {
  if (f.dispo !== "1") return liste;
  return liste
    .map((fo) => ({ ...fo, sessions: fo.sessions.filter((s) => !s.places.complet) }))
    .filter((fo) => fo.sessions.length > 0);
}

function lien(f: Filtres, change: Filtres) {
  const p = new URLSearchParams(Object.entries({ ...f, ...change }).filter(([, v]) => v) as [string, string][]);
  const q = p.toString();
  return q ? `/formations?${q}` : "/formations";
}

export default async function PageFormations({ searchParams }: { searchParams: Promise<Filtres> }) {
  const f = await searchParams;
  const vue = f.vue === "calendrier" ? "calendrier" : "liste";
  const u = await exigerUtilisateur();
  const [tout, inscrit, attentes] = await Promise.all([
    catalogue(),
    idsSessionsInscrit(u).catch(() => new Set<string>()),
    attentesUtilisateur(u.id).catch(() => new Map<string, number>()),
  ]);
  const liste = filtrer(tout, f);

  // Regroupement par thématique, comme le site public.
  const groupes = new Map<string, FormationCatalogue[]>();
  for (const fo of liste) {
    const cle = fo.categorie || "Autres formations";
    groupes.set(cle, [...(groupes.get(cle) ?? []), fo]);
  }

  const evenements: EvenementCalendrier[] = liste.flatMap((fo) =>
    fo.sessions.flatMap((s) => {
      const base = { title: fo.titre, url: `/sessions/${s.id}`, color: couleurCategorie(s.idCategorie || fo.idCategorie, fo.categorie), complet: s.places.complet };
      if (s.creneaux.length === 0) {
        // Sans créneau : événement « journée » (fin exclusive pour FullCalendar).
        const fin = new Date(`${s.fin.slice(0, 10)}T00:00:00Z`);
        fin.setUTCDate(fin.getUTCDate() + 1);
        return [{ ...base, id: s.id, start: s.debut.slice(0, 10), end: fin.toISOString().slice(0, 10), allDay: true }];
      }
      return s.creneaux.map((c) => ({ ...base, id: `${s.id}-${c.id}`, start: versIsoLocal(c.debut), end: versIsoLocal(c.fin) }));
    }),
  );

  return (
    <>
      <Hero
        surtitre={<p className="eyebrow">Formations inter</p>}
        titre={
          <>
            Des formations pour <span className="text-turquoise">faire grandir</span> vos compétences
          </>
        }
        sousTitre="Choisissez une session parmi les prochaines dates et inscrivez-vous en un clic."
      >
        <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full bg-white/10 p-1 text-sm" role="tablist" aria-label="Affichage">
          {(["liste", "calendrier"] as const).map((v) => (
            <Link
              key={v}
              href={lien(f, { vue: v === "liste" ? undefined : v })}
              role="tab"
              aria-selected={vue === v}
              className={`rounded-full px-4 py-1.5 font-semibold ${vue === v ? "bg-white text-violet" : "text-white/80 hover:text-white"}`}
            >
              {v === "liste" ? "Liste" : "Calendrier"}
            </Link>
          ))}
        </div>
        <Link
          href={lien(f, { dispo: f.dispo === "1" ? undefined : "1" })}
          role="switch"
          aria-checked={f.dispo === "1"}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${f.dispo === "1" ? "bg-turquoise text-turquoise-ink" : "bg-white/10 text-white/90 hover:text-white"}`}
        >
          <span className={`grid h-4 w-4 place-items-center rounded border ${f.dispo === "1" ? "border-turquoise-ink" : "border-white/70"}`} aria-hidden>
            {f.dispo === "1" && "✓"}
          </span>
          Places disponibles
        </Link>
        </div>
      </Hero>

      <div className="mx-auto max-w-6xl space-y-10 px-4 pt-8">
        {vue === "calendrier" ? (
          <div className="card p-3 sm:p-5">
            <Calendrier evenements={evenements} />
          </div>
        ) : liste.length === 0 ? (
          <p className="card p-8 text-center text-muted">Aucune session avec des places disponibles pour le moment.</p>
        ) : (
          // Thématiques dans l'ordre du catalogue (plus petit « ordre d'affichage » des fiches du groupe).
          [...groupes.entries()]
            .sort(([, a], [, b]) => Math.min(...a.map((f) => f.fiche?.ordre ?? 9999)) - Math.min(...b.map((f) => f.fiche?.ordre ?? 9999)))
            .map(([nom, formations]) => {
            const t = themeCategorie(nom, formations[0]?.idCategorie);
            const nbSessions = formations.reduce((n, fo) => n + fo.sessions.length, 0);
            return (
              <section key={nom} className="space-y-4">
                <div className="border-l-4 pl-3" style={{ borderColor: t.couleur }}>
                  <h2 className="text-lg font-bold">{nom}</h2>
                  <p className="text-sm text-muted">
                    {formations.length} formation{formations.length > 1 ? "s" : ""} · {nbSessions ? `${nbSessions} session${nbSessions > 1 ? "s" : ""} à venir` : "pas de session programmée"}
                  </p>
                </div>
                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {formations.map((fo) => (
                    <CarteFormation
                      key={fo.slug}
                      formation={fo}
                      resume={fo.fiche?.resume || texteBrut(fo.sessions[0]?.descriptionHtml, 180) || "Programme détaillé à venir."}
                      inscrit={inscrit}
                      attentes={attentes}
                    />
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>
    </>
  );
}
