// Couleurs de catégories, lisibles en texte blanc dans les deux thèmes.
const PALETTE = ["#c2255c", "#1971c2", "#2b8a3e", "#e8590c", "#6741d9", "#0c8599", "#a61e4d", "#5c940d"];

export function couleurCategorie(idCategorie: string): string {
  const n = Number.parseInt(idCategorie, 10);
  return PALETTE[(Number.isFinite(n) ? n : 0) % PALETTE.length];
}
