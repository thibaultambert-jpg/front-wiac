"use client";
import { useRef, useState } from "react";
import type { ModuleProgramme } from "@/lib/programme";
import { EditeurRiche } from "./EditeurRiche";

type Ligne = ModuleProgramme & { cle: number };

const ligne = (cle: number, m?: Partial<ModuleProgramme>): Ligne => ({ cle, titre: m?.titre ?? "", sous_titre: m?.sous_titre ?? "", contenu: m?.contenu ?? "" });

/** Modules du programme (accordéon du portail) : titre, sous-titre, contenu riche. Envoyés en JSON dans `programme_modules`. */
export function EditeurProgramme({ initiaux }: { initiaux: ModuleProgramme[] }) {
  // Clés déterministes (identiques au rendu serveur et navigateur), puis compteur local pour les ajouts.
  const [lignes, setLignes] = useState<Ligne[]>(() => (initiaux.length ? initiaux.map((m, i) => ligne(i, m)) : [ligne(0)]));
  const prochaineCle = useRef(Math.max(initiaux.length, 1));
  const [ouvert, setOuvert] = useState<number | null>(lignes[0]?.cle ?? null);

  const maj = (cle: number, champ: keyof ModuleProgramme, v: string) => setLignes((ls) => ls.map((l) => (l.cle === cle ? { ...l, [champ]: v } : l)));
  const deplacer = (i: number, d: number) =>
    setLignes((ls) => {
      const j = i + d;
      if (j < 0 || j >= ls.length) return ls;
      const c = [...ls];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });

  const json = JSON.stringify(lignes.map(({ titre, sous_titre, contenu }) => ({ titre, sous_titre, contenu })));

  return (
    <div className="space-y-3">
      <input type="hidden" name="programme_modules" value={json} />
      {lignes.map((l, i) => {
        const deplie = ouvert === l.cle;
        return (
          <div key={l.cle} className="rounded-2xl border border-line bg-surface-2">
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="text-2xl font-extrabold text-violet/25">{String(i + 1).padStart(2, "0")}</span>
              <button type="button" onClick={() => setOuvert(deplie ? null : l.cle)} className="min-w-0 flex-1 text-left" aria-expanded={deplie}>
                <span className="block truncate font-semibold">{l.titre || <span className="text-muted">Module sans titre</span>}</span>
                {l.sous_titre && <span className="block truncate text-xs text-muted">{l.sous_titre}</span>}
              </button>
              <div className="flex shrink-0 items-center gap-1">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => deplacer(i, -1)} disabled={i === 0} aria-label="Monter">↑</button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => deplacer(i, 1)} disabled={i === lignes.length - 1} aria-label="Descendre">↓</button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  aria-label="Supprimer le module"
                  onClick={() => {
                    if (window.confirm(`Supprimer le module ${i + 1} ?`)) setLignes((ls) => ls.filter((x) => x.cle !== l.cle));
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            {deplie && (
              <div className="space-y-3 border-t border-line bg-white px-4 py-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="label" htmlFor={`titre-${l.cle}`}>Titre *</label>
                    <input id={`titre-${l.cle}`} value={l.titre} onChange={(e) => maj(l.cle, "titre", e.target.value)} placeholder="Qui est le Product Builder ?" className="input" />
                  </div>
                  <div>
                    <label className="label" htmlFor={`st-${l.cle}`}>Sous-titre</label>
                    <input id={`st-${l.cle}`} value={l.sous_titre} onChange={(e) => maj(l.cle, "sous_titre", e.target.value)} placeholder="Une phrase de résumé" className="input" />
                  </div>
                </div>
                <div>
                  <p className="label">Contenu</p>
                  <EditeurRiche valeur={l.contenu} onChange={(h) => maj(l.cle, "contenu", h)} minHauteur={160} />
                </div>
              </div>
            )}
          </div>
        );
      })}
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => {
          const n = ligne(prochaineCle.current++);
          setLignes((ls) => [...ls, n]);
          setOuvert(n.cle);
        }}
      >
        + Ajouter un module
      </button>
    </div>
  );
}
