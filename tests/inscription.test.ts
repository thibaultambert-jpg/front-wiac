import { describe, expect, it } from "vitest";
import type { Query, Row } from "@/lib/dendreo/client";
import { desinscrire, inscrire, InscriptionImpossible, type ClientDendreo } from "@/lib/dendreo/inscription";

/** Faux Dendreo en mémoire. */
function fauxDendreo(init: { adf: Row; participants?: Row[]; laps?: Row[] }) {
  const participants = [...(init.participants ?? [])];
  const laps = [...(init.laps ?? [])];
  const appels: string[] = [];
  const client: ClientDendreo = {
    async list(endpoint: string, q: Query = {}) {
      if (endpoint === "actions_de_formation.php") return String(q.id) === String(init.adf.id_action_de_formation) ? [init.adf] : [];
      if (endpoint === "participants.php") return participants.filter((p) => p.email === q.email);
      if (endpoint === "laps.php") return laps.filter((l) => String(l.id_action_de_formation) === String(q.id_action_de_formation));
      throw new Error(endpoint);
    },
    async post(endpoint: string, body: Row) {
      appels.push(`POST ${endpoint}`);
      if (endpoint === "participants.php") {
        const p = { ...body, id_participant: String(900 + participants.length) };
        participants.push(p);
        return p;
      }
      const l = { ...body, id_lap: String(5000 + laps.length) };
      laps.push(l);
      return l;
    },
    async delete(endpoint: string, q: Query) {
      appels.push(`DELETE ${endpoint} ${q.id_lap}`);
      return null;
    },
  };
  return { client, appels, laps, participants };
}

const adf = (p: Row = {}): Row => ({ id_action_de_formation: "352", type: "inter", date_debut: "2026-12-01", nb_participants_max: "8", total_participants: "6", ...p });
const moi = { email: "lea.martin@wivoo.fr", prenom: "Léa", nom: "Martin" };
const base = { idAdf: "352", personne: moi, idEntreprise: "170", aujourdhui: "2026-11-06" };

describe("inscrire", () => {
  it("inscrit un participant existant", async () => {
    const f = fauxDendreo({ adf: adf(), participants: [{ id_participant: "42", email: moi.email, id_entreprise: "170" }] });
    const r = await inscrire(f.client, base);
    expect(r).toMatchObject({ statut: "inscrit", idParticipant: "42", participantCree: false });
    expect(f.laps[0]).toMatchObject({ id_action_de_formation: "352", id_participant: "42", id_entreprise: "170" });
  });

  it("crée le participant s'il n'existe pas, rattaché à l'entreprise", async () => {
    const f = fauxDendreo({ adf: adf() });
    const r = await inscrire(f.client, base);
    expect(r.participantCree).toBe(true);
    expect(f.participants[0]).toMatchObject({ email: moi.email, prenom: "Léa", nom: "Martin", id_entreprise: "170" });
    expect(f.appels).toEqual(["POST participants.php", "POST laps.php"]);
  });

  it("ne réinscrit pas un participant déjà inscrit", async () => {
    const f = fauxDendreo({ adf: adf(), participants: [{ id_participant: "42", email: moi.email }], laps: [{ id_lap: "1", id_action_de_formation: "352", id_participant: "42" }] });
    expect((await inscrire(f.client, base)).statut).toBe("deja_inscrit");
    expect(f.appels).toEqual([]);
  });

  it("refuse une session complète, sauf promotion forcée", async () => {
    const f = fauxDendreo({ adf: adf({ total_participants: "8" }), participants: [{ id_participant: "42", email: moi.email }] });
    await expect(inscrire(f.client, base)).rejects.toMatchObject({ code: "complet" });
    expect((await inscrire(f.client, { ...base, forcer: true })).statut).toBe("inscrit");
  });

  it("refuse une session intra ou déjà commencée", async () => {
    await expect(inscrire(fauxDendreo({ adf: adf({ type: "intra" }) }).client, base)).rejects.toMatchObject({ code: "pas_inter" });
    await expect(inscrire(fauxDendreo({ adf: adf({ date_debut: "2026-11-06" }) }).client, base)).rejects.toMatchObject({ code: "deja_commencee" });
  });

  it("refuse si plusieurs fiches participant ambiguës", async () => {
    const f = fauxDendreo({ adf: adf(), participants: [{ id_participant: "1", email: moi.email, id_entreprise: "3" }, { id_participant: "2", email: moi.email, id_entreprise: "4" }] });
    const e = await inscrire(f.client, base).catch((x) => x);
    expect(e).toBeInstanceOf(InscriptionImpossible);
    expect(e.code).toBe("participant_ambigu");
  });
});

describe("desinscrire", () => {
  it("supprime le lap du participant", async () => {
    const f = fauxDendreo({ adf: adf(), laps: [{ id_lap: "77", id_action_de_formation: "352", id_participant: "42" }] });
    expect(await desinscrire(f.client, { idAdf: "352", idParticipant: "42", aujourdhui: "2026-11-06" })).toBe("77");
    expect(f.appels).toEqual(["DELETE laps.php 77"]);
  });
  it("refuse si non inscrit", async () => {
    const f = fauxDendreo({ adf: adf() });
    await expect(desinscrire(f.client, { idAdf: "352", idParticipant: "42", aujourdhui: "2026-11-06" })).rejects.toMatchObject({ code: "non_inscrit" });
  });
});
