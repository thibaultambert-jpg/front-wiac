# front-wiac — Portail des formations internes

Portail où les collaborateurs consultent les formations **INTER** programmées dans Dendreo et s'y inscrivent avec leur compte Google Workspace, plus un back-office pour l'équipe formation.

- **Stack** : Next.js 16 (App Router) · Supabase (Auth Google + Postgres + Storage) · Tailwind 4 · FullCalendar
- **Dendreo** est la source des sessions et des inscriptions ; Supabase ne stocke que ce que Dendreo n'a pas (fiches éditoriales, liaisons, liste d'attente, rôles, journal).
- La clé API Dendreo et la clé service Supabase ne sont utilisées que côté serveur.

## Fonctionnalités

**Portail (collaborateurs)**
- Connexion Google limitée au domaine Workspace (revérifié côté serveur, pas seulement via `hd`).
- `/formations` : catalogue en **liste** ou **calendrier** (mois / semaine), filtres catégorie, mois, format, places disponibles, recherche.
- `/formations/[slug]` : fiche éditée dans le BO (ou description Dendreo par défaut) + sessions à venir.
- `/sessions/[id]` : planning des créneaux, lieu, formateurs, jauge de places ; **S'inscrire** (inscription directe dans Dendreo, places relues en direct) ou **liste d'attente** si complet.
- `/mes-formations` : inscriptions à venir et passées, positions en liste d'attente, annulation.

**Back-office (`/admin`, rôle admin)**
- Tableau de bord : remplissage, places restantes, sessions sous le minimum, demande non satisfaite (listes d'attente par formation), inscriptions par mois, export CSV.
- Listes d'attente : ordre par glisser-déposer, **Inscrire** (crée l'inscription Dendreo, option « dépasser la capacité »), **Retirer**.
- Fiches formation : éditeur Markdown avec aperçu, visuel, publication, modules liés.
- Formations détectées : synchronisation des modules Dendreo (bouton + cron quotidien), créer une fiche, lier à une fiche, ignorer.
- Journal de toutes les actions.

### Règles de gestion
- Seules les sessions `type=inter` qui commencent après aujourd'hui sont proposées à l'inscription.
- Complet = `nb_participants_max > 0` et `total_participants >= nb_participants_max`.
- Le participant Dendreo est retrouvé par email (créé si absent, rattaché à `DENDREO_ID_ENTREPRISE`).
- Une session dont tous les modules sont « ignorés » est masquée du portail ; un module sans fiche publiée reste visible avec sa description Dendreo.
- Désinscription possible jusqu'à la veille du début (Dendreo refuse si des présences sont saisies).

## Mise en route

1. **Supabase** : créer un projet, puis appliquer `supabase/migrations/20261106000000_init.sql` (SQL editor ou `supabase db push`).
2. **Google** : dans Supabase › Authentication › Providers, activer Google avec un client OAuth de type « Web » de la console Google Cloud (écran de consentement **interne** au Workspace). URL de redirection Google : `https://<projet>.supabase.co/auth/v1/callback`.
3. Supabase › Authentication › URL Configuration : ajouter `https://<votre-domaine>/auth/callback` (et `http://localhost:3000/auth/callback` en local) aux Redirect URLs.
4. Copier `.env.example` en `.env.local` et renseigner les variables.
5. Installer et lancer :

```bash
npm install
```

```bash
npm run dev
```

6. Se connecter avec un email listé dans `ADMIN_EMAILS`, aller dans **Back-office › Formations détectées** et cliquer **Synchroniser avec Dendreo**.

### Déploiement Vercel
Importer le dépôt, renseigner les variables d'environnement (dont `CRON_SECRET` et `PUBLIC_URL`). Le cron `vercel.json` appelle `/api/cron/sync-modules` chaque jour.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run lint` / `npm run typecheck` | Qualité |
| `npm test` | Tests unitaires (Vitest) |

## Structure

```
src/lib/dendreo/     client API (repris de MCP-Dendreo), assemblage des sessions, places, inscription
src/lib/catalogue/   regroupement sessions ↔ fiches
src/lib/attente.ts   liste d'attente
src/app/(interne)/   portail collaborateurs
src/app/admin/       back-office
supabase/migrations/ schéma SQL + RLS
tests/               tests unitaires (faux Dendreo en mémoire)
```
