import "server-only";
import { emailDuDomaine, emailsAdmin } from "./config";
import { supabaseAdmin } from "./supabase/server";

export type AdminListe = {
  email: string;
  nom: string;
  /** Défini par ADMIN_EMAILS : non retirable depuis le back-office. */
  fixe: boolean;
  /** Pas encore connecté : sera admin à sa première connexion. */
  enAttente: boolean;
};

export class AdminImpossible extends Error {}

export const normaliserEmail = (v: string) => v.trim().toLowerCase();

/** Emails promus admin à la connexion : variable d'environnement + liste gérée dans le back-office. */
export async function emailsAdminAutorises(): Promise<Set<string>> {
  const { data } = await supabaseAdmin().from("admins_autorises").select("email");
  return new Set([...emailsAdmin(), ...(data ?? []).map((r) => r.email)]);
}

export async function listerAdmins(): Promise<AdminListe[]> {
  const db = supabaseAdmin();
  const [{ data: profils }, { data: autorises }] = await Promise.all([
    db.from("profiles").select("email, prenom, nom").eq("role", "admin").order("email"),
    db.from("admins_autorises").select("email"),
  ]);
  const fixes = emailsAdmin();
  const liste = new Map<string, AdminListe>();
  for (const p of profils ?? []) {
    liste.set(p.email, { email: p.email, nom: `${p.prenom} ${p.nom}`.trim(), fixe: fixes.has(p.email), enAttente: false });
  }
  for (const email of [...fixes, ...(autorises ?? []).map((a) => a.email)]) {
    if (!liste.has(email)) liste.set(email, { email, nom: "", fixe: fixes.has(email), enAttente: true });
  }
  return [...liste.values()].sort((a, b) => a.email.localeCompare(b.email));
}

export async function ajouterAdmin(emailBrut: string, par: string): Promise<{ promu: boolean }> {
  const email = normaliserEmail(emailBrut);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new AdminImpossible("Adresse email invalide.");
  if (!emailDuDomaine(email)) throw new AdminImpossible("L'adresse doit appartenir au domaine de l'entreprise.");
  const db = supabaseAdmin();
  const { error } = await db.from("admins_autorises").upsert({ email, ajoute_par: par }, { onConflict: "email" });
  if (error) throw error;
  const { data, error: e2 } = await db.from("profiles").update({ role: "admin" }).eq("email", email).select("id");
  if (e2) throw e2;
  return { promu: (data ?? []).length > 0 };
}

export async function retirerAdmin(emailBrut: string, par: string): Promise<void> {
  const email = normaliserEmail(emailBrut);
  if (email === normaliserEmail(par)) throw new AdminImpossible("Vous ne pouvez pas retirer vos propres droits.");
  if (emailsAdmin().has(email)) throw new AdminImpossible("Cet admin est défini dans la configuration (ADMIN_EMAILS) : il ne peut pas être retiré ici.");
  const db = supabaseAdmin();
  const { error } = await db.from("admins_autorises").delete().eq("email", email);
  if (error) throw error;
  const { error: e2 } = await db.from("profiles").update({ role: "interne" }).eq("email", email);
  if (e2) throw e2;
}
