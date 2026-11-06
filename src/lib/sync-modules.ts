import "server-only";
import { dendreo } from "./dendreo/sessions";
import { supabaseAdmin } from "./supabase/server";

/** Recopie la liste des modules Dendreo dans `modules_detectes` (sans toucher au statut « ignoré »). */
export async function synchroniserModules(): Promise<{ total: number; nouveaux: number }> {
  const client = dendreo();
  const [modules, categories] = await Promise.all([
    client.list("modules.php", { fields: "id_module,intitule,numero_complet,id_categorie_module,catalogue" }),
    client.list("categories_module.php", { fields: "id_categorie_module,intitule" }),
  ]);
  const nomsCategories = new Map(categories.map((c) => [String(c.id_categorie_module), String(c.intitule ?? "")]));
  const db = supabaseAdmin();
  const { data: existants, error: e1 } = await db.from("modules_detectes").select("id_module");
  if (e1) throw e1;
  const connus = new Set((existants ?? []).map((r) => String(r.id_module)));
  const lignes = modules
    .filter((m) => m.id_module)
    .map((m) => {
      const cat = String(m.id_categorie_module ?? "");
      return {
        id_module: String(m.id_module),
        intitule: String(m.intitule ?? ""),
        numero_complet: String(m.numero_complet ?? ""),
        id_categorie_module: cat,
        categorie: nomsCategories.get(cat) ?? "",
        catalogue: String(m.catalogue ?? "1") === "1",
        vu_le: new Date().toISOString(),
      };
    });
  if (lignes.length > 0) {
    const { error } = await db.from("modules_detectes").upsert(lignes, { onConflict: "id_module" });
    if (error) throw error;
  }
  return { total: lignes.length, nouveaux: lignes.filter((l) => !connus.has(l.id_module)).length };
}
