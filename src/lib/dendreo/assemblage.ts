// Assemblage des données brutes Dendreo en sessions affichables (fonctions pures, testées).
import type { Row } from "./client";
import { calculerPlaces } from "./places";
import type { Creneau, Session } from "./types";

export const s = (v: unknown) => (v === undefined || v === null ? "" : String(v));
const id = (v: unknown) => {
  const t = s(v);
  return t && t !== "0" ? t : null;
};

/** Dendreo renvoie parfois `[[]]` pour une liste vide : on ne garde que les objets. */
const objets = (v: unknown): Row[] => (Array.isArray(v) ? v.filter((x): x is Row => !!x && typeof x === "object" && !Array.isArray(x)) : []);

export type DonneesBrutes = {
  adfs: Row[];
  lams: Row[];
  creneaux: Row[];
  categories: Row[];
};

/** Assemble actions de formation, modules (lams) et créneaux. Fonction pure (testée). */
export function assemblerSessions(d: DonneesBrutes, etapesMasquees: Set<string> = new Set()): Session[] {
  const categories = new Map(d.categories.map((r) => [s(r.id_categorie_module), s(r.intitule)]));
  const lamsParAdf = groupe(d.lams, (r) => s(r.id_action_de_formation));
  const creneauxParAdf = groupe(d.creneaux, (r) => s(r.id_action_de_formation));

  return d.adfs
    .filter((a) => s(a.type) === "inter" && !etapesMasquees.has(s(a.id_etape_process)))
    .map((a): Session => {
      const idAdf = s(a.id_action_de_formation);
      const lams = lamsParAdf.get(idAdf) ?? [];
      const creneaux: Creneau[] = (creneauxParAdf.get(idAdf) ?? [])
        .map((c) => ({ id: s(c.id_creneau), debut: s(c.date_debut), fin: s(c.date_fin), nom: s(c.name).trim() }))
        .sort((x, y) => x.debut.localeCompare(y.debut));

      const formateurs = new Set<string>();
      for (const l of lams) {
        for (const f of objets(l.formateurs)) {
          const nom = `${s(f.prenom)} ${s(f.nom)}`.trim() || s(f.nom_complet);
          if (nom) formateurs.add(nom);
        }
      }

      const idCategorie = s(a.categorie_module_id) || s(objets(lams.map((l) => l.module))[0]?.id_categorie_module);
      const modes = [...new Set(lams.map((l) => s(l.mode_organisation)).filter(Boolean))];

      return {
        id: idAdf,
        numero: s(a.numero_complet),
        intitule: s(a.intitule),
        descriptionHtml: s(a.description),
        debut: s(a.date_debut),
        fin: s(a.date_fin),
        idEtape: s(a.id_etape_process),
        idCategorie,
        categorie: categories.get(idCategorie) ?? "",
        modules: lams.map((l) => ({ id: s(l.id_module), intitule: s(l.intitule_module) || s(l.intitule), mode: s(l.mode_organisation) })),
        modes,
        formateurs: [...formateurs],
        creneaux,
        places: calculerPlaces(a),
      };
    })
    .sort((x, y) => x.debut.localeCompare(y.debut));
}

function groupe<T>(rows: T[], cle: (r: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const r of rows) {
    const k = cle(r);
    m.set(k, [...(m.get(k) ?? []), r]);
  }
  return m;
}

