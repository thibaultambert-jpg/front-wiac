import Link from "next/link";
import type { Metadata } from "next";
import { Calendrier, type EvenementCalendrier } from "@/components/Calendrier";
import { CarteFormation } from "@/components/CarteFormation";
import { Hero } from "@/components/Hero";
import { libelleMode } from "@/components/Mode";
import { attentesUtilisateur } from "@/lib/attente";
import { exigerUtilisateur } from "@/lib/auth";
import { catalogue, type FormationCatalogue } from "@/lib/catalogue";
import { couleurCategorie, themeCategorie } from "@/lib/couleurs";
import { versIsoLocal } from "@/lib/dendreo/dates";
import { texteBrut } from "@/lib/dendreo/html";
import { categories } from "@/lib/dendreo/sessions";
import type { Session } from "@/lib/dendreo/types";
import { idsSessionsInscrit } from "@/lib/mes-formations";

export const metadata: Metadata = { title: "Formations" };

type Filtres = { vue?: string; categorie?: string; mois?: string; mode?: string; dispo?: string; q?: string };

const norm = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

function sessionRetenue(s: Session, f: Filtres): boolean {
  if (f.categorie && s.idCategorie !== f.categorie) return false;
  if (f.mois && !s.debut.startsWith(f.mois)) return false;
  if (f.mode && !s.modes.includes(f.mode)) return false;
  if (f.dispo === "1" && s.places.complet) return false;
  return true;
}

function filtrer(liste: FormationCatalogue[], f: Filtres): FormationCatalogue[] {
  const filtreSession = !!(f.categorie || f.mois || f.mode || f.dispo);
  const q = f.q ? norm(f.q) : "";
  return liste
    .filter((fo) => !q || norm(`${fo.titre} ${fo.categorie} ${fo.fiche?.resume ?? ""}`).includes(q))
    .filter((fo) => !f.categorie || fo.idCategorie === f.categorie || fo.sessions.some((s) => s.idCategorie === f.categorie))
    .map((fo) => ({ ...fo, sessions: fo.sessions.filter((s) => sessionRetenue(s, f)) }))
    .filter((fo) => !filtreSession || fo.sessions.length > 0);
}

function lienVue(f: Filtres, vue: string) {
  const p = new URLSearchParams(Object.entries({ ...f, vue }).filter(([, v]) => v) as [string, string][]);
  return `/formations?${p.toString()}`;
}

const MOIS = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });

export default async function PageFormations({ searchParams }: { searchParams: Promise<Filtres> }) {
  const f = await searchParams;
  const vue = f.vue === "calendrier" ? "calendrier" : "liste";
  const u = await exigerUtilisateur();
  const [tout, cats, inscrit, attentes] = await Promise.all([
    catalogue(),
    categories(),
    idsSessionsInscrit(u).catch(() => new Set<string>()),
    attentesUtilisateur(u.id).catch(() => new Map<string, number>()),
  ]);
  const liste = filtrer(tout, f);
  const toutesSessions = tout.flatMap((fo) => fo.sessions);
  const mois = [...new Set(toutesSessions.map((s) => s.debut.slice(0, 7)))].sort();
  const modes = [...new Set(toutesSessions.flatMap((s) => s.modes))].sort();

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
        <div className="inline-flex rounded-full bg-white/10 p-1 text-sm" role="tablist" aria-label="Affichage">
          {(["liste", "calendrier"] as const).map((v) => (
            <Link
              key={v}
              href={lienVue(f, v)}
              role="tab"
              aria-selected={vue === v}
              className={`rounded-full px-4 py-1.5 font-semibold ${vue === v ? "bg-white text-violet" : "text-white/80 hover:text-white"}`}
            >
              {v === "liste" ? "Liste" : "Calendrier"}
            </Link>
          ))}
        </div>
      </Hero>

      <div className="mx-auto max-w-6xl space-y-10 px-4">
        <form className="card -mt-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6" method="get">
          <input type="hidden" name="vue" value={vue} />
          <div className="lg:col-span-2">
            <label className="label" htmlFor="q">Recherche</label>
            <input id="q" name="q" defaultValue={f.q} placeholder="Intitulé, thème…" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="categorie">Thématique</label>
            <select id="categorie" name="categorie" defaultValue={f.categorie ?? ""} className="input">
              <option value="">Toutes</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>{c.intitule}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="mois">Mois</label>
            <select id="mois" name="mois" defaultValue={f.mois ?? ""} className="input">
              <option value="">Tous</option>
              {mois.map((m) => (
                <option key={m} value={m}>{MOIS.format(new Date(`${m}-01T00:00:00Z`))}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="mode">Format</label>
            <select id="mode" name="mode" defaultValue={f.mode ?? ""} className="input">
              <option value="">Tous</option>
              {modes.map((m) => (
                <option key={m} value={m}>{libelleMode(m)}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col justify-end gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="dispo" value="1" defaultChecked={f.dispo === "1"} className="accent-[var(--violet)]" />
              Places disponibles
            </label>
            <div className="flex gap-2">
              <button className="btn btn-primary btn-sm flex-1" type="submit">Filtrer</button>
              <Link href={`/formations?vue=${vue}`} className="btn btn-secondary btn-sm">Effacer</Link>
            </div>
          </div>
        </form>

        {vue === "calendrier" ? (
          <div className="card p-3 sm:p-5">
            <Calendrier evenements={evenements} date={f.mois ? `${f.mois}-01` : undefined} />
          </div>
        ) : liste.length === 0 ? (
          <p className="card p-8 text-center text-muted">Aucune formation ne correspond à ces critères.</p>
        ) : (
          [...groupes.entries()].map(([nom, formations]) => {
            const t = themeCategorie(nom, formations[0]?.idCategorie);
            const nbSessions = formations.reduce((n, fo) => n + fo.sessions.length, 0);
            return (
              <section key={nom} className="space-y-4">
                <div className="border-l-4 pl-3" style={{ borderColor: t.couleur }}>
                  <h2 className="text-lg font-bold">{nom}</h2>
                  <p className="text-sm text-muted">
                    {formations.length} formation{formations.length > 1 ? "s" : ""} · {nbSessions} session{nbSessions > 1 ? "s" : ""} à venir
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
