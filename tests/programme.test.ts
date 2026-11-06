import { describe, expect, it } from "vitest";
import { estHtml, modulesDeFiche, normaliserModules } from "@/lib/programme";

describe("normaliserModules", () => {
  it("accepte le JSON de l'éditeur et garde la mise en forme", () => {
    const r = normaliserModules(
      JSON.stringify([
        { titre: " Qui est le Product Builder ? ", sous_titre: "Comprendre le rôle", contenu: "<p><strong>Objectif :</strong></p><ul><li>Un</li></ul><ol><li>Deux</li></ol>" },
      ]),
    );
    expect(r).toEqual({
      ok: true,
      modules: [{ titre: "Qui est le Product Builder ?", sous_titre: "Comprendre le rôle", contenu: "<p><strong>Objectif :</strong></p><ul><li>Un</li></ul><ol><li>Deux</li></ol>" }],
    });
  });

  it("retire le HTML dangereux", () => {
    const r = normaliserModules([{ titre: "A", contenu: '<p onclick="x()">ok</p><script>alert(1)</script><a href="javascript:alert(1)">lien</a>' }]);
    expect(r.ok && r.modules[0].contenu).toBe('<p>ok</p><a target="_blank" rel="noopener noreferrer">lien</a>');
  });

  it("ignore les modules vides et exige un titre sinon", () => {
    expect(normaliserModules([{ titre: "", sous_titre: "", contenu: "<p></p>" }])).toEqual({ ok: true, modules: [] });
    expect(normaliserModules([{ titre: "", contenu: "<p>du texte</p>" }])).toEqual({ ok: false, message: "Module 1 : le titre est obligatoire." });
  });

  it("refuse un JSON illisible ou trop de modules", () => {
    expect(normaliserModules("{oups")).toMatchObject({ ok: false });
    expect(normaliserModules(Array.from({ length: 31 }, () => ({ titre: "x" })))).toMatchObject({ ok: false });
  });
});

describe("lecture", () => {
  it("modulesDeFiche tolère des données inattendues", () => {
    expect(modulesDeFiche(null)).toEqual([]);
    expect(modulesDeFiche([{ titre: "A" }, { sous_titre: "sans titre" }, 3])).toEqual([{ titre: "A", sous_titre: "", contenu: "" }]);
  });
  it("estHtml distingue HTML et Markdown", () => {
    expect(estHtml("<p>x</p>")).toBe(true);
    expect(estHtml("**x**")).toBe(false);
  });
});
