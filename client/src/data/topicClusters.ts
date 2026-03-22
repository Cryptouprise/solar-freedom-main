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
    pillarUrl: "/blog/how-to-cancel-solar-contract",
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
    id: "solar-scam",
    pillarTitle: "Solar Panel Scams: What You Need to Know",
    pillarUrl: "/blog/solar-contract-red-flags",
    pillarKeyword: "solar panel scam",
    pillarDescription:
      "How to identify solar scams, deceptive sales tactics, and what legal recourse you have when a solar company defrauds you.",
    color: "red",
    spokes: [
      {
        title: "Pink Energy Bankruptcy Guide",
        url: "/blog/pink-energy-bankruptcy-what-homeowners-need-to-know",
        type: "blog",
        description: "What Pink Energy victims can do now",
        targetKeyword: "Pink Energy bankruptcy homeowners",
      },
      {
        title: "SunPower Bankruptcy Options",
        url: "/blog/sunpower-bankruptcy-your-options",
        type: "blog",
        description: "SunPower filed bankruptcy — your rights explained",
        targetKeyword: "SunPower bankruptcy options",
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
      {
        title: "Solar Company Went Bankrupt",
        url: "/blog/solar-company-went-bankrupt",
        type: "blog",
        description: "What to do when your solar company goes out of business",
        targetKeyword: "solar company went bankrupt what to do",
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
        title: "How to Sell a Home With a Solar Lease",
        url: "/blog/how-to-sell-home-with-solar-lease",
        type: "blog",
        description: "Solar lease blocking your home sale? Here's how to handle it",
        targetKeyword: "sell home with solar lease",
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
        title: "Cancel Freedom Forever Contract",
        url: "/cancel-freedom-forever-solar-contract",
        type: "company",
        description: "Freedom Forever complaints and exit guide",
        targetKeyword: "cancel Freedom Forever solar contract",
      },
      {
        title: "Cancel ADT Solar Contract",
        url: "/cancel-adt-solar-solar-contract",
        type: "company",
        description: "ADT Solar (Sunpro) cancellation strategies",
        targetKeyword: "cancel ADT Solar contract",
      },
      {
        title: "Sunrun Contract Cancellation Guide",
        url: "/blog/sunrun-contract-cancellation",
        type: "blog",
        description: "Step-by-step Sunrun cancellation guide",
        targetKeyword: "Sunrun contract cancellation guide",
      },
      {
        title: "Pink Energy Bankruptcy",
        url: "/blog/pink-energy-bankruptcy-what-homeowners-need-to-know",
        type: "blog",
        description: "Pink Energy victims — what you can recover",
        targetKeyword: "Pink Energy bankruptcy victims",
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
        title: "How to Cancel Solar Contract",
        url: "/blog/how-to-cancel-solar-contract",
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
  return cluster.spokes
    .filter((s) => s.url !== url)
    .slice(0, limit);
}
