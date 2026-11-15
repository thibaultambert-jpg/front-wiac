-- Admins ajoutés depuis le back-office (en plus de ceux listés dans ADMIN_EMAILS).
-- Permet de pré-autoriser quelqu'un qui ne s'est pas encore connecté : il sera promu admin à sa première connexion.
create table admins_autorises (
  email text primary key check (email = lower(email)),
  ajoute_par text not null,
  created_at timestamptz not null default now()
);
alter table admins_autorises enable row level security;
-- Aucun accès hors clé service.
