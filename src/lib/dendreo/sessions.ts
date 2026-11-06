// Lecture des sessions INTER dans Dendreo, normalisées pour l'affichage.
import "server-only";
import { unstable_cache } from "next/cache";
import { etapesMasquees } from "../config";
import { DendreoClient } from "./client";
import { assemblerSessions, s } from "./assemblage";
import { aujourdhui } from "./dates";
import type { Categorie, Session } from "./types";

export const TAG_SESSIONS = "dendreo-sessions";
const DUREE_CACHE = 300; // secondes

let instance: DendreoClient | undefined;
export const dendreo = () => (instance ??= DendreoClient.fromEnv());

/** Référentiels peu volatils : salles et catégories. */
const referentiels = unstable_cache(
  async () => {
    const [salles, categories] = await Promise.all([
      dendreo().list("salles_de_formation.php"),
      dendreo().list("categories_module.php"),
    ]);
    return { salles, categories };
  },
  ["dendreo-referentiels"],
  { revalidate: 3600, tags: [TAG_SESSIONS] },
);

async function chargerAVenir(): Promise<Session[]> {
  const depuis = aujourdhui();
  const client = dendreo();
  const [adfs, lams, creneaux, ref] = await Promise.all([
    client.list("actions_de_formation.php", { type: "inter", started_after: depuis }),
    client.list("lams.php", { started_after: depuis, include: "module" }),
    client.list("creneaux.php", { started_after: depuis }),
    referentiels(),
  ]);
  return assemblerSessions({ adfs, lams, creneaux, ...ref }, etapesMasquees());
}

/** Sessions INTER à venir (cache 5 min, invalidé après chaque inscription). */
export const sessionsAVenir = unstable_cache(chargerAVenir, ["dendreo-sessions-a-venir"], {
  revalidate: DUREE_CACHE,
  tags: [TAG_SESSIONS],
});

async function chargerSessions(ids: string[]): Promise<Session[]> {
  if (ids.length === 0) return [];
  const client = dendreo();
  const liste = ids.join(",");
  const [adfs, lams, creneaux, ref] = await Promise.all([
    client.list("actions_de_formation.php", { id: liste }),
    Promise.all(ids.map((i) => client.list("lams.php", { id_action_de_formation: i, include: "module" }))).then((r) => r.flat()),
    Promise.all(ids.map((i) => client.list("creneaux.php", { id_action_de_formation: i }))).then((r) => r.flat()),
    referentiels(),
  ]);
  return assemblerSessions({ adfs, lams, creneaux, ...ref }, etapesMasquees());
}

/** Une ou plusieurs sessions précises (y compris passées ou en cours), en cache. */
export const sessionsParIds = unstable_cache(
  async (ids: string[]) => chargerSessions([...new Set(ids)].sort()),
  ["dendreo-sessions-par-ids"],
  { revalidate: DUREE_CACHE, tags: [TAG_SESSIONS] },
);

export async function sessionParId(idAdf: string): Promise<Session | null> {
  if (!/^\d+$/.test(idAdf)) return null;
  const aVenir = (await sessionsAVenir()).find((x) => x.id === idAdf);
  if (aVenir) return aVenir;
  return (await sessionsParIds([idAdf]))[0] ?? null;
}

export async function categories(): Promise<Categorie[]> {
  const { categories: rows } = await referentiels();
  return rows
    .filter((r) => s(r.status) !== "0")
    .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))
    .map((r) => ({ id: s(r.id_categorie_module), intitule: s(r.intitule) }));
}
