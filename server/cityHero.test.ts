import { describe, expect, it } from "vitest";
import { CITY_HEROES, GENERIC_CITY_HERO, getCityHero, getMissingIndexableCityHeroes } from "../client/src/data/city-heroes";

describe("city hero coverage", () => {
  it("assigns a unique, non-generic hero to every index-eligible city", () => {
    expect(getMissingIndexableCityHeroes()).toEqual([]);
    const heroUrls = Object.values(CITY_HEROES);
    expect(new Set(heroUrls).size).toBe(heroUrls.length);
    expect(heroUrls).not.toContain(GENERIC_CITY_HERO);
  });

  it("keeps the generic hero as a deliberate fallback for noneligible routes", () => {
    expect(getCityHero("unapproved-example-city")).toBe(GENERIC_CITY_HERO);
  });
});
