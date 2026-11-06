import "server-only";
import sanitizeHtml from "sanitize-html";

/** HTML Dendreo ou Markdown rendu : on ne garde que la mise en forme, sans styles ni classes. */
export function nettoyerHtml(html: string | undefined | null): string {
  return sanitizeHtml(html ?? "", {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "a", "h2", "h3", "h4", "blockquote", "code", "pre", "hr", "img"],
    allowedAttributes: { a: ["href", "target", "rel"], img: ["src", "alt"] },
    allowedSchemes: ["https", "mailto"],
    transformTags: { a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }) },
  }).trim();
}

/** Texte brut (résumés de cartes). */
export function texteBrut(html: string | undefined | null, max = 220): string {
  const t = sanitizeHtml(html ?? "", { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  return t.length > max ? `${t.slice(0, max).replace(/\s+\S*$/, "")}…` : t;
}
