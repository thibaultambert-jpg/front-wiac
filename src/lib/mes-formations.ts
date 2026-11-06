import "server-only";
import type { Utilisateur } from "./auth";
import { idEntrepriseDendreo } from "./config";
import { trouverParticipant } from "./dendreo/inscription";
import { dendreo, sessionsParIds } from "./dendreo/sessions";
import type { Session } from "./dendreo/types";
import { supabaseAdmin } from "./supabase/server";

/** Id participant Dendreo de l'utilisateur (mémorisé dans son profil dès qu'il est connu). */
export async function idParticipant(u: Utilisateur): Promise<string | null> {
  if (u.idParticipantDendreo) return u.idParticipantDendreo;
  const p = await trouverParticipant(dendreo(), u.email, idEntrepriseDendreo()).catch(() => null);
  if (!p) return null;
  const id = String(p.id_participant);
  await supabaseAdmin().from("profiles").update({ id_participant_dendreo: id }).eq("id", u.id);
  return id;
}

/** Sessions inter auxquelles l'utilisateur est inscrit dans Dendreo. */
export async function mesInscriptions(u: Utilisateur): Promise<Session[]> {
  const id = await idParticipant(u);
  if (!id) return [];
  const laps = await dendreo().list("laps.php", { id_participant: id, fields: "id_lap,id_action_de_formation" });
  const ids = [...new Set(laps.map((l) => String(l.id_action_de_formation)))];
  return sessionsParIds(ids);
}

/** Ids des sessions où l'utilisateur est inscrit (lecture directe, pour l'état des boutons). */
export async function idsSessionsInscrit(u: Utilisateur): Promise<Set<string>> {
  const id = await idParticipant(u);
  if (!id) return new Set();
  const laps = await dendreo().list("laps.php", { id_participant: id, fields: "id_lap,id_action_de_formation" });
  return new Set(laps.map((l) => String(l.id_action_de_formation)));
}
