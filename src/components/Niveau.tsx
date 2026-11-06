const NIVEAUX = {
  debutant: { libelle: "Débutant", barres: 1 },
  intermediaire: { libelle: "Intermédiaire", barres: 2 },
  avance: { libelle: "Avancé", barres: 3 },
} as const;

export const libelleNiveau = (n: string) => NIVEAUX[n as keyof typeof NIVEAUX]?.libelle ?? "";

/** « ▂▄▆ Intermédiaire » : barres pleines selon le niveau. */
export function Niveau({ niveau }: { niveau: string }) {
  const n = NIVEAUX[niveau as keyof typeof NIVEAUX];
  if (!n) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
      <span className="flex items-end gap-[2px]" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span key={i} className={`w-[3px] rounded-sm ${i <= n.barres ? "bg-ink" : "bg-ink/20"}`} style={{ height: 4 + i * 3 }} />
        ))}
      </span>
      {n.libelle}
    </span>
  );
}
