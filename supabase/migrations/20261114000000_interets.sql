-- « La formation m'intéresse » : un collaborateur signale son intérêt pour une formation sans session programmée.
create table interets (
  id uuid primary key default gen_random_uuid(),
  formation_id uuid not null references formations (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (formation_id, user_id)
);
create index interets_formation_idx on interets (formation_id);

alter table interets enable row level security;
create policy "intérêts : lecture de ses lignes" on interets for select to authenticated using (user_id = auth.uid());
