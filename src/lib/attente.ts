// Liste d'attente (Supabase). La position affichée est le rang parmi les lignes « en_attente ».
import "server-only";
import { supabaseAdmin } from "./supabase/server";

export type LigneAttente = {
  id: string;
  id_action_de_formation: string;
  user_id: string;
  position: number;
  statut: "en_attente" | "promu" | "retire";
  commentaire: string;
  created_at: string;
  profil?: { email: string; prenom: string; nom: string } | null;
};

/** Rang 1..n des lignes en attente, triées par position puis date d'ajout. */
export function rangs<T extends Pick<LigneAttente, "position" | "created_at" | "statut">>(lignes: T[]): (T & { rang: number })[] {
  return lignes
    .filter((l) => l.statut === "en_attente")
    .sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at))
    .map((l, i) => ({ ...l, rang: i + 1 }));
}

export async function attenteSession(idAdf: string): Promise<(LigneAttente & { rang: number })[]> {
  const { data, error } = await supabaseAdmin()
    .from("liste_attente")
    .select("*, profil:profiles(email, prenom, nom)")
    .eq("id_action_de_formation", idAdf)
    .eq("statut", "en_attente");
  if (error) throw error;
  return rangs((data ?? []) as LigneAttente[]);
}

/** Positions de l'utilisateur dans chaque liste d'attente où il figure (clé = id session). */
export async function attentesUtilisateur(userId: string): Promise<Map<string, number>> {
  const db = supabaseAdmin();
  const { data: siennes, error } = await db.from("liste_attente").select("id_action_de_formation").eq("user_id", userId).eq("statut", "en_attente");
  if (error) throw error;
  const ids = (siennes ?? []).map((r) => r.id_action_de_formation as string);
  if (ids.length === 0) return new Map();
  const { data: toutes, error: e2 } = await db
    .from("liste_attente")
    .select("id_action_de_formation, user_id, position, created_at, statut")
    .in("id_action_de_formation", ids)
    .eq("statut", "en_attente");
  if (e2) throw e2;
  const res = new Map<string, number>();
  for (const id of ids) {
    const r = rangs((toutes ?? []).filter((l) => l.id_action_de_formation === id) as LigneAttente[]).find((l) => l.user_id === userId);
    if (r) res.set(id, r.rang);
  }
  return res;
}

/** Nombre de personnes en attente par session. */
export async function comptesAttente(): Promise<Map<string, number>> {
  const { data, error } = await supabaseAdmin().from("liste_attente").select("id_action_de_formation").eq("statut", "en_attente");
  if (error) throw error;
  const m = new Map<string, number>();
  for (const r of data ?? []) m.set(r.id_action_de_formation, (m.get(r.id_action_de_formation) ?? 0) + 1);
  return m;
}

export async function rejoindre(idAdf: string, userId: string, commentaire = ""): Promise<void> {
  const db = supabaseAdmin();
  const { data: dernier } = await db
    .from("liste_attente")
    .select("position")
    .eq("id_action_de_formation", idAdf)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const position = (dernier?.position ?? 0) + 1;
  // Une ligne retirée ou promue peut être réactivée : elle repart en fin de liste.
  const { error } = await db
    .from("liste_attente")
    .upsert(
      { id_action_de_formation: idAdf, user_id: userId, position, statut: "en_attente", commentaire, created_at: new Date().toISOString() },
      { onConflict: "id_action_de_formation,user_id" },
    );
  if (error) throw error;
}

export async function changerStatut(idLigne: string, statut: LigneAttente["statut"]): Promise<LigneAttente | null> {
  const { data, error } = await supabaseAdmin().from("liste_attente").update({ statut }).eq("id", idLigne).select("*").maybeSingle();
  if (error) throw error;
  return data as LigneAttente | null;
}

export async function quitter(idAdf: string, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin()
    .from("liste_attente")
    .update({ statut: "retire" })
    .eq("id_action_de_formation", idAdf)
    .eq("user_id", userId)
    .eq("statut", "en_attente")
    .select("id");
  if (error) throw error;
  return (data ?? []).length > 0;
}

/** Réordonne la liste d'une session selon l'ordre d'ids donné. */
export async function reordonner(idAdf: string, ids: string[]): Promise<void> {
  const db = supabaseAdmin();
  const results = await Promise.all(
    ids.map((id, i) => db.from("liste_attente").update({ position: i + 1 }).eq("id", id).eq("id_action_de_formation", idAdf)),
  );
  const erreur = results.find((r) => r.error)?.error;
  if (erreur) throw erreur;
}
