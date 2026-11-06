import type { ModuleProgramme } from "@/lib/programme";

/** Programme en accordéon numéroté (style du site public) ; le contenu doit être du HTML déjà nettoyé. */
export function AccordeonProgramme({ modules }: { modules: ModuleProgramme[] }) {
  return (
    <div className="space-y-3">
      {modules.map((m, i) => (
        <details key={i} className="group rounded-2xl border border-[#d9d0f7] bg-[#f3f0fd]">
          <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
            <span className="text-3xl font-extrabold leading-none text-violet/20">{String(i + 1).padStart(2, "0")}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{m.titre}</span>
              {m.sous_titre && <span className="mt-0.5 block text-sm text-muted">{m.sous_titre}</span>}
            </span>
            <svg className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-180" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="m5 8 5 5 5-5" />
            </svg>
          </summary>
          {m.contenu && (
            <div
              className="prose-fiche px-5 pb-5 text-sm [&_h3]:mt-4 [&_h3]:mb-1 [&_h3]:text-[15px] [&_p]:my-2"
              dangerouslySetInnerHTML={{ __html: m.contenu }}
            />
          )}
        </details>
      ))}
    </div>
  );
}
