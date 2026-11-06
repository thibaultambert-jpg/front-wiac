import Link from "next/link";
import type { Metadata } from "next";
import { Calendrier, type EvenementCalendrier } from "@/components/Calendrier";
import { libelleMode } from "@/components/Mode";
import { BadgePlaces } from "@/components/Places";
import { attentesUtilisateur } from "@/lib/attente";
import { exigerUtilisateur } from "@/lib/auth";
import { catalogue, type FormationCatalogue } from "@/lib/catalogue";
import { couleurCategorie } from "@/lib/couleurs";
import { formatPeriode, versIsoLocal } from "@/lib/dendreo/dates";
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

  const evenements: EvenementCalendrier[] = liste.flatMap((fo) =>
    fo.sessions.flatMap((s) => {
      const base = { title: fo.titre, url: `/sessions/${s.id}`, color: couleurCategorie(s.idCategorie || fo.idCategorie), complet: s.places.complet };
      if (s.creneaux.length === 0) {
        return [{ ...base, id: s.id, start: versIsoLocal(s.debut), end: versIsoLocal(s.fin) }];
      }
      return s.creneaux.map((c) => ({ ...base, id: `${s.id}-${c.id}`, start: versIsoLocal(c.debut), end: versIsoLocal(c.fin) }));
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Formations inter</h1>
          <p className="mt-1 text-sm text-muted">Choisissez une session et inscrivez-vous en un clic.</p>
        </div>
        <div className="inline-flex rounded-lg border border-line bg-surface p-1 text-sm" role="tablist" aria-label="Affichage">
          {(["liste", "calendrier"] as const).map((v) => (
            <Link
              key={v}
              href={lienVue(f, v)}
              role="tab"
              aria-selected={vue === v}
              className={`rounded-md px-3 py-1.5 ${vue === v ? "bg-accent-soft font-medium text-accent" : "text-muted hover:text-ink"}`}
            >
              {v === "liste" ? "Liste" : "Calendrier"}
            </Link>
          ))}
        </div>
      </div>

      <form className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6" method="get">
        <input type="hidden" name="vue" value={vue} />
        <div className="lg:col-span-2">
          <label className="label" htmlFor="q">Recherche</label>
          <input id="q" name="q" defaultValue={f.q} placeholder="Intitulé, thème…" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="categorie">Catégorie</label>
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
            <input type="checkbox" name="dispo" value="1" defaultChecked={f.dispo === "1"} className="accent-[var(--accent)]" />
            Places disponibles
          </label>
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm flex-1" type="submit">Filtrer</button>
            <Link href={`/formations?vue=${vue}`} className="btn btn-secondary btn-sm">Effacer</Link>
          </div>
        </div>
      </form>

      {vue === "calendrier" ? (
        <Calendrier evenements={evenements} date={f.mois ? `${f.mois}-01` : undefined} />
      ) : liste.length === 0 ? (
        <p className="card p-8 text-center text-muted">Aucune formation ne correspond à ces critères.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {liste.map((fo) => (
            <li key={fo.slug} className="card flex flex-col overflow-hidden">
              {fo.fiche?.visuel_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fo.fiche.visuel_url} alt="" className="h-36 w-full object-cover" />
              )}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {fo.categorie && (
                      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: couleurCategorie(fo.idCategorie) }}>
                        {fo.categorie}
                      </p>
                    )}
                    <h2 className="mt-1 text-lg font-semibold">
                      <Link href={`/formations/${fo.slug}`} className="hover:text-accent">{fo.titre}</Link>
                    </h2>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted">
                  {fo.fiche?.resume || texteBrut(fo.sessions[0]?.descriptionHtml, 180) || "Programme détaillé à venir."}
                </p>
                <div className="mt-4 flex-1 space-y-2">
                  {fo.sessions.length === 0 && <p className="text-sm text-muted">Aucune session programmée pour le moment.</p>}
                  {fo.sessions.slice(0, 3).map((s) => (
                    <Link
                      key={s.id}
                      href={`/sessions/${s.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:border-accent"
                    >
                      <span>
                        {formatPeriode(s.debut, s.fin)}
                        {s.lieux[0]?.ville && <span className="text-muted"> · {s.lieux[0].ville}</span>}
                      </span>
                      {inscrit.has(s.id) ? (
                        <span className="badge bg-ok-soft text-ok">Inscrit</span>
                      ) : attentes.has(s.id) ? (
                        <span className="badge bg-warn-soft text-warn">En attente · n°{attentes.get(s.id)}</span>
                      ) : (
                        <BadgePlaces places={s.places} />
                      )}
                    </Link>
                  ))}
                  {fo.sessions.length > 3 && (
                    <Link href={`/formations/${fo.slug}`} className="text-sm text-accent hover:underline">
                      + {fo.sessions.length - 3} autre{fo.sessions.length - 3 > 1 ? "s" : ""} session{fo.sessions.length - 3 > 1 ? "s" : ""}
                    </Link>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
