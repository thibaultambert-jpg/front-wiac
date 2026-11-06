"use client";
import { useState, useTransition } from "react";
import { FormAction, type Etat } from "./FormAction";

type Action = (etat: Etat, formData: FormData) => Promise<Etat>;

export type LigneAdmin = { id: string; nom: string; email: string; commentaire: string; depuis: string };

/** File d'attente ordonnable (glisser-déposer ou flèches) avec promotion / retrait. */
export function ListeAttenteAdmin({
  idAdf,
  lignes,
  complet,
  reordonner,
  promouvoir,
  retirer,
}: {
  idAdf: string;
  lignes: LigneAdmin[];
  complet: boolean;
  reordonner: (idAdf: string, ids: string[]) => Promise<Etat>;
  promouvoir: Action;
  retirer: Action;
}) {
  const [ordre, setOrdre] = useState(lignes);
  const [glisse, setGlisse] = useState<number | null>(null);
  const [etat, setEtat] = useState<Etat>(null);
  const [pending, start] = useTransition();

  const enregistrer = (nouvel: LigneAdmin[]) => {
    setOrdre(nouvel);
    start(async () => setEtat(await reordonner(idAdf, nouvel.map((l) => l.id))));
  };
  const deplacer = (de: number, vers: number) => {
    if (vers < 0 || vers >= ordre.length || de === vers) return;
    const copie = [...ordre];
    const [l] = copie.splice(de, 1);
    copie.splice(vers, 0, l);
    enregistrer(copie);
  };

  if (ordre.length === 0) return <p className="card p-6 text-sm text-muted">Personne en attente.</p>;

  return (
    <div className="space-y-2">
      <ol className="card divide-y divide-line">
        {ordre.map((l, i) => (
          <li
            key={l.id}
            draggable
            onDragStart={() => setGlisse(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (glisse !== null) deplacer(glisse, i);
              setGlisse(null);
            }}
            className={`flex flex-wrap items-center gap-3 px-4 py-3 ${glisse === i ? "opacity-50" : ""}`}
          >
            <span className="cursor-grab select-none text-muted" aria-hidden>⋮⋮</span>
            <span className="w-6 text-center font-semibold">{i + 1}</span>
            <div className="min-w-48 flex-1">
              <p className="font-medium">{l.nom || l.email}</p>
              <p className="text-xs text-muted">
                {l.email} · depuis le {l.depuis}
              </p>
              {l.commentaire && <p className="mt-1 text-sm italic text-muted">« {l.commentaire} »</p>}
            </div>
            <div className="flex items-center gap-1">
              <button type="button" className="btn btn-secondary btn-sm" disabled={i === 0 || pending} onClick={() => deplacer(i, i - 1)} aria-label="Monter">↑</button>
              <button type="button" className="btn btn-secondary btn-sm" disabled={i === ordre.length - 1 || pending} onClick={() => deplacer(i, i + 1)} aria-label="Descendre">↓</button>
            </div>
            <div className="flex flex-wrap items-start gap-2">
              <FormAction action={promouvoir} champs={{ ligne: l.id }} libelle="Inscrire" enCours="Inscription…" variante="primary">
                {complet && (
                  <label className="flex items-center gap-1 text-xs text-muted">
                    <input type="checkbox" name="forcer" value="1" /> dépasser la capacité
                  </label>
                )}
              </FormAction>
              <FormAction action={retirer} champs={{ ligne: l.id }} libelle="Retirer" variante="danger" confirmation={`Retirer ${l.nom || l.email} de la liste ?`} />
            </div>
          </li>
        ))}
      </ol>
      {(pending || etat) && <p className={`text-sm ${etat && !etat.ok ? "text-danger" : "text-muted"}`}>{pending ? "Enregistrement de l'ordre…" : etat?.message}</p>}
    </div>
  );
}
