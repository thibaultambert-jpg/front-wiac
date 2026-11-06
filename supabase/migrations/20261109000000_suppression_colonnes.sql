-- Nettoyage : champs retirés de la fiche formation (remplacés par objectif + programme_modules).
-- À lancer APRÈS le déploiement du code qui ne les utilise plus.
alter table formations
  drop column if exists duree,
  drop column if exists public_cible,
  drop column if exists prerequis,
  drop column if exists modalites,
  drop column if exists contenu,
  drop column if exists visuel_url,
  drop column if exists programme;
