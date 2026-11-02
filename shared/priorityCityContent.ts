import cityContent from './priority-city-content.json';

export interface PriorityCityContent {
  slug: string; city: string; state: string; stateCode: string;
  title: string; description: string; question: string; answer: string;
  heroCopy: string; localNote: string; sourceCheckedOn: string;
  faq: Array<{q:string;a:string}>;
  sources: Array<{label:string;url:string;supports:string}>;
  documents: string[];
  reviewSteps: Array<{heading:string;body:string}>;
  links: Array<{label:string;url:string}>;
  ctaHeading: string; ctaCopy: string;
}
const registry = cityContent as Record<string, PriorityCityContent>;
export const PRIORITY_CITY_PATHS = Object.keys(registry);
export function getPriorityCityContent(pagePath:string): PriorityCityContent | undefined {
  const path = pagePath.split(/[?#]/,1)[0].replace(/\/+$/, '') || '/';
  return Object.prototype.hasOwnProperty.call(registry,path) ? registry[path] : undefined;
}
export { renderPriorityCityBody, buildPriorityCitySchemas } from './priority-city-render.mjs';
