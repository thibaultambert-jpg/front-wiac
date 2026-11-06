"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Etat } from "@/components/FormAction";
import { changerStatut, reordonner } from "@/lib/attente";
import { exigerAdmin } from "@/lib/auth";
import { nettoyerHtml, texteBrut } from "@/lib/dendreo/html";
import { InscriptionImpossible } from "@/lib/dendreo/inscription";
import { sessionsAVenir } from "@/lib/dendreo/sessions";
import { inscrireProfil } from "@/lib/inscriptions";
import { journaliser } from "@/lib/journal";
import { titreSansPrefixe } from "@/lib/catalogue/assembler";
import { normaliserModules } from "@/lib/programme";
import { slugifier } from "@/lib/slug";
import { supabaseAdmin } from "@/lib/supabase/server";
import { synchroniserModules } from "@/lib/sync-modules";

const texte = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const idNum = (v: string) => (/^\d+$/.test(v) ? v : null);
const uuid = z.string().uuid();

function echec(e: unknown, defaut = "Opération impossible."): Etat {
  if (e instanceof InscriptionImpossible) return { ok: false, message: e.message };
  console.error(e);
  return { ok: false, message: e instanceof Error && e.message ? `${defaut} (${e.message})` : defaut };
}

// --- Formations détectées ---------------------------------------------------

export async function lancerSynchronisation(): Promise<Etat> {
  const admin = await exigerAdmin();
  try {
    const res = await synchroniserModules();
    await journaliser({ acteur: admin.email, action: "synchronisation", details: res });
    revalidatePath("/admin/detectees");
    return { ok: true, message: `${res.total} modules lus, ${res.nouveaux} nouveau${res.nouveaux > 1 ? "x" : ""}.` };
  } catch (e) {
    return echec(e, "Synchronisation impossible");
  }
}

export async function lierModule(_: Etat, f: FormData): Promise<Etat> {
  const admin = await exigerAdmin();
  const idModule = idNum(texte(f, "module"));
  const formation = texte(f, "formation");
  if (!idModule) return { ok: false, message: "Module invalide." };
  const db = supabaseAdmin();
  if (!formation) {
    const { error } = await db.from("formation_modules").delete().eq("id_module", idModule);
    if (error) return echec(error);
    await journaliser({ acteur: admin.email, action: "module_delie", details: { id_module: idModule } });
  } else {
    if (!uuid.safeParse(formation).success) return { ok: false, message: "Fiche invalide." };
    const { error } = await db.from("formation_modules").upsert({ id_module: idModule, formation_id: formation }, { onConflict: "id_module" });
    if (error) return echec(error);
    await db.from("modules_detectes").update({ ignore: false }).eq("id_module", idModule);
    await journaliser({ acteur: admin.email, action: "module_lie", details: { id_module: idModule, formation_id: formation } });
  }
  revalidatePath("/admin/detectees");
  revalidatePath("/formations");
  return { ok: true, message: formation ? "Module lié." : "Liaison retirée." };
}

export async function ignorerModule(_: Etat, f: FormData): Promise<Etat> {
  const admin = await exigerAdmin();
  const idModule = idNum(texte(f, "module"));
  const ignore = texte(f, "ignore") === "1";
  if (!idModule) return { ok: false, message: "Module invalide." };
  const db = supabaseAdmin();
  const { error } = await db.from("modules_detectes").update({ ignore }).eq("id_module", idModule);
  if (error) return echec(error);
  if (ignore) await db.from("formation_modules").delete().eq("id_module", idModule);
  await journaliser({ acteur: admin.email, action: "module_ignore", details: { id_module: idModule, ignore } });
  revalidatePath("/admin/detectees");
  revalidatePath("/formations");
  return { ok: true, message: ignore ? "Module masqué du portail." : "Module réactivé." };
}

async function slugLibre(base: string): Promise<string> {
  const db = supabaseAdmin();
  const { data } = await db.from("formations").select("slug").like("slug", `${base}%`);
  const pris = new Set((data ?? []).map((r) => r.slug));
  if (!pris.has(base)) return base;
  let i = 2;
  while (pris.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

export async function creerFicheDepuisModule(_: Etat, f: FormData): Promise<Etat> {
  const admin = await exigerAdmin();
  const idModule = idNum(texte(f, "module"));
  if (!idModule) return { ok: false, message: "Module invalide." };
  const db = supabaseAdmin();
  const { data: mod } = await db.from("modules_detectes").select("*").eq("id_module", idModule).maybeSingle();
  if (!mod) return { ok: false, message: "Module inconnu : lancez une synchronisation." };
  const session = (await sessionsAVenir()).find((s) => s.modules.some((m) => m.id === idModule));
  const titre = titreSansPrefixe(String(mod.intitule));
  const { data: fiche, error } = await db
    .from("formations")
    .insert({
      slug: await slugLibre(slugifier(titre)),
      titre,
      categorie: mod.categorie ?? "",
      resume: session ? texteBrut(session.descriptionHtml, 240) : "",
    })
    .select("id")
    .single();
  if (error || !fiche) return echec(error);
  await db.from("formation_modules").upsert({ id_module: idModule, formation_id: fiche.id }, { onConflict: "id_module" });
  await db.from("modules_detectes").update({ ignore: false }).eq("id_module", idModule);
  await journaliser({ acteur: admin.email, action: "module_lie", details: { id_module: idModule, formation_id: fiche.id, creation: true } });
  redirect(`/admin/formations/${fiche.id}`);
}

// --- Fiches -----------------------------------------------------------------

const FICHE = z.object({
  titre: z.string().min(1, "Le titre est obligatoire.").max(200),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Adresse : minuscules, chiffres et tirets uniquement."),
  resume: z.string().max(600),
  categorie: z.string().max(100),
  niveau: z.enum(["", "debutant", "intermediaire", "avance"]),
  objectifs: z.string().max(20000),
  ordre: z.coerce.number().int().min(0).max(9999),
  publiee: z.boolean(),
});

export async function enregistrerFiche(_: Etat, f: FormData): Promise<Etat> {
  const admin = await exigerAdmin();
  const id = texte(f, "id");
  const nouvelle = id === "nouvelle";
  if (!nouvelle && !uuid.safeParse(id).success) return { ok: false, message: "Fiche invalide." };
  const parse = FICHE.safeParse({
    titre: texte(f, "titre"),
    slug: texte(f, "slug") || slugifier(texte(f, "titre")),
    resume: texte(f, "resume"),
    categorie: texte(f, "categorie"),
    niveau: texte(f, "niveau"),
    objectifs: String(f.get("objectifs") ?? ""),
    ordre: texte(f, "ordre") || "0",
    publiee: f.get("publiee") === "on",
  });
  if (!parse.success) return { ok: false, message: parse.error.issues[0]?.message ?? "Champs invalides." };
  const programme = normaliserModules(f.get("programme_modules") ?? "[]");
  if (!programme.ok) return { ok: false, message: programme.message };
  const valeurs: Record<string, unknown> = {
    ...parse.data,
    objectifs: nettoyerHtml(parse.data.objectifs),
    programme_modules: programme.modules,
  };
  const db = supabaseAdmin();

  const req = nouvelle ? db.from("formations").insert(valeurs).select("id").single() : db.from("formations").update(valeurs).eq("id", id).select("id").single();
  const { data, error } = await req;
  if (error) {
    if (error.code === "23505") return { ok: false, message: "Cette adresse (slug) est déjà utilisée par une autre fiche." };
    return echec(error);
  }
  await journaliser({ acteur: admin.email, action: "fiche_enregistree", details: { id: data.id, titre: parse.data.titre, publiee: parse.data.publiee } });
  revalidatePath("/admin/formations");
  revalidatePath("/formations");
  if (nouvelle) redirect(`/admin/formations/${data.id}`);
  return { ok: true, message: "Fiche enregistrée." };
}

export async function supprimerFiche(_: Etat, f: FormData): Promise<Etat> {
  const admin = await exigerAdmin();
  const id = texte(f, "id");
  if (!uuid.safeParse(id).success) return { ok: false, message: "Fiche invalide." };
  const { data, error } = await supabaseAdmin().from("formations").delete().eq("id", id).select("titre").maybeSingle();
  if (error) return echec(error);
  await journaliser({ acteur: admin.email, action: "fiche_supprimee", details: { id, titre: data?.titre } });
  revalidatePath("/formations");
  redirect("/admin/formations");
}

// --- Listes d'attente -------------------------------------------------------

export async function promouvoir(_: Etat, f: FormData): Promise<Etat> {
  const admin = await exigerAdmin();
  const idLigne = texte(f, "ligne");
  if (!uuid.safeParse(idLigne).success) return { ok: false, message: "Ligne invalide." };
  const forcer = texte(f, "forcer") === "1";
  const db = supabaseAdmin();
  const { data: ligne } = await db
    .from("liste_attente")
    .select("id, id_action_de_formation, statut, profil:profiles(id, email, prenom, nom)")
    .eq("id", idLigne)
    .maybeSingle();
  const profil = (Array.isArray(ligne?.profil) ? ligne?.profil[0] : ligne?.profil) as { id: string; email: string; prenom: string; nom: string } | undefined;
  if (!ligne || !profil || ligne.statut !== "en_attente") return { ok: false, message: "Cette personne n'est plus en attente." };
  const idAdf = String(ligne.id_action_de_formation);
  try {
    const res = await inscrireProfil(profil, idAdf, { acteur: admin.email, forcer, via: "liste_attente" });
    await changerStatut(idLigne, "promu");
    await journaliser({ acteur: admin.email, action: "attente_promotion", idAdf, cible: profil.email, details: { forcee: forcer, statut: res.statut } });
    revalidatePath(`/admin/attente/${idAdf}`);
    revalidatePath("/admin/attente");
    return { ok: true, message: `${profil.prenom || profil.email} inscrit(e) dans Dendreo. Pensez à la prévenir.` };
  } catch (e) {
    if (e instanceof InscriptionImpossible && e.code === "complet") {
      return { ok: false, message: "Session complète dans Dendreo : libérez une place ou cochez « dépasser la capacité »." };
    }
    return echec(e, "Inscription impossible");
  }
}

export async function retirerDeLAttente(_: Etat, f: FormData): Promise<Etat> {
  const admin = await exigerAdmin();
  const idLigne = texte(f, "ligne");
  if (!uuid.safeParse(idLigne).success) return { ok: false, message: "Ligne invalide." };
  const ligne = await changerStatut(idLigne, "retire");
  if (!ligne) return { ok: false, message: "Ligne introuvable." };
  await journaliser({ acteur: admin.email, action: "attente_retrait", idAdf: ligne.id_action_de_formation, details: { ligne: idLigne, par_admin: true } });
  revalidatePath(`/admin/attente/${ligne.id_action_de_formation}`);
  revalidatePath("/admin/attente");
  return { ok: true, message: "Retiré(e) de la liste." };
}

export async function reordonnerAttente(idAdf: string, ids: string[]): Promise<Etat> {
  const admin = await exigerAdmin();
  if (!idNum(idAdf) || !ids.every((i) => uuid.safeParse(i).success)) return { ok: false, message: "Ordre invalide." };
  try {
    await reordonner(idAdf, ids);
    await journaliser({ acteur: admin.email, action: "attente_reordonnee", idAdf, details: { ordre: ids } });
    revalidatePath(`/admin/attente/${idAdf}`);
    return { ok: true, message: "Ordre enregistré." };
  } catch (e) {
    return echec(e);
  }
}
