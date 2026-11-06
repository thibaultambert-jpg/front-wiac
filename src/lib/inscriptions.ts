// Orchestration des inscriptions : Dendreo + profil + journal + cache.
import "server-only";
import { updateTag } from "next/cache";
import { idEntrepriseDendreo } from "./config";
import { aujourdhui } from "./dendreo/dates";
import { desinscrire, inscrire, type ResultatInscription } from "./dendreo/inscription";
import { dendreo, TAG_SESSIONS } from "./dendreo/sessions";
import { journaliser } from "./journal";
import { supabaseAdmin } from "./supabase/server";

type Profil = { id: string; email: string; prenom: string; nom: string };

export async function inscrireProfil(
  profil: Profil,
  idAdf: string,
  opts: { acteur: string; forcer?: boolean; via?: string },
): Promise<ResultatInscription> {
  const res = await inscrire(dendreo(), {
    idAdf,
    personne: { email: profil.email, prenom: profil.prenom, nom: profil.nom },
    idEntreprise: idEntrepriseDendreo(),
    aujourdhui: aujourdhui(),
    forcer: opts.forcer,
  });
  await supabaseAdmin().from("profiles").update({ id_participant_dendreo: res.idParticipant }).eq("id", profil.id);
  if (res.statut === "inscrit") {
    updateTag(TAG_SESSIONS);
    await journaliser({
      acteur: opts.acteur,
      action: "inscription",
      idAdf,
      cible: profil.email,
      details: { id_lap: res.idLap, participant_cree: res.participantCree, via: opts.via ?? "portail", forcee: !!opts.forcer },
    });
  }
  return res;
}

export async function desinscrireProfil(profil: Profil & { idParticipantDendreo: string | null }, idAdf: string, acteur: string): Promise<void> {
  if (!profil.idParticipantDendreo) throw new Error("Aucune fiche participant Dendreo liée à ce compte.");
  const idLap = await desinscrire(dendreo(), { idAdf, idParticipant: profil.idParticipantDendreo, aujourdhui: aujourdhui() });
  updateTag(TAG_SESSIONS);
  await journaliser({ acteur, action: "desinscription", idAdf, cible: profil.email, details: { id_lap: idLap } });
}
