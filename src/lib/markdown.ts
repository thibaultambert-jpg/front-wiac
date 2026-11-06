import "server-only";
import { marked } from "marked";
import { nettoyerHtml } from "./dendreo/html";

/** Markdown saisi dans le BO → HTML nettoyé. */
export function markdownVersHtml(md: string | null | undefined): string {
  if (!md?.trim()) return "";
  return nettoyerHtml(marked.parse(md, { async: false, gfm: true, breaks: true }) as string);
}

/**
 * Programme découpé en modules sur les titres « ## » (affiché en accordéon numéroté).
 * Renvoie null s'il n'y a pas de titre : le programme est alors affiché tel quel.
 */
export function decouperProgramme(md: string | null | undefined): { titre: string; html: string }[] | null {
  if (!md?.trim() || !/^##\s+/m.test(md)) return null;
  const blocs = md.split(/^##\s+/m).slice(1);
  return blocs.map((b) => {
    const [titre, ...reste] = b.split("\n");
    return { titre: titre.trim(), html: markdownVersHtml(reste.join("\n")) };
  });
}
