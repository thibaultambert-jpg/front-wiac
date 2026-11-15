import type { Metadata } from "next";
import { ajouterUnAdmin, retirerUnAdmin } from "@/app/admin/actions";
import { FormAction } from "@/components/FormAction";
import { FormulaireAjoutAdmin } from "@/components/FormulaireAjoutAdmin";
import { listerAdmins } from "@/lib/admins";
import { exigerAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admins" };

export default async function Admins() {
  const [moi, admins] = await Promise.all([exigerAdmin(), listerAdmins()]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admins</h1>
        <p className="mt-1 text-sm text-muted">Personnes ayant accès au back-office. Les admins « configuration » sont définis dans la variable ADMIN_EMAILS et ne peuvent pas être retirés ici.</p>
      </div>
      <FormulaireAjoutAdmin action={ajouterUnAdmin} />
      <ul className="card divide-y divide-line">
        {admins.map((a) => (
          <li key={a.email} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <div>
              <p className="font-medium">{a.nom || a.email}</p>
              {a.nom && <p className="text-sm text-muted">{a.email}</p>}
            </div>
            <div className="flex items-center gap-3">
              {a.enAttente && <span className="badge bg-warn-soft text-warn">Pas encore connecté</span>}
              {a.email === moi.email && <span className="badge bg-surface-2 text-muted">Vous</span>}
              {a.fixe ? (
                <span className="badge bg-surface-2 text-muted">Configuration</span>
              ) : (
                a.email !== moi.email && (
                  <FormAction action={retirerUnAdmin} champs={{ email: a.email }} libelle="Retirer" variante="danger" confirmation={`Retirer les droits admin de ${a.email} ?`} />
                )
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
