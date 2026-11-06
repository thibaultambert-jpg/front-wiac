import type { Places } from "@/lib/dendreo/types";

export function BadgePlaces({ places }: { places: Places }) {
  if (places.complet) return <span className="badge bg-danger-soft text-danger">Complet</span>;
  if (places.restantes === null) return <span className="badge bg-ok-soft text-ok">Places disponibles</span>;
  const peu = places.restantes <= 2;
  return (
    <span className={`badge ${peu ? "bg-warn-soft text-warn" : "bg-ok-soft text-ok"}`}>
      {places.restantes} place{places.restantes > 1 ? "s" : ""} restante{places.restantes > 1 ? "s" : ""}
    </span>
  );
}

export function JaugePlaces({ places }: { places: Places }) {
  if (places.max === 0) return null;
  const pct = Math.min(100, Math.round((places.inscrits / places.max) * 100));
  return (
    <div className="flex items-center gap-2 text-xs text-muted">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-2" aria-hidden>
        <div className={`h-full ${places.complet ? "bg-danger" : "bg-accent"}`} style={{ width: `${pct}%` }} />
      </div>
      <span>
        {places.inscrits}/{places.max} inscrits
      </span>
    </div>
  );
}
