import { NextResponse, type NextRequest } from "next/server";
import { journaliser } from "@/lib/journal";
import { synchroniserModules } from "@/lib/sync-modules";

// Appelé chaque jour par le cron Vercel (vercel.json), authentifié par CRON_SECRET.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ erreur: "non autorisé" }, { status: 401 });
  }
  const res = await synchroniserModules();
  await journaliser({ acteur: "cron", action: "synchronisation", details: res });
  return NextResponse.json(res);
}
