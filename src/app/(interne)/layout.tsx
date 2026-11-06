import { Entete } from "@/components/Entete";
import { exigerUtilisateur } from "@/lib/auth";

export default async function LayoutInterne({ children }: { children: React.ReactNode }) {
  const u = await exigerUtilisateur();
  return (
    <>
      <Entete u={u} zone="interne" />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </>
  );
}
