import Image from "next/image";
import Link from "next/link";

export function PiedDePage() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 py-10">
        <Image src="/logo-wiacademy.png" alt="WiAcademy by Wavestone" width={150} height={38} />
        <nav className="flex flex-wrap gap-6 text-sm text-violet">
          <Link href="/formations" className="hover:underline">Formations</Link>
          <Link href="/mes-formations" className="hover:underline">Mes formations</Link>
        </nav>
        <p className="text-xs text-muted">Portail interne · réservé aux collaborateurs</p>
      </div>
    </footer>
  );
}
