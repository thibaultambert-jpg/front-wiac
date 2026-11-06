"use client";
import { useActionState } from "react";
import type { Etat } from "./FormAction";

type Action = (etat: Etat, formData: FormData) => Promise<Etat>;

/** Liste déroulante qui lie un module à une fiche dès qu'on change la valeur. */
export function SelectLiaison({ action, idModule, valeur, fiches }: { action: Action; idModule: string; valeur: string; fiches: { id: string; titre: string }[] }) {
  const [etat, envoyer, pending] = useActionState(action, null);
  return (
    <form action={envoyer} className="flex flex-col gap-1">
      <input type="hidden" name="module" value={idModule} />
      <select
        name="formation"
        defaultValue={valeur}
        disabled={pending}
        aria-label="Fiche liée"
        className="input py-1.5"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        <option value="">— Aucune fiche —</option>
        {fiches.map((f) => (
          <option key={f.id} value={f.id}>{f.titre}</option>
        ))}
      </select>
      {etat && <span className={`text-xs ${etat.ok ? "text-ok" : "text-danger"}`}>{etat.message}</span>}
    </form>
  );
}
