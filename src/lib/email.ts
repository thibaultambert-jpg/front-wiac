import "server-only";

/** Envoi via l'API Resend si RESEND_API_KEY est défini ; sinon rien n'est envoyé (renvoie false). */
export async function envoyerEmail(m: { a: string; sujet: string; texte: string }): Promise<boolean> {
  const cle = process.env.RESEND_API_KEY;
  const de = process.env.EMAIL_FROM;
  if (!cle || !de) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: de, to: [m.a], subject: m.sujet, text: m.texte }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.error("Email non envoyé :", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("Email non envoyé :", e);
    return false;
  }
}
