-- Programme en modules (accordéon) : [{ "titre", "sous_titre", "contenu" (HTML nettoyé) }].
-- Les anciennes colonnes (duree, public_cible, prerequis, modalites, contenu, visuel_url, programme)
-- sont conservées mais ne sont plus éditées.
alter table formations add column programme_modules jsonb not null default '[]'::jsonb;
