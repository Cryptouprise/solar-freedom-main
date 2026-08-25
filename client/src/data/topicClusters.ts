// ─── EVIDENCE-BASED TOPIC CLUSTERS ───────────────────────────────────────────
// Each cluster has one canonical pillar and a small set of final-destination,
// index-eligible supporting pages. Redirect sources and quarantined templates
// must never be added here.

export interface ClusterSpoke {
  title: string;
  url: string;
  type: "blog" | "city" | "company" | "home";
  description: string;
  targetKeyword: string;
}

export interface TopicCluster {
  id: string;
  pillarTitle: string;
  pillarUrl: string;
  pillarKeyword: string;
  pillarDescription: string;
  color: string;
  spokes: ClusterSpoke[];
}

export const TOPIC_CLUSTERS: TopicCluster[] = [
  {
    id: "contract-review",
    pillarTitle: "How to Get Out of a Solar Contract",
    pillarUrl: "/blog/how-to-get-out-of-a-solar-contract",
    pillarKeyword: "how to get out of a solar contract",
    pillarDescription:
      "A document-first framework for identifying the agreement, parties, timing, written options, evidence, and safe next steps.",
    color: "amber",
    spokes: [
      {
        title: "Solar Contract Rescission Rights",
        url: "/blog/solar-contract-rescission-rights",
        type: "blog",
        description: "How to check written cancellation notices and transaction-specific deadlines",
        targetKeyword: "solar contract rescission rights",
      },
      {
        title: "Cancel Sunrun Before Installation",
        url: "/blog/cancel-sunrun-solar-contract-before-installation",
        type: "blog",
        description: "Records and written steps to check before installation begins",
        targetKeyword: "cancel Sunrun before installation",
      },
      {
        title: "Solar Contract Escalator Clauses",
        url: "/blog/solar-contract-escalator-clause-explained-how-to-fight-it",
        type: "blog",
        description: "How to identify and calculate a lease or PPA escalator",
        targetKeyword: "solar contract escalator clause",
      },
      {
        title: "Contract Assignment Without Consent",
        url: "/blog/solar-contract-assignment-without-consent",
        type: "blog",
        description: "Documents to compare when an agreement or account changes hands",
        targetKeyword: "solar contract assignment without consent",
      },
      {
        title: "I Do Not Know What to Do With My Solar Contract",
        url: "/blog/solar-contract-help-i-dont-know-what-to-do",
        type: "blog",
        description: "A practical starting checklist for an unclear solar problem",
        targetKeyword: "solar contract help",
      },
      {
        title: "Solar Contracts and Military Families",
        url: "/blog/solar-contract-military-families",
        type: "blog",
        description: "Records and transfer questions for military household moves",
        targetKeyword: "solar contract military families",
      },
    ],
  },
  {
    id: "solar-loans-payments",
    pillarTitle: "GoodLeap Solar Loan Payoff and Contract Review",
    pillarUrl: "/blog/goodleap-solar-loan-cancellation-hidden-fees-2026",
    pillarKeyword: "cancel GoodLeap solar loan",
    pillarDescription:
      "A source-backed guide to loan documents, payoff quotes, payment changes, UCC-1 records, home-sale assumptions, and complaints.",
    color: "blue",
    spokes: [
      {
        title: "Solar Loan Help",
        url: "/solar-loan-help",
        type: "home",
        description: "Start with the agreement, disclosures, statements, and payoff records",
        targetKeyword: "solar loan help",
      },
      {
        title: "Solar Payment Shock",
        url: "/blog/solar-payment-shock-help",
        type: "blog",
        description: "What to compare when the payment changes or exceeds expectations",
        targetKeyword: "solar payment shock",
      },
      {
        title: "Sunlight Financial Loan Complaints",
        url: "/blog/sunlight-financial-solar-loan-complaints",
        type: "blog",
        description: "How to identify the current servicer and preserve loan records",
        targetKeyword: "Sunlight Financial solar loan complaints",
      },
      {
        title: "Selling a House With a Solar Loan",
        url: "/blog/selling-house-with-solar-loan",
        type: "blog",
        description: "Payoff, title, buyer, lender, and closing records to request early",
        targetKeyword: "selling house with solar loan",
      },
      {
        title: "Solar Savings Statements Did Not Match",
        url: "/blog/i-was-lied-to-about-solar-savings",
        type: "blog",
        description: "How to compare written projections with bills and production data",
        targetKeyword: "lied to about solar savings",
      },
    ],
  },
  {
    id: "company-status-support",
    pillarTitle: "When a Solar Installer Changes or Closes",
    pillarUrl: "/blog/solar-installer-out-of-business",
    pillarKeyword: "solar installer out of business",
    pillarDescription:
      "How to separate the installer, lender, system owner, servicer, and equipment warranty when a company changes or exits.",
    color: "red",
    spokes: [
      {
        title: "Sunrun Contract Cancellation Options",
        url: "/blog/sunrun-solar-contract-cancellation-2026",
        type: "blog",
        description: "Agreement timing, notice, installation, transfer, and official support records",
        targetKeyword: "cancel Sunrun contract",
      },
      {
        title: "Blue Raven Solar Status and Support",
        url: "/blog/blue-raven-solar-complaints",
        type: "blog",
        description: "Acquisition dates, current support routing, lender, and warranty records",
        targetKeyword: "Blue Raven Solar complaints",
      },
      {
        title: "ADT Solar Shutdown and Support",
        url: "/blog/adt-solar-complaints",
        type: "blog",
        description: "How to identify the current lender, warranty provider, and service route",
        targetKeyword: "ADT Solar complaints",
      },
      {
        title: "Freedom Forever Company Status",
        url: "/blog/freedom-forever-solar-bankruptcy-what-homeowners-can-do-2026",
        type: "blog",
        description: "How to verify company status before relying on bankruptcy claims",
        targetKeyword: "Freedom Forever solar company status",
      },
      {
        title: "Tesla and SolarCity Contract Help",
        url: "/blog/tesla-solar-solarcity-complaints-cancel-2026",
        type: "blog",
        description: "Records to gather for a Tesla or legacy SolarCity account issue",
        targetKeyword: "Tesla SolarCity complaints",
      },
      {
        title: "Sunnova Contract and Account Options",
        url: "/blog/how-to-cancel-sunnova-solar-contract-2026",
        type: "blog",
        description: "How to identify current account, transfer, and written contract procedures",
        targetKeyword: "cancel Sunnova solar contract",
      },
      {
        title: "Complete Solaria Complaints",
        url: "/blog/complete-solaria-complaints",
        type: "blog",
        description: "How to document a Complete Solaria project or service issue",
        targetKeyword: "Complete Solaria complaints",
      },
      {
        title: "Vivint Solar Contract Records",
        url: "/blog/cancel-vivint-solar-contract",
        type: "blog",
        description: "How to identify the current contract and support path for a legacy account",
        targetKeyword: "cancel Vivint Solar contract",
      },
    ],
  },
  {
    id: "sales-complaints",
    pillarTitle: "How to File a Solar Company Complaint",
    pillarUrl: "/blog/how-to-file-a-complaint-against-solar-company-attorney-general",
    pillarKeyword: "file complaint against solar company",
    pillarDescription:
      "How to build a factual record and use company, financial-regulator, consumer-protection, and contractor complaint channels.",
    color: "orange",
    spokes: [
      {
        title: "Report Solar Fraud to an Attorney General",
        url: "/blog/solar-fraud-report-to-attorney-general",
        type: "blog",
        description: "Records and privacy considerations for a state consumer complaint",
        targetKeyword: "report solar fraud attorney general",
      },
      {
        title: "Solar Sales Warning Signs",
        url: "/blog/solar-fraud-warning-signs",
        type: "blog",
        description: "Statements and documents to verify before relying on a sales claim",
        targetKeyword: "solar fraud warning signs",
      },
      {
        title: "Misleading Solar Savings Claims",
        url: "/blog/solar-misleading-savings-claims",
        type: "blog",
        description: "Compare sales projections with the agreement, bills, and production records",
        targetKeyword: "misleading solar savings claims",
      },
      {
        title: "Solar Scams Targeting Senior Homeowners",
        url: "/blog/senior-homeowners-solar-scams",
        type: "blog",
        description: "Records and support steps for older homeowners and their families",
        targetKeyword: "senior homeowners solar scams",
      },
      {
        title: "Spanish-Language Solar Contracts",
        url: "/blog/solar-contract-spanish-speaking-homeowners",
        type: "blog",
        description: "How to preserve translated sales statements and signed contract records",
        targetKeyword: "Spanish solar contract help",
      },
      {
        title: "Undersized Solar System Records",
        url: "/blog/undersized-solar-system-legal-options",
        type: "blog",
        description: "Compare the design, production estimate, actual output, and utility bills",
        targetKeyword: "undersized solar system options",
      },
    ],
  },
  {
    id: "selling-home",
    pillarTitle: "Selling a Home With Solar",
    pillarUrl: "/selling-house-with-solar",
    pillarKeyword: "selling house with solar panels",
    pillarDescription:
      "A closing-focused guide to ownership, payoff, prepayment, transfer, assumption, title, lender, buyer, and escrow records.",
    color: "purple",
    spokes: [
      {
        title: "Sell a House With Solar Panels",
        url: "/blog/sell-house-with-solar-panels",
        type: "blog",
        description: "Identify ownership, financing, transfer, and payoff requirements",
        targetKeyword: "sell house with solar panels",
      },
      {
        title: "Selling a Home With a Solar PPA",
        url: "/blog/selling-home-with-solar-ppa-panels-transfer-or-cancel",
        type: "blog",
        description: "Transfer, prepayment, buyer approval, and escrow questions for a PPA",
        targetKeyword: "selling home with solar PPA",
      },
      {
        title: "Selling a House With a Solar Loan",
        url: "/blog/selling-house-with-solar-loan",
        type: "blog",
        description: "Current payoff, title, lender, and closing records to request",
        targetKeyword: "selling house with solar loan",
      },
      {
        title: "Sunnova Contract Transfer",
        url: "/blog/sunnova-contract-transfer-selling-home-2026",
        type: "blog",
        description: "Documents and approval steps to check before a Sunnova home sale",
        targetKeyword: "Sunnova contract transfer selling home",
      },
      {
        title: "GoodLeap Payoff and Assumption",
        url: "/blog/goodleap-solar-loan-cancellation-hidden-fees-2026",
        type: "blog",
        description: "Payoff quotes, UCC-1 records, and buyer-assumption procedures",
        targetKeyword: "GoodLeap loan home sale",
      },
    ],
  },
  {
    id: "state-location-guides",
    pillarTitle: "Solar Contract Laws by State",
    pillarUrl: "/solar-contract-laws",
    pillarKeyword: "solar contract laws by state",
    pillarDescription:
      "A starting point for locating official state resources, contractor records, written notices, and complaint channels.",
    color: "green",
    spokes: [
      {
        title: "New Jersey Solar Contract Rights",
        url: "/blog/new-jersey-solar-contract-rights",
        type: "blog",
        description: "Cancellation notices, contractor registration, records, and official complaints",
        targetKeyword: "New Jersey solar contract rights",
      },
      {
        title: "Florida Solar Contract Law Resources",
        url: "/solar-contract-laws/florida",
        type: "city",
        description: "Florida-specific agencies, records, and contract questions to verify",
        targetKeyword: "Florida solar contract law",
      },
      {
        title: "Ohio Solar Contract Law Resources",
        url: "/solar-contract-laws/ohio",
        type: "city",
        description: "Ohio-specific agencies, records, and contract questions to verify",
        targetKeyword: "Ohio solar contract law",
      },
      {
        title: "Nevada Solar Contract Law Resources",
        url: "/solar-contract-laws/nevada",
        type: "city",
        description: "Nevada-specific agencies, records, and contract questions to verify",
        targetKeyword: "Nevada solar contract law",
      },
      {
        title: "Dallas Solar Contract Help",
        url: "/cancel-solar-contract/dallas-tx",
        type: "city",
        description: "Texas resources and records for a Dallas-area solar dispute",
        targetKeyword: "cancel solar contract Dallas Texas",
      },
      {
        title: "Los Angeles Solar Contract Help",
        url: "/cancel-solar-contract/los-angeles-ca",
        type: "city",
        description: "California resources and records for a Los Angeles-area solar dispute",
        targetKeyword: "cancel solar contract Los Angeles California",
      },
      {
        title: "Miami Solar Contract Help",
        url: "/cancel-solar-contract/miami-fl",
        type: "city",
        description: "Florida resources and records for a Miami-area solar dispute",
        targetKeyword: "cancel solar contract Miami Florida",
      },
    ],
  },
];

export function getClusterForPage(url: string): TopicCluster | undefined {
  return TOPIC_CLUSTERS.find(
    (cluster) =>
      cluster.pillarUrl === url ||
      cluster.spokes.some((spoke) => spoke.url === url)
  );
}

export function getRelatedSpokes(url: string, limit = 4): ClusterSpoke[] {
  const cluster = getClusterForPage(url);
  if (!cluster) return [];

  const currentIndex = cluster.spokes.findIndex((spoke) => spoke.url === url);
  const orderedSpokes =
    currentIndex >= 0
      ? [
          ...cluster.spokes.slice(currentIndex + 1),
          ...cluster.spokes.slice(0, currentIndex),
        ]
      : cluster.spokes;

  return orderedSpokes.filter((spoke) => spoke.url !== url).slice(0, limit);
}
