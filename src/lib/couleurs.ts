// Couleurs des thématiques, reprises du site public WiAcademy (liseré des cartes, puce, bouton).
export type Theme = { couleur: string; fond: string; puce: string; libelle: string };

const THEMES = {
  ia: { couleur: "#e5007e", fond: "#fff0f8", puce: "#ffd6ee", libelle: "AI" },
  data: { couleur: "#2323c8", fond: "#f1f2ff", puce: "#dde0ff", libelle: "Data" },
  produit: { couleur: "#139a4a", fond: "#effbf3", puce: "#cff4dd", libelle: "Product" },
  design: { couleur: "#d4213d", fond: "#fff1f3", puce: "#ffd9df", libelle: "Design" },
  responsable: { couleur: "#0f8f86", fond: "#eefaf8", puce: "#cdf1ec", libelle: "Responsable" },
  autre: { couleur: "#461dc8", fond: "#f5f2ff", puce: "#e4dcff", libelle: "" },
} satisfies Record<string, Theme>;

// Catégories Dendreo connues (id_categorie_module).
const PAR_ID: Record<string, keyof typeof THEMES> = { "4": "produit", "5": "data", "6": "responsable", "7": "ia", "8": "design" };

const norm = (t: string) => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Thème d'une catégorie : d'abord par son nom (fiches BO), sinon par l'id Dendreo. */
export function themeCategorie(nom?: string | null, idCategorie?: string | null): Theme {
  const n = norm(nom ?? "");
  let cle: keyof typeof THEMES | undefined;
  if (/\b(ai|ia|genai|llm|gen ai)\b/.test(n)) cle = "ia";
  else if (/\bdata\b|sql/.test(n)) cle = "data";
  else if (/design|marketing/.test(n)) cle = "design";
  else if (/responsable/.test(n)) cle = "responsable";
  else if (/product|produit/.test(n)) cle = "produit";
  cle ??= PAR_ID[idCategorie ?? ""] ?? "autre";
  const t = THEMES[cle];
  return { ...t, libelle: t.libelle || nom || "" };
}

/** Couleur pleine (calendrier). */
export const couleurCategorie = (idCategorie: string, nom?: string) => themeCategorie(nom, idCategorie).couleur;
