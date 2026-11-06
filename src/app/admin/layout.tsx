import { Entete } from "@/components/Entete";
import { exigerAdmin } from "@/lib/auth";

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const u = await exigerAdmin();
  return (
    <>
      <Entete u={u} zone="admin" />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </>
  );
}
