"use client";
import { useEffect, useState } from "react";

/**
 * Bandeau fixe « Choisir une session » en bas d'écran. Il disparaît dès que la section
 * « Sessions » (#sessions) est atteinte, pour ne jamais masquer les sessions ni le pied de page.
 */
export function BarreSessions({ titre, sousTitre }: { titre: string; sousTitre: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const cible = document.getElementById("sessions");
    if (!cible) return;
    const maj = () => setVisible(cible.getBoundingClientRect().top > window.innerHeight);
    maj();
    window.addEventListener("scroll", maj, { passive: true });
    window.addEventListener("resize", maj);
    return () => {
      window.removeEventListener("scroll", maj);
      window.removeEventListener("resize", maj);
    };
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 backdrop-blur transition-transform duration-200 ${visible ? "translate-y-0" : "pointer-events-none translate-y-full"}`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{titre}</p>
          <p className="text-xs text-muted first-letter:uppercase">{sousTitre}</p>
        </div>
        <a href="#sessions" tabIndex={visible ? 0 : -1} className="btn btn-primary btn-sm shrink-0">
          Choisir une session
        </a>
      </div>
    </div>
  );
}
