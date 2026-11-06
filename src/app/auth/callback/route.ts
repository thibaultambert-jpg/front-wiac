import { NextResponse, type NextRequest } from "next/server";
import { identiteAutorisee, synchroniserProfil } from "@/lib/auth";
import { cheminInterne } from "@/lib/chemins";
import { publicUrl } from "@/lib/config";
import { supabaseSession } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const suite = cheminInterne(request.nextUrl.searchParams.get("suite"));
  const base = publicUrl();
  if (!code) return NextResponse.redirect(`${base}/login?erreur=code`);

  const supabase = await supabaseSession();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${base}/login?erreur=code`);

  // Le paramètre `hd` envoyé à Google ne suffit pas : on revérifie le domaine côté serveur.
  if (!identiteAutorisee(data.user)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${base}/login?erreur=domaine`);
  }
  await synchroniserProfil(data.user);
  return NextResponse.redirect(`${base}${suite}`);
}
