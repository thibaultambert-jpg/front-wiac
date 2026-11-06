// Configuration lue dans les variables d'environnement (voir .env.example). Serveur uniquement.
import "server-only";

function liste(v: string | undefined): string[] {
  return (v ?? "")
    .split(/[\s,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export const domaineWorkspace = () => (process.env.GOOGLE_WORKSPACE_DOMAIN ?? "").trim().toLowerCase();

export const emailsAdmin = () => new Set(liste(process.env.ADMIN_EMAILS));

export const idEntrepriseDendreo = () => (process.env.DENDREO_ID_ENTREPRISE ?? "").trim();

export const etapesMasquees = () => new Set(liste(process.env.DENDREO_ETAPES_MASQUEES));

export function publicUrl(): string {
  const explicite = process.env.PUBLIC_URL?.trim();
  if (explicite) return explicite.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

/** Vrai si l'email appartient au domaine Workspace autorisé. */
export function emailDuDomaine(email: string | undefined | null): boolean {
  const domaine = domaineWorkspace();
  if (!email || !domaine) return false;
  return email.trim().toLowerCase().endsWith(`@${domaine}`);
}
