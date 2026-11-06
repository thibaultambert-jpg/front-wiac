import "server-only";
import { sessionsAVenir } from "../dendreo/sessions";
import { supabaseAdmin } from "../supabase/server";
import { construireCatalogue, type Fiche, type FormationCatalogue } from "./assembler";

export type { Fiche, FormationCatalogue };

export async function donneesBo() {
  const db = supabaseAdmin();
  const [fiches, liens, ignores] = await Promise.all([
    db.from("formations").select("*").order("ordre").order("titre"),
    db.from("formation_modules").select("id_module, formation_id"),
    db.from("modules_detectes").select("id_module").eq("ignore", true),
  ]);
  if (fiches.error) throw fiches.error;
  if (liens.error) throw liens.error;
  if (ignores.error) throw ignores.error;
  return {
    fiches: (fiches.data ?? []) as Fiche[],
    liens: liens.data ?? [],
    ignores: new Set((ignores.data ?? []).map((r) => String(r.id_module))),
  };
}

export async function catalogue(): Promise<FormationCatalogue[]> {
  const [sessions, bo] = await Promise.all([sessionsAVenir(), donneesBo()]);
  return construireCatalogue(sessions, bo.fiches, bo.liens, bo.ignores);
}

export async function formationParSlug(slug: string): Promise<FormationCatalogue | null> {
  return (await catalogue()).find((f) => f.slug === slug) ?? null;
}

/** Formation (fiche ou module) à laquelle une session est rattachée dans le catalogue. */
export async function formationDeSession(idAdf: string): Promise<FormationCatalogue | null> {
  return (await catalogue()).find((f) => f.sessions.some((x) => x.id === idAdf)) ?? null;
}
