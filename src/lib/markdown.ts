import "server-only";
import { marked } from "marked";
import { nettoyerHtml } from "./dendreo/html";

/** Markdown saisi dans le BO → HTML nettoyé. */
export function markdownVersHtml(md: string | null | undefined): string {
  if (!md?.trim()) return "";
  return nettoyerHtml(marked.parse(md, { async: false, gfm: true, breaks: true }) as string);
}

