// Solar Freedom — Aggregated City Content Depth
// Combines all batch files into a single lookup function

import { CityContentDepth, cityContentDepth } from "./city-content-depth";
import { cityContentDepthBatchA } from "./city-content-depth-batch-a";
import { cityContentDepthBatchB } from "./city-content-depth-batch-b";
import { cityContentDepthBatchC } from "./city-content-depth-batch-c";
import { cityContentDepthBatchD } from "./city-content-depth-batch-d";

export type { CityContentDepth };

const allCityContentDepth: CityContentDepth[] = [
  ...cityContentDepth,
  ...cityContentDepthBatchA,
  ...cityContentDepthBatchB,
  ...cityContentDepthBatchC,
  ...cityContentDepthBatchD,
];

export function getCityContentDepthAll(slug: string): CityContentDepth | undefined {
  return allCityContentDepth.find(c => c.slug === slug);
}
