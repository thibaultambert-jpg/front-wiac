import { NextResponse } from "next/server";
import { comptesAttente } from "@/lib/attente";
import { utilisateurCourant } from "@/lib/auth";
import { catalogue } from "@/lib/catalogue";
import { csv, lignesSessions } from "@/lib/tableau-de-bord";

export async function GET() {
  const u = await utilisateurCourant();
  if (u?.role !== "admin") return NextResponse.json({ erreur: "non autorisé" }, { status: 403 });
  const [formations, attente] = await Promise.all([catalogue(), comptesAttente()]);
  const parSession = new Map(formations.flatMap((f) => f.sessions.map((s) => [s.id, { formation: f.titre, numero: s.numero }] as const)));
  const lignes = lignesSessions(formations.flatMap((f) => f.sessions), attente).sort((a, b) => a.debut.localeCompare(b.debut));
  const contenu = csv([
    ["Formation", "Session", "Numéro", "Début", "Fin", "Inscrits", "Places max", "Minimum", "Remplissage %", "En attente", "Sous le minimum"],
    ...lignes.map((l) => [
      parSession.get(l.id)?.formation ?? "",
      l.intitule,
      parSession.get(l.id)?.numero ?? "",
      l.debut.slice(0, 10),
      l.fin.slice(0, 10),
      l.inscrits,
      l.max || null,
      l.min || null,
      l.remplissage === null ? null : Math.round(l.remplissage * 100),
      l.attente,
      l.sousMinimum ? "oui" : "non",
    ]),
  ]);
  return new NextResponse(contenu, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sessions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
