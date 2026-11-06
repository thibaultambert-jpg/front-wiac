import Image from "next/image";
import { redirect } from "next/navigation";
import { utilisateurCourant } from "@/lib/auth";
import { cheminInterne } from "@/lib/chemins";
import { connexionGoogle } from "./actions";

const ERREURS: Record<string, string> = {
  domaine: "Ce compte n'appartient pas au domaine de l'entreprise. Connectez-vous avec votre adresse professionnelle.",
  oauth: "La connexion Google a échoué. Réessayez.",
  code: "Le lien de connexion a expiré. Réessayez.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const { suite, erreur } = await searchParams;
  if (await utilisateurCourant()) redirect(cheminInterne(suite));
  return (
    <main className="grid min-h-dvh place-items-center bg-violet px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-xl">
        <Image src="/logo-wiacademy.png" alt="WiAcademy by Wavestone" width={170} height={43} priority />
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight">Formations internes</h1>
        <p className="mt-2 text-sm text-muted">
          Consultez les formations inter et inscrivez-vous avec votre compte Google professionnel.
        </p>
        {erreur && ERREURS[erreur] && (
          <p role="alert" className="mt-4 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
            {ERREURS[erreur]}
          </p>
        )}
        <form action={connexionGoogle} className="mt-6">
          <input type="hidden" name="suite" value={cheminInterne(suite)} />
          <button className="btn btn-primary w-full" type="submit">
            Se connecter avec Google
          </button>
        </form>
      </div>
    </main>
  );
}
