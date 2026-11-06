import Image from "next/image";
import Link from "next/link";
import type { Utilisateur } from "@/lib/auth";
import { NavLiens } from "./NavLiens";

const LIENS_INTERNE: [string, string][] = [
  ["/formations", "Formations"],
  ["/mes-formations", "Mes formations"],
];
const LIENS_ADMIN: [string, string][] = [
  ["/admin", "Tableau de bord"],
  ["/admin/attente", "Listes d'attente"],
  ["/admin/formations", "Fiches"],
  ["/admin/detectees", "Formations détectées"],
  ["/admin/journal", "Journal"],
];

/** Bandeau violet avec barre de navigation en pilule lavande, comme le site public. */
export function Entete({ u, zone }: { u: Utilisateur; zone: "interne" | "admin" }) {
  return (
    <div className="bg-violet px-4 pt-3">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl bg-lavande px-4 py-2.5 shadow-sm">
        <Link href={zone === "admin" ? "/admin" : "/formations"} className="flex items-center gap-2" aria-label="WiAcademy — accueil">
          <Image src="/logo-wiacademy.png" alt="WiAcademy by Wavestone" width={124} height={31} priority />
          {zone === "admin" && <span className="chip bg-violet text-white">Back-office</span>}
        </Link>
        <NavLiens liens={zone === "admin" ? LIENS_ADMIN : LIENS_INTERNE} />
        <div className="ml-auto flex items-center gap-3 text-sm">
          {u.role === "admin" && (
            <Link href={zone === "admin" ? "/formations" : "/admin"} className="btn btn-turquoise btn-sm">
              {zone === "admin" ? "Voir le portail" : "Back-office"}
            </Link>
          )}
          <span className="hidden font-medium text-ink/70 md:inline">{u.prenom || u.email}</span>
          <form action="/auth/deconnexion" method="post">
            <button className="text-ink/60 hover:text-violet" type="submit">
              Déconnexion
            </button>
          </form>
        </div>
      </header>
    </div>
  );
}
