import Link from "next/link";
import type { Metadata } from "next";
import { BoutonAction } from "@/components/BoutonAction";
import { Hero } from "@/components/Hero";
import { attentesUtilisateur } from "@/lib/attente";
import { exigerUtilisateur } from "@/lib/auth";
import { aujourdhui, formatPeriode } from "@/lib/dendreo/dates";
import { sessionsParIds } from "@/lib/dendreo/sessions";
import type { Session } from "@/lib/dendreo/types";
import { mesInscriptions } from "@/lib/mes-formations";
import { quitterAttente, seDesinscrire } from "../actions";

export const metadata: Metadata = { title: "Mes formations" };

function Ligne({ s, children }: { s: Session; children?: React.ReactNode }) {
  return (
    <li className="card flex flex-wrap items-center justify-between gap-3 p-4">
      <div>
        <Link href={`/sessions/${s.id}`} className="font-semibold hover:text-violet">{s.intitule}</Link>
        <p className="text-sm text-muted">
          {formatPeriode(s.debut, s.fin)}
          {s.lieux[0] && ` · ${s.lieux[0].intitule}`}
        </p>
      </div>
      {children}
    </li>
  );
}

export default async function MesFormations() {
  const u = await exigerUtilisateur();
  const [inscriptions, attentes] = await Promise.all([mesInscriptions(u), attentesUtilisateur(u.id)]);
  const sessionsAttente = await sessionsParIds([...attentes.keys()]);
  const jour = aujourdhui();
  const aVenir = inscriptions.filter((s) => s.fin.slice(0, 10) >= jour);
  const passees = inscriptions.filter((s) => s.fin.slice(0, 10) < jour).reverse();
  const enAttente = sessionsAttente.filter((s) => s.debut.slice(0, 10) > jour);

  return (
    <>
    <Hero surtitre={<p className="eyebrow">Mon espace</p>} titre={<>Mes <span className="text-turquoise">formations</span></>} sousTitre={`Bonjour ${u.prenom || ""}, retrouvez vos inscriptions et vos listes d'attente.`} />
    <div className="mx-auto max-w-5xl space-y-10 px-4 pt-10">

      <section className="space-y-3">
        <h2 className="titre-section text-xl">À venir</h2>
        {aVenir.length === 0 ? (
          <p className="text-sm text-muted">
            Aucune inscription à venir. <Link href="/formations" className="font-semibold text-violet hover:underline">Parcourir le catalogue</Link>
          </p>
        ) : (
          <ul className="space-y-3">
            {aVenir.map((s) => (
              <Ligne key={s.id} s={s}>
                {s.debut.slice(0, 10) > jour ? (
                  <BoutonAction
                    action={seDesinscrire}
                    session={s.id}
                    libelle="Annuler"
                    enCours="Annulation…"
                    variante="danger"
                    confirmation="Annuler votre inscription à cette session ?"
                  />
                ) : (
                  <span className="badge bg-accent-soft text-accent">En cours</span>
                )}
              </Ligne>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="titre-section text-xl">Listes d&apos;attente</h2>
        {enAttente.length === 0 ? (
          <p className="text-sm text-muted">Vous n&apos;êtes sur aucune liste d&apos;attente.</p>
        ) : (
          <ul className="space-y-3">
            {enAttente.map((s) => (
              <Ligne key={s.id} s={s}>
                <div className="flex items-center gap-3">
                  <span className="badge bg-warn-soft text-warn">n°{attentes.get(s.id)}</span>
                  <BoutonAction action={quitterAttente} session={s.id} libelle="Quitter" enCours="…" variante="secondary" />
                </div>
              </Ligne>
            ))}
          </ul>
        )}
      </section>

      {passees.length > 0 && (
        <section className="space-y-3">
          <h2 className="titre-section text-xl">Formations suivies</h2>
          <ul className="space-y-3">
            {passees.map((s) => (
              <Ligne key={s.id} s={s} />
            ))}
          </ul>
        </section>
      )}
    </div>
    </>
  );
}
