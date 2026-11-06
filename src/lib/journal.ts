import "server-only";
import { supabaseAdmin } from "./supabase/server";

export type ActionJournal =
  | "inscription"
  | "desinscription"
  | "attente_ajout"
  | "attente_retrait"
  | "attente_promotion"
  | "attente_reordonnee"
  | "fiche_enregistree"
  | "fiche_supprimee"
  | "module_lie"
  | "module_delie"
  | "module_ignore"
  | "synchronisation";

export async function journaliser(e: {
  acteur: string;
  action: ActionJournal;
  idAdf?: string;
  cible?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("journal")
    .insert({ acteur_email: e.acteur, action: e.action, id_action_de_formation: e.idAdf ?? null, cible_email: e.cible ?? null, details: e.details ?? {} });
  if (error) console.error("Journal non écrit :", error.message);
}
