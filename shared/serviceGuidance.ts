import guidanceData from "./service-guidance.json";

export type ServiceIntent = "company" | "loan" | "lien" | "sale";

export interface ServiceLink {
  href: string;
  label: string;
}

export interface ServiceGuidance {
  heading: string;
  introduction: string;
  eligibility: string;
  records: string[];
  fees: string;
  limitations: string;
  nextSteps: string[];
  links: ServiceLink[];
}

export const SERVICE_REVIEW_DISCLOSURE = guidanceData.disclosure;
export const SERVICE_REVIEW_FEES = guidanceData.reviewFees;

export function getServiceGuidance(intent: ServiceIntent, companyName = "your solar company"): ServiceGuidance {
  const guidance = guidanceData.intents[intent];
  return {
    ...guidance,
    heading: guidance.heading.replace("{companyName}", () => companyName),
  };
}

const [contractLink, loanLink, saleLink] = guidanceData.intents.company.links;
const [lienLink] = guidanceData.intents.loan.links;

export function getRelatedServiceLinks(slug: string): ServiceLink[] {
  if (/selling|sell-house/.test(slug)) return [saleLink, lienLink, loanLink];
  if (/lien|ucc|pace|hero-loan/.test(slug)) return [lienLink, saleLink];
  if (/loan|goodleap|mosaic|sunlight|payment-shock/.test(slug)) return [loanLink, lienLink];
  if (/contract|complaint|installer|solar-fraud/.test(slug)) return [contractLink, loanLink].filter(link => link.href !== `/blog/${slug}`);
  return [];
}
