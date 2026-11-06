"use client";
import { useActionState } from "react";
import type { Fiche } from "@/lib/catalogue/assembler";
import { EditeurMarkdown } from "./EditeurMarkdown";
import type { Etat } from "./FormAction";

type Action = (etat: Etat, formData: FormData) => Promise<Etat>;

const AIDE_MD = "Markdown : **gras**, *italique*, listes avec « - », titres avec « ## ».";

export function FormulaireFiche({ fiche, action, apercu }: { fiche: Fiche | null; action: Action; apercu: (md: string) => Promise<string> }) {
  const [etat, envoyer, pending] = useActionState(action, null);
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
          <label className="label" htmlFor="resume">Résumé (cartes du catalogue)</label>
          <textarea id="resume" name="resume" rows={2} maxLength={600} defaultValue={f?.resume ?? ""} className="input" />
        </div>
        {champ("categorie", "Catégorie affichée")}
        {champ("duree", "Durée", { placeholder: "ex. 4 × 3 h (12 h)" })}
        {champ("public_cible", "Public")}
        {champ("prerequis", "Prérequis")}
        {champ("modalites", "Modalités", { placeholder: "ex. Présentiel, en soirée" })}
        <div>
          <label className="label" htmlFor="ordre">Ordre d&apos;affichage</label>
          <input id="ordre" name="ordre" type="number" min={0} defaultValue={f?.ordre ?? 0} className="input" />
        </div>
      </section>

      <section className="card space-y-5 p-5">
        <EditeurMarkdown nom="contenu" libelle="Présentation" valeur={f?.contenu ?? ""} lignes={10} aide={AIDE_MD} apercu={apercu} />
        <EditeurMarkdown nom="objectifs" libelle="Objectifs" valeur={f?.objectifs ?? ""} apercu={apercu} />
        <EditeurMarkdown nom="programme" libelle="Programme" valeur={f?.programme ?? ""} lignes={10} apercu={apercu} />
      </section>

      <section className="card flex flex-wrap items-center gap-6 p-5">
        <div>
          <label className="label" htmlFor="visuel">Visuel</label>
          <input id="visuel" name="visuel" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm" />
          <p className="mt-1 text-xs text-muted">JPEG, PNG ou WebP, 3 Mo max.</p>
        </div>
        {f?.visuel_url && (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.visuel_url} alt="" className="h-16 w-28 rounded object-cover" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="retirer_visuel" /> Retirer
            </label>
          </div>
        )}
      </section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-4 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="publiee" defaultChecked={f?.publiee ?? false} className="accent-[var(--accent)]" />
          Publiée sur le portail
        </label>
        <button type="submit" disabled={pending} className="btn btn-primary">{pending ? "Enregistrement…" : "Enregistrer"}</button>
        {etat && <span role="status" className={`text-sm ${etat.ok ? "text-ok" : "text-danger"}`}>{etat.message}</span>}
      </div>
    </form>
  );
}
