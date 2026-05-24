// ─── TOPIC CLUSTER ARCHITECTURE ─────────────────────────────────────────────
// Design Philosophy: Dark Industrial / Cinematic — Bebas Neue + Inter
// Each cluster has ONE pillar page and multiple supporting spokes.
// Internal links flow: Spoke → Pillar (always), Pillar → Spokes (always)
// This tells Google exactly what the site is about and builds topical authority.

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
  color: string; // amber, red, blue, green, purple
  spokes: ClusterSpoke[];
}

export const TOPIC_CLUSTERS: TopicCluster[] = [
  {
    id: "cancel-solar-contract",
    pillarTitle: "How to Get Out of a Solar Contract",
    pillarUrl: "/blog/how-to-get-out-of-a-solar-contract",
    pillarKeyword: "how to cancel solar contract",
    pillarDescription:
      "The definitive guide to canceling any solar panel agreement — lease, PPA, or loan — with legal strategies that actually work.",
    color: "amber",
    spokes: [
      {
        title: "Solar Contract Red Flags",
        url: "/blog/solar-contract-red-flags",
        type: "blog",
        description: "Warning signs your solar contract is predatory",
        targetKeyword: "solar contract red flags",
      },
      {
        title: "TILA Violations in Solar Loans",
        url: "/blog/tila-violations-solar-loans",
        type: "blog",
        description: "How Truth in Lending Act violations void your contract",
        targetKeyword: "TILA violations solar loans",
      },
      {
        title: "GoodLeap Solar Loan Problems",
        url: "/blog/goodleap-solar-loan-problems-contract-cancellation",
        type: "blog",
        description: "How to escape a predatory GoodLeap solar loan",
        targetKeyword: "GoodLeap solar loan problems",
      },
      {
        title: "Mosaic Solar Loan Bankruptcy Guide",
        url: "/blog/mosaic-solar-loan-problems-bankruptcy-guide",
        type: "blog",
        description: "Mosaic Solar filed Chapter 11 — what it means for your loan",
        targetKeyword: "Mosaic solar loan problems",
      },
      {
        title: "Cancel Sunrun Before Installation",
        url: "/blog/cancel-sunrun-solar-contract-before-installation",
        type: "blog",
        description: "How to cancel a Sunrun contract before panels go up",
        targetKeyword: "cancel Sunrun solar contract before installation",
      },
      {
        title: "Cancel Solar Contract in Texas",
        url: "/cancel-solar-contract/dallas-tx",
        type: "city",
        description: "Texas-specific cancellation rights and attorneys",
        targetKeyword: "cancel solar contract Texas",
      },
      {
        title: "Cancel Solar Contract in California",
        url: "/cancel-solar-contract/los-angeles-ca",
        type: "city",
        description: "California solar consumer protection laws",
        targetKeyword: "cancel solar contract California",
      },
      {
        title: "Cancel Solar Contract in Florida",
        url: "/cancel-solar-contract/miami-fl",
        type: "city",
        description: "Florida solar lease and PPA cancellation",
        targetKeyword: "cancel solar contract Florida",
      },
      {
        title: "Free Case Review",
        url: "/",
        type: "home",
        description: "Get a free consultation from our solar attorneys",
        targetKeyword: "solar contract attorney free consultation",
      },
    ],
  },
  {
    id: "solar-bankruptcy",
    pillarTitle: "Solar Company Bankruptcies: What Homeowners Must Do",
    pillarUrl: "/blog/sunpower-bankruptcy-solar-contract",
    pillarKeyword: "solar company bankruptcy homeowners",
    pillarDescription:
      "SunPower, Sunnova, Lumio, Pink Energy, ADT Solar — dozens of solar companies have gone bankrupt. Here is exactly what to do if your company is one of them.",
    color: "red",
    spokes: [
      {
        title: "SunPower Bankruptcy Solar Contract",
        url: "/blog/sunpower-bankruptcy-solar-contract",
        type: "blog",
        description: "600,000 SunPower customers in limbo — your legal options",
        targetKeyword: "SunPower bankruptcy solar contract",
      },
      {
        title: "Sunnova Bankruptcy: Homeowner Guide",
        url: "/blog/sunnova-bankruptcy-solar-contract",
        type: "blog",
        description: "Sunnova filed for bankruptcy — here's what to do",
        targetKeyword: "Sunnova bankruptcy solar contract",
      },
      {
        title: "Lumio Solar Bankruptcy Guide",
        url: "/blog/lumio-solar-bankruptcy-homeowner-guide",
        type: "blog",
        description: "Lumio Solar victims — your rights after bankruptcy",
        targetKeyword: "Lumio Solar bankruptcy",
      },
      {
        title: "Pink Energy Bankruptcy Guide",
        url: "/blog/pink-energy-bankruptcy-what-homeowners-need-to-know",
        type: "blog",
        description: "What Pink Energy victims can do now",
        targetKeyword: "Pink Energy bankruptcy homeowners",
      },
      {
        title: "Solar Company Went Bankrupt",
        url: "/blog/solar-company-went-bankrupt",
        type: "blog",
        description: "What to do when your solar company goes out of business",
        targetKeyword: "solar company went bankrupt what to do",
      },
      {
        title: "Cancel SunPower Contract",
        url: "/cancel-sunpower-solar-contract",
        type: "company",
        description: "SunPower bankruptcy and contract cancellation",
        targetKeyword: "cancel SunPower contract",
      },
      {
        title: "Cancel Sunnova Contract",
        url: "/cancel-sunnova-solar-contract",
        type: "company",
        description: "Sunnova PPA and lease exit strategies",
        targetKeyword: "cancel Sunnova solar contract",
      },
    ],
  },
  {
    id: "solar-scam",
    pillarTitle: "Solar Panel Scams: What You Need to Know",
    pillarUrl: "/blog/solar-contract-red-flags",
    pillarKeyword: "solar panel scam",
    pillarDescription:
      "How to identify solar scams, deceptive sales tactics, and what legal recourse you have when a solar company defrauds you.",
    color: "orange",
    spokes: [
      {
        title: "Solar Panel Scam Signs & Solutions",
        url: "/blog/solar-panel-scam-signs-and-solutions",
        type: "blog",
        description: "8 signs you were scammed by a solar company",
        targetKeyword: "solar panel scam signs",
      },
      {
        title: "Solar Door-to-Door Scam Guide",
        url: "/blog/solar-door-to-door-scam-guide",
        type: "blog",
        description: "How to identify and fight back against door-to-door solar fraud",
        targetKeyword: "solar door to door scam",
      },
      {
        title: "Solar Tax Credit Scam: Didn't Get It",
        url: "/blog/solar-tax-credit-scam-didnt-get-it",
        type: "blog",
        description: "Promised a 30% tax credit you never received? Here's what to do",
        targetKeyword: "solar tax credit scam",
      },
      {
        title: "Cancel Pink Energy Solar Contract",
        url: "/cancel-pink-energy-solar-contract",
        type: "company",
        description: "Pink Energy fraud victims — legal options",
        targetKeyword: "cancel Pink Energy solar contract",
      },
      {
        title: "Cancel Sunrun Solar Contract",
        url: "/cancel-sunrun-solar-contract",
        type: "company",
        description: "Sunrun complaints and cancellation guide",
        targetKeyword: "cancel Sunrun solar contract",
      },
      {
        title: "Cancel Vivint Solar Contract",
        url: "/cancel-vivint-solar-solar-contract",
        type: "company",
        description: "Vivint Solar complaints and exit strategies",
        targetKeyword: "cancel Vivint Solar contract",
      },
    ],
  },
  {
    id: "solar-regret",
    pillarTitle: "Solar Panel Regret: You're Not Alone",
    pillarUrl: "/blog/solar-contract-rescission-rights",
    pillarKeyword: "solar panel regret cancel",
    pillarDescription:
      "Millions of homeowners regret their solar purchase. Here's why it happens and what you can legally do about it.",
    color: "blue",
    spokes: [
      {
        title: "3-Day Right of Rescission",
        url: "/blog/solar-contract-rescission-rights",
        type: "blog",
        description: "Your legal right to cancel within 3 days",
        targetKeyword: "solar contract rescission rights",
      },
      {
        title: "File an Attorney General Complaint",
        url: "/blog/how-to-file-a-complaint-against-solar-company-attorney-general",
        type: "blog",
        description: "How AG complaints support solar contract disputes",
        targetKeyword: "file complaint against solar company attorney general",
      },
      {
        title: "New Jersey Solar Contract Rights",
        url: "/blog/new-jersey-solar-contract-rights",
        type: "blog",
        description: "New Jersey rescission and Consumer Fraud Act options",
        targetKeyword: "New Jersey solar contract rights",
      },
      {
        title: "Cancel Solar Contract Rescission",
        url: "/blog/cancel-solar-contract-rescission-rights",
        type: "blog",
        description: "Extended rescission rights after deceptive solar sales",
        targetKeyword: "cancel solar contract rescission",
      },
      {
        title: "Selling House With Solar Lease",
        url: "/blog/selling-house-with-solar-lease-complete-guide",
        type: "blog",
        description: "Solar lease blocking your home sale? Here's how to handle it",
        targetKeyword: "selling house with solar lease",
      },
      {
        title: "Solar Lien on House: Removal Guide",
        url: "/blog/solar-lien-on-house-removal-guide",
        type: "blog",
        description: "How to remove a UCC-1 solar lien blocking your home sale",
        targetKeyword: "solar lien on house removal",
      },
      {
        title: "Solar Payments Too High: Help",
        url: "/blog/solar-payments-too-high-help",
        type: "blog",
        description: "Paying more for solar than your old electric bill? Here's why",
        targetKeyword: "solar payments too high",
      },
      {
        title: "Cancel GoodLeap Solar Loan",
        url: "/cancel-goodleap-solar-contract",
        type: "company",
        description: "GoodLeap loan cancellation strategies",
        targetKeyword: "cancel GoodLeap solar loan",
      },
      {
        title: "Solar Loan Cancellation Guide",
        url: "/blog/solar-loan-cancellation-goodleap-mosaic",
        type: "blog",
        description: "GoodLeap, Mosaic, Sunlight — how to cancel solar loans",
        targetKeyword: "cancel solar loan GoodLeap Mosaic",
      },
      {
        title: "Cancel Sunnova Solar Contract",
        url: "/cancel-sunnova-solar-contract",
        type: "company",
        description: "Sunnova PPA and lease exit strategies",
        targetKeyword: "cancel Sunnova solar contract",
      },
      {
        title: "Free Case Review",
        url: "/",
        type: "home",
        description: "Talk to a solar attorney today — free",
        targetKeyword: "solar attorney free review",
      },
    ],
  },
  {
    id: "company-complaints",
    pillarTitle: "Solar Company Complaints & Fraud Database",
    pillarUrl: "/cancel-sunrun-solar-contract",
    pillarKeyword: "solar company complaints fraud",
    pillarDescription:
      "Documented complaints, lawsuits, BBB ratings, and legal violations for every major solar company in America.",
    color: "purple",
    spokes: [
      {
        title: "Cancel Sunrun Contract",
        url: "/cancel-sunrun-solar-contract",
        type: "company",
        description: "Sunrun — #1 most complained-about solar company",
        targetKeyword: "cancel Sunrun contract",
      },
      {
        title: "Cancel SunPower Contract",
        url: "/cancel-sunpower-solar-contract",
        type: "company",
        description: "SunPower bankruptcy and contract cancellation",
        targetKeyword: "cancel SunPower contract",
      },
      {
        title: "Freedom Forever Solar Bankruptcy 2026",
        url: "/blog/freedom-forever-solar-bankruptcy-what-homeowners-can-do-2026",
        type: "blog",
        description: "Freedom Forever bankruptcy — what homeowners can do in 2026",
        targetKeyword: "Freedom Forever solar bankruptcy homeowners",
      },
      {
        title: "Cancel ADT Solar Contract",
        url: "/cancel-adt-solar-solar-contract",
        type: "company",
        description: "ADT Solar (Sunpro) cancellation strategies",
        targetKeyword: "cancel ADT Solar contract",
      },
      {
        title: "Sunrun Contract Cancellation 2026",
        url: "/blog/sunrun-solar-contract-cancellation-2026",
        type: "blog",
        description: "Step-by-step Sunrun cancellation guide with 2026 legal updates",
        targetKeyword: "Sunrun contract cancellation 2026",
      },
      {
        title: "Sunrun Complaints in California",
        url: "/blog/sunrun-complaints-california",
        type: "blog",
        description: "California Sunrun complaints, NEM 3.0, and legal rights",
        targetKeyword: "Sunrun complaints California",
      },
      {
        title: "Cancel Sunrun Before Installation",
        url: "/blog/cancel-sunrun-solar-contract-before-installation",
        type: "blog",
        description: "How to cancel a Sunrun agreement before panels go up",
        targetKeyword: "cancel Sunrun solar contract before installation",
      },
      {
        title: "Pink Energy Bankruptcy",
        url: "/blog/pink-energy-bankruptcy-what-homeowners-need-to-know",
        type: "blog",
        description: "Pink Energy victims — what you can recover",
        targetKeyword: "Pink Energy bankruptcy victims",
      },
      {
        title: "SunPower Bankruptcy Solar Contract",
        url: "/blog/sunpower-bankruptcy-solar-contract",
        type: "blog",
        description: "What SunPower's Chapter 11 means for your contract",
        targetKeyword: "SunPower bankruptcy solar contract",
      },
      {
        title: "Sunnova Bankruptcy Guide",
        url: "/blog/sunnova-bankruptcy-solar-contract",
        type: "blog",
        description: "Sunnova bankruptcy — homeowner rights and next steps",
        targetKeyword: "Sunnova bankruptcy homeowners",
      },
    ],
  },
  {
    id: "state-pages",
    pillarTitle: "Solar Contract Laws by State",
    pillarUrl: "/cancel-solar-contract/dallas-tx",
    pillarKeyword: "solar contract laws by state",
    pillarDescription:
      "Every state has different consumer protection laws that affect your right to cancel a solar contract. Find yours.",
    color: "green",
    spokes: [
      {
        title: "Texas Solar Contract Law",
        url: "/cancel-solar-contract/dallas-tx",
        type: "city",
        description: "Texas DTPA and solar cancellation rights",
        targetKeyword: "cancel solar contract Texas law",
      },
      {
        title: "California Solar Contract Law",
        url: "/cancel-solar-contract/los-angeles-ca",
        type: "city",
        description: "California Consumer Legal Remedies Act",
        targetKeyword: "cancel solar contract California law",
      },
      {
        title: "Florida Solar Contract Law",
        url: "/cancel-solar-contract/miami-fl",
        type: "city",
        description: "Florida Deceptive and Unfair Trade Practices Act",
        targetKeyword: "cancel solar contract Florida law",
      },
      {
        title: "Arizona Solar Contract Law",
        url: "/cancel-solar-contract/phoenix-az",
        type: "city",
        description: "Arizona Consumer Fraud Act solar rights",
        targetKeyword: "cancel solar contract Arizona law",
      },
      {
        title: "Nevada Solar Contract Law",
        url: "/cancel-solar-contract/las-vegas-nv",
        type: "city",
        description: "Nevada solar consumer protection statutes",
        targetKeyword: "cancel solar contract Nevada law",
      },
      {
        title: "Get Out of Solar Contract by State",
        url: "/blog/get-out-of-solar-contract-by-state",
        type: "blog",
        description: "State-by-state guide to solar contract cancellation rights",
        targetKeyword: "get out of solar contract by state",
      },
      {
        title: "How to Cancel Solar Contract",
        url: "/blog/how-to-get-out-of-a-solar-contract",
        type: "blog",
        description: "The complete legal guide to canceling any solar contract",
        targetKeyword: "how to cancel solar contract",
      },
    ],
  },
];

export function getClusterForPage(url: string): TopicCluster | undefined {
  return TOPIC_CLUSTERS.find(
    (c) =>
      c.pillarUrl === url ||
      c.spokes.some((s) => s.url === url)
  );
}

export function getRelatedSpokes(url: string, limit = 4): ClusterSpoke[] {
  const cluster = getClusterForPage(url);
  if (!cluster) return [];
  const currentIndex = cluster.spokes.findIndex((s) => s.url === url);
  const orderedSpokes =
    currentIndex >= 0
      ? [
          ...cluster.spokes.slice(currentIndex + 1),
          ...cluster.spokes.slice(0, currentIndex),
        ]
      : cluster.spokes;

  return orderedSpokes.filter((s) => s.url !== url).slice(0, limit);
}
