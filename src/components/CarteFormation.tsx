import Link from "next/link";
import { BadgePlaces } from "./Places";
import { Niveau } from "./Niveau";
import { themeCategorie } from "@/lib/couleurs";
import { formatPeriode } from "@/lib/dendreo/dates";
import type { FormationCatalogue } from "@/lib/catalogue/assembler";

/** Carte du catalogue, au style du site public : liseré et teinte de la thématique, niveau, puce, bouton coloré. */
export function CarteFormation({
  formation: fo,
  resume,
  inscrit,
  attentes,
}: {
  formation: FormationCatalogue;
  resume: string;
  inscrit: Set<string>;
  attentes: Map<string, number>;
}) {
  const t = themeCategorie(fo.categorie, fo.idCategorie);
  return (
    <li
      className="card relative flex flex-col overflow-hidden border-l-4"
      style={{ borderLeftColor: t.couleur, backgroundImage: `linear-gradient(135deg, ${t.fond} 0%, #ffffff 55%)` }}
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          {fo.fiche?.niveau ? <Niveau niveau={fo.fiche.niveau} /> : <span />}
          {t.libelle && (
            <span className="chip" style={{ background: t.puce, color: t.couleur }}>
              {t.libelle}
            </span>
          )}
        </div>
        <h3 className="mt-3 text-lg font-bold leading-snug">
          <Link href={`/formations/${fo.slug}`} className="hover:text-violet">
            {fo.titre}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm text-muted">{resume}</p>

        <div className="mt-4 flex-1 space-y-2">
          {fo.sessions.length === 0 && <p className="text-xs font-semibold uppercase tracking-wide text-muted">Prochaines sessions à venir</p>}
          {fo.sessions.slice(0, 2).map((s) => (
            <Link
              key={s.id}
              href={`/sessions/${s.id}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-white/80 px-3 py-2 text-sm transition hover:border-violet"
            >
              <span className="font-medium first-letter:uppercase">{formatPeriode(s.debut, s.fin)}</span>
              {inscrit.has(s.id) ? (
                <span className="badge bg-ok-soft text-ok">Inscrit</span>
              ) : attentes.has(s.id) ? (
                <span className="badge bg-warn-soft text-warn">Attente · n°{attentes.get(s.id)}</span>
              ) : (
                <BadgePlaces places={s.places} />
              )}
            </Link>
          ))}
          {fo.sessions.length > 2 && (
            <p className="text-xs text-muted">
              + {fo.sessions.length - 2} autre{fo.sessions.length - 2 > 1 ? "s" : ""} session{fo.sessions.length - 2 > 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <Link href={`/formations/${fo.slug}`} className="btn btn-sm text-white hover:brightness-110" style={{ background: t.couleur }}>
            Voir la formation →
          </Link>
        </div>
      </div>
    </li>
  );
}
