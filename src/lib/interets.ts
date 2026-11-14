// « La formation m'intéresse » (formations sans session programmée).
import "server-only";
import { supabaseAdmin } from "./supabase/server";

export async function estInteresse(formationId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin().from("interets").select("id").eq("formation_id", formationId).eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return !!data;
}

/** Ajoute ou retire l'intérêt ; renvoie le nouvel état. */
export async function basculerInteret(formationId: string, userId: string): Promise<boolean> {
  const db = supabaseAdmin();
  if (await estInteresse(formationId, userId)) {
    const { error } = await db.from("interets").delete().eq("formation_id", formationId).eq("user_id", userId);
    if (error) throw error;
    return false;
  }
  const { error } = await db.from("interets").insert({ formation_id: formationId, user_id: userId });
  if (error && error.code !== "23505") throw error;
  return true;
}

export type InteretFormation = {
  formationId: string;
  titre: string;
  slug: string;
  personnes: { nom: string; email: string; depuis: string }[];
};

/** Formations avec au moins un intérêt, les plus demandées d'abord. */
export async function interetsParFormation(): Promise<InteretFormation[]> {
  const { data, error } = await supabaseAdmin()
    .from("interets")
    .select("created_at, formation:formations(id, titre, slug), profil:profiles(email, prenom, nom)")
    .order("created_at");
  if (error) throw error;
  const parFormation = new Map<string, InteretFormation>();
  for (const r of data ?? []) {
    const f = (Array.isArray(r.formation) ? r.formation[0] : r.formation) as { id: string; titre: string; slug: string } | null;
    const p = (Array.isArray(r.profil) ? r.profil[0] : r.profil) as { email: string; prenom: string; nom: string } | null;
    if (!f || !p) continue;
    const e = parFormation.get(f.id) ?? { formationId: f.id, titre: f.titre, slug: f.slug, personnes: [] };
    e.personnes.push({ nom: `${p.prenom} ${p.nom}`.trim(), email: p.email, depuis: r.created_at });
    parFormation.set(f.id, e);
  }
  return [...parFormation.values()].sort((a, b) => b.personnes.length - a.personnes.length || a.titre.localeCompare(b.titre, "fr"));
}
