type CityMetaInput = {
  slug: string;
  name: string;
  state: string;
  stateCode: string;
};

export type CityMeta = { title: string; description: string };

const titlePatterns = [
  ({ name, stateCode }: CityMetaInput) => `Solar Contract Review in ${name}, ${stateCode} | Solar Freedom`,
  ({ name, stateCode }: CityMetaInput) => `${name}, ${stateCode} Solar Contract Options | Solar Freedom`,
  ({ name, stateCode }: CityMetaInput) => `Cancel a Solar Contract in ${name}, ${stateCode} | Solar Freedom`,
  ({ name, stateCode }: CityMetaInput) => `${name}, ${stateCode} Solar Agreement Review | Solar Freedom`,
];

const descriptionPatterns = [
  ({ name, state }: CityMetaInput) => `${name}, ${state} homeowners can review solar agreement terms, financing disclosures, and consumer resources before requesting an individual case review.`,
  ({ name, state }: CityMetaInput) => `Review solar-contract records, sales promises, and available consumer resources for ${name}, ${state}. Get a no-obligation individual case review.`,
  ({ name, state }: CityMetaInput) => `Questions about a solar agreement in ${name}, ${state}? Gather the contract and financing records, then review practical next steps with Solar Freedom.`,
  ({ name, state }: CityMetaInput) => `A ${name}, ${state} solar contract review starts with the agreement, disclosures, and communications. Learn what to gather before requesting help.`,
];

function stableIndex(slug: string, size: number) {
  let value = 0;
  for (const character of slug) value = (value * 31 + character.charCodeAt(0)) >>> 0;
  return value % size;
}

/** Generates a deterministic, location-specific fallback for every city route. */
export function generateCityMeta(city: CityMetaInput): CityMeta {
  return {
    title: titlePatterns[stableIndex(city.slug, titlePatterns.length)](city),
    description: descriptionPatterns[stableIndex(`${city.slug}:description`, descriptionPatterns.length)](city),
  };
}

export function findDuplicateCityMeta(entries: Array<{ slug: string } & CityMeta>) {
  const issues: string[] = [];
  for (const field of ["title", "description"] as const) {
    const seen = new Map<string, string>();
    for (const entry of entries) {
      const normalized = entry[field].trim().toLowerCase();
      const original = seen.get(normalized);
      if (original) issues.push(`Duplicate ${field}: ${original} and ${entry.slug}`);
      else seen.set(normalized, entry.slug);
    }
  }
  return issues;
}
