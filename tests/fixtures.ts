// Extraits réels (simplifiés) de l'API Dendreo.
export const brut = {
  adfs: [
    { id_action_de_formation: "353", numero_complet: "ADF_20260036", type: "inter", intitule: "WIVOO - Product Builder", id_etape_process: "6", date_debut: "2026-12-01", date_fin: "2026-12-09 23:59:59", nb_participants_min: "6", nb_participants_max: "8", total_participants: "11", categorie_module_id: "7" },
    { id_action_de_formation: "352", numero_complet: "ADF_20260035", type: "inter", intitule: "WIVOO - Data for PM 2", description: "<p style=\"color:red\">Passer à la <b>data</b></p>", id_etape_process: "6", date_debut: "2026-12-01", date_fin: "2026-12-09 23:59:59", nb_participants_min: "6", nb_participants_max: "8", total_participants: "6", categorie_module_id: "5" },
    { id_action_de_formation: "363", type: "intra", intitule: "INTRA - Product Builder", date_debut: "2026-12-03", date_fin: "2026-12-04", nb_participants_max: "10", total_participants: "3" },
  ],
  lams: [
    { id_lam: "423", id_action_de_formation: "353", id_module: "57", intitule_module: "WIVOO - Product Builder", mode_organisation: "presentiel", id_salle_de_formation: "7", formateurs: [{ prenom: "Brian", nom: "Ridolce" }] },
    { id_lam: "422", id_action_de_formation: "352", id_module: "48", intitule_module: "WIVOO - Data for PM 2", mode_organisation: "presentiel", formateurs: [[]] },
  ],
  creneaux: [
    { id_creneau: "2351", id_action_de_formation: "353", date_debut: "2026-12-02 17:30", date_fin: "2026-12-02 20:30", name: "Discovery IA", id_salle_de_formation: "7" },
    { id_creneau: "2350", id_action_de_formation: "353", date_debut: "2026-12-01 17:30", date_fin: "2026-12-01 20:30", name: "Stratégie", id_salle_de_formation: "7" },
    { id_creneau: "2346", id_action_de_formation: "352", date_debut: "2026-12-01 17:30", date_fin: "2026-12-01 20:30" },
  ],
  salles: [{ id_salle_de_formation: "7", intitule: "Wiacademy", adresse: "20 av. Franklin D. Roosevelt", code_postal: "75008", ville: "Paris", elearning: "0" }],
  categories: [
    { id_categorie_module: "5", intitule: "Data" },
    { id_categorie_module: "7", intitule: "AI" },
  ],
};
