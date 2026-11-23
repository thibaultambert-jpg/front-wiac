import { describe, expect, it } from "vitest";
import { animeSession, idsFormateurParEmail, idsSessionsAVenir, participantsDepuisLaps } from "@/lib/dendreo/formateurs";

describe("formateurs", () => {
  const annuaire = [
    { id_formateur: "28", email_pro: "Brian.Ridolce@wivoo.fr" },
    { id_formateur: "23" },
    { id_formateur: "6", email_pro: "remi.duflos@wivoo.fr" },
  ];

  it("retrouve la fiche formateur par email, sans tenir compte de la casse", () => {
    expect(idsFormateurParEmail(annuaire, "brian.ridolce@wivoo.fr")).toEqual(["28"]);
    expect(idsFormateurParEmail(annuaire, "inconnu@wivoo.fr")).toEqual([]);
    expect(idsFormateurParEmail(annuaire, "")).toEqual([]);
  });

  it("reconnaît le formateur affecté à la session", () => {
    expect(animeSession(["28"], { idsFormateurs: ["6", "28"] })).toBe(true);
    expect(animeSession(["28"], { idsFormateurs: ["6"] })).toBe(false);
    expect(animeSession([], { idsFormateurs: ["6"] })).toBe(false);
  });

  it("ne garde que les sessions INTER non terminées", () => {
    const adfs = [
      { id_action_de_formation: "346", type: "inter", date_fin: "2026-09-30 23:59:59" },
      { id_action_de_formation: "353", type: "inter", date_fin: "2026-12-09 23:59:59" },
      { id_action_de_formation: "360", type: "inter", date_fin: "2026-11-23" },
      { id_action_de_formation: "364", type: "intra", date_fin: "2026-12-04 23:59:59" },
    ];
    expect(idsSessionsAVenir(adfs, "2026-11-23")).toEqual(["353", "360"]);
  });

  it("liste les inscrits triés par nom, sans données sensibles", () => {
    const laps = [
      { id_lap: "1", participant: { prenom: "Leïla", nom: "Bouhend", email: "leila@wivoo.fr", fonction: "Marketing", portable: "+33600000000" } },
      { id_lap: "2", participant: { prenom: "Clément", nom: "Janot", email: "clement@wivoo.fr" } },
      { id_lap: "3", participant: { prenom: "Camille", nom: "Arnaud", email: "camille@wivoo.fr", fonction: "PO" } },
      { id_lap: "4" },
    ];
    expect(participantsDepuisLaps(laps)).toEqual([
      { id: "4", nom: "Participant non identifié", fonction: "", email: "" },
      { id: "3", nom: "Camille Arnaud", fonction: "PO", email: "camille@wivoo.fr" },
      { id: "1", nom: "Leïla Bouhend", fonction: "Marketing", email: "leila@wivoo.fr" },
      { id: "2", nom: "Clément Janot", fonction: "", email: "clement@wivoo.fr" },
    ]);
  });
});
