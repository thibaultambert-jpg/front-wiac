export type Creneau = {
  id: string;
  debut: string; // « AAAA-MM-JJ HH:MM »
  fin: string;
  nom: string;
};

export type ModuleSession = { id: string; intitule: string; mode: string };

export type Places = {
  min: number;
  max: number; // 0 = pas de limite
  inscrits: number;
  restantes: number | null; // null = illimité
  complet: boolean;
};

export type Session = {
  id: string;
  numero: string;
  intitule: string;
  descriptionHtml: string;
  debut: string;
  fin: string;
  idEtape: string;
  idCategorie: string;
  categorie: string;
  modules: ModuleSession[];
  modes: string[];
  formateurs: string[];
  idsFormateurs: string[]; // ids Dendreo, pour reconnaître le formateur connecté
  creneaux: Creneau[];
  places: Places;
};

export type Categorie = { id: string; intitule: string };
