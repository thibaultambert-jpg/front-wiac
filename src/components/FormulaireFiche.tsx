"use client";
import { useActionState, useState } from "react";
import type { Fiche } from "@/lib/catalogue/assembler";
import type { ModuleProgramme } from "@/lib/programme";
import { EditeurProgramme } from "./EditeurProgramme";
import { EditeurRiche } from "./EditeurRiche";
import type { Etat } from "./FormAction";

type Action = (etat: Etat, formData: FormData) => Promise<Etat>;

export function FormulaireFiche({
  fiche,
  objectifHtml,
  modules,
  action,
}: {
  fiche: Fiche | null;
  objectifHtml: string;
  modules: ModuleProgramme[];
  action: Action;
}) {
  const [etat, envoyer, pending] = useActionState(action, null);
  const [objectif, setObjectif] = useState(objectifHtml);
  const f = fiche;
  const champ = (nom: keyof Fiche, libelle: string, props: { placeholder?: string; aide?: string } = {}) => (
    <div>
      <label className="label" htmlFor={nom}>{libelle}</label>
      <input id={nom} name={nom} defaultValue={String(f?.[nom] ?? "")} placeholder={props.placeholder} className="input" />
      {props.aide && <p className="mt-1 text-xs text-muted">{props.aide}</p>}
    </div>
  );
  return (
    <form action={envoyer} className="space-y-6">
      <input type="hidden" name="id" value={f?.id ?? "nouvelle"} />
      <section className="card grid gap-4 p-5 md:grid-cols-2">
        {champ("titre", "Titre *")}
        {champ("slug", "Adresse de la page", { placeholder: "générée depuis le titre", aide: "/formations/<adresse> — minuscules et tirets" })}
        <div className="md:col-span-2">
          <label className="label" htmlFor="resume">Résumé (cartes du catalogue et bandeau de la fiche)</label>
          <textarea id="resume" name="resume" rows={2} maxLength={600} defaultValue={f?.resume ?? ""} className="input" />
        </div>
        {champ("categorie", "Catégorie affichée")}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="niveau">Niveau</label>
            <select id="niveau" name="niveau" defaultValue={f?.niveau ?? ""} className="input">
              <option value="">Non précisé</option>
              <option value="debutant">Débutant</option>
              <option value="intermediaire">Intermédiaire</option>
              <option value="avance">Avancé</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="ordre">Ordre d&apos;affichage</label>
            <input id="ordre" name="ordre" type="number" min={0} defaultValue={f?.ordre ?? 0} className="input" />
          </div>
        </div>
      </section>

      <section className="card space-y-2 p-5">
        <h2 className="font-bold">Objectif</h2>
        <p className="text-xs text-muted">Mis en avant en tête de la fiche.</p>
        <input type="hidden" name="objectifs" value={objectif} />
        <EditeurRiche valeur={objectifHtml} onChange={setObjectif} minHauteur={90} />
      </section>

      <section className="card space-y-3 p-5">
        <div>
          <h2 className="font-bold">Programme</h2>
          <p className="text-xs text-muted">Chaque module s&apos;affiche en accordéon numéroté sur le portail. Cliquez sur un module pour le modifier.</p>
        </div>
        <EditeurProgramme initiaux={modules} />
      </section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-4 border-t border-line bg-surface-2/95 px-4 py-3 backdrop-blur">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="publiee" defaultChecked={f?.publiee ?? false} className="accent-[var(--violet)]" />
          Publiée sur le portail
        </label>
        <button type="submit" disabled={pending} className="btn btn-primary">{pending ? "Enregistrement…" : "Enregistrer"}</button>
        {etat && <span role="status" className={`text-sm ${etat.ok ? "text-ok" : "text-danger"}`}>{etat.message}</span>}
      </div>
    </form>
  );
}
