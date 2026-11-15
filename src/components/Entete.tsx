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
  ["/admin/admins", "Admins"],
  ["/admin/journal", "Journal"],
];

function IconeDeconnexion() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function IconeBackOffice() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}

function IconePortail() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" />
    </svg>
  );
}

/**
 * Bandeau violet avec barre de navigation en pilule lavande, comme le site public.
 * Mobile : logo + pictos (back-office, déconnexion) en haut, menu sur une ligne en dessous.
 */
export function Entete({ u, zone }: { u: Utilisateur; zone: "interne" | "admin" }) {
  const versAutreZone = zone === "admin" ? { href: "/formations", label: "Voir le portail" } : { href: "/admin", label: "Back-office" };
  return (
    <div className="bg-violet px-4 pt-3">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl bg-lavande px-4 py-2.5 shadow-sm">
        <Link href={zone === "admin" ? "/admin" : "/formations"} className="flex items-center gap-2" aria-label="WiAcademy — accueil">
          <Image src="/logo-wiacademy.png" alt="WiAcademy by Wavestone" width={124} height={31} priority />
          {zone === "admin" && <span className="chip bg-violet text-white">Back-office</span>}
        </Link>

        <div className="order-2 ml-auto flex items-center gap-1 sm:order-3 sm:gap-3">
          {u.role === "admin" && (
            <>
              <Link href={versAutreZone.href} className="btn btn-turquoise btn-sm hidden sm:inline-flex">
                {versAutreZone.label}
              </Link>
              <Link
                href={versAutreZone.href}
                className="grid h-9 w-9 place-items-center rounded-lg text-violet hover:bg-white/60 sm:hidden"
                aria-label={versAutreZone.label}
                title={versAutreZone.label}
              >
                {zone === "admin" ? <IconePortail /> : <IconeBackOffice />}
              </Link>
            </>
          )}
          <form action="/auth/deconnexion" method="post">
            <button
              className="grid h-9 w-9 place-items-center rounded-lg text-ink/60 hover:bg-white/60 hover:text-violet"
              type="submit"
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              <IconeDeconnexion />
            </button>
          </form>
        </div>

        <div className="order-3 -mx-1 w-full overflow-x-auto sm:order-2 sm:mx-0 sm:w-auto">
          <NavLiens liens={zone === "admin" ? LIENS_ADMIN : LIENS_INTERNE} />
        </div>
      </header>
    </div>
  );
}
