import Link from "next/link";
import type { Utilisateur } from "@/lib/auth";

export function Entete({ u, zone }: { u: Utilisateur; zone: "interne" | "admin" }) {
  const liens =
    zone === "admin"
      ? [
          ["/admin", "Tableau de bord"],
          ["/admin/attente", "Listes d'attente"],
          ["/admin/formations", "Fiches"],
          ["/admin/detectees", "Formations détectées"],
          ["/admin/journal", "Journal"],
        ]
      : [
          ["/formations", "Formations"],
          ["/mes-formations", "Mes formations"],
        ];
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href={zone === "admin" ? "/admin" : "/formations"} className="font-semibold">
          <span className="text-accent">Wiacademy</span> {zone === "admin" ? "· Back-office" : "· Formations"}
        </Link>
        <nav className="flex flex-wrap gap-4 text-sm text-muted">
          {liens.map(([href, label]) => (
            <Link key={href} href={href} className="hover:text-ink">
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          {u.role === "admin" && (
            <Link href={zone === "admin" ? "/formations" : "/admin"} className="btn btn-secondary btn-sm">
              {zone === "admin" ? "Voir le portail" : "Back-office"}
            </Link>
          )}
          <span className="hidden text-muted sm:inline">{u.prenom || u.email}</span>
          <form action="/auth/deconnexion" method="post">
            <button className="text-muted hover:text-ink" type="submit">
              Déconnexion
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
