const LIBELLES: Record<string, string> = {
  presentiel: "Présentiel",
  distanciel: "Distanciel",
  mixte: "Mixte",
  elearning: "E-learning",
  "e-learning": "E-learning",
};
export const libelleMode = (m: string) => LIBELLES[m] ?? (m ? m[0].toUpperCase() + m.slice(1) : "");
