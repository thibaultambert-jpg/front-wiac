// Indicateurs du tableau de bord (fonctions pures, testées).
import type { Session } from "./dendreo/types";

export type LigneSession = {
  id: string;
  intitule: string;
  debut: string;
  fin: string;
  inscrits: number;
  max: number;
  min: number;
  remplissage: number | null; // 0..1, null si pas de limite
  attente: number;
  sousMinimum: boolean;
};

export function lignesSessions(sessions: Session[], attente: Map<string, number>): LigneSession[] {
  return sessions.map((s) => ({
    id: s.id,
    intitule: s.intitule,
    debut: s.debut,
    fin: s.fin,
    inscrits: s.places.inscrits,
    max: s.places.max,
    min: s.places.min,
    remplissage: s.places.max > 0 ? s.places.inscrits / s.places.max : null,
    attente: attente.get(s.id) ?? 0,
    sousMinimum: s.places.min > 0 && s.places.inscrits < s.places.min,
  }));
}

export function indicateurs(lignes: LigneSession[]) {
  const limitees = lignes.filter((l) => l.max > 0);
  const places = limitees.reduce((t, l) => t + l.max, 0);
  const occupees = limitees.reduce((t, l) => t + Math.min(l.inscrits, l.max), 0);
  return {
    sessions: lignes.length,
    inscrits: lignes.reduce((t, l) => t + l.inscrits, 0),
    placesRestantes: limitees.reduce((t, l) => t + Math.max(0, l.max - l.inscrits), 0),
    remplissageMoyen: places > 0 ? occupees / places : null,
    enAttente: lignes.reduce((t, l) => t + l.attente, 0),
    completes: limitees.filter((l) => l.inscrits >= l.max).length,
    sousMinimum: lignes.filter((l) => l.sousMinimum).length,
  };
}

/** Nombre d'événements par mois (AAAA-MM) sur les `n` derniers mois, du plus ancien au plus récent. */
export function parMois(dates: string[], n: number, maintenant = new Date()): { mois: string; total: number }[] {
  const res: { mois: string; total: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth() - i, 1));
    res.push({ mois: d.toISOString().slice(0, 7), total: 0 });
  }
  const index = new Map(res.map((r, i) => [r.mois, i]));
  for (const d of dates) {
    const i = index.get(d.slice(0, 7));
    if (i !== undefined) res[i].total++;
  }
  return res;
}

/** Échappement CSV (séparateur « ; » pour Excel FR). */
export function csv(lignes: (string | number | null)[][]): string {
  const cell = (v: string | number | null) => {
    const t = v === null ? "" : String(v);
    return /[";\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  return "﻿" + lignes.map((l) => l.map(cell).join(";")).join("\r\n");
}
