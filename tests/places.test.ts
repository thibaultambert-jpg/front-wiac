import { describe, expect, it } from "vitest";
import { calculerPlaces } from "@/lib/dendreo/places";

describe("calculerPlaces", () => {
  it("compte les places restantes", () => {
    expect(calculerPlaces({ nb_participants_max: "8", nb_participants_min: "6", total_participants: "6" })).toEqual({
      min: 6, max: 8, inscrits: 6, restantes: 2, complet: false,
    });
  });
  it("est complet quand les inscrits atteignent ou dépassent le maximum", () => {
    expect(calculerPlaces({ nb_participants_max: "8", total_participants: "8" }).complet).toBe(true);
    const sur = calculerPlaces({ nb_participants_max: "8", total_participants: "11" });
    expect(sur).toMatchObject({ complet: true, restantes: 0 });
  });
  it("max à 0 = pas de limite", () => {
    expect(calculerPlaces({ nb_participants_max: "0", total_participants: "40" })).toMatchObject({ complet: false, restantes: null });
    expect(calculerPlaces({})).toMatchObject({ complet: false, restantes: null, inscrits: 0 });
  });
});
