import { Entete } from "@/components/Entete";
import { exigerAdmin } from "@/lib/auth";

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const u = await exigerAdmin();
  return (
    <div className="min-h-dvh bg-surface-2">
      <Entete u={u} zone="admin" />
      <div className="h-6 bg-violet" aria-hidden />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
