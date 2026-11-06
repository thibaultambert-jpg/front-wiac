/** N'accepte qu'un chemin interne (« /… », pas « //… ») pour éviter les redirections ouvertes. */
export function cheminInterne(v: unknown, defaut = "/formations"): string {
  if (typeof v !== "string" || !v.startsWith("/") || v.startsWith("//") || v.startsWith("/\\")) return defaut;
  return v;
}
