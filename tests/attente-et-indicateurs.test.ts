import { describe, expect, it } from "vitest";
import { rangs } from "@/lib/attente";
import { assemblerSessions } from "@/lib/dendreo/assemblage";
import { csv, indicateurs, lignesSessions, parMois } from "@/lib/tableau-de-bord";
import { brut } from "./fixtures";

describe("rangs de la liste d'attente", () => {
  it("ordonne par position puis date et ignore les lignes promues/retirées", () => {
    const r = rangs([
      { id: "a", position: 2, created_at: "2026-11-01", statut: "en_attente" as const },
      { id: "b", position: 1, created_at: "2026-11-03", statut: "en_attente" as const },
      { id: "c", position: 1, created_at: "2026-11-02", statut: "en_attente" as const },
      { id: "d", position: 0, created_at: "2026-11-01", statut: "promu" as const },
    ]);
    expect(r.map((l) => [l.id, l.rang])).toEqual([["c", 1], ["b", 2], ["a", 3]]);
  });
});

describe("tableau de bord", () => {
  const lignes = lignesSessions(assemblerSessions(brut), new Map([["353", 3]]));
  it("calcule les indicateurs", () => {
    expect(indicateurs(lignes)).toMatchObject({ sessions: 2, completes: 1, enAttente: 3, placesRestantes: 2, sousMinimum: 0 });
    expect(indicateurs(lignes).remplissageMoyen).toBeCloseTo(14 / 16);
  });
  it("compte par mois", () => {
    expect(parMois(["2026-11-02T10:00:00Z", "2026-11-20T10:00:00Z", "2026-09-01T00:00:00Z", "2025-01-01"], 3, new Date("2026-11-06T00:00:00Z"))).toEqual([
      { mois: "2026-09", total: 1 },
      { mois: "2026-10", total: 0 },
      { mois: "2026-11", total: 2 },
    ]);
  });
  it("échappe le CSV", () => {
    expect(csv([["a;b", 'c"d', null, 3]])).toBe('﻿"a;b";"c""d";;3');
  });
});
