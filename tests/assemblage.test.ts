import { describe, expect, it } from "vitest";
import { assemblerSessions } from "@/lib/dendreo/assemblage";
import { brut } from "./fixtures";

describe("assemblerSessions", () => {
  const sessions = assemblerSessions(brut);

  it("ne garde que les sessions inter, triées par date", () => {
    expect(sessions.map((s) => s.id)).toEqual(["353", "352"]);
  });

  it("assemble créneaux triés, lieu, formateurs, catégorie et places", () => {
    const pb = sessions.find((s) => s.id === "353")!;
    expect(pb.creneaux.map((c) => c.id)).toEqual(["2350", "2351"]);
    expect(pb.lieux.map((l) => l.ville)).toEqual(["Paris"]);
    expect(pb.formateurs).toEqual(["Brian Ridolce"]);
    expect(pb.categorie).toBe("AI");
    expect(pb.modules).toEqual([{ id: "57", intitule: "WIVOO - Product Builder", mode: "presentiel" }]);
    expect(pb.places).toMatchObject({ complet: true, inscrits: 11, max: 8 });
  });

  it("ignore les listes vides au format Dendreo ([[]])", () => {
    expect(sessions.find((s) => s.id === "352")!.formateurs).toEqual([]);
  });

  it("masque les étapes demandées", () => {
    expect(assemblerSessions(brut, new Set(["6"]))).toEqual([]);
  });
});
