import { Entete } from "@/components/Entete";
import { PiedDePage } from "@/components/PiedDePage";
import { exigerUtilisateur } from "@/lib/auth";
import { estFormateur } from "@/lib/formateur";

export default async function LayoutInterne({ children }: { children: React.ReactNode }) {
  const u = await exigerUtilisateur();
  const formateur = await estFormateur(u);
  return (
    <>
      <Entete u={u} zone="interne" formateur={formateur} />
      <main>{children}</main>
      <PiedDePage />
    </>
  );
}
