-- Niveau affiché sur les cartes et la fiche (comme sur le site public : Débutant / Intermédiaire / Avancé).
alter table formations
  add column niveau text not null default ''
  check (niveau in ('', 'debutant', 'intermediaire', 'avance'));
