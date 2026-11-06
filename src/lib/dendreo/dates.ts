/** Date du jour à Paris, au format AAAA-MM-JJ. */
export function aujourdhui(): string {
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris" }).format(new Date());
}

/** « 2026-12-01 17:30 » ou « 2026-12-01 » → « 2026-12-01T17:30:00 » (heure locale Paris, sans fuseau). */
export function versIsoLocal(d: string): string {
  const [date, heure = "00:00"] = d.trim().split(/[ T]/);
  const [h = "00", m = "00", s = "00"] = heure.split(":");
  return `${date}T${h.padStart(2, "0")}:${m.padStart(2, "0")}:${s.slice(0, 2).padStart(2, "0")}`;
}

const JOUR = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const JOUR_LONG = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function enUtc(d: string): Date {
  return new Date(`${versIsoLocal(d)}Z`);
}

export const formatJour = (d: string) => JOUR.format(enUtc(d));
export const formatJourLong = (d: string) => JOUR_LONG.format(enUtc(d));
export const formatHeure = (d: string) => versIsoLocal(d).slice(11, 16).replace(":", "h");

/** « du 1 déc. 2026 au 9 déc. 2026 » ou « le 1 déc. 2026 ». */
export function formatPeriode(debut: string, fin: string): string {
  const a = debut.slice(0, 10);
  const b = fin.slice(0, 10);
  return a === b ? `le ${formatJour(debut)}` : `du ${formatJour(debut)} au ${formatJour(fin)}`;
}
