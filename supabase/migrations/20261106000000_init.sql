-- Portail formations INTER : données propres à l'application (Dendreo reste la source des sessions et inscriptions).
-- Toutes les écritures passent par le serveur Next.js (clé service) après contrôle du rôle.
-- RLS activée partout : les clés publiques ne donnent accès qu'à la lecture prévue ci-dessous.

create type role_utilisateur as enum ('interne', 'admin');
create type statut_attente as enum ('en_attente', 'promu', 'retire');

-- Profils (un par compte Google connecté)
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  prenom text not null default '',
  nom text not null default '',
  role role_utilisateur not null default 'interne',
  id_participant_dendreo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Fiches formation éditées dans le BO
create table formations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  titre text not null,
  resume text not null default '',
  contenu text not null default '',          -- Markdown
  objectifs text not null default '',        -- Markdown
  public_cible text not null default '',
  prerequis text not null default '',
  programme text not null default '',        -- Markdown
  duree text not null default '',
  modalites text not null default '',
  visuel_url text,
  categorie text not null default '',
  publiee boolean not null default false,
  ordre integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Modules Dendreo vus lors de la synchronisation
create table modules_detectes (
  id_module text primary key,
  intitule text not null,
  numero_complet text not null default '',
  id_categorie_module text not null default '',
  categorie text not null default '',
  catalogue boolean not null default true,
  ignore boolean not null default false,
  vu_le timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Liaison fiche <-> modules Dendreo (un module appartient à une seule fiche)
create table formation_modules (
  id_module text primary key references modules_detectes (id_module) on delete cascade,
  formation_id uuid not null references formations (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index formation_modules_formation_idx on formation_modules (formation_id);

-- Liste d'attente par session (action de formation Dendreo)
create table liste_attente (
  id uuid primary key default gen_random_uuid(),
  id_action_de_formation text not null,
  user_id uuid not null references profiles (id) on delete cascade,
  position double precision not null,
  statut statut_attente not null default 'en_attente',
  commentaire text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id_action_de_formation, user_id)
);
create index liste_attente_session_idx on liste_attente (id_action_de_formation, statut, position);

-- Journal des actions
create table journal (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  acteur_email text not null,
  action text not null,
  id_action_de_formation text,
  cible_email text,
  details jsonb not null default '{}'::jsonb
);
create index journal_created_idx on journal (created_at desc);
create index journal_action_idx on journal (action, created_at desc);

-- updated_at automatique
create function touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
create trigger profiles_touch before update on profiles for each row execute function touch_updated_at();
create trigger formations_touch before update on formations for each row execute function touch_updated_at();
create trigger liste_attente_touch before update on liste_attente for each row execute function touch_updated_at();

-- RLS
alter table profiles enable row level security;
alter table formations enable row level security;
alter table modules_detectes enable row level security;
alter table formation_modules enable row level security;
alter table liste_attente enable row level security;
alter table journal enable row level security;

create policy "profil : lecture de soi" on profiles for select to authenticated using (id = auth.uid());
create policy "formations publiées : lecture" on formations for select to authenticated using (publiee);
create policy "attente : lecture de ses lignes" on liste_attente for select to authenticated using (user_id = auth.uid());
-- modules_detectes, formation_modules, journal : aucun accès hors clé service.

-- Stockage des visuels (lecture publique, écriture par la clé service uniquement)
insert into storage.buckets (id, name, public) values ('visuels', 'visuels', true)
on conflict (id) do nothing;
