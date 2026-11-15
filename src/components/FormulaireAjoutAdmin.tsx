"use client";
import { useActionState } from "react";
import type { Etat } from "./FormAction";

export function FormulaireAjoutAdmin({ action }: { action: (etat: Etat, formData: FormData) => Promise<Etat> }) {
  const [etat, envoyer, pending] = useActionState(action, null);
  return (
    <form action={envoyer} className="card flex flex-wrap items-start gap-3 p-4">
      <input name="email" type="email" required placeholder="prenom.nom@entreprise.fr" aria-label="Email du nouvel admin" className="input min-w-64 flex-1" />
      <button type="submit" disabled={pending} className="btn btn-primary">{pending ? "Ajout…" : "Ajouter un admin"}</button>
      {etat && <p role="status" className={`w-full text-sm ${etat.ok ? "text-ok" : "text-danger"}`}>{etat.message}</p>}
    </form>
  );
}
