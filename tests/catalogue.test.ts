import { describe, expect, it } from "vitest";
import { construireCatalogue, type Fiche } from "@/lib/catalogue/assembler";
import { assemblerSessions } from "@/lib/dendreo/assemblage";
import { brut } from "./fixtures";

const fiche = (p: Partial<Fiche>): Fiche => ({
  id: "f1", slug: "product-builder", titre: "Product Builder", resume: "", objectifs: "", programme_modules: [], niveau: "",
  categorie: "IA", publiee: true, ordre: 0, ...p,
});

describe("construireCatalogue", () => {
  const sessions = assemblerSessions(brut);

  it("sans fiche, une entrée par module avec un slug module-<id>", () => {
    const c = construireCatalogue(sessions, [], [], new Set());
    expect(c.map((f) => f.slug).sort()).toEqual(["module-48", "module-57"]);
    expect(c.find((f) => f.slug === "module-57")!.fiche).toBeNull();
  });

  it("regroupe sous la fiche publiée liée au module", () => {
    const c = construireCatalogue(sessions, [fiche({})], [{ id_module: "57", formation_id: "f1" }], new Set());
    const pb = c.find((f) => f.slug === "product-builder")!;
    expect(pb.sessions.map((s) => s.id)).toEqual(["353"]);
    expect(pb.titre).toBe("Product Builder");
  });

  it("une fiche non publiée ne masque pas les sessions", () => {
    const c = construireCatalogue(sessions, [fiche({ publiee: false })], [{ id_module: "57", formation_id: "f1" }], new Set());
    expect(c.some((f) => f.slug === "module-57")).toBe(true);
    expect(c.some((f) => f.slug === "product-builder")).toBe(false);
  });

  it("une fiche publiée sans session reste listée", () => {
    const c = construireCatalogue([], [fiche({})], [], new Set());
    expect(c).toHaveLength(1);
    expect(c[0].sessions).toEqual([]);
  });

  it("les modules ignorés sont masqués", () => {
    const c = construireCatalogue(sessions, [], [], new Set(["48"]));
    expect(c.map((f) => f.slug)).toEqual(["module-57"]);
  });
});

describe("tri du catalogue", () => {
  it("trie par niveau puis par ordre d'affichage, quelle que soit la date des sessions", () => {
    const fiches = [
      fiche({ id: "a", slug: "avance", titre: "Avancé", niveau: "avance", ordre: 1 }),
      fiche({ id: "i2", slug: "inter-2", titre: "Inter 2", niveau: "intermediaire", ordre: 20 }),
      fiche({ id: "d", slug: "debutant", titre: "Débutant", niveau: "debutant", ordre: 99 }),
      fiche({ id: "i1", slug: "inter-1", titre: "Inter 1", niveau: "intermediaire", ordre: 10 }),
      fiche({ id: "n", slug: "sans-niveau", titre: "Sans niveau", niveau: "", ordre: 0 }),
    ];
    // La session la plus proche (353, 1er déc.) est liée à la fiche « Avancé » : elle reste après les autres niveaux.
    const c = construireCatalogue(assemblerSessions(brut), fiches, [{ id_module: "57", formation_id: "a" }], new Set(["48"]));
    expect(c.map((f) => f.slug)).toEqual(["debutant", "inter-1", "inter-2", "avance", "sans-niveau"]);
  });
});
