import { Entete } from "@/components/Entete";
import { PiedDePage } from "@/components/PiedDePage";
import { exigerUtilisateur } from "@/lib/auth";

export default async function LayoutInterne({ children }: { children: React.ReactNode }) {
  const u = await exigerUtilisateur();
  return (
    <>
      <Entete u={u} zone="interne" />
      <main>{children}</main>
      <PiedDePage />
    </>
  );
}
