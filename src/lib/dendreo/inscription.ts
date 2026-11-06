// Inscription / désinscription d'un interne à une session INTER dans Dendreo.
// Reprend la logique de MCP-Dendreo (src/tools/inscriptions.ts) : participant retrouvé par email,
// créé s'il n'existe pas, contrôle « déjà inscrit », puis création du lap.
// Sans cache : les places sont relues en direct juste avant d'écrire.
import type { Query, Row } from "./client";
import { calculerPlaces } from "./places";

export type ClientDendreo = {
  list(endpoint: string, query?: Query): Promise<Row[]>;
  post(endpoint: string, body: Row): Promise<unknown>;
  delete(endpoint: string, query: Query): Promise<unknown>;
};

export type Personne = { email: string; prenom: string; nom: string };

export class InscriptionImpossible extends Error {
  constructor(
    message: string,
    readonly code: "session_introuvable" | "pas_inter" | "deja_commencee" | "complet" | "participant_ambigu" | "non_inscrit",
  ) {
    super(message);
  }
}

export type ResultatInscription = {
  statut: "inscrit" | "deja_inscrit";
  idParticipant: string;
  idLap?: string;
  participantCree: boolean;
};

const s = (v: unknown) => (v === undefined || v === null ? "" : String(v));

/** Session lue en direct (sans cache) pour connaître les places réelles. */
export async function lireSession(client: ClientDendreo, idAdf: string): Promise<Row> {
  const [adf] = await client.list("actions_de_formation.php", {
    id: idAdf,
    fields: "id_action_de_formation,type,intitule,date_debut,date_fin,nb_participants_min,nb_participants_max,total_participants,nb_participants_inscrits",
  });
  if (!adf || s(adf.id_action_de_formation) !== idAdf) throw new InscriptionImpossible("Session introuvable dans Dendreo.", "session_introuvable");
  return adf;
}

/**
 * Participant Dendreo correspondant à l'email. Plusieurs fiches avec le même email : on prend
 * celle rattachée à l'entreprise, sinon on refuse (à corriger dans Dendreo).
 */
export async function trouverParticipant(client: ClientDendreo, email: string, idEntreprise: string): Promise<Row | null> {
  const rows = (await client.list("participants.php", { email, fields: "id_participant,nom,prenom,email,id_entreprise" })).filter(
    (r) => s(r.email).trim().toLowerCase() === email.toLowerCase(),
  );
  if (rows.length <= 1) return rows[0] ?? null;
  const memeEntreprise = rows.filter((r) => s(r.id_entreprise) === idEntreprise);
  if (memeEntreprise.length === 1) return memeEntreprise[0];
  throw new InscriptionImpossible(
    "Plusieurs fiches participant Dendreo portent votre email : l'équipe formation doit les fusionner.",
    "participant_ambigu",
  );
}

export async function trouverOuCreerParticipant(
  client: ClientDendreo,
  personne: Personne,
  idEntreprise: string,
): Promise<{ idParticipant: string; cree: boolean }> {
  const existant = await trouverParticipant(client, personne.email, idEntreprise);
  if (existant) return { idParticipant: s(existant.id_participant), cree: false };
  const cree = (await client.post("participants.php", {
    email: personne.email,
    prenom: personne.prenom || personne.email.split("@")[0],
    nom: personne.nom || personne.email.split("@")[0],
    ...(idEntreprise ? { id_entreprise: idEntreprise } : {}),
  })) as Row;
  return { idParticipant: s(cree.id_participant), cree: true };
}

export async function lapDuParticipant(client: ClientDendreo, idAdf: string, idParticipant: string): Promise<Row | null> {
  const laps = await client.list("laps.php", { id_action_de_formation: idAdf, fields: "id_lap,id_participant,id_action_de_formation" });
  return laps.find((l) => s(l.id_participant) === idParticipant) ?? null;
}

export async function inscrire(
  client: ClientDendreo,
  p: {
    idAdf: string;
    personne: Personne;
    idEntreprise: string;
    aujourdhui: string;
    /** Promotion par un admin : autorise le dépassement de la capacité. */
    forcer?: boolean;
  },
): Promise<ResultatInscription> {
  const adf = await lireSession(client, p.idAdf);
  if (s(adf.type) !== "inter") throw new InscriptionImpossible("Seules les sessions inter sont ouvertes à l'inscription.", "pas_inter");
  if (!p.forcer && s(adf.date_debut).slice(0, 10) <= p.aujourdhui) {
    throw new InscriptionImpossible("Cette session a déjà commencé.", "deja_commencee");
  }

  const { idParticipant, cree } = await trouverOuCreerParticipant(client, p.personne, p.idEntreprise);
  if (!cree && (await lapDuParticipant(client, p.idAdf, idParticipant))) {
    return { statut: "deja_inscrit", idParticipant, participantCree: false };
  }
  if (!p.forcer && calculerPlaces(adf).complet) {
    throw new InscriptionImpossible("La session est complète.", "complet");
  }

  const lap = (await client.post("laps.php", {
    id_action_de_formation: p.idAdf,
    id_participant: idParticipant,
    ...(p.idEntreprise ? { id_entreprise: p.idEntreprise } : {}),
  })) as Row;
  return { statut: "inscrit", idParticipant, idLap: s(lap?.id_lap) || undefined, participantCree: cree };
}

/** Désinscription (Dendreo refuse si des présences sont déjà saisies). */
export async function desinscrire(client: ClientDendreo, p: { idAdf: string; idParticipant: string; aujourdhui: string }): Promise<string> {
  const adf = await lireSession(client, p.idAdf);
  if (s(adf.date_debut).slice(0, 10) <= p.aujourdhui) {
    throw new InscriptionImpossible("La session a commencé : contactez l'équipe formation pour vous désinscrire.", "deja_commencee");
  }
  const lap = await lapDuParticipant(client, p.idAdf, p.idParticipant);
  if (!lap) throw new InscriptionImpossible("Vous n'êtes pas inscrit à cette session.", "non_inscrit");
  await client.delete("laps.php", { id_lap: s(lap.id_lap) });
  return s(lap.id_lap);
}
