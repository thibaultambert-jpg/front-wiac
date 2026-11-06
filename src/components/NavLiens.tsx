"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLiens({ liens }: { liens: [string, string][] }) {
  const chemin = usePathname();
  const actif = (href: string) => (href === "/admin" ? chemin === "/admin" : chemin === href || chemin.startsWith(`${href}/`));
  return (
    <nav className="flex flex-wrap items-center gap-1 text-sm font-medium">
      {liens.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          aria-current={actif(href) ? "page" : undefined}
          className={`rounded-lg px-3 py-1.5 transition ${actif(href) ? "bg-violet text-white" : "text-ink hover:bg-white/60"}`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
