import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { emailDuDomaine, emailsAdmin } from "./config";
import { supabaseAdmin, supabaseSession } from "./supabase/server";

export type Utilisateur = {
  id: string;
  email: string;
  prenom: string;
  nom: string;
  role: "interne" | "admin";
  idParticipantDendreo: string | null;
};

/** Prénom / nom depuis le profil Google (given_name / family_name, sinon découpage du nom complet). */
export function nomsDepuisGoogle(meta: Record<string, unknown>): { prenom: string; nom: string } {
  const prenom = typeof meta.given_name === "string" ? meta.given_name : "";
  const nom = typeof meta.family_name === "string" ? meta.family_name : "";
  if (prenom || nom) return { prenom, nom };
  const complet = String(meta.full_name ?? meta.name ?? "").trim();
  const [p = "", ...reste] = complet.split(/\s+/);
  return { prenom: p, nom: reste.join(" ") };
}

/** Contrôle d'identité Google : email vérifié et domaine Workspace (claim `hd` si présent). */
export function identiteAutorisee(user: Pick<User, "email" | "user_metadata">): boolean {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  if (!emailDuDomaine(user.email)) return false;
  if (meta.email_verified === false) return false;
  const hd = (meta.custom_claims as Record<string, unknown> | undefined)?.hd;
  if (typeof hd === "string" && !emailDuDomaine(`x@${hd}`)) return false;
  return true;
}

/** Crée ou met à jour le profil à la connexion ; promeut admin les emails de ADMIN_EMAILS. */
export async function synchroniserProfil(user: User): Promise<void> {
  const db = supabaseAdmin();
  const email = user.email!.toLowerCase();
  const { prenom, nom } = nomsDepuisGoogle((user.user_metadata ?? {}) as Record<string, unknown>);
  const { data: existant } = await db.from("profiles").select("id, role").eq("id", user.id).maybeSingle();
  const admin = emailsAdmin().has(email);
  if (existant) {
    await db
      .from("profiles")
      .update({ email, prenom, nom, ...(admin ? { role: "admin" } : {}) })
      .eq("id", user.id);
  } else {
    await db.from("profiles").insert({ id: user.id, email, prenom, nom, role: admin ? "admin" : "interne" });
  }
}

/** Utilisateur connecté et autorisé, ou null. Mis en cache pour la durée de la requête. */
export const utilisateurCourant = cache(async (): Promise<Utilisateur | null> => {
  const supabase = await supabaseSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !identiteAutorisee(user)) return null;
  const { data: profil } = await supabaseAdmin()
    .from("profiles")
    .select("id, email, prenom, nom, role, id_participant_dendreo")
    .eq("id", user.id)
    .maybeSingle();
  if (!profil) return null;
  return {
    id: profil.id,
    email: profil.email,
    prenom: profil.prenom,
    nom: profil.nom,
    role: profil.role,
    idParticipantDendreo: profil.id_participant_dendreo,
  };
});

export async function exigerUtilisateur(): Promise<Utilisateur> {
  const u = await utilisateurCourant();
  if (!u) redirect("/login");
  return u;
}

export async function exigerAdmin(): Promise<Utilisateur> {
  const u = await exigerUtilisateur();
  if (u.role !== "admin") redirect("/formations");
  return u;
}
