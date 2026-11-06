"use server";
import { revalidatePath } from "next/cache";
import { quitter, rejoindre } from "@/lib/attente";
import { exigerUtilisateur } from "@/lib/auth";
import { InscriptionImpossible } from "@/lib/dendreo/inscription";
import { sessionParId } from "@/lib/dendreo/sessions";
import { desinscrireProfil, inscrireProfil } from "@/lib/inscriptions";
import { journaliser } from "@/lib/journal";
import { idsSessionsInscrit } from "@/lib/mes-formations";

export type EtatAction = { ok: boolean; message: string } | null;

const idValide = (v: FormDataEntryValue | null) => (typeof v === "string" && /^\d+$/.test(v) ? v : null);

function messageErreur(e: unknown): string {
  if (e instanceof InscriptionImpossible) return e.message;
  console.error(e);
  return "Une erreur est survenue avec Dendreo. Réessayez ou contactez l'équipe formation.";
}

function rafraichir(idAdf: string) {
  revalidatePath(`/sessions/${idAdf}`);
  revalidatePath("/formations");
  revalidatePath("/mes-formations");
}

export async function sInscrire(_: EtatAction, formData: FormData): Promise<EtatAction> {
  const u = await exigerUtilisateur();
  const idAdf = idValide(formData.get("session"));
  if (!idAdf) return { ok: false, message: "Session invalide." };
  try {
    const res = await inscrireProfil(u, idAdf, { acteur: u.email });
    await quitter(idAdf, u.id).catch(() => false);
    rafraichir(idAdf);
    return {
      ok: true,
      message: res.statut === "deja_inscrit" ? "Vous étiez déjà inscrit à cette session." : "Inscription confirmée.",
    };
  } catch (e) {
    if (e instanceof InscriptionImpossible && e.code === "complet") {
      rafraichir(idAdf);
      return { ok: false, message: "La session vient d'être complète : vous pouvez rejoindre la liste d'attente." };
    }
    return { ok: false, message: messageErreur(e) };
  }
}

export async function seDesinscrire(_: EtatAction, formData: FormData): Promise<EtatAction> {
  const u = await exigerUtilisateur();
  const idAdf = idValide(formData.get("session"));
  if (!idAdf) return { ok: false, message: "Session invalide." };
  try {
    await desinscrireProfil(u, idAdf, u.email);
    rafraichir(idAdf);
    return { ok: true, message: "Votre inscription est annulée." };
  } catch (e) {
    return { ok: false, message: messageErreur(e) };
  }
}

export async function rejoindreAttente(_: EtatAction, formData: FormData): Promise<EtatAction> {
  const u = await exigerUtilisateur();
  const idAdf = idValide(formData.get("session"));
  if (!idAdf) return { ok: false, message: "Session invalide." };
  const session = await sessionParId(idAdf);
  if (!session) return { ok: false, message: "Session introuvable." };
  if (!session.places.complet) return { ok: false, message: "Il reste des places : inscrivez-vous directement." };
  if ((await idsSessionsInscrit(u)).has(idAdf)) return { ok: false, message: "Vous êtes déjà inscrit à cette session." };
  const commentaire = String(formData.get("commentaire") ?? "").slice(0, 500);
  await rejoindre(idAdf, u.id, commentaire);
  await journaliser({ acteur: u.email, action: "attente_ajout", idAdf, cible: u.email });
  rafraichir(idAdf);
  return { ok: true, message: "Vous êtes sur la liste d'attente. Votre position est visible dans « Mes formations »." };
}

export async function quitterAttente(_: EtatAction, formData: FormData): Promise<EtatAction> {
  const u = await exigerUtilisateur();
  const idAdf = idValide(formData.get("session"));
  if (!idAdf) return { ok: false, message: "Session invalide." };
  if (await quitter(idAdf, u.id)) await journaliser({ acteur: u.email, action: "attente_retrait", idAdf, cible: u.email });
  rafraichir(idAdf);
  return { ok: true, message: "Vous avez quitté la liste d'attente." };
}
