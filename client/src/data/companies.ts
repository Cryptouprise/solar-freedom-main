// Solar company profiles for SEO landing pages
// Each company has complaint data, fraud allegations, BBB rating, and cancellation grounds

export interface CompanyData {
  slug: string;
  name: string;
  legalName: string;
  founded: string;
  headquarters: string;
  contractTypes: string[];
  bbRating: string;
  complaintCount: string;
  avgContractLength: string;
  avgMonthlyPayment: string;
  stockSymbol?: string;
  status: string; // "Active" | "Bankrupt" | "Acquired"
  tagline: string; // Our SEO hook headline
  summary: string;
  topComplaints: string[];
  knownIssues: string[];
  cancellationGrounds: string[];
  lawsuits: string[];
  statesActive: string[];
  relatedCompanies: string[];
}

export const companies: CompanyData[] = [
  // ─── PINK ENERGY (formerly Power Home Solar) ─────────────────────────────────
  {
    slug: "pink-energy",
    name: "Pink Energy",
    legalName: "Pink Energy LLC (formerly Power Home Solar)",
    founded: "2014",
    headquarters: "Mooresville, NC",
    contractTypes: ["Solar Loan", "Cash Purchase"],
    bbRating: "F",
    complaintCount: "1,000+",
    avgContractLength: "25 years",
    avgMonthlyPayment: "$180–$260",
    status: "Bankrupt",
    tagline: "Pink Energy Filed for Bankruptcy — Your Contract May Be Voidable",
    summary: "Pink Energy (formerly Power Home Solar) was one of the fastest-growing residential solar installers in the US before filing for Chapter 7 bankruptcy in October 2022. The company left thousands of homeowners with broken systems, unfulfilled warranties, and no recourse — while their loan obligations to GoodLeap and Mosaic continued. If you signed a Pink Energy contract, you may have strong grounds to cancel based on fraud, misrepresentation, and the company's inability to honor its obligations.",
    topComplaints: [
      "System never worked properly after installation",
      "Company went bankrupt and stopped responding to service calls",
      "Promised savings never materialized — bills actually increased",
      "Salespeople lied about tax credit eligibility",
      "Roof damage caused during installation was never repaired",
      "System was undersized compared to what was promised",
      "Loan payments continued even after company went bankrupt",
    ],
    knownIssues: [
      "Filed Chapter 7 bankruptcy in October 2022",
      "North Carolina Attorney General investigation for deceptive practices",
      "Thousands of unresolved warranty claims at time of bankruptcy",
      "Multiple class action lawsuits filed by homeowners",
      "Lenders (GoodLeap, Mosaic) continued collecting payments post-bankruptcy",
      "FTC complaints filed by hundreds of customers",
      "BBB rating of F with 1,000+ unresolved complaints",
    ],
    cancellationGrounds: [
      "Company bankruptcy — inability to perform contractual obligations",
      "Fraudulent misrepresentation of system performance and savings",
      "TILA violations in financing documents",
      "Failure to honor warranty obligations",
      "Deceptive sales practices under state consumer protection laws",
      "Undisclosed escalator clauses in loan agreements",
      "Roof damage and property destruction during installation",
    ],
    lawsuits: [
      "Multiple class action suits filed in NC, OH, TN, VA, and other states",
      "North Carolina AG investigation (2022)",
      "Individual homeowner suits against GoodLeap for continuing to collect post-bankruptcy",
    ],
    statesActive: ["NC", "OH", "TN", "VA", "PA", "GA", "SC", "IN", "KY", "WV"],
    relatedCompanies: ["goodleap", "mosaic", "sunrun", "freedom-forever"],
  },

  // ─── SUNRUN ───────────────────────────────────────────────────────────────────
  {
    slug: "sunrun",
    name: "Sunrun",
    legalName: "Sunrun Inc.",
    founded: "2007",
    headquarters: "San Francisco, CA",
    contractTypes: ["Solar Lease", "Power Purchase Agreement (PPA)", "Solar Loan"],
    bbRating: "B-",
    complaintCount: "2,500+",
    avgContractLength: "20–25 years",
    avgMonthlyPayment: "$120–$220",
    stockSymbol: "RUN",
    status: "Active",
    tagline: "Trapped in a Sunrun Lease or PPA? You Have Legal Options.",
    summary: "Sunrun is the largest residential solar company in the United States, but size hasn't stopped the complaints. With over 2,500 BBB complaints and thousands of CFPB filings, Sunrun customers regularly report being locked into 20–25 year leases with escalating payments, misleading savings projections, and aggressive collections tactics. Sunrun's lease and PPA contracts are notoriously difficult to exit — but not impossible with the right legal strategy.",
    topComplaints: [
      "20-year lease with 2.9% annual payment escalator not disclosed at signing",
      "System produces far less energy than promised — bills not reduced",
      "Cannot sell home because buyer refuses to assume the lease",
      "Customer service impossible to reach for repairs and maintenance",
      "Roof penetrations causing leaks — company refuses to repair",
      "Collections calls and credit damage after disputing charges",
      "Buyout price at end of lease is prohibitively expensive",
    ],
    knownIssues: [
      "2.9% annual escalator clause buries homeowners in increasing payments",
      "Home sale complications — buyers often refuse to assume solar leases",
      "CFPB complaints about aggressive collections and billing disputes",
      "Class action suits related to misleading savings projections",
      "Acquired Vivint Solar in 2021, inheriting thousands of additional complaints",
      "Door-to-door sales team with history of high-pressure tactics",
    ],
    cancellationGrounds: [
      "Undisclosed annual payment escalator clause",
      "Misrepresentation of projected energy savings",
      "FTC 3-day right of rescission violations",
      "TILA violations in financing documents",
      "Deceptive door-to-door sales practices",
      "System performance below contractual guarantees",
      "Home sale impossibility — constructive breach of quiet enjoyment",
    ],
    lawsuits: [
      "Multiple class action suits in CA, FL, AZ, NV related to misleading savings claims",
      "CFPB enforcement actions related to billing and collections",
      "State AG investigations in multiple states",
    ],
    statesActive: ["CA", "AZ", "FL", "TX", "NV", "CO", "MA", "NY", "NJ", "CT", "MD", "VA", "NC", "SC", "GA", "HI"],
    relatedCompanies: ["vivint-solar", "sunpower", "freedom-forever", "sunnova"],
  },

  // ─── SUNPOWER ─────────────────────────────────────────────────────────────────
  {
    slug: "sunpower",
    name: "SunPower",
    legalName: "SunPower Corporation",
    founded: "1985",
    headquarters: "San Jose, CA",
    contractTypes: ["Solar Loan", "Solar Lease", "Power Purchase Agreement (PPA)", "Cash Purchase"],
    bbRating: "C",
    complaintCount: "1,800+",
    avgContractLength: "25 years",
    avgMonthlyPayment: "$150–$280",
    stockSymbol: "SPWR",
    status: "Bankrupt",
    tagline: "SunPower Filed for Bankruptcy in 2024 — Here's What That Means for Your Contract",
    summary: "SunPower Corporation, once considered the premium brand in residential solar, filed for Chapter 11 bankruptcy in August 2024. The company had been struggling with declining margins, dealer network problems, and thousands of unresolved customer complaints. If you have a SunPower loan, lease, or PPA, the bankruptcy filing may give you significant legal leverage to renegotiate or cancel your agreement — especially if your system is underperforming or your warranty is now worthless.",
    topComplaints: [
      "System underperforms by 30–50% compared to projections",
      "Dealer installed system incorrectly — SunPower refuses to fix",
      "Bankruptcy means warranty is now effectively worthless",
      "Loan payments continue despite system not working",
      "Dealer network collapsed — no one to service the system",
      "Misrepresented federal tax credit eligibility",
      "25-year loan with no exit clause",
    ],
    knownIssues: [
      "Filed Chapter 11 bankruptcy in August 2024",
      "Dealer network model meant poor quality control across installations",
      "Multiple SEC investigations into financial reporting",
      "Thousands of warranty claims with no path to resolution post-bankruptcy",
      "SunPower Financial (loan arm) sold to third parties — confusing who owns your debt",
      "Stock delisted from NASDAQ in 2024",
    ],
    cancellationGrounds: [
      "Company bankruptcy — inability to honor warranty and service obligations",
      "Dealer fraud and misrepresentation",
      "System performance below contractual guarantees",
      "TILA violations in SunPower Financial loan documents",
      "Deceptive savings projections",
      "Warranty impossibility due to bankruptcy",
    ],
    lawsuits: [
      "SEC investigation into financial reporting (2023–2024)",
      "Multiple class action suits related to dealer fraud",
      "Homeowner suits in CA, AZ, TX, FL related to system underperformance",
    ],
    statesActive: ["CA", "AZ", "TX", "FL", "NV", "CO", "HI", "MA", "NJ", "NY", "OR", "WA", "NC", "VA", "MD"],
    relatedCompanies: ["sunrun", "freedom-forever", "pink-energy", "sunnova"],
  },

  // ─── VIVINT SOLAR ─────────────────────────────────────────────────────────────
  {
    slug: "vivint-solar",
    name: "Vivint Solar",
    legalName: "Vivint Solar, Inc. (acquired by Sunrun 2021)",
    founded: "2011",
    headquarters: "Lehi, UT (now part of Sunrun)",
    contractTypes: ["Solar Lease", "Power Purchase Agreement (PPA)", "Solar Loan"],
    bbRating: "C+",
    complaintCount: "3,000+",
    avgContractLength: "20 years",
    avgMonthlyPayment: "$110–$200",
    status: "Acquired",
    tagline: "Vivint Solar Contracts Are Now Owned by Sunrun — And Still Cancellable",
    summary: "Vivint Solar was acquired by Sunrun in 2021 for $3.2 billion, but if you signed a Vivint Solar contract before the acquisition, your agreement may still carry Vivint's original terms — including some of the most aggressively structured escalator clauses in the industry. Vivint Solar was notorious for door-to-door sales tactics that resulted in thousands of consumer complaints. The acquisition does not erase your legal rights.",
    topComplaints: [
      "Door-to-door salesperson made promises not reflected in the contract",
      "20-year lease with 2.9% annual escalator — never disclosed",
      "System installed without proper permits in multiple states",
      "Sunrun acquisition changed service terms without notice",
      "Cannot refinance or sell home due to lease on title",
      "Billing disputes ignored for months",
      "System installed on roof that couldn't support it — structural damage",
    ],
    knownIssues: [
      "Acquired by Sunrun in 2021 — service quality declined post-acquisition",
      "Thousands of BBB complaints pre-acquisition carried forward",
      "Door-to-door sales team with documented history of misrepresentation",
      "Multiple state AG investigations into sales practices",
      "Permit violations in CA, NV, AZ, and other states",
    ],
    cancellationGrounds: [
      "Fraudulent misrepresentation by door-to-door sales agents",
      "Undisclosed annual payment escalator",
      "Permit violations — illegal installation",
      "Material change in service terms post-acquisition",
      "TILA violations in original financing documents",
      "Structural damage to property during installation",
    ],
    lawsuits: [
      "Class action suits in CA and NV related to door-to-door sales misrepresentation",
      "State AG actions in multiple states",
      "Individual homeowner suits related to permit violations",
    ],
    statesActive: ["CA", "AZ", "NV", "UT", "TX", "FL", "HI", "MA", "CT", "NJ", "NY", "MD", "VA", "NC"],
    relatedCompanies: ["sunrun", "sunpower", "freedom-forever", "sunnova"],
  },

  // ─── FREEDOM FOREVER ─────────────────────────────────────────────────────────
  {
    slug: "freedom-forever",
    name: "Freedom Forever",
    legalName: "Freedom Forever LLC",
    founded: "2011",
    headquarters: "Temecula, CA",
    contractTypes: ["Solar Loan", "Cash Purchase", "Power Purchase Agreement (PPA)"],
    bbRating: "B",
    complaintCount: "900+",
    avgContractLength: "25 years",
    avgMonthlyPayment: "$140–$240",
    status: "Active",
    tagline: "Freedom Forever Promised Freedom — But Your Loan Has You Trapped",
    summary: "Freedom Forever markets itself as the solar company that gives homeowners 'freedom' from utility bills. The reality for many customers is a 25-year loan with no meaningful exit clause, systems that underperform their projections, and a dealer network that varies wildly in installation quality. Freedom Forever uses third-party lenders like GoodLeap and Mosaic, which means your loan obligation survives even if Freedom Forever goes out of business.",
    topComplaints: [
      "System produces 20–40% less energy than projected at sale",
      "Dealer installed system incorrectly — Freedom Forever disputes responsibility",
      "Loan payments to GoodLeap continue despite system not working",
      "Salesperson promised $0 out-of-pocket — hidden fees appeared at closing",
      "Installation took 6–12 months longer than promised",
      "Roof damage during installation — company denies liability",
      "Customer service unresponsive after installation complete",
    ],
    knownIssues: [
      "Dealer/franchise model creates inconsistent installation quality",
      "Third-party lender structure separates loan from performance guarantee",
      "Multiple state contractor license violations",
      "BBB complaints rising rapidly in 2023–2024",
      "Aggressive door-to-door and digital marketing with misleading claims",
    ],
    cancellationGrounds: [
      "Misrepresentation of projected energy savings",
      "Dealer fraud — installer misrepresented system specifications",
      "TILA violations in GoodLeap/Mosaic loan documents",
      "System performance below contractual guarantees",
      "Contractor license violations in state of installation",
      "Deceptive sales practices under state consumer protection laws",
    ],
    lawsuits: [
      "Multiple individual homeowner suits in CA, TX, AZ, FL",
      "Contractor license board actions in several states",
      "Class action suits related to misleading savings projections",
    ],
    statesActive: ["CA", "AZ", "TX", "FL", "NV", "CO", "NM", "UT", "OR", "WA", "GA", "NC", "SC", "VA", "MD", "NJ", "NY"],
    relatedCompanies: ["goodleap", "mosaic", "sunrun", "pink-energy"],
  },

  // ─── ADT SOLAR (formerly Sunpro Solar) ───────────────────────────────────────
  {
    slug: "adt-solar",
    name: "ADT Solar",
    legalName: "ADT Solar LLC (formerly Sunpro Solar)",
    founded: "2011",
    headquarters: "Boca Raton, FL",
    contractTypes: ["Solar Loan", "Cash Purchase"],
    bbRating: "C+",
    complaintCount: "700+",
    avgContractLength: "25 years",
    avgMonthlyPayment: "$150–$250",
    status: "Bankrupt",
    tagline: "ADT Solar Shut Down in 2023 — Your Warranty Is Gone. Your Loan Isn't.",
    summary: "ADT Solar (formerly Sunpro Solar) was acquired by ADT Inc. in 2021 and shut down entirely in June 2023 after losing over $200 million. ADT exited the solar business completely, leaving thousands of homeowners with active loans, no warranty coverage, and no service provider. If you have an ADT Solar system, your loan obligation to GoodLeap or another lender continues — but you may have strong grounds to cancel based on the company's failure to perform.",
    topComplaints: [
      "Company shut down — no one to honor the warranty",
      "System issues with no service provider available",
      "Loan payments continue despite company being gone",
      "Promised 25-year warranty now worthless",
      "Installation quality problems discovered after company closed",
      "Misrepresented federal tax credit amounts",
      "System undersized compared to what was sold",
    ],
    knownIssues: [
      "ADT Inc. shut down solar division in June 2023",
      "Lost over $200 million in solar operations",
      "Thousands of orphaned customers with no warranty coverage",
      "GoodLeap and other lenders continue collecting payments",
      "No successor company to assume warranty obligations",
    ],
    cancellationGrounds: [
      "Company shutdown — complete failure to perform contractual obligations",
      "Warranty impossibility — no company exists to honor it",
      "Fraudulent misrepresentation of company stability at time of sale",
      "TILA violations in financing documents",
      "System performance below contractual guarantees",
    ],
    lawsuits: [
      "Individual homeowner suits against ADT Inc. for abandoning solar customers",
      "Suits against GoodLeap for continuing collections post-shutdown",
      "Class action suits in FL, TX, GA, NC, and other states",
    ],
    statesActive: ["FL", "TX", "GA", "NC", "SC", "VA", "TN", "AL", "LA", "MS", "AR", "OK", "KS", "MO"],
    relatedCompanies: ["goodleap", "sunrun", "freedom-forever", "pink-energy"],
  },

  // ─── SUNNOVA ─────────────────────────────────────────────────────────────────
  {
    slug: "sunnova",
    name: "Sunnova",
    legalName: "Sunnova Energy International Inc.",
    founded: "2012",
    headquarters: "Houston, TX",
    contractTypes: ["Solar Lease", "Power Purchase Agreement (PPA)", "Solar Loan"],
    bbRating: "B-",
    complaintCount: "1,100+",
    avgContractLength: "25 years",
    avgMonthlyPayment: "$130–$230",
    stockSymbol: "NOVA",
    status: "Active",
    tagline: "Sunnova's 25-Year Contracts Are Designed to Be Impossible to Exit — We Know the Way Out",
    summary: "Sunnova operates through a dealer network model, which means the company that sold you your system may be entirely different from Sunnova itself. This creates a convenient blame-shifting dynamic when things go wrong. Sunnova's 25-year agreements — whether lease, PPA, or loan — are structured to maximize long-term revenue extraction, with escalator clauses, buyout penalties, and transfer requirements that make home sales complicated.",
    topComplaints: [
      "Dealer misrepresented system size and savings — Sunnova denies responsibility",
      "25-year agreement with escalating payments not clearly disclosed",
      "System underperforms — Sunnova blames 'weather conditions'",
      "Home sale delayed or fell through due to solar agreement on title",
      "Billing errors and double charges ignored for months",
      "Dealer went out of business — Sunnova refuses to service system",
      "Buyout price at end of term is shockingly high",
    ],
    knownIssues: [
      "Dealer network model creates accountability gaps",
      "Stock price declined 90%+ from peak — financial stability concerns",
      "CFPB complaints about billing and collections",
      "Multiple state AG investigations",
      "Escalator clauses buried in 50+ page contracts",
    ],
    cancellationGrounds: [
      "Dealer fraud — Sunnova vicariously liable for dealer misrepresentation",
      "Undisclosed payment escalator clauses",
      "System performance below contractual guarantees",
      "TILA violations in financing documents",
      "Deceptive sales practices under state consumer protection laws",
      "Home sale impossibility — constructive breach",
    ],
    lawsuits: [
      "CFPB enforcement actions",
      "Class action suits in TX, FL, NV, HI related to dealer fraud",
      "Individual homeowner suits in multiple states",
    ],
    statesActive: ["TX", "FL", "NV", "AZ", "CA", "HI", "NJ", "CT", "MA", "MD", "VA", "NC", "GA", "CO", "UT"],
    relatedCompanies: ["sunrun", "sunpower", "freedom-forever", "goodleap"],
  },

  // ─── GOODLEAP ─────────────────────────────────────────────────────────────────
  {
    slug: "goodleap",
    name: "GoodLeap",
    legalName: "GoodLeap LLC (formerly Loanpal)",
    founded: "2003",
    headquarters: "Roseville, CA",
    contractTypes: ["Solar Loan"],
    bbRating: "C",
    complaintCount: "1,400+",
    avgContractLength: "25 years",
    avgMonthlyPayment: "$150–$280",
    status: "Active",
    tagline: "GoodLeap Is Collecting Your Payments Even If Your Solar Company Is Gone",
    summary: "GoodLeap is the largest solar loan originator in the United States, financing systems installed by hundreds of different solar dealers — including many that have since gone bankrupt or out of business. The critical issue: GoodLeap continues collecting loan payments even after the installing company (Pink Energy, ADT Solar, etc.) has shut down and can no longer service your system or honor warranties. GoodLeap's position is that your loan obligation is separate from the installer's performance — but consumer protection law says otherwise.",
    topComplaints: [
      "Continuing to collect payments after installing company went bankrupt",
      "Loan terms changed after signing — interest rate or term length different",
      "Refuses to cancel loan despite installer fraud",
      "Aggressive collections and credit reporting for disputed charges",
      "Hidden fees not disclosed at origination",
      "Loan documents contain TILA violations",
      "Refuses to release lien on home despite dispute",
    ],
    knownIssues: [
      "Finances systems for hundreds of dealers — quality control nonexistent",
      "Continues collecting from Pink Energy, ADT Solar, and other bankrupt installer customers",
      "CFPB complaints among the highest in the solar lending industry",
      "Multiple state AG investigations into loan origination practices",
      "Lien on home title complicates refinancing and sale",
    ],
    cancellationGrounds: [
      "Holder in Due Course doctrine — lender liable for installer fraud",
      "TILA violations in loan origination documents",
      "FTC Holder Rule — consumer defenses apply against assignee lenders",
      "Installer bankruptcy — failure of consideration",
      "Deceptive loan terms and undisclosed fees",
      "Illegal lien placement or improper UCC filing",
    ],
    lawsuits: [
      "CFPB enforcement actions",
      "Class action suits in CA, TX, FL related to Holder Rule violations",
      "Individual suits related to Pink Energy and ADT Solar customer collections",
      "State AG investigations in CA, TX, FL, NC",
    ],
    statesActive: ["CA", "TX", "FL", "AZ", "NV", "CO", "NC", "GA", "VA", "MD", "NJ", "NY", "MA", "CT", "HI"],
    relatedCompanies: ["pink-energy", "adt-solar", "freedom-forever", "sunrun"],
  },
];

export function getCompanyBySlug(slug: string): CompanyData | undefined {
  return companies.find(c => c.slug === slug);
}

export function getRelatedCompanies(currentSlug: string, count = 4): CompanyData[] {
  const current = getCompanyBySlug(currentSlug);
  if (!current) return companies.slice(0, count);
  return current.relatedCompanies
    .map(s => getCompanyBySlug(s))
    .filter(Boolean)
    .slice(0, count) as CompanyData[];
}
