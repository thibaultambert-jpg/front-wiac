"use server";
import { redirect } from "next/navigation";
import { domaineWorkspace, publicUrl } from "@/lib/config";
import { cheminInterne } from "@/lib/chemins";
import { supabaseSession } from "@/lib/supabase/server";

export async function connexionGoogle(formData: FormData) {
  const suite = cheminInterne(formData.get("suite"));
  const supabase = await supabaseSession();
  const callback = `${publicUrl()}/auth/callback?suite=${encodeURIComponent(suite)}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callback,
      queryParams: { hd: domaineWorkspace(), prompt: "select_account" },
    },
  });
  if (error || !data.url) redirect("/login?erreur=oauth");
  redirect(data.url);
}
