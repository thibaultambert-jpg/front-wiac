import { FormAction, type Etat } from "./FormAction";

type Action = (etat: Etat, formData: FormData) => Promise<Etat>;

export type LigneAdmin = { id: string; nom: string; email: string; commentaire: string; depuis: string };

/**
 * Personnes en attente, par ordre d'arrivée. Chacune peut être inscrite individuellement,
 * ou toutes d'un coup. Session complète : l'inscription se fait « en surnombre » (après confirmation).
 */
export function ListeAttenteAdmin({
  idAdf,
  lignes,
  complet,
  promouvoir,
  promouvoirTous,
  retirer,
}: {
  idAdf: string;
  lignes: LigneAdmin[];
  complet: boolean;
  promouvoir: Action;
  promouvoirTous: Action;
  retirer: Action;
}) {
  if (lignes.length === 0) return <p className="card p-6 text-sm text-muted">Personne en attente.</p>;
  const forcer = complet ? "1" : "";
  return (
    <div className="space-y-3">
      {lignes.length > 1 && (
        <FormAction
          action={promouvoirTous}
          champs={{ session: idAdf, forcer }}
          libelle={complet ? `Tout inscrire en surnombre (${lignes.length})` : `Tout inscrire (${lignes.length})`}
          enCours="Inscriptions…"
          variante="primary"
          confirmation={
            complet
              ? `La session est complète. Inscrire les ${lignes.length} personnes au-delà de la capacité ?`
              : `Inscrire les ${lignes.length} personnes en attente ? S'il ne reste pas assez de places, seules les premières seront inscrites.`
          }
        />
      )}
      <ol className="card divide-y divide-line">
        {lignes.map((l, i) => (
          <li key={l.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-soft text-sm font-bold text-violet">{i + 1}</span>
              <div className="min-w-0">
                <p className="font-semibold">{l.nom || l.email}</p>
                <p className="truncate text-xs text-muted">
                  {l.email} · depuis le {l.depuis}
                </p>
                {l.commentaire && <p className="mt-1 text-sm italic text-muted">« {l.commentaire} »</p>}
              </div>
            </div>
            <div className="flex shrink-0 items-start gap-2 sm:items-center">
              <FormAction
                action={promouvoir}
                champs={{ ligne: l.id, session: idAdf, forcer }}
                libelle={complet ? "Inscrire en surnombre" : "Inscrire"}
                enCours="Inscription…"
                variante="primary"
                confirmation={complet ? `La session est complète. Inscrire ${l.nom || l.email} au-delà de la capacité ?` : undefined}
              />
              <FormAction action={retirer} champs={{ ligne: l.id }} libelle="Retirer" variante="danger" confirmation={`Retirer ${l.nom || l.email} de la liste ?`} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
