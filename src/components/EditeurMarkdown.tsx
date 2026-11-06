"use client";
import { useState, useTransition } from "react";

/** Zone Markdown avec onglet d'aperçu (rendu par le serveur, identique au portail). */
export function EditeurMarkdown({
  nom,
  libelle,
  valeur,
  lignes = 8,
  aide,
  apercu,
}: {
  nom: string;
  libelle: string;
  valeur: string;
  lignes?: number;
  aide?: string;
  apercu: (md: string) => Promise<string>;
}) {
  const [texte, setTexte] = useState(valeur);
  const [html, setHtml] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const voir = html !== null;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="label mb-0" htmlFor={nom}>{libelle}</label>
        <div className="flex gap-1 text-xs">
          <button type="button" onClick={() => setHtml(null)} className={`rounded px-2 py-1 ${!voir ? "bg-accent-soft text-accent" : "text-muted"}`}>
            Écrire
          </button>
          <button
            type="button"
            onClick={() => start(async () => setHtml(await apercu(texte)))}
            className={`rounded px-2 py-1 ${voir ? "bg-accent-soft text-accent" : "text-muted"}`}
          >
            {pending ? "…" : "Aperçu"}
          </button>
        </div>
      </div>
      <textarea id={nom} name={nom} rows={lignes} value={texte} onChange={(e) => setTexte(e.target.value)} className={`input font-mono ${voir ? "hidden" : ""}`} />
      {voir && (
        <div className="prose-fiche min-h-24 rounded-lg border border-line bg-surface-2 p-3" dangerouslySetInnerHTML={{ __html: html || "<p><em>Vide</em></p>" }} />
      )}
      {aide && <p className="mt-1 text-xs text-muted">{aide}</p>}
    </div>
  );
}
