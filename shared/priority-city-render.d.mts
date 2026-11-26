import type { PriorityCityContent } from './priorityCityContent';
/** Published state-law path for a state name, or null when that state has no published page. */
export function getStateLawPath(state:string):string|null;
export function renderPriorityCityBody(data:PriorityCityContent):string;
export function buildPriorityCitySchemas(data:PriorityCityContent,pagePath:string):object[];
