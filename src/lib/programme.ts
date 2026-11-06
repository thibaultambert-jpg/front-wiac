// Programme d'une fiche : liste de modules affichés en accordéon (titre, sous-titre, contenu riche).
import { z } from "zod";
import { nettoyerHtml } from "./dendreo/html";

export type ModuleProgramme = { titre: string; sous_titre: string; contenu: string };

const MODULE = z.object({
  titre: z.string().trim().max(200),
  sous_titre: z.string().trim().max(400).default(""),
  contenu: z.string().max(50000).default(""),
});

/**
 * Valide le JSON envoyé par l'éditeur et nettoie le HTML de chaque module.
 * Les modules entièrement vides sont ignorés ; un module avec du contenu mais sans titre est refusé.
 */
export function normaliserModules(json: unknown): { ok: true; modules: ModuleProgramme[] } | { ok: false; message: string } {
  let brut: unknown = json;
  if (typeof json === "string") {
    try {
      brut = json.trim() ? JSON.parse(json) : [];
    } catch {
      return { ok: false, message: "Programme illisible." };
    }
  }
  const parse = z.array(MODULE).max(30, "30 modules maximum.").safeParse(brut);
  if (!parse.success) return { ok: false, message: parse.error.issues[0]?.message ?? "Programme invalide." };
  const modules: ModuleProgramme[] = [];
  for (const [i, m] of parse.data.entries()) {
    const contenu = nettoyerHtml(m.contenu).replace(/^<p><\/p>$/, "");
    if (!m.titre && !m.sous_titre && !contenu) continue;
    if (!m.titre) return { ok: false, message: `Module ${i + 1} : le titre est obligatoire.` };
    modules.push({ titre: m.titre, sous_titre: m.sous_titre, contenu });
  }
  return { ok: true, modules };
}

/** Lecture tolérante de la colonne jsonb (données déjà nettoyées à l'enregistrement). */
export function modulesDeFiche(v: unknown): ModuleProgramme[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((m): m is Record<string, unknown> => !!m && typeof m === "object")
    .map((m) => ({ titre: String(m.titre ?? ""), sous_titre: String(m.sous_titre ?? ""), contenu: String(m.contenu ?? "") }))
    .filter((m) => m.titre);
}

/** Texte saisi en WYSIWYG (HTML) ou ancien contenu Markdown. */
export const estHtml = (t: string | null | undefined) => !!t && t.trim().startsWith("<");
