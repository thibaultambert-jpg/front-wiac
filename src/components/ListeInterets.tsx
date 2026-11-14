"use client";
import { useRef, useState } from "react";
import type { InteretFormation } from "@/lib/interets";

const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Paris" });

/** Formations ayant reçu des « La formation m'intéresse » ; un clic ouvre la liste des personnes. */
export function ListeInterets({ interets }: { interets: InteretFormation[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [choisie, setChoisie] = useState<InteretFormation | null>(null);

  if (interets.length === 0) {
    return <p className="card p-6 text-sm text-muted">Personne n&apos;a encore signalé d&apos;intérêt pour une formation sans session.</p>;
  }
  return (
    <>
      <ul className="card divide-y divide-line">
        {interets.map((f) => (
          <li key={f.formationId}>
            <button
              type="button"
              onClick={() => {
                setChoisie(f);
                dialog.current?.showModal();
              }}
              className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left hover:bg-surface-2"
            >
              <span className="font-medium">{f.titre}</span>
              <span className="badge bg-violet-soft text-violet">
                {f.personnes.length} personne{f.personnes.length > 1 ? "s" : ""} intéressée{f.personnes.length > 1 ? "s" : ""}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
        className="m-auto w-[min(92vw,32rem)] rounded-2xl p-0 shadow-xl backdrop:bg-ink/40"
      >
        {choisie && (
          <div className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-violet">Intéressés</p>
                <h2 className="text-lg font-bold">{choisie.titre}</h2>
              </div>
              <button type="button" onClick={() => dialog.current?.close()} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2" aria-label="Fermer">
                ✕
              </button>
            </div>
            <ul className="mt-4 max-h-[60vh] divide-y divide-line overflow-y-auto">
              {choisie.personnes.map((p) => (
                <li key={p.email} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-sm">
                  <span>
                    <span className="font-medium">{p.nom || p.email}</span>
                    {p.nom && <span className="block text-xs text-muted">{p.email}</span>}
                  </span>
                  <span className="text-xs text-muted">depuis le {DATE.format(new Date(p.depuis))}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </dialog>
    </>
  );
}
