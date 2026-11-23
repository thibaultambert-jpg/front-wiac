// Formateurs Dendreo : reconnaissance par email et lecture des inscrits (fonctions pures, testées).
import type { Row } from "./client";
import type { Session } from "./types";

const s = (v: unknown) => (v === undefined || v === null ? "" : String(v));

/** Ids des fiches formateur Dendreo dont l'email pro correspond (comparaison insensible à la casse). */
export function idsFormateurParEmail(formateurs: Row[], email: string): string[] {
  const cible = email.trim().toLowerCase();
  if (!cible) return [];
  return formateurs
    .filter((f) => s(f.email_pro).trim().toLowerCase() === cible)
    .map((f) => s(f.id_formateur))
    .filter((id) => id && id !== "0");
}

/** Vrai si l'une des fiches formateur est affectée à la session. */
export function animeSession(idsFormateur: string[], session: Pick<Session, "idsFormateurs">): boolean {
  return idsFormateur.some((id) => session.idsFormateurs.includes(id));
}

/** Sessions INTER d'un formateur qui ne sont pas terminées (en cours ou à venir). */
export function idsSessionsAVenir(adfs: Row[], jour: string): string[] {
  return [
    ...new Set(
      adfs
        .filter((a) => s(a.type) === "inter" && s(a.date_fin).slice(0, 10) >= jour)
        .map((a) => s(a.id_action_de_formation))
        .filter(Boolean),
    ),
  ];
}

export type ParticipantInscrit = { id: string; nom: string; fonction: string; email: string };

/** Inscrits d'une session (laps avec `include=participant`), triés par nom. */
export function participantsDepuisLaps(laps: Row[]): ParticipantInscrit[] {
  const lignes = laps.map((l) => {
    const p = (l.participant && typeof l.participant === "object" ? l.participant : {}) as Row;
    const nom = `${s(p.prenom)} ${s(p.nom)}`.trim();
    const participant: ParticipantInscrit = {
      id: s(l.id_lap),
      nom: nom || "Participant non identifié",
      fonction: s(p.fonction).trim(),
      email: s(p.email).trim(),
    };
    return { participant, tri: `${s(p.nom)} ${s(p.prenom)}`.trim().toLowerCase() };
  });
  return lignes.sort((a, b) => a.tri.localeCompare(b.tri, "fr")).map((l) => l.participant);
}
