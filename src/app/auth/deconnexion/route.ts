import { NextResponse } from "next/server";
import { publicUrl } from "@/lib/config";
import { supabaseSession } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await supabaseSession();
  await supabase.auth.signOut();
  return NextResponse.redirect(`${publicUrl()}/login`, { status: 303 });
}
