import type { Places } from "./types";

const entier = (v: unknown) => {
  const n = Number.parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/**
 * Places d'une action de formation Dendreo. `nb_participants_max` à 0 (ou vide) = pas de limite.
 * `total_participants` compte tous les inscrits (y compris non identifiés) : c'est lui qui remplit la session.
 */
export function calculerPlaces(adf: Record<string, unknown>): Places {
  const max = entier(adf.nb_participants_max);
  const min = entier(adf.nb_participants_min);
  const inscrits = entier(adf.total_participants ?? adf.nb_participants_inscrits);
  const restantes = max > 0 ? Math.max(0, max - inscrits) : null;
  return { min, max, inscrits, restantes, complet: max > 0 && inscrits >= max };
}
