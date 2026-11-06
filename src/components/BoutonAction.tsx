"use client";
import { useActionState } from "react";
import type { EtatAction } from "@/app/(interne)/actions";

type Action = (etat: EtatAction, formData: FormData) => Promise<EtatAction>;

/** Formulaire d'une action serveur avec retour (succès / erreur) affiché sous le bouton. */
export function BoutonAction({
  action,
  session,
  libelle,
  enCours,
  variante = "primary",
  confirmation,
  avecCommentaire,
}: {
  action: Action;
  session: string;
  libelle: string;
  enCours: string;
  variante?: "primary" | "secondary" | "danger";
  confirmation?: string;
  avecCommentaire?: boolean;
}) {
  const [etat, envoyer, pending] = useActionState(action, null);
  return (
    <form
      action={envoyer}
      onSubmit={(e) => {
        if (confirmation && !window.confirm(confirmation)) e.preventDefault();
      }}
      className="space-y-2"
    >
      <input type="hidden" name="session" value={session} />
      {avecCommentaire && (
        <textarea name="commentaire" rows={2} maxLength={500} placeholder="Un mot pour l'équipe formation (facultatif)" className="input" />
      )}
      <button type="submit" disabled={pending} className={`btn btn-${variante} w-full sm:w-auto`}>
        {pending ? enCours : libelle}
      </button>
      {etat && (
        <p role="status" className={`text-sm ${etat.ok ? "text-ok" : "text-danger"}`}>
          {etat.message}
        </p>
      )}
    </form>
  );
}
