import { describe, expect, it } from "vitest";
import { construireCatalogue, type Fiche } from "@/lib/catalogue/assembler";
import { assemblerSessions } from "@/lib/dendreo/assemblage";
import { brut } from "./fixtures";

const fiche = (p: Partial<Fiche>): Fiche => ({
  id: "f1", slug: "product-builder", titre: "Product Builder", resume: "", contenu: "", objectifs: "", public_cible: "", prerequis: "",
  programme: "", duree: "", niveau: "", modalites: "", visuel_url: null, categorie: "IA", publiee: true, ordre: 0, ...p,
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
