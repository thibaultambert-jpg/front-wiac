// Regroupe les sessions Dendreo par « formation » affichée : fiche du BO si le module y est lié
// (et publiée), sinon une fiche par défaut construite depuis le module Dendreo.
import type { Session } from "../dendreo/types";

export type Fiche = {
  id: string;
  slug: string;
  titre: string;
  resume: string;
  objectifs: string;
  programme_modules: unknown;
  niveau: "" | "debutant" | "intermediaire" | "avance";
  categorie: string;
  publiee: boolean;
  ordre: number;
};

export type FormationCatalogue = {
  slug: string;
  titre: string;
  categorie: string;
  idCategorie: string;
  fiche: Fiche | null;
  idModules: string[];
  sessions: Session[];
};

/** « WIVOO - Data for PM 2 » → « Data for PM 2 » (préfixe interne de Dendreo). */
export const titreSansPrefixe = (t: string) => t.replace(/^WIVOO\s*[-–]\s*/i, "").trim() || t;

export const slugModule = (idModule: string) => `module-${idModule}`;

export function construireCatalogue(
  sessions: Session[],
  fiches: Fiche[],
  liens: { id_module: string; formation_id: string }[],
  modulesIgnores: Set<string>,
): FormationCatalogue[] {
  const fichesPubliees = new Map(fiches.filter((f) => f.publiee).map((f) => [f.id, f]));
  const ficheParModule = new Map<string, Fiche>();
  for (const l of liens) {
    const f = fichesPubliees.get(l.formation_id);
    if (f) ficheParModule.set(l.id_module, f);
  }

  const parCle = new Map<string, FormationCatalogue>();
  const entree = (cle: string, init: () => FormationCatalogue) => {
    let e = parCle.get(cle);
    if (!e) parCle.set(cle, (e = init()));
    return e;
  };

  // Fiches publiées, même sans session à venir.
  for (const f of fichesPubliees.values()) {
    entree(f.slug, () => ({
      slug: f.slug,
      titre: f.titre,
      categorie: f.categorie,
      idCategorie: "",
      fiche: f,
      idModules: liens.filter((l) => l.formation_id === f.id).map((l) => l.id_module),
      sessions: [],
    }));
  }

  for (const session of sessions) {
    const ids = session.modules.map((m) => m.id);
    if (ids.length > 0 && ids.every((m) => modulesIgnores.has(m))) continue;
    const fiche = ids.map((m) => ficheParModule.get(m)).find(Boolean);
    let e: FormationCatalogue;
    if (fiche) {
      e = parCle.get(fiche.slug)!;
    } else {
      const mod = session.modules.find((m) => !modulesIgnores.has(m.id));
      const cle = mod ? slugModule(mod.id) : `session-${session.id}`;
      e = entree(cle, () => ({
        slug: cle,
        titre: titreSansPrefixe(mod?.intitule || session.intitule),
        categorie: session.categorie,
        idCategorie: session.idCategorie,
        fiche: null,
        idModules: mod ? [mod.id] : [],
        sessions: [],
      }));
    }
    if (!e.idCategorie) e.idCategorie = session.idCategorie;
    if (!e.categorie) e.categorie = session.categorie;
    e.sessions.push(session);
  }

  return [...parCle.values()].sort((a, b) => {
    const da = a.sessions[0]?.debut ?? "9999";
    const db = b.sessions[0]?.debut ?? "9999";
    return da.localeCompare(db) || (a.fiche?.ordre ?? 0) - (b.fiche?.ordre ?? 0) || a.titre.localeCompare(b.titre, "fr");
  });
}
