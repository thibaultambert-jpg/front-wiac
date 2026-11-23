// Vue formateur : sessions INTER animées par l'utilisateur connecté et leurs inscrits.
// Le formateur est reconnu par l'email pro de sa fiche Dendreo (= email Google Workspace).
import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Utilisateur } from "./auth";
import { aujourdhui } from "./dendreo/dates";
import { animeSession, idsFormateurParEmail, idsSessionsAVenir, participantsDepuisLaps, type ParticipantInscrit } from "./dendreo/formateurs";
import { dendreo, sessionsParIds, TAG_SESSIONS } from "./dendreo/sessions";
import type { Session } from "./dendreo/types";

/** Annuaire des formateurs (id + email pro), peu volatil. */
const annuaireFormateurs = unstable_cache(
  async () => dendreo().list("formateurs.php", { fields: "id_formateur,email_pro" }),
  ["dendreo-formateurs-v1"],
  { revalidate: 3600, tags: ["dendreo-formateurs"] },
);

/** Ids des fiches formateur de l'utilisateur (vide s'il n'est pas formateur). Mis en cache pour la requête. */
export const idsFormateur = cache(async (email: string): Promise<string[]> => {
  const annuaire = await annuaireFormateurs().catch(() => []);
  return idsFormateurParEmail(annuaire, email);
});

export async function estFormateur(u: Utilisateur): Promise<boolean> {
  return (await idsFormateur(u.email)).length > 0;
}

export async function animeLaSession(u: Utilisateur, session: Session): Promise<boolean> {
  return animeSession(await idsFormateur(u.email), session);
}

/** Ids des sessions INTER non terminées d'une fiche formateur (cache 5 min). */
const sessionsDuFormateur = unstable_cache(
  async (idFormateur: string, jour: string) =>
    idsSessionsAVenir(
      await dendreo().list("actions_de_formation.php", { id_formateur: idFormateur, fields: "id_action_de_formation,type,date_fin" }),
      jour,
    ),
  ["dendreo-sessions-formateur-v1"],
  { revalidate: 300, tags: [TAG_SESSIONS] },
);

/** Sessions INTER en cours ou à venir animées par l'utilisateur, triées par date. */
export async function mesInterventions(u: Utilisateur): Promise<Session[]> {
  const ids = await idsFormateur(u.email);
  if (ids.length === 0) return [];
  const jour = aujourdhui();
  const idsAdf = (await Promise.all(ids.map((id) => sessionsDuFormateur(id, jour)))).flat();
  const sessions = await sessionsParIds(idsAdf);
  // Double contrôle : l'affectation doit aussi figurer sur les modules de la session.
  return sessions.filter((s) => animeSession(ids, s)).sort((a, b) => a.debut.localeCompare(b.debut));
}

/** Inscrits d'une session, lus en direct dans Dendreo. Réservé au formateur de la session (contrôle à faire par l'appelant). */
export async function participantsSession(idAdf: string): Promise<ParticipantInscrit[]> {
  const laps = await dendreo().list("laps.php", { id_action_de_formation: idAdf, include: "participant" });
  return participantsDepuisLaps(laps);
}
