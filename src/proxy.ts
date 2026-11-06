// Rafraîchit la session Supabase et redirige vers /login les visiteurs non connectés.
// Contrôle « optimiste » : les droits (domaine, rôle admin) sont revérifiés côté serveur dans chaque page et action.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = [/^\/login/, /^\/auth\//, /^\/api\/cron\//];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (aPoser) => {
        for (const { name, value } of aPoser) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of aPoser) response.cookies.set(name, value, options);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const chemin = request.nextUrl.pathname;
  if (!user && !PUBLIC.some((r) => r.test(chemin))) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = chemin === "/" ? "" : `?suite=${encodeURIComponent(chemin + request.nextUrl.search)}`;
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
