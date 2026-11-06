"use client";
import { useActionState } from "react";

export type Etat = { ok: boolean; message: string } | null;
type Action = (etat: Etat, formData: FormData) => Promise<Etat>;

/** Petit formulaire d'action serveur (champs cachés + bouton) avec retour affiché. */
export function FormAction({
  action,
  champs,
  libelle,
  enCours = "…",
  variante = "secondary",
  taille = "sm",
  confirmation,
  children,
}: {
  action: Action;
  champs: Record<string, string>;
  libelle: string;
  enCours?: string;
  variante?: "primary" | "secondary" | "danger";
  taille?: "sm" | "md";
  confirmation?: string;
  children?: React.ReactNode;
}) {
  const [etat, envoyer, pending] = useActionState(action, null);
  return (
    <form
      action={envoyer}
      onSubmit={(e) => {
        if (confirmation && !window.confirm(confirmation)) e.preventDefault();
      }}
      className="inline-flex flex-col items-start gap-1"
    >
      {Object.entries(champs).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {children}
      <button type="submit" disabled={pending} className={`btn btn-${variante} ${taille === "sm" ? "btn-sm" : ""}`}>
        {pending ? enCours : libelle}
      </button>
      {etat && <span role="status" className={`text-xs ${etat.ok ? "text-ok" : "text-danger"}`}>{etat.message}</span>}
    </form>
  );
}
