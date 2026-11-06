export type Creneau = {
  id: string;
  debut: string; // « AAAA-MM-JJ HH:MM »
  fin: string;
  nom: string;
  idSalle: string | null;
};

export type Lieu = {
  id: string;
  intitule: string;
  adresse: string;
  codePostal: string;
  ville: string;
  acces: string; // HTML Dendreo
  accueil: string;
  elearning: boolean;
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
  creneaux: Creneau[];
  lieux: Lieu[];
  places: Places;
};

export type Categorie = { id: string; intitule: string };
