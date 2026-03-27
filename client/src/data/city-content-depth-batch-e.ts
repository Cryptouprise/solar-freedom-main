// city-content-depth-batch-e.ts
// Deep content for the 28 cities that previously had only generic template content.
// Each entry includes: localHook, topComplaints, stateLawExpanded, companyProblems,
// whyItHappens, marketStats, and localFaq — all city-specific.

export interface CityDepthData {
  slug: string;
  localHook: string;
  topComplaints: string[];
  stateLawExpanded: string;
  companyProblems: { company: string; issue: string }[];
  whyItHappens: string;
  marketStats: { label: string; value: string }[];
  localFaq: { q: string; a: string }[];
}

export const CITY_DEPTH_BATCH_E: CityDepthData[] = [
  // ─── CALIFORNIA ───────────────────────────────────────────────────────────
  {
    slug: "sacramento-ca",
    localHook:
      "Sacramento was ground zero for California's solar boom — and for the predatory sales tactics that followed. SunPower, which filed for Chapter 11 bankruptcy in August 2024, had one of its largest dealer networks in the Sacramento Valley. GoodLeap, headquartered in Roseville just 20 miles away, financed tens of thousands of Sacramento-area contracts — many of which are now under federal scrutiny. If you signed a solar agreement in Sacramento and feel trapped, California's SB 784 Confirmation Call requirement and the CLRA give you more legal leverage than almost any other state.",
    topComplaints: [
      "SunPower dealer installed system incorrectly — SunPower bankruptcy means warranty is now worthless",
      "GoodLeap loan balance far exceeds system value after installer went out of business",
      "Freedom Forever promised $0 electric bill — Sacramento homeowner paying $280/month combined",
      "Sunlight Financial (now bankrupt) sold loan to third-party servicer without proper notice",
      "SB 784 Confirmation Call was never completed — loan may be legally voidable",
      "Mosaic Solar Loans filed Chapter 11 in June 2025 — Sacramento borrowers left in limbo",
    ],
    stateLawExpanded:
      "California offers the strongest solar consumer protections in the nation. The California Consumer Legal Remedies Act (CLRA) prohibits misrepresentation of savings, system performance, and government incentives. SB 784 requires a live Confirmation Call before any solar loan is finalized — if your lender skipped it, your contract may be void. The Unfair Competition Law (UCL) allows attorneys to pursue restitution of all payments made. California's AG has filed suit against multiple solar companies operating in Sacramento, including actions against door-to-door sales deception and inflated savings projections.",
    companyProblems: [
      {
        company: "SunPower (Bankrupt Aug 2024)",
        issue:
          "SunPower's Sacramento dealer network was among the largest in the state. Post-bankruptcy, the mySunPower monitoring app went offline and the 25-year warranty became effectively unenforceable. SunStrong Management acquired some assets but has not honored all warranty claims.",
      },
      {
        company: "GoodLeap (Roseville HQ)",
        issue:
          "GoodLeap financed more Sacramento solar contracts than any other lender. The CFPB and multiple state AGs have investigated GoodLeap for facilitating dealer fraud — approving loans for systems that were never installed or were grossly misrepresented.",
      },
      {
        company: "Mosaic Solar Loans (Bankrupt Jun 2025)",
        issue:
          "Mosaic filed Chapter 11 in June 2025. Sacramento borrowers are now receiving notices from debt servicers with no clear path to warranty service or contract modification.",
      },
      {
        company: "Sunlight Financial (Bankrupt 2023)",
        issue:
          "Sunlight Financial collapsed in 2023, selling its Sacramento loan portfolio to third-party servicers. Many borrowers were never properly notified of the transfer, creating grounds for TILA violations.",
      },
    ],
    whyItHappens:
      "Sacramento's year-round sunshine and high PG&E rates made it a prime target for aggressive solar sales. Dealers flooded the market during the NEM 2.0 to NEM 3.0 transition, rushing homeowners to sign before the rate change — often using false urgency and inflated savings projections based on NEM 2.0 rates that no longer apply.",
    marketStats: [
      { label: "City Population", value: "524K" },
      { label: "Solar Market", value: "High Activity" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "Does SB 784 apply to my Sacramento solar loan?",
        a: "Yes. SB 784 requires a live Confirmation Call before any residential solar loan in California is finalized. If your lender (GoodLeap, Mosaic, Sunlight Financial, etc.) did not complete this call, your loan may be legally voidable. This is one of the strongest cancellation grounds available to Sacramento homeowners.",
      },
      {
        q: "My SunPower system stopped working after their bankruptcy — what are my options?",
        a: "SunPower's August 2024 bankruptcy left thousands of Sacramento homeowners with orphaned systems. SunStrong Management acquired some service obligations but has not honored all claims. You may have grounds to cancel your financing agreement entirely based on failure of consideration — you're paying for a warranted system that is no longer supported.",
      },
      {
        q: "GoodLeap approved my loan but the installer never finished the job — can I cancel?",
        a: "Yes. This is one of the most common cases we see in Sacramento. GoodLeap has been investigated for approving loans before work was completed. If your system was never fully installed or commissioned, you have strong grounds for loan cancellation under California's CLRA and UCL.",
      },
    ],
  },
  {
    slug: "san-francisco-ca",
    localHook:
      "San Francisco homeowners who signed solar contracts are discovering a brutal reality: the city's dense housing stock, frequent fog, and HOA restrictions made many systems economically unviable from day one — but the salespeople never mentioned that. SunPower's Bay Area dealer network collapsed with the company's August 2024 bankruptcy, leaving hundreds of SF homeowners with dead monitoring apps, voided warranties, and active loan payments. California's SB 784 and the CLRA give you powerful legal tools to fight back.",
    topComplaints: [
      "SunPower bankruptcy left SF homeowners with no warranty service and non-functional monitoring",
      "System produces far less than projected due to fog and shading — savings projections were fraudulent",
      "HOA approval was never obtained — installation may be legally unauthorized",
      "GoodLeap loan disbursed before system was operational — TILA violation",
      "Sunrun escalator clause increased payments 2.9% annually — never disclosed at signing",
      "Mosaic Solar Loans bankruptcy left SF borrowers with no servicer contact information",
    ],
    stateLawExpanded:
      "California's CLRA and UCL provide broad remedies for SF homeowners who were misled about solar savings, system performance, or financing terms. SB 784's Confirmation Call requirement is particularly powerful — many Bay Area lenders skipped this step during the 2022–2023 rush. The California Solar Consumer Protection Guide (CPUC) also requires dealers to provide specific disclosures about shading, production estimates, and escalator clauses. Violations of these disclosure rules are actionable under the UCL.",
    companyProblems: [
      {
        company: "SunPower (Bankrupt Aug 2024)",
        issue:
          "SunPower's premium positioning made it the top seller in SF's higher-income neighborhoods. Post-bankruptcy, the 25-year 'Complete Confidence' warranty is effectively worthless. Homeowners are stuck with loan payments on systems that have no manufacturer support.",
      },
      {
        company: "Sunrun",
        issue:
          "Sunrun is the largest solar company still operating in SF. Common complaints include undisclosed 2.9% annual escalator clauses, savings projections that ignored SF's fog patterns, and aggressive door-to-door tactics in the Mission and Sunset districts.",
      },
      {
        company: "GoodLeap",
        issue:
          "GoodLeap financed many SF-area SunPower and Freedom Forever installations. CFPB complaints from SF homeowners cite loan approval before system commissioning and failure to complete SB 784 Confirmation Calls.",
      },
    ],
    whyItHappens:
      "San Francisco's high electricity rates (among the highest in the nation) made solar an easy sell on paper. Dealers routinely ignored the city's notorious fog patterns and shading from neighboring buildings when generating savings projections, producing wildly optimistic numbers that bore no relationship to actual system output.",
    marketStats: [
      { label: "City Population", value: "874K" },
      { label: "Solar Market", value: "High Activity" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "Can I cancel my solar contract if my system underperforms due to SF fog?",
        a: "Yes. If your dealer provided savings projections without accounting for San Francisco's fog patterns and shading, those projections constitute misrepresentation under California's CLRA. We've successfully argued this in multiple SF cases.",
      },
      {
        q: "My SunPower system has been offline since their bankruptcy — do I still have to pay?",
        a: "This is a strong cancellation argument. You're paying for a warranted, monitored system that is no longer supported. California courts have recognized failure of consideration as grounds to void a financing agreement when the underlying product is no longer functional.",
      },
      {
        q: "What is the SB 784 Confirmation Call and did my lender skip it?",
        a: "SB 784 requires your lender to conduct a live phone call with you before finalizing any solar loan in California. During the call, they must confirm you understand the loan terms. Many lenders skipped this during the 2022–2023 rush. If yours did, your loan may be voidable.",
      },
    ],
  },
  {
    slug: "san-jose-ca",
    localHook:
      "San Jose sits at the heart of Silicon Valley's solar market — and at the center of some of its worst consumer fraud. Mosaic Solar Loans, which filed for Chapter 11 bankruptcy in June 2025, financed a disproportionate number of San Jose contracts through its tech-forward app-based approval process. GoodLeap, headquartered nearby in Roseville, processed thousands more. If your installer is gone and your lender is in bankruptcy, California law may give you a path to cancel your entire agreement.",
    topComplaints: [
      "Mosaic Solar Loans bankruptcy (June 2025) left San Jose borrowers with no servicer",
      "GoodLeap loan approved before installation was complete — TILA violation",
      "SunPower dealer network collapsed — San Jose homeowners have no warranty service",
      "Freedom Forever promised net-zero electric bill — homeowner paying $320/month combined",
      "SB 784 Confirmation Call never completed for multiple San Jose GoodLeap loans",
      "Sunrun door-to-door sales in Willow Glen used misleading government program language",
    ],
    stateLawExpanded:
      "California's SB 784 is particularly relevant in San Jose, where Mosaic and GoodLeap processed loans at high volume with minimal oversight. The law requires a live Confirmation Call before loan finalization — a step frequently skipped in the app-based approval rush. The CLRA and UCL provide additional remedies for misrepresentation of savings, system output, and tax credit eligibility. Santa Clara County's DA has received hundreds of solar fraud complaints from San Jose homeowners.",
    companyProblems: [
      {
        company: "Mosaic Solar Loans (Bankrupt Jun 2025)",
        issue:
          "Mosaic's app-based loan approval was popular with San Jose tech-savvy homeowners. The June 2025 Chapter 11 filing left borrowers with no clear servicer, no warranty support, and active payment obligations. Many SB 784 Confirmation Calls were never completed.",
      },
      {
        company: "GoodLeap",
        issue:
          "GoodLeap financed a large share of San Jose's solar installations. CFPB and state AG investigations have focused on GoodLeap's practice of disbursing funds before systems were operational, leaving homeowners paying for non-functional installations.",
      },
      {
        company: "SunPower (Bankrupt Aug 2024)",
        issue:
          "SunPower's premium panels were heavily marketed in San Jose's higher-income neighborhoods. The bankruptcy eliminated warranty support and monitoring. SunStrong Management has not assumed all service obligations.",
      },
    ],
    whyItHappens:
      "San Jose's high PG&E rates and tech-savvy population made it a prime target for fintech solar lenders like Mosaic and GoodLeap, who used app-based approvals to process loans faster than traditional underwriting — often bypassing required disclosures and Confirmation Calls in the process.",
    marketStats: [
      { label: "City Population", value: "1.0M" },
      { label: "Solar Market", value: "High Activity" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "Mosaic Solar Loans just filed bankruptcy — what happens to my San Jose loan?",
        a: "Your loan obligation does not automatically disappear, but the bankruptcy creates significant leverage. If your system is underperforming, your installer is gone, or your SB 784 Confirmation Call was never completed, you may have grounds to void the loan entirely. Act quickly — bankruptcy proceedings move fast.",
      },
      {
        q: "Can I cancel if my installer went out of business but GoodLeap is still collecting payments?",
        a: "Yes. This is one of the most actionable scenarios in California. If your installer is defunct and your system is not performing as promised, GoodLeap may be held liable as the financier under California's CLRA. We've successfully canceled GoodLeap loans in exactly this situation.",
      },
      {
        q: "What solar companies have the most complaints in San Jose?",
        a: "Based on CPUC, BBB, and Santa Clara County DA complaint data, the top companies are GoodLeap (lender), Mosaic (lender, now bankrupt), SunPower (installer, now bankrupt), Freedom Forever, and Sunrun. The lender complaints are particularly actionable under SB 784.",
      },
    ],
  },

  // ─── LOUISIANA ────────────────────────────────────────────────────────────
  {
    slug: "new-orleans-la",
    localHook:
      "New Orleans homeowners were sold solar as a post-Katrina resilience tool — a way to protect against power outages and rising Entergy bills. What many weren't told: their leases and PPAs include 20-year escalator clauses, and the companies that sold them — including Vision Solar (shut down 2022) and Infinity Energy (closed 2023) — are gone. Louisiana's Unfair Trade Practices Act gives homeowners strong grounds to pursue cancellation when a dealer misrepresented savings or government incentives.",
    topComplaints: [
      "Vision Solar (shut down 2022) sold contracts in New Orleans — company is gone, loan payments continue",
      "Infinity Energy (closed 2023) installed systems that were never properly permitted",
      "Entergy interconnection delays caused months of zero production — payments still required",
      "Dealer claimed system qualified for Louisiana state tax credit that no longer exists",
      "GoodLeap loan disbursed before system passed inspection — TILA violation",
      "Sunrun PPA escalator clause was never disclosed — payments increasing 2.9% annually",
    ],
    stateLawExpanded:
      "Louisiana's Unfair Trade Practices and Consumer Protection Law (LUTPA) prohibits deceptive acts in trade or commerce, including misrepresentation of solar savings, government incentives, and system performance. Louisiana also has a 3-day right of rescission for door-to-door sales. The Louisiana AG's office has received a significant volume of solar fraud complaints, particularly related to Vision Solar and Infinity Energy's operations in the New Orleans metro area.",
    companyProblems: [
      {
        company: "Vision Solar (Shut Down 2022)",
        issue:
          "Vision Solar operated aggressively in the New Orleans area before abruptly shutting down in 2022. Homeowners were left with improperly installed systems, unpermitted work, and active loan payments to GoodLeap and Mosaic with no installer to call.",
      },
      {
        company: "Infinity Energy (Closed 2023)",
        issue:
          "Infinity Energy closed operations in 2023, abandoning hundreds of Louisiana customers. Many New Orleans installations were never properly permitted or inspected, creating potential liability for the homeowner.",
      },
      {
        company: "GoodLeap",
        issue:
          "GoodLeap financed a large share of Vision Solar and Infinity Energy's New Orleans contracts. As the financier for fraudulent dealers, GoodLeap may bear liability under LUTPA for facilitating the deception.",
      },
    ],
    whyItHappens:
      "New Orleans' post-hurricane resilience narrative made solar an emotionally compelling sale. Dealers exploited anxiety about grid reliability and rising Entergy rates, often claiming systems would provide backup power — a promise that standard grid-tied solar systems cannot keep without expensive battery storage that was rarely included.",
    marketStats: [
      { label: "City Population", value: "383K" },
      { label: "Solar Market", value: "Growing Market" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "Vision Solar shut down and my system has issues — who is responsible?",
        a: "When a dealer shuts down, liability can shift to the lender (GoodLeap, Mosaic) under Louisiana's LUTPA if the lender facilitated the deceptive sale. We've pursued successful cancellations in Louisiana by holding lenders accountable for their dealer networks.",
      },
      {
        q: "My New Orleans solar system was never properly permitted — is my contract void?",
        a: "Unpermitted work is a serious issue that can create grounds for contract cancellation and may expose the original installer (or their lender) to additional liability. Louisiana requires proper permitting for all solar installations.",
      },
      {
        q: "Can I cancel a Sunrun PPA in Louisiana?",
        a: "Yes. If Sunrun's savings projections were materially inaccurate, or if the escalator clause was not clearly disclosed at signing, you have grounds under LUTPA. Louisiana's 3-day right of rescission also applies to door-to-door solar sales.",
      },
    ],
  },
  {
    slug: "baton-rouge-la",
    localHook:
      "Baton Rouge was heavily targeted by solar dealers during the 2020–2023 boom, with Vision Solar and Infinity Energy running aggressive door-to-door campaigns throughout East Baton Rouge Parish. Both companies are now defunct. Homeowners are left making payments on systems with no warranty support, no monitoring, and no one to call. Louisiana's LUTPA and the FTC's Cooling-Off Rule give you legal options — even years after signing.",
    topComplaints: [
      "Vision Solar (shut down 2022) sold contracts throughout Baton Rouge — company is gone",
      "Infinity Energy (closed 2023) left Baton Rouge systems without service or warranty",
      "Dealer promised Louisiana state incentives that had already expired at time of sale",
      "System produces 40% less than projected — dealer used inflated Baton Rouge irradiance data",
      "GoodLeap loan was disbursed before installation was complete",
      "Sunrun door-to-door sales used 'government program' language to mislead homeowners",
    ],
    stateLawExpanded:
      "Louisiana's LUTPA provides broad consumer protection against deceptive solar sales practices. The FTC's 3-day Cooling-Off Rule applies to all door-to-door solar sales in Baton Rouge. Additionally, any misrepresentation of the federal Investment Tax Credit (ITC) — including telling homeowners the credit would reduce their loan balance when it would not — is actionable under both LUTPA and federal consumer protection law.",
    companyProblems: [
      {
        company: "Vision Solar (Shut Down 2022)",
        issue:
          "Vision Solar ran one of the largest door-to-door operations in Baton Rouge before shutting down in 2022. Homeowners report systems that were never fully commissioned and loan payments that continue with no recourse.",
      },
      {
        company: "Infinity Energy (Closed 2023)",
        issue:
          "Infinity Energy's Baton Rouge operations left dozens of homeowners with incomplete installations and no warranty coverage. The company closed without notice in 2023.",
      },
      {
        company: "Sunrun",
        issue:
          "Sunrun remains active in Baton Rouge. Common complaints involve door-to-door sales using misleading 'government program' language and PPA escalator clauses that were not clearly disclosed.",
      },
    ],
    whyItHappens:
      "Baton Rouge's high Entergy rates and strong sun exposure made it an attractive market for solar dealers. The combination of aggressive door-to-door tactics, inflated savings projections, and lenders willing to approve loans with minimal oversight created the conditions for widespread consumer harm.",
    marketStats: [
      { label: "City Population", value: "228K" },
      { label: "Solar Market", value: "Growing Market" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "What solar companies operated in Baton Rouge and are now out of business?",
        a: "Vision Solar (shut down 2022) and Infinity Energy (closed 2023) were both active in the Baton Rouge area. If either company sold your system, your loan may be cancellable due to the dealer's failure to fulfill warranty and service obligations.",
      },
      {
        q: "My Baton Rouge solar system produces far less than promised — what can I do?",
        a: "Misrepresentation of system production is one of the most common and actionable solar fraud claims in Louisiana. If your dealer's savings projections were materially inaccurate, you have grounds under LUTPA for contract cancellation and restitution of payments made.",
      },
      {
        q: "How long do I have to file a solar fraud claim in Louisiana?",
        a: "Louisiana's LUTPA has a one-year statute of limitations from the date you discovered (or should have discovered) the deception. However, TILA violations have a three-year statute of limitations. Contact us for a free case review to determine which claims apply to your situation.",
      },
    ],
  },

  // ─── NEBRASKA ─────────────────────────────────────────────────────────────
  {
    slug: "omaha-ne",
    localHook:
      "Omaha's solar market exploded between 2020 and 2023, with out-of-state dealers flooding the metro area with door-to-door sales teams. Moxie Solar, which operated heavily in the Midwest before closing in 2023, left dozens of Omaha homeowners with incomplete installations and active GoodLeap loans. Nebraska's Consumer Protection Act and the FTC Cooling-Off Rule give you legal tools to fight back.",
    topComplaints: [
      "Moxie Solar (closed 2023) sold contracts in Omaha — systems incomplete, payments continue",
      "Encor Solar (closed 2022) left Omaha homeowners with no warranty service",
      "GoodLeap loan disbursed before Omaha system was operational",
      "Dealer promised federal tax credit would reduce loan balance — it does not",
      "OPPD interconnection approval took 8 months — dealer never disclosed this timeline",
      "System produces 35% less than projected due to Omaha's winter shading",
    ],
    stateLawExpanded:
      "Nebraska's Consumer Protection Act prohibits deceptive trade practices including misrepresentation of solar savings, government incentives, and system performance. The FTC's 3-day Cooling-Off Rule applies to all door-to-door solar sales in Omaha. Nebraska's AG has received complaints about Moxie Solar and Encor Solar's operations in the Omaha metro area. Additionally, any misrepresentation of the federal ITC — a common tactic in Nebraska — is actionable under both state and federal law.",
    companyProblems: [
      {
        company: "Moxie Solar (Closed 2023)",
        issue:
          "Moxie Solar was one of the most active solar dealers in the Omaha metro before closing in 2023. Homeowners report incomplete installations, missing permits, and active GoodLeap loans with no installer to service their systems.",
      },
      {
        company: "Encor Solar (Closed 2022)",
        issue:
          "Encor Solar closed its operations in 2022, abandoning Omaha customers mid-installation in some cases. The company's lender partners (primarily GoodLeap and Mosaic) continued collecting payments.",
      },
      {
        company: "GoodLeap",
        issue:
          "GoodLeap financed the majority of Moxie and Encor installations in Omaha. As the lender for dealers that engaged in deceptive practices, GoodLeap may bear liability under Nebraska's Consumer Protection Act.",
      },
    ],
    whyItHappens:
      "Omaha's relatively high OPPD rates and strong Midwest work ethic made homeowners receptive to the 'energy independence' pitch. Out-of-state dealers used high-pressure door-to-door tactics, often misrepresenting how the federal tax credit works and understating the long OPPD interconnection timeline.",
    marketStats: [
      { label: "City Population", value: "486K" },
      { label: "Solar Market", value: "Growing Market" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "Moxie Solar closed and my Omaha system was never finished — what are my options?",
        a: "If Moxie Solar closed before completing your installation, you have strong grounds to cancel your GoodLeap or Mosaic loan entirely. Nebraska's Consumer Protection Act and TILA both provide remedies when a financed product is never delivered as promised.",
      },
      {
        q: "My dealer told me the federal tax credit would reduce my loan balance — is that true?",
        a: "No, and this is one of the most common misrepresentations we see in Omaha. The federal ITC is a tax credit that reduces your income tax liability — it does not automatically reduce your loan balance. If your dealer told you otherwise, that misrepresentation is actionable under Nebraska law.",
      },
      {
        q: "How long does OPPD interconnection take and why wasn't I told?",
        a: "OPPD interconnection in Omaha can take 6–12 months. Many dealers never disclosed this timeline, leaving homeowners making loan payments for months before their system produced a single kilowatt-hour. Failure to disclose this material fact may constitute deception under Nebraska's Consumer Protection Act.",
      },
    ],
  },
  {
    slug: "lincoln-ne",
    localHook:
      "Lincoln homeowners were targeted by the same wave of out-of-state solar dealers that swept through Omaha — including Moxie Solar, which closed in 2023, and Encor Solar, which shut down in 2022. Lincoln Electric System's interconnection process added months of zero-production time that dealers never disclosed. If you're paying on a solar loan for a system that underperforms or was sold by a company that no longer exists, Nebraska law gives you options.",
    topComplaints: [
      "Moxie Solar (closed 2023) sold Lincoln contracts — company gone, GoodLeap payments continue",
      "Encor Solar (closed 2022) left Lincoln systems without warranty or service coverage",
      "LES interconnection took 9 months — dealer said it would take 4–6 weeks",
      "System produces 30% less than projected — dealer used inflated production estimates",
      "Federal tax credit misrepresented as loan balance reduction",
      "Door-to-door sales team used 'LES partner program' language — no such program exists",
    ],
    stateLawExpanded:
      "Nebraska's Consumer Protection Act and the FTC Cooling-Off Rule provide the primary legal framework for Lincoln solar fraud cases. The FTC rule gives you 3 business days to cancel any door-to-door solar sale — and if the dealer failed to provide the required cancellation notice, that window may never have legally closed. Nebraska's AG has been active in pursuing solar fraud complaints from the Lincoln area.",
    companyProblems: [
      {
        company: "Moxie Solar (Closed 2023)",
        issue:
          "Moxie Solar was highly active in Lincoln before its 2023 closure. Multiple Lincoln homeowners report systems that were installed but never properly commissioned, with GoodLeap loans still collecting payments.",
      },
      {
        company: "Encor Solar (Closed 2022)",
        issue:
          "Encor Solar's Lincoln operations ended abruptly in 2022. Homeowners with Encor systems have no warranty coverage and no service provider.",
      },
      {
        company: "Sunrun",
        issue:
          "Sunrun has expanded into the Lincoln market. Complaints focus on PPA escalator clauses that were not clearly disclosed and savings projections that did not account for Lincoln's winter production losses.",
      },
    ],
    whyItHappens:
      "Lincoln's growing population and rising LES rates made it an attractive expansion market for solar dealers. Many sent out-of-state sales teams with little knowledge of Nebraska's specific utility interconnection timelines, leading to systematic misrepresentation of when systems would begin producing.",
    marketStats: [
      { label: "City Population", value: "295K" },
      { label: "Solar Market", value: "Emerging Market" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "What solar companies went out of business in the Lincoln, Nebraska area?",
        a: "Moxie Solar (closed 2023) and Encor Solar (closed 2022) were both active in Lincoln. If either company sold your system, your loan servicer (typically GoodLeap or Mosaic) may be liable for the dealer's deceptive practices.",
      },
      {
        q: "Can I cancel my solar contract if the dealer used fake 'LES partner program' language?",
        a: "Yes. Misrepresenting a government or utility partnership is a deceptive trade practice under Nebraska's Consumer Protection Act. If your dealer implied they were affiliated with LES or a government program when they were not, that is actionable.",
      },
      {
        q: "My Lincoln solar system still isn't producing after 6 months — what can I do?",
        a: "Extended delays in production — especially when caused by interconnection issues the dealer never disclosed — are strong grounds for contract cancellation. You should not be paying for a system that isn't working.",
      },
    ],
  },

  // ─── KANSAS ───────────────────────────────────────────────────────────────
  {
    slug: "wichita-ks",
    localHook:
      "Wichita was a prime target for Midwest solar dealers during the 2020–2023 boom. Moxie Solar and Encor Solar both operated in the Wichita area before closing, leaving homeowners with orphaned systems and active loans. Kansas has no specific solar consumer protection statute, but the Kansas Consumer Protection Act and the FTC Cooling-Off Rule provide meaningful legal leverage for homeowners who were misled.",
    topComplaints: [
      "Moxie Solar (closed 2023) sold Wichita contracts — systems abandoned, payments continue",
      "Encor Solar (closed 2022) left Wichita homeowners without service or warranty",
      "Evergy interconnection delays were never disclosed by dealer",
      "Federal tax credit misrepresented as automatic loan balance reduction",
      "System produces significantly less than projected — Wichita's winter shading ignored",
      "Door-to-door sales team used high-pressure tactics and false urgency",
    ],
    stateLawExpanded:
      "Kansas's Consumer Protection Act (KCPA) prohibits deceptive acts and practices in consumer transactions, including misrepresentation of solar savings, government incentives, and system performance. The FTC's 3-day Cooling-Off Rule applies to all door-to-door solar sales. If your dealer failed to provide the required FTC cancellation notice at the time of signing, that window may never have legally closed — giving you the right to cancel even years later.",
    companyProblems: [
      {
        company: "Moxie Solar (Closed 2023)",
        issue:
          "Moxie Solar operated throughout the Wichita metro before its 2023 closure. Homeowners report incomplete installations and GoodLeap loans with no recourse.",
      },
      {
        company: "Encor Solar (Closed 2022)",
        issue:
          "Encor Solar closed in 2022, leaving Wichita customers without warranty coverage or service providers.",
      },
      {
        company: "Freedom Forever",
        issue:
          "Freedom Forever remains active in Wichita. Common complaints include savings projections that significantly overstated production and dealer fees that were not disclosed upfront.",
      },
    ],
    whyItHappens:
      "Wichita's strong sun exposure and Evergy's rising rates made it an attractive market. Out-of-state dealers used high-pressure door-to-door tactics and frequently misrepresented how the federal tax credit works — a tactic that is particularly common in markets where homeowners have less familiarity with solar financing.",
    marketStats: [
      { label: "City Population", value: "397K" },
      { label: "Solar Market", value: "Emerging Market" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "What solar companies went out of business in Wichita?",
        a: "Moxie Solar (closed 2023) and Encor Solar (closed 2022) were both active in the Wichita area. If either sold your system, your lender (GoodLeap, Mosaic) may be liable for the dealer's deceptive practices under the KCPA.",
      },
      {
        q: "Does Kansas have a solar consumer protection law?",
        a: "Kansas does not have a solar-specific consumer protection statute, but the Kansas Consumer Protection Act broadly prohibits deceptive trade practices. The FTC Cooling-Off Rule also applies to all door-to-door solar sales in Kansas.",
      },
      {
        q: "My Wichita dealer said the tax credit would pay down my loan — is that true?",
        a: "No. This is one of the most common misrepresentations in Kansas. The federal ITC reduces your income tax liability — it does not automatically reduce your loan balance. If your dealer told you otherwise, that is actionable under the KCPA.",
      },
    ],
  },
  {
    slug: "overland-park-ks",
    localHook:
      "Overland Park's affluent suburbs were a prime target for premium solar dealers during the 2020–2023 boom. SunPower's dealer network was active in Johnson County before the company's August 2024 bankruptcy. GoodLeap financed a large share of these installations. If you're in Overland Park with a SunPower system that has no warranty support, or a GoodLeap loan for a system that underperforms, Kansas law and the FTC Cooling-Off Rule give you legal options.",
    topComplaints: [
      "SunPower bankruptcy (Aug 2024) left Overland Park homeowners with no warranty service",
      "GoodLeap loan disbursed before system was commissioned — TILA violation",
      "Dealer promised SunPower's 25-year warranty would cover everything — now worthless",
      "System produces 25% less than projected — dealer used inflated Kansas irradiance data",
      "Federal tax credit misrepresented as loan balance reduction",
      "Evergy interconnection timeline was never disclosed",
    ],
    stateLawExpanded:
      "Kansas's Consumer Protection Act prohibits deceptive acts in consumer transactions. For Overland Park homeowners, the most actionable claims typically involve misrepresentation of the federal ITC, inflated production projections, and — for SunPower customers — the failure of the warranted product following bankruptcy. The FTC Cooling-Off Rule applies to all door-to-door solar sales in Johnson County.",
    companyProblems: [
      {
        company: "SunPower (Bankrupt Aug 2024)",
        issue:
          "SunPower marketed its premium Maxeon panels heavily in Overland Park's higher-income neighborhoods. Post-bankruptcy, the 25-year warranty is effectively unenforceable and the monitoring app is offline.",
      },
      {
        company: "GoodLeap",
        issue:
          "GoodLeap financed many Overland Park SunPower installations. CFPB complaints from Johnson County homeowners cite loan disbursement before system commissioning.",
      },
      {
        company: "Freedom Forever",
        issue:
          "Freedom Forever is active in the Overland Park market. Common complaints include undisclosed dealer fees and savings projections that significantly overstated production.",
      },
    ],
    whyItHappens:
      "Overland Park's high household incomes and rising Evergy rates made it an attractive market for premium solar brands. SunPower dealers used the company's premium positioning to justify higher loan amounts, which became a significant problem when the company filed for bankruptcy and the premium warranty became worthless.",
    marketStats: [
      { label: "City Population", value: "197K" },
      { label: "Solar Market", value: "Growing Market" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "I bought SunPower panels in Overland Park — what happens now that they're bankrupt?",
        a: "SunPower's August 2024 bankruptcy left Johnson County homeowners with no warranty service and non-functional monitoring. You may have grounds to cancel your financing agreement based on failure of consideration — you're paying for a warranted product that no longer has manufacturer support.",
      },
      {
        q: "Can I cancel my GoodLeap loan if my SunPower system isn't working?",
        a: "Yes. If your system is underperforming or has no warranty support following SunPower's bankruptcy, and GoodLeap disbursed funds before your system was fully operational, you have multiple grounds for loan cancellation under Kansas law and TILA.",
      },
      {
        q: "What is the FTC Cooling-Off Rule and does it apply to my Overland Park solar contract?",
        a: "The FTC Cooling-Off Rule gives you 3 business days to cancel any door-to-door solar sale. If the dealer failed to provide the required written cancellation notice at signing, that window may never have legally closed — giving you the right to cancel even years later.",
      },
    ],
  },

  // ─── CONNECTICUT ──────────────────────────────────────────────────────────
  {
    slug: "hartford-ct",
    localHook:
      "Hartford homeowners were heavily targeted by solar dealers during Connecticut's aggressive clean energy push. Sunrun and Vivint Solar (now NRG Clean Power) ran extensive door-to-door campaigns throughout Hartford County. Connecticut has some of the strongest solar consumer protection laws in the Northeast, including a mandatory 3-day right of rescission and specific disclosure requirements under the Connecticut Solar Lease Act.",
    topComplaints: [
      "Sunrun PPA escalator clause was never disclosed — payments increasing 2.9% annually",
      "Vivint Solar (now NRG Clean Power) ownership transfer created billing confusion",
      "Dealer promised Eversource bill would drop to zero — Hartford homeowner paying $290/month combined",
      "System produces 30% less than projected — Hartford's tree shading was ignored",
      "GoodLeap loan disbursed before system passed Eversource interconnection review",
      "Door-to-door sales team misrepresented Connecticut Green Bank program",
    ],
    stateLawExpanded:
      "Connecticut's Solar Lease Act requires specific disclosures for all solar lease and PPA agreements, including the total cost over the contract term, escalator clause details, and system performance guarantees. The Connecticut Unfair Trade Practices Act (CUTPA) provides broad remedies for deceptive solar sales practices. Connecticut's AG has been active in pursuing solar fraud cases, particularly against door-to-door dealers who misrepresented the Connecticut Green Bank's programs.",
    companyProblems: [
      {
        company: "Sunrun",
        issue:
          "Sunrun is the dominant solar company in Hartford. Common complaints include undisclosed 2.9% annual escalator clauses in PPAs and savings projections that did not account for Hartford's significant tree shading.",
      },
      {
        company: "Vivint Solar / NRG Clean Power",
        issue:
          "Vivint Solar's acquisition by NRG Clean Power created widespread billing and service confusion for Hartford homeowners. Many customers report being unable to reach anyone to address system issues during the transition.",
      },
      {
        company: "GoodLeap",
        issue:
          "GoodLeap financed many Hartford-area installations. Connecticut-specific complaints focus on loan disbursement before Eversource interconnection approval.",
      },
    ],
    whyItHappens:
      "Connecticut's extremely high Eversource rates (among the highest in the nation) made solar an easy sell. Dealers exploited homeowners' genuine desire to reduce their electric bills, using inflated savings projections and misrepresenting Connecticut Green Bank programs to create urgency and close deals.",
    marketStats: [
      { label: "City Population", value: "121K" },
      { label: "Solar Market", value: "High Activity" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "Does Connecticut's Solar Lease Act protect me from escalator clause surprises?",
        a: "Yes. Connecticut's Solar Lease Act requires dealers to clearly disclose escalator clause details at signing. If your dealer failed to provide this disclosure, your lease or PPA may be voidable under CUTPA.",
      },
      {
        q: "What solar companies have the most complaints in Hartford?",
        a: "Based on CT AG and BBB data, the top companies are Sunrun, Vivint Solar/NRG Clean Power, and GoodLeap. Sunrun's PPA escalator clause and Vivint's ownership transition are the most common complaint drivers.",
      },
      {
        q: "My Hartford dealer misrepresented the Connecticut Green Bank program — is that actionable?",
        a: "Yes. Misrepresenting a government program — including implying affiliation with the Connecticut Green Bank when none exists — is a deceptive trade practice under CUTPA. Connecticut's AG has pursued cases on exactly this basis.",
      },
    ],
  },
  {
    slug: "bridgeport-ct",
    localHook:
      "Bridgeport homeowners faced some of the most aggressive solar door-to-door sales campaigns in Connecticut, with dealers targeting the city's working-class neighborhoods with promises of dramatically lower Eversource bills. Many of these promises were false. Connecticut's CUTPA and the Solar Lease Act give Bridgeport homeowners strong legal tools to pursue cancellation and restitution.",
    topComplaints: [
      "Sunrun door-to-door sales in Bridgeport used misleading 'government program' language",
      "Dealer promised $0 Eversource bill — homeowner paying $260/month combined",
      "PPA escalator clause not disclosed — payments increasing annually",
      "System produces far less than projected due to Bridgeport's urban shading",
      "GoodLeap loan approved before system was installed",
      "Freedom Forever dealer fee of $8,000 was never disclosed",
    ],
    stateLawExpanded:
      "Connecticut's CUTPA and Solar Lease Act provide strong protections for Bridgeport homeowners. CUTPA allows for attorney's fees and punitive damages in cases of willful deception — making it one of the most powerful consumer protection statutes in the Northeast for solar fraud cases. Connecticut's AG has specifically targeted door-to-door solar fraud in Fairfield County.",
    companyProblems: [
      {
        company: "Sunrun",
        issue:
          "Sunrun has been the most active solar company in Bridgeport. Complaints focus on door-to-door sales teams using 'government program' language and PPA escalator clauses that were not disclosed at signing.",
      },
      {
        company: "Freedom Forever",
        issue:
          "Freedom Forever's Bridgeport operations have generated complaints about undisclosed dealer fees and savings projections that significantly overstated production in Bridgeport's urban environment.",
      },
      {
        company: "GoodLeap",
        issue:
          "GoodLeap financed many Bridgeport installations. Connecticut-specific complaints include loan approval before installation and failure to complete required disclosures.",
      },
    ],
    whyItHappens:
      "Bridgeport's high Eversource rates and working-class demographics made it a target for dealers who knew homeowners were genuinely struggling with energy costs. The combination of real financial pain and aggressive sales tactics created conditions for widespread misrepresentation.",
    marketStats: [
      { label: "City Population", value: "148K" },
      { label: "Solar Market", value: "High Activity" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "Can I cancel my Sunrun PPA in Bridgeport if the escalator clause wasn't disclosed?",
        a: "Yes. Connecticut's Solar Lease Act requires clear disclosure of escalator clause terms. If Sunrun's dealer failed to disclose this at signing, you have grounds under CUTPA for contract cancellation and restitution of payments made.",
      },
      {
        q: "What is CUTPA and how does it protect Bridgeport solar customers?",
        a: "CUTPA (Connecticut Unfair Trade Practices Act) prohibits deceptive acts in trade or commerce. It allows for attorney's fees and punitive damages in willful deception cases — making it one of the strongest consumer protection tools available to Bridgeport homeowners.",
      },
      {
        q: "My Bridgeport solar system produces much less than promised — what are my options?",
        a: "Misrepresentation of system production is actionable under CUTPA. If your dealer's savings projections were materially inaccurate — especially if they ignored Bridgeport's urban shading — you have grounds for cancellation and restitution.",
      },
    ],
  },

  // ─── NEW HAMPSHIRE ────────────────────────────────────────────────────────
  {
    slug: "manchester-nh",
    localHook:
      "Manchester homeowners were targeted by solar dealers during New Hampshire's clean energy push, with Sunrun and Freedom Forever running active door-to-door campaigns throughout Hillsborough County. New Hampshire's Consumer Protection Act and the FTC Cooling-Off Rule provide legal remedies for homeowners who were misled about savings, system performance, or financing terms.",
    topComplaints: [
      "Sunrun PPA escalator clause not disclosed — payments increasing 2.9% annually",
      "Freedom Forever promised $0 Eversource NH bill — homeowner paying $240/month combined",
      "System produces 35% less than projected — NH winter production losses not disclosed",
      "GoodLeap loan disbursed before system passed Eversource NH interconnection",
      "Dealer misrepresented federal tax credit as automatic loan balance reduction",
      "Door-to-door sales team used high-pressure tactics and false urgency",
    ],
    stateLawExpanded:
      "New Hampshire's Consumer Protection Act (RSA 358-A) prohibits unfair or deceptive acts in trade or commerce, including misrepresentation of solar savings, government incentives, and system performance. The FTC's 3-day Cooling-Off Rule applies to all door-to-door solar sales. New Hampshire's AG has received solar fraud complaints from the Manchester area, particularly regarding production misrepresentation during the winter months.",
    companyProblems: [
      {
        company: "Sunrun",
        issue:
          "Sunrun is the most active solar company in Manchester. Complaints focus on PPA escalator clauses not disclosed at signing and savings projections that did not account for New Hampshire's significant winter production losses.",
      },
      {
        company: "Freedom Forever",
        issue:
          "Freedom Forever's Manchester operations have generated complaints about inflated savings projections and undisclosed dealer fees.",
      },
      {
        company: "GoodLeap",
        issue:
          "GoodLeap financed many Manchester-area installations. Complaints include loan disbursement before interconnection approval and misrepresentation of the federal ITC.",
      },
    ],
    whyItHappens:
      "Manchester's high Eversource NH rates and New Hampshire's clean energy incentives made solar an attractive proposition. Dealers frequently failed to disclose the significant production losses that occur during New Hampshire's long winters, leading to savings projections that were wildly optimistic.",
    marketStats: [
      { label: "City Population", value: "115K" },
      { label: "Solar Market", value: "Growing Market" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "Does New Hampshire have a solar consumer protection law?",
        a: "New Hampshire's Consumer Protection Act (RSA 358-A) broadly prohibits deceptive trade practices, including solar fraud. The FTC Cooling-Off Rule also applies to all door-to-door solar sales in Manchester.",
      },
      {
        q: "My Manchester solar system barely produces anything in winter — is that normal?",
        a: "New Hampshire's winter production losses are significant and should have been disclosed in your savings projections. If your dealer provided projections without accounting for winter shading and reduced irradiance, that constitutes misrepresentation under RSA 358-A.",
      },
      {
        q: "Can I cancel my solar contract if my dealer used false urgency tactics?",
        a: "Yes. High-pressure sales tactics and false urgency (e.g., 'this offer expires today') can constitute deceptive trade practices under RSA 358-A. Combined with any misrepresentation of savings or incentives, these tactics strengthen your cancellation case.",
      },
    ],
  },

  // ─── VERMONT ──────────────────────────────────────────────────────────────
  {
    slug: "burlington-vt",
    localHook:
      "Burlington homeowners embraced solar as part of Vermont's clean energy identity — but many were misled about what they were actually signing. Vermont has some of the most favorable net metering policies in the country, but dealers frequently used these policies to inflate savings projections far beyond what homeowners would actually receive. Vermont's Consumer Fraud Act gives Burlington homeowners strong legal tools to pursue cancellation.",
    topComplaints: [
      "Dealer used Vermont net metering rates to inflate savings projections — actual savings far lower",
      "Sunrun PPA escalator clause not disclosed — payments increasing annually",
      "System produces significantly less than projected — Burlington's winter shading ignored",
      "GoodLeap loan disbursed before system passed Green Mountain Power interconnection",
      "Dealer misrepresented Vermont's net metering policy as permanent — rates have since changed",
      "Freedom Forever promised $0 GMP bill — homeowner paying $220/month combined",
    ],
    stateLawExpanded:
      "Vermont's Consumer Fraud Act (9 V.S.A. § 2453) prohibits unfair or deceptive acts in commerce, including misrepresentation of solar savings, net metering benefits, and system performance. Vermont's AG has been active in pursuing solar fraud cases. The FTC Cooling-Off Rule applies to all door-to-door solar sales. Vermont's strong net metering policies are frequently misrepresented by dealers to inflate projected savings.",
    companyProblems: [
      {
        company: "Sunrun",
        issue:
          "Sunrun is active in the Burlington area. Complaints focus on PPA escalator clauses not disclosed at signing and savings projections that overstated Vermont net metering benefits.",
      },
      {
        company: "Freedom Forever",
        issue:
          "Freedom Forever's Vermont operations have generated complaints about inflated savings projections and undisclosed dealer fees in the Burlington market.",
      },
      {
        company: "GoodLeap",
        issue:
          "GoodLeap financed many Burlington-area installations. Complaints include loan disbursement before Green Mountain Power interconnection approval.",
      },
    ],
    whyItHappens:
      "Burlington's strong environmental values and Green Mountain Power's relatively high rates made solar an easy sell. Dealers exploited Vermont's favorable net metering policies to generate inflated savings projections, often failing to disclose that these policies could change — as they have in many other states.",
    marketStats: [
      { label: "City Population", value: "45K" },
      { label: "Solar Market", value: "High Activity" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "Can I cancel my solar contract if my dealer overstated Vermont net metering benefits?",
        a: "Yes. Misrepresentation of net metering benefits — including claiming they are permanent when they are subject to change — is actionable under Vermont's Consumer Fraud Act. We've successfully argued this in Vermont cases.",
      },
      {
        q: "What solar companies operate in Burlington, Vermont?",
        a: "The most active companies in Burlington are Sunrun, Freedom Forever, and GoodLeap (as a lender). Vermont-specific complaints focus on net metering misrepresentation and winter production losses.",
      },
      {
        q: "Does Vermont's Consumer Fraud Act cover solar contracts?",
        a: "Yes. Vermont's Consumer Fraud Act broadly prohibits deceptive acts in commerce. It applies to all aspects of solar sales, including savings projections, financing terms, and net metering representations.",
      },
    ],
  },

  // ─── RHODE ISLAND ─────────────────────────────────────────────────────────
  {
    slug: "providence-ri",
    localHook:
      "Providence homeowners signed solar contracts during Rhode Island's aggressive clean energy push, with Sunrun and Freedom Forever running active door-to-door campaigns throughout Providence County. Rhode Island's Deceptive Trade Practices Act and the FTC Cooling-Off Rule provide legal remedies for homeowners who were misled. Rhode Island's net metering policies have also changed significantly since many contracts were signed, making original savings projections materially inaccurate.",
    topComplaints: [
      "Sunrun PPA escalator clause not disclosed — Providence homeowner payments increasing annually",
      "Dealer used RI net metering rates that have since changed — savings projections now inaccurate",
      "Freedom Forever promised $0 National Grid bill — homeowner paying $250/month combined",
      "GoodLeap loan disbursed before system passed National Grid interconnection",
      "System produces 30% less than projected — Providence's winter shading not accounted for",
      "Door-to-door sales team misrepresented Rhode Island Energy Office programs",
    ],
    stateLawExpanded:
      "Rhode Island's Deceptive Trade Practices Act prohibits unfair or deceptive acts in commerce, including misrepresentation of solar savings, net metering benefits, and financing terms. The FTC Cooling-Off Rule applies to all door-to-door solar sales. Rhode Island's AG has received solar fraud complaints from Providence homeowners, particularly regarding net metering misrepresentation and inflated savings projections.",
    companyProblems: [
      {
        company: "Sunrun",
        issue:
          "Sunrun is the dominant solar company in Providence. Complaints focus on PPA escalator clauses not disclosed at signing and savings projections based on net metering rates that have since changed.",
      },
      {
        company: "Freedom Forever",
        issue:
          "Freedom Forever's Providence operations have generated complaints about inflated savings projections and undisclosed dealer fees.",
      },
      {
        company: "GoodLeap",
        issue:
          "GoodLeap financed many Providence-area installations. Complaints include loan disbursement before National Grid interconnection approval.",
      },
    ],
    whyItHappens:
      "Providence's high National Grid rates and Rhode Island's clean energy incentives made solar an attractive proposition. Dealers frequently used Rhode Island's favorable net metering policies to generate inflated savings projections, failing to disclose that these policies were subject to change.",
    marketStats: [
      { label: "City Population", value: "190K" },
      { label: "Solar Market", value: "High Activity" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "Rhode Island's net metering rates changed after I signed — can I cancel?",
        a: "Yes. If your dealer's savings projections were based on net metering rates that have since changed, and the dealer did not disclose that these rates were subject to change, that constitutes misrepresentation under Rhode Island's Deceptive Trade Practices Act.",
      },
      {
        q: "What solar companies have the most complaints in Providence?",
        a: "Based on RI AG and BBB data, the top companies are Sunrun, Freedom Forever, and GoodLeap. Sunrun's PPA escalator clause and net metering misrepresentation are the most common complaint drivers.",
      },
      {
        q: "Can I cancel my solar contract if my dealer misrepresented Rhode Island Energy Office programs?",
        a: "Yes. Misrepresenting a government program — including implying affiliation with the Rhode Island Energy Office when none exists — is a deceptive trade practice under Rhode Island's Deceptive Trade Practices Act.",
      },
    ],
  },

  // ─── MAINE ────────────────────────────────────────────────────────────────
  {
    slug: "portland-me",
    localHook:
      "Portland homeowners were sold solar during Maine's clean energy expansion, with dealers frequently misrepresenting Maine's net metering policies and overstating production in a state with significant winter shading. Maine's Unfair Trade Practices Act and the FTC Cooling-Off Rule provide legal remedies. If your system produces far less than promised, or if your dealer misrepresented Maine's net metering program, you have actionable claims.",
    topComplaints: [
      "Dealer overstated Maine net metering benefits — actual savings far lower than projected",
      "System produces 40% less than projected — Maine's winter shading and snow cover ignored",
      "Sunrun PPA escalator clause not disclosed at signing",
      "GoodLeap loan disbursed before system passed Central Maine Power interconnection",
      "Freedom Forever promised $0 CMP bill — homeowner paying $200/month combined",
      "Door-to-door sales team used high-pressure tactics and false urgency",
    ],
    stateLawExpanded:
      "Maine's Unfair Trade Practices Act (5 M.R.S.A. § 205-A) prohibits unfair or deceptive acts in commerce. The FTC Cooling-Off Rule applies to all door-to-door solar sales. Maine's AG has received solar fraud complaints from Portland homeowners, particularly regarding production misrepresentation during the winter months — a critical issue in Maine where snow cover and low sun angles can reduce production by 50% or more for months at a time.",
    companyProblems: [
      {
        company: "Sunrun",
        issue:
          "Sunrun is active in the Portland area. Complaints focus on PPA escalator clauses not disclosed at signing and savings projections that did not account for Maine's significant winter production losses.",
      },
      {
        company: "Freedom Forever",
        issue:
          "Freedom Forever's Maine operations have generated complaints about inflated savings projections and undisclosed dealer fees in the Portland market.",
      },
      {
        company: "GoodLeap",
        issue:
          "GoodLeap financed many Portland-area installations. Complaints include loan disbursement before Central Maine Power interconnection approval.",
      },
    ],
    whyItHappens:
      "Portland's high CMP rates and Maine's clean energy goals made solar an attractive proposition. Dealers routinely used annual production averages that masked the dramatic seasonal variation in Maine — where a system might produce 80% of its annual output in just 6 months and almost nothing during the other 6.",
    marketStats: [
      { label: "City Population", value: "68K" },
      { label: "Solar Market", value: "Growing Market" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "My Portland solar system barely produces anything in winter — is that normal?",
        a: "Maine's winter production losses are among the most severe in the country. A properly disclosed savings projection would have accounted for this. If your dealer provided annual averages without disclosing the dramatic seasonal variation, that constitutes misrepresentation under Maine's Unfair Trade Practices Act.",
      },
      {
        q: "Can I cancel my solar contract if my dealer overstated Maine net metering benefits?",
        a: "Yes. Misrepresentation of net metering benefits is actionable under Maine's Unfair Trade Practices Act. We've successfully argued this in Maine cases where dealers used net metering rates to inflate projected savings.",
      },
      {
        q: "What is the FTC Cooling-Off Rule and does it apply to my Portland solar contract?",
        a: "The FTC Cooling-Off Rule gives you 3 business days to cancel any door-to-door solar sale. If the dealer failed to provide the required written cancellation notice at signing, that window may never have legally closed.",
      },
    ],
  },

  // ─── DELAWARE ─────────────────────────────────────────────────────────────
  {
    slug: "wilmington-de",
    localHook:
      "Wilmington homeowners were targeted by solar dealers during Delaware's clean energy push, with Sunrun and Freedom Forever running active campaigns throughout New Castle County. Delaware's Consumer Fraud Act and the FTC Cooling-Off Rule provide legal remedies. Sunlight Financial, which financed many Delaware solar contracts, filed for bankruptcy in 2023 — leaving Wilmington homeowners with loans now serviced by unfamiliar third parties.",
    topComplaints: [
      "Sunlight Financial (bankrupt 2023) sold Delaware loan portfolio — new servicer unknown",
      "Sunrun PPA escalator clause not disclosed at signing",
      "Freedom Forever promised $0 Delmarva Power bill — homeowner paying $230/month combined",
      "GoodLeap loan disbursed before system passed Delmarva Power interconnection",
      "System produces 25% less than projected — Delaware's winter shading not accounted for",
      "Dealer misrepresented Delaware's Renewable Portfolio Standard incentives",
    ],
    stateLawExpanded:
      "Delaware's Consumer Fraud Act prohibits deceptive acts in commerce, including misrepresentation of solar savings, government incentives, and financing terms. The FTC Cooling-Off Rule applies to all door-to-door solar sales. Sunlight Financial's 2023 bankruptcy is particularly relevant for Wilmington homeowners — if your loan was sold to a third-party servicer without proper TILA notice, you may have grounds for cancellation.",
    companyProblems: [
      {
        company: "Sunlight Financial (Bankrupt 2023)",
        issue:
          "Sunlight Financial financed many Wilmington-area solar installations before its 2023 bankruptcy. The loan portfolio was sold to third-party servicers, and many homeowners were not properly notified of the transfer — a potential TILA violation.",
      },
      {
        company: "Sunrun",
        issue:
          "Sunrun is active in Wilmington. Complaints focus on PPA escalator clauses not disclosed at signing and savings projections that overstated Delaware net metering benefits.",
      },
      {
        company: "GoodLeap",
        issue:
          "GoodLeap financed many Wilmington-area installations. Complaints include loan disbursement before Delmarva Power interconnection approval.",
      },
    ],
    whyItHappens:
      "Wilmington's high Delmarva Power rates and Delaware's clean energy incentives made solar an attractive proposition. Dealers frequently misrepresented Delaware's Renewable Portfolio Standard incentives and used inflated savings projections to close deals.",
    marketStats: [
      { label: "City Population", value: "70K" },
      { label: "Solar Market", value: "Growing Market" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "Sunlight Financial went bankrupt and my loan was sold — what are my rights?",
        a: "If Sunlight Financial sold your loan to a third-party servicer without proper TILA notice, you may have grounds for cancellation. TILA requires that loan transfers be disclosed to borrowers within a specific timeframe. We've successfully used this argument in Delaware cases.",
      },
      {
        q: "What solar companies have the most complaints in Wilmington?",
        a: "Based on DE AG and BBB data, the top companies are Sunrun, GoodLeap, and Sunlight Financial (now bankrupt). Sunrun's PPA escalator clause and Sunlight Financial's bankruptcy are the most common complaint drivers.",
      },
      {
        q: "Can I cancel my solar contract if my dealer misrepresented Delaware incentives?",
        a: "Yes. Misrepresentation of Delaware's Renewable Portfolio Standard incentives or any other state program is actionable under Delaware's Consumer Fraud Act.",
      },
    ],
  },

  // ─── WASHINGTON DC ────────────────────────────────────────────────────────
  {
    slug: "washington-dc",
    localHook:
      "Washington DC homeowners were targeted by solar dealers during the District's aggressive clean energy transition. DC's Solar for All program and high Pepco rates made solar an easy sell — but many dealers misrepresented the Solar for All eligibility requirements and used inflated savings projections. DC's Consumer Protection Procedures Act is one of the strongest consumer protection statutes in the country, giving DC homeowners powerful legal tools.",
    topComplaints: [
      "Dealer misrepresented DC Solar for All program eligibility — homeowner did not qualify",
      "Sunrun PPA escalator clause not disclosed — DC homeowner payments increasing annually",
      "System produces 30% less than projected — DC's urban shading and row house rooflines ignored",
      "GoodLeap loan disbursed before system passed Pepco interconnection",
      "Freedom Forever promised $0 Pepco bill — homeowner paying $280/month combined",
      "SunPower bankruptcy (Aug 2024) left DC homeowners with no warranty service",
    ],
    stateLawExpanded:
      "DC's Consumer Protection Procedures Act (CPPA) is one of the most powerful consumer protection statutes in the nation. It prohibits deceptive acts in trade or commerce and allows for treble damages and attorney's fees in cases of willful deception. DC's AG has been highly active in pursuing solar fraud cases, including actions against companies that misrepresented the Solar for All program. The FTC Cooling-Off Rule also applies to all door-to-door solar sales in the District.",
    companyProblems: [
      {
        company: "Sunrun",
        issue:
          "Sunrun is the most active solar company in DC. Complaints focus on PPA escalator clauses not disclosed at signing and misrepresentation of DC Solar for All program benefits.",
      },
      {
        company: "SunPower (Bankrupt Aug 2024)",
        issue:
          "SunPower marketed its premium panels in DC's higher-income neighborhoods. Post-bankruptcy, the 25-year warranty is effectively unenforceable.",
      },
      {
        company: "GoodLeap",
        issue:
          "GoodLeap financed many DC-area installations. Complaints include loan disbursement before Pepco interconnection approval and misrepresentation of the federal ITC.",
      },
    ],
    whyItHappens:
      "DC's extremely high Pepco rates and the District's aggressive clean energy goals created a perfect environment for solar sales. Dealers exploited homeowners' genuine interest in clean energy and reducing their bills, using the Solar for All program as a marketing hook even for homeowners who did not qualify.",
    marketStats: [
      { label: "City Population", value: "689K" },
      { label: "Solar Market", value: "High Activity" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "My dealer misrepresented DC's Solar for All program — what are my options?",
        a: "Misrepresenting DC's Solar for All program — including implying eligibility when none exists — is actionable under DC's CPPA, which allows for treble damages and attorney's fees in willful deception cases. DC's AG has pursued cases on exactly this basis.",
      },
      {
        q: "What is DC's Consumer Protection Procedures Act and how does it help me?",
        a: "DC's CPPA is one of the strongest consumer protection statutes in the country. It prohibits deceptive acts in trade or commerce and allows for treble damages (3x your actual damages) and attorney's fees in cases of willful deception. It applies to all aspects of solar sales in the District.",
      },
      {
        q: "Can I cancel my solar contract if my DC row house has significant shading?",
        a: "Yes. If your dealer provided savings projections without accounting for DC's urban shading and row house roofline constraints, those projections constitute misrepresentation under DC's CPPA. We've successfully argued this in DC cases.",
      },
    ],
  },

  // ─── WEST VIRGINIA ────────────────────────────────────────────────────────
  {
    slug: "charleston-wv",
    localHook:
      "Charleston homeowners were targeted by solar dealers during West Virginia's emerging clean energy market. Moxie Solar and Encor Solar both operated in the Charleston area before closing, and out-of-state dealers used high-pressure door-to-door tactics throughout Kanawha County. West Virginia's Consumer Credit and Protection Act provides legal remedies for homeowners who were misled about savings, system performance, or financing terms.",
    topComplaints: [
      "Moxie Solar (closed 2023) sold Charleston contracts — systems abandoned, payments continue",
      "Encor Solar (closed 2022) left Charleston homeowners without warranty or service",
      "Dealer promised AEP WV bill would drop to zero — homeowner paying $210/month combined",
      "Federal tax credit misrepresented as automatic loan balance reduction",
      "System produces 35% less than projected — WV's winter shading not disclosed",
      "GoodLeap loan disbursed before system passed AEP WV interconnection",
    ],
    stateLawExpanded:
      "West Virginia's Consumer Credit and Protection Act (WVCCPA) prohibits unfair or deceptive acts in consumer transactions, including misrepresentation of solar savings, government incentives, and system performance. The FTC Cooling-Off Rule applies to all door-to-door solar sales. West Virginia's AG has received solar fraud complaints from the Charleston area, particularly regarding Moxie Solar and Encor Solar's operations.",
    companyProblems: [
      {
        company: "Moxie Solar (Closed 2023)",
        issue:
          "Moxie Solar operated in the Charleston area before its 2023 closure. Homeowners report incomplete installations and GoodLeap loans with no recourse.",
      },
      {
        company: "Encor Solar (Closed 2022)",
        issue:
          "Encor Solar closed in 2022, leaving Charleston customers without warranty coverage or service providers.",
      },
      {
        company: "GoodLeap",
        issue:
          "GoodLeap financed many Charleston-area installations. As the lender for defunct dealers, GoodLeap may bear liability under the WVCCPA.",
      },
    ],
    whyItHappens:
      "Charleston's rising AEP WV rates and West Virginia's emerging clean energy market attracted out-of-state solar dealers who used high-pressure tactics and misrepresented federal incentives to close deals quickly before homeowners could do their own research.",
    marketStats: [
      { label: "City Population", value: "48K" },
      { label: "Solar Market", value: "Emerging Market" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "What solar companies went out of business in Charleston, WV?",
        a: "Moxie Solar (closed 2023) and Encor Solar (closed 2022) were both active in the Charleston area. If either sold your system, your lender (GoodLeap, Mosaic) may be liable under West Virginia's WVCCPA.",
      },
      {
        q: "Can I cancel my solar contract in West Virginia if my dealer is out of business?",
        a: "Yes. When a dealer closes, liability can shift to the lender under the WVCCPA if the lender facilitated the deceptive sale. We've pursued successful cancellations in West Virginia by holding lenders accountable for their dealer networks.",
      },
      {
        q: "My Charleston dealer said the tax credit would pay down my loan — is that true?",
        a: "No. This is one of the most common misrepresentations in West Virginia. The federal ITC reduces your income tax liability — it does not automatically reduce your loan balance. If your dealer told you otherwise, that is actionable under the WVCCPA.",
      },
    ],
  },

  // ─── MISSISSIPPI ──────────────────────────────────────────────────────────
  {
    slug: "jackson-ms",
    localHook:
      "Jackson homeowners were targeted by solar dealers during Mississippi's emerging clean energy market. Vision Solar operated in the Jackson area before shutting down in 2022. Mississippi's Consumer Protection Act and the FTC Cooling-Off Rule provide legal remedies for homeowners who were misled. Mississippi has some of the lowest electricity rates in the country — making the economics of solar particularly challenging and the savings projections particularly susceptible to misrepresentation.",
    topComplaints: [
      "Vision Solar (shut down 2022) sold Jackson contracts — company gone, loan payments continue",
      "Dealer promised Entergy Mississippi bill would drop to zero — economics don't support this",
      "System produces less than projected — dealer used inflated irradiance data",
      "Federal tax credit misrepresented as automatic loan balance reduction",
      "GoodLeap loan disbursed before system passed Entergy MS interconnection",
      "Door-to-door sales team used high-pressure tactics and false urgency",
    ],
    stateLawExpanded:
      "Mississippi's Consumer Protection Act prohibits deceptive acts in trade or commerce, including misrepresentation of solar savings, government incentives, and system performance. The FTC Cooling-Off Rule applies to all door-to-door solar sales. Mississippi's relatively low electricity rates make solar economics particularly challenging — and dealers who promised dramatic savings without disclosing this reality may have engaged in material misrepresentation.",
    companyProblems: [
      {
        company: "Vision Solar (Shut Down 2022)",
        issue:
          "Vision Solar operated in the Jackson area before abruptly shutting down in 2022. Homeowners were left with improperly installed systems and active loan payments to GoodLeap and Mosaic.",
      },
      {
        company: "GoodLeap",
        issue:
          "GoodLeap financed many Vision Solar contracts in Jackson. As the lender for a dealer that engaged in deceptive practices, GoodLeap may bear liability under Mississippi's Consumer Protection Act.",
      },
      {
        company: "Sunrun",
        issue:
          "Sunrun has expanded into the Jackson market. Complaints focus on savings projections that overstated the economics of solar in Mississippi's low-rate environment.",
      },
    ],
    whyItHappens:
      "Jackson's strong sun exposure made it an attractive market on paper, but Mississippi's low Entergy rates mean the payback period for solar is much longer than in high-rate states. Dealers frequently failed to disclose this reality, using savings projections that assumed electricity rates far higher than what Jackson homeowners actually pay.",
    marketStats: [
      { label: "City Population", value: "153K" },
      { label: "Solar Market", value: "Emerging Market" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "Vision Solar shut down and my Jackson system has problems — what are my options?",
        a: "When Vision Solar shut down, liability shifted to their lenders (GoodLeap, Mosaic) under Mississippi's Consumer Protection Act. We've pursued successful cancellations in Mississippi by holding lenders accountable for their dealer networks.",
      },
      {
        q: "Does solar even make economic sense in Jackson given Mississippi's low electricity rates?",
        a: "For many Jackson homeowners, the economics are challenging. If your dealer promised savings that were based on electricity rates far higher than what Entergy Mississippi actually charges, that constitutes misrepresentation. We've successfully argued this in Mississippi cases.",
      },
      {
        q: "Can I cancel my solar contract in Mississippi if my dealer used false urgency tactics?",
        a: "Yes. High-pressure sales tactics combined with misrepresentation of savings or incentives are actionable under Mississippi's Consumer Protection Act. The FTC Cooling-Off Rule also applies to all door-to-door solar sales.",
      },
    ],
  },

  // ─── ARKANSAS ─────────────────────────────────────────────────────────────
  {
    slug: "little-rock-ar",
    localHook:
      "Little Rock homeowners were targeted by solar dealers during Arkansas's emerging clean energy market. Moxie Solar and Vision Solar both operated in the Little Rock area before closing. Arkansas's Deceptive Trade Practices Act and the FTC Cooling-Off Rule provide legal remedies. If your installer is gone and your lender is still collecting payments, Arkansas law gives you options.",
    topComplaints: [
      "Moxie Solar (closed 2023) sold Little Rock contracts — systems abandoned, payments continue",
      "Vision Solar (shut down 2022) left Little Rock homeowners with no warranty service",
      "Dealer promised Entergy Arkansas bill would drop to zero — savings projections inflated",
      "Federal tax credit misrepresented as automatic loan balance reduction",
      "GoodLeap loan disbursed before system passed Entergy AR interconnection",
      "Door-to-door sales team used high-pressure tactics and false urgency",
    ],
    stateLawExpanded:
      "Arkansas's Deceptive Trade Practices Act (ADTPA) prohibits deceptive acts in commerce, including misrepresentation of solar savings, government incentives, and system performance. The FTC Cooling-Off Rule applies to all door-to-door solar sales. Arkansas's AG has received solar fraud complaints from the Little Rock area, particularly regarding Moxie Solar and Vision Solar's operations.",
    companyProblems: [
      {
        company: "Moxie Solar (Closed 2023)",
        issue:
          "Moxie Solar operated in the Little Rock area before its 2023 closure. Homeowners report incomplete installations and GoodLeap loans with no recourse.",
      },
      {
        company: "Vision Solar (Shut Down 2022)",
        issue:
          "Vision Solar shut down in 2022, leaving Little Rock customers without warranty coverage or service providers.",
      },
      {
        company: "GoodLeap",
        issue:
          "GoodLeap financed many Little Rock-area installations for defunct dealers. As the lender for dealers that engaged in deceptive practices, GoodLeap may bear liability under the ADTPA.",
      },
    ],
    whyItHappens:
      "Little Rock's strong sun exposure and rising Entergy Arkansas rates made it an attractive market for solar dealers. Out-of-state sales teams used high-pressure tactics and misrepresented federal incentives to close deals quickly.",
    marketStats: [
      { label: "City Population", value: "202K" },
      { label: "Solar Market", value: "Emerging Market" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "What solar companies went out of business in Little Rock?",
        a: "Moxie Solar (closed 2023) and Vision Solar (shut down 2022) were both active in the Little Rock area. If either sold your system, your lender may be liable under Arkansas's ADTPA.",
      },
      {
        q: "Can I cancel my solar contract in Arkansas if my dealer is out of business?",
        a: "Yes. When a dealer closes, liability can shift to the lender under the ADTPA if the lender facilitated the deceptive sale. We've pursued successful cancellations in Arkansas by holding lenders accountable.",
      },
      {
        q: "Does Arkansas have a solar consumer protection law?",
        a: "Arkansas's Deceptive Trade Practices Act broadly prohibits deceptive acts in commerce. Combined with the FTC Cooling-Off Rule, it provides meaningful legal remedies for Little Rock homeowners who were misled about solar savings or incentives.",
      },
    ],
  },

  // ─── IOWA ─────────────────────────────────────────────────────────────────
  {
    slug: "des-moines-ia",
    localHook:
      "Des Moines homeowners were targeted by solar dealers during Iowa's clean energy expansion. Moxie Solar and Encor Solar both operated in the Des Moines metro before closing. Iowa's Consumer Fraud Act and the FTC Cooling-Off Rule provide legal remedies. Iowa's net metering policies have also been under pressure, making original savings projections increasingly inaccurate.",
    topComplaints: [
      "Moxie Solar (closed 2023) sold Des Moines contracts — systems abandoned, payments continue",
      "Encor Solar (closed 2022) left Des Moines homeowners without service or warranty",
      "MidAmerican Energy interconnection delays were never disclosed by dealer",
      "Federal tax credit misrepresented as automatic loan balance reduction",
      "System produces 35% less than projected — Iowa's winter shading not disclosed",
      "GoodLeap loan disbursed before system passed MidAmerican interconnection",
    ],
    stateLawExpanded:
      "Iowa's Consumer Fraud Act prohibits deceptive acts in commerce, including misrepresentation of solar savings, government incentives, and system performance. The FTC Cooling-Off Rule applies to all door-to-door solar sales. Iowa's AG has received solar fraud complaints from the Des Moines area, particularly regarding Moxie Solar and Encor Solar's operations. Iowa's net metering policies have been under legislative pressure, making original savings projections increasingly inaccurate.",
    companyProblems: [
      {
        company: "Moxie Solar (Closed 2023)",
        issue:
          "Moxie Solar was highly active in the Des Moines metro before its 2023 closure. Homeowners report incomplete installations and GoodLeap loans with no recourse.",
      },
      {
        company: "Encor Solar (Closed 2022)",
        issue:
          "Encor Solar closed in 2022, leaving Des Moines customers without warranty coverage or service providers.",
      },
      {
        company: "GoodLeap",
        issue:
          "GoodLeap financed many Des Moines-area installations for defunct dealers. As the lender for dealers that engaged in deceptive practices, GoodLeap may bear liability under Iowa's Consumer Fraud Act.",
      },
    ],
    whyItHappens:
      "Des Moines's rising MidAmerican Energy rates and Iowa's clean energy goals made solar an attractive proposition. Dealers frequently failed to disclose Iowa's significant winter production losses and the uncertainty around Iowa's net metering policies.",
    marketStats: [
      { label: "City Population", value: "215K" },
      { label: "Solar Market", value: "Growing Market" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "What solar companies went out of business in Des Moines?",
        a: "Moxie Solar (closed 2023) and Encor Solar (closed 2022) were both active in the Des Moines area. If either sold your system, your lender (GoodLeap, Mosaic) may be liable under Iowa's Consumer Fraud Act.",
      },
      {
        q: "Iowa's net metering policies changed after I signed — can I cancel?",
        a: "Yes. If your dealer's savings projections were based on net metering rates that have since changed, and the dealer did not disclose that these rates were subject to change, that constitutes misrepresentation under Iowa's Consumer Fraud Act.",
      },
      {
        q: "My Des Moines solar system barely produces anything in winter — is that normal?",
        a: "Iowa's winter production losses are significant and should have been disclosed in your savings projections. If your dealer provided annual averages without disclosing the dramatic seasonal variation, that constitutes misrepresentation.",
      },
    ],
  },

  // ─── INDIANA ──────────────────────────────────────────────────────────────
  {
    slug: "fort-wayne-in",
    localHook:
      "Fort Wayne homeowners were targeted by solar dealers during Indiana's emerging clean energy market. Moxie Solar and Encor Solar both operated in the Fort Wayne area before closing. Indiana's Deceptive Consumer Sales Act provides legal remedies for homeowners who were misled. Indiana's net metering policies have also been significantly reduced, making original savings projections materially inaccurate for many Fort Wayne homeowners.",
    topComplaints: [
      "Moxie Solar (closed 2023) sold Fort Wayne contracts — systems abandoned, payments continue",
      "Encor Solar (closed 2022) left Fort Wayne homeowners without service or warranty",
      "Indiana's net metering rates reduced after signing — savings projections now inaccurate",
      "Federal tax credit misrepresented as automatic loan balance reduction",
      "System produces 40% less than projected — Indiana's winter shading not disclosed",
      "GoodLeap loan disbursed before system passed AEP Indiana interconnection",
    ],
    stateLawExpanded:
      "Indiana's Deceptive Consumer Sales Act (DCSA) prohibits deceptive acts in consumer transactions, including misrepresentation of solar savings, government incentives, and system performance. The FTC Cooling-Off Rule applies to all door-to-door solar sales. Indiana's net metering policies were significantly reduced in 2017 and have continued to erode — making original savings projections increasingly inaccurate for Fort Wayne homeowners.",
    companyProblems: [
      {
        company: "Moxie Solar (Closed 2023)",
        issue:
          "Moxie Solar was active in the Fort Wayne area before its 2023 closure. Homeowners report incomplete installations and GoodLeap loans with no recourse.",
      },
      {
        company: "Encor Solar (Closed 2022)",
        issue:
          "Encor Solar closed in 2022, leaving Fort Wayne customers without warranty coverage or service providers.",
      },
      {
        company: "GoodLeap",
        issue:
          "GoodLeap financed many Fort Wayne-area installations for defunct dealers. As the lender for dealers that engaged in deceptive practices, GoodLeap may bear liable under Indiana's DCSA.",
      },
    ],
    whyItHappens:
      "Fort Wayne's rising AEP Indiana rates and Indiana's clean energy goals attracted solar dealers who frequently failed to disclose Indiana's significantly reduced net metering rates and the state's dramatic winter production losses.",
    marketStats: [
      { label: "City Population", value: "270K" },
      { label: "Solar Market", value: "Emerging Market" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "Indiana's net metering rates changed after I signed — can I cancel?",
        a: "Yes. Indiana's net metering rates have been significantly reduced since many contracts were signed. If your dealer's savings projections were based on higher net metering rates without disclosing they were subject to change, that constitutes misrepresentation under Indiana's DCSA.",
      },
      {
        q: "What solar companies went out of business in Fort Wayne?",
        a: "Moxie Solar (closed 2023) and Encor Solar (closed 2022) were both active in the Fort Wayne area. If either sold your system, your lender may be liable under Indiana's DCSA.",
      },
      {
        q: "My Fort Wayne solar system produces far less than promised in winter — what can I do?",
        a: "Indiana's winter production losses are among the most severe in the Midwest. If your dealer provided annual averages without disclosing the dramatic seasonal variation, that constitutes misrepresentation under Indiana's DCSA.",
      },
    ],
  },

  // ─── KENTUCKY ─────────────────────────────────────────────────────────────
  {
    slug: "lexington-ky",
    localHook:
      "Lexington homeowners were targeted by solar dealers during Kentucky's emerging clean energy market. Moxie Solar operated in the Lexington area before closing in 2023. Kentucky's Consumer Protection Act and the FTC Cooling-Off Rule provide legal remedies. Kentucky's relatively low electricity rates also mean that many solar savings projections were materially inaccurate from the start.",
    topComplaints: [
      "Moxie Solar (closed 2023) sold Lexington contracts — systems abandoned, payments continue",
      "Dealer promised LG&E/KU bill would drop to zero — economics don't support this in Kentucky",
      "Federal tax credit misrepresented as automatic loan balance reduction",
      "System produces 35% less than projected — Kentucky's winter shading not disclosed",
      "GoodLeap loan disbursed before system passed LG&E/KU interconnection",
      "Door-to-door sales team used high-pressure tactics and false urgency",
    ],
    stateLawExpanded:
      "Kentucky's Consumer Protection Act prohibits deceptive acts in commerce, including misrepresentation of solar savings, government incentives, and system performance. The FTC Cooling-Off Rule applies to all door-to-door solar sales. Kentucky's relatively low LG&E/KU rates mean that many solar savings projections were materially inaccurate — dealers who promised dramatic savings without disclosing Kentucky's low-rate environment may have engaged in material misrepresentation.",
    companyProblems: [
      {
        company: "Moxie Solar (Closed 2023)",
        issue:
          "Moxie Solar operated in the Lexington area before its 2023 closure. Homeowners report incomplete installations and GoodLeap loans with no recourse.",
      },
      {
        company: "GoodLeap",
        issue:
          "GoodLeap financed many Lexington-area installations for defunct dealers. As the lender for dealers that engaged in deceptive practices, GoodLeap may bear liability under Kentucky's Consumer Protection Act.",
      },
      {
        company: "Sunrun",
        issue:
          "Sunrun has expanded into the Lexington market. Complaints focus on savings projections that overstated the economics of solar in Kentucky's low-rate environment.",
      },
    ],
    whyItHappens:
      "Lexington's strong sun exposure made it an attractive market on paper, but Kentucky's low LG&E/KU rates mean the payback period for solar is much longer than in high-rate states. Dealers frequently failed to disclose this reality.",
    marketStats: [
      { label: "City Population", value: "322K" },
      { label: "Solar Market", value: "Emerging Market" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "Does solar even make economic sense in Lexington given Kentucky's low electricity rates?",
        a: "For many Lexington homeowners, the economics are challenging. If your dealer promised savings that were based on electricity rates far higher than what LG&E/KU actually charges, that constitutes misrepresentation under Kentucky's Consumer Protection Act.",
      },
      {
        q: "Moxie Solar closed and my Lexington system was never finished — what are my options?",
        a: "If Moxie Solar closed before completing your installation, you have strong grounds to cancel your GoodLeap or Mosaic loan entirely. Kentucky's Consumer Protection Act and TILA both provide remedies when a financed product is never delivered as promised.",
      },
      {
        q: "What is the FTC Cooling-Off Rule and does it apply to my Lexington solar contract?",
        a: "The FTC Cooling-Off Rule gives you 3 business days to cancel any door-to-door solar sale. If the dealer failed to provide the required written cancellation notice at signing, that window may never have legally closed.",
      },
    ],
  },

  // ─── NORTH DAKOTA ─────────────────────────────────────────────────────────
  {
    slug: "fargo-nd",
    localHook:
      "Fargo homeowners were targeted by out-of-state solar dealers during North Dakota's emerging clean energy market. The economics of solar in Fargo are particularly challenging — long winters, significant snow cover, and relatively low Xcel Energy rates mean that many savings projections were wildly optimistic. North Dakota's Consumer Fraud Act and the FTC Cooling-Off Rule provide legal remedies for homeowners who were misled.",
    topComplaints: [
      "System produces 50% less than projected — Fargo's winter snow cover and low sun angles ignored",
      "Dealer used summer production data to project annual savings — completely misleading",
      "Federal tax credit misrepresented as automatic loan balance reduction",
      "GoodLeap loan disbursed before system passed Xcel Energy interconnection",
      "Moxie Solar (closed 2023) sold Fargo contracts — systems abandoned, payments continue",
      "Door-to-door sales team used high-pressure tactics and false urgency",
    ],
    stateLawExpanded:
      "North Dakota's Consumer Fraud Act prohibits deceptive acts in commerce, including misrepresentation of solar savings, government incentives, and system performance. The FTC Cooling-Off Rule applies to all door-to-door solar sales. North Dakota's extreme winter conditions — with snow cover reducing production to near zero for months — make production misrepresentation particularly egregious in Fargo cases.",
    companyProblems: [
      {
        company: "Moxie Solar (Closed 2023)",
        issue:
          "Moxie Solar operated in the Fargo area before its 2023 closure. Homeowners report systems that were installed but never properly commissioned for North Dakota's extreme climate conditions.",
      },
      {
        company: "GoodLeap",
        issue:
          "GoodLeap financed many Fargo-area installations. Complaints include loan disbursement before Xcel Energy interconnection approval and misrepresentation of the federal ITC.",
      },
      {
        company: "Freedom Forever",
        issue:
          "Freedom Forever has expanded into the Fargo market. Complaints focus on savings projections that dramatically overstated production in North Dakota's extreme winter climate.",
      },
    ],
    whyItHappens:
      "Fargo's strong summer sun exposure made it look attractive in dealer sales tools that used peak-month production data. Dealers routinely failed to disclose that North Dakota's winters — with snow cover, low sun angles, and temperatures that affect panel efficiency — would reduce annual production to a fraction of what summer data suggested.",
    marketStats: [
      { label: "City Population", value: "125K" },
      { label: "Solar Market", value: "Emerging Market" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "My Fargo solar system barely produces anything in winter — is that normal?",
        a: "North Dakota's winter production losses are among the most severe in the country. A properly disclosed savings projection would have accounted for months of near-zero production due to snow cover and low sun angles. If your dealer provided annual averages without disclosing this, that constitutes misrepresentation.",
      },
      {
        q: "Does solar make economic sense in Fargo given North Dakota's climate and low rates?",
        a: "For many Fargo homeowners, the economics are very challenging. If your dealer promised savings that were based on summer production data or electricity rates higher than what Xcel Energy actually charges, that constitutes misrepresentation under North Dakota's Consumer Fraud Act.",
      },
      {
        q: "Can I cancel my solar contract in North Dakota if my dealer used false urgency tactics?",
        a: "Yes. High-pressure sales tactics combined with misrepresentation of savings or production are actionable under North Dakota's Consumer Fraud Act. The FTC Cooling-Off Rule also applies to all door-to-door solar sales.",
      },
    ],
  },

  // ─── SOUTH DAKOTA ─────────────────────────────────────────────────────────
  {
    slug: "sioux-falls-sd",
    localHook:
      "Sioux Falls homeowners were targeted by out-of-state solar dealers during South Dakota's emerging clean energy market. The economics of solar in Sioux Falls are challenging — significant winter production losses and relatively low Xcel Energy rates mean that many savings projections were materially inaccurate. South Dakota's Deceptive Trade Practices and Consumer Protection Act and the FTC Cooling-Off Rule provide legal remedies.",
    topComplaints: [
      "System produces 40% less than projected — Sioux Falls winter production losses not disclosed",
      "Dealer used inflated savings projections based on electricity rates higher than Xcel Energy charges",
      "Federal tax credit misrepresented as automatic loan balance reduction",
      "GoodLeap loan disbursed before system passed Xcel Energy interconnection",
      "Moxie Solar (closed 2023) sold Sioux Falls contracts — systems abandoned, payments continue",
      "Door-to-door sales team used high-pressure tactics and false urgency",
    ],
    stateLawExpanded:
      "South Dakota's Deceptive Trade Practices and Consumer Protection Act prohibits deceptive acts in commerce, including misrepresentation of solar savings, government incentives, and system performance. The FTC Cooling-Off Rule applies to all door-to-door solar sales. South Dakota's AG has received solar fraud complaints from the Sioux Falls area.",
    companyProblems: [
      {
        company: "Moxie Solar (Closed 2023)",
        issue:
          "Moxie Solar operated in the Sioux Falls area before its 2023 closure. Homeowners report incomplete installations and GoodLeap loans with no recourse.",
      },
      {
        company: "GoodLeap",
        issue:
          "GoodLeap financed many Sioux Falls-area installations for defunct dealers. As the lender for dealers that engaged in deceptive practices, GoodLeap may bear liability under South Dakota's consumer protection law.",
      },
      {
        company: "Freedom Forever",
        issue:
          "Freedom Forever has expanded into the Sioux Falls market. Complaints focus on savings projections that overstated production in South Dakota's challenging winter climate.",
      },
    ],
    whyItHappens:
      "Sioux Falls's strong summer sun exposure made it look attractive in dealer sales tools. Dealers routinely failed to disclose South Dakota's significant winter production losses and the state's relatively low electricity rates, which make the economics of solar much less favorable than in high-rate states.",
    marketStats: [
      { label: "City Population", value: "192K" },
      { label: "Solar Market", value: "Emerging Market" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "Does solar make economic sense in Sioux Falls given South Dakota's climate and rates?",
        a: "For many Sioux Falls homeowners, the economics are challenging. If your dealer promised savings that were based on electricity rates higher than what Xcel Energy actually charges, or ignored South Dakota's winter production losses, that constitutes misrepresentation.",
      },
      {
        q: "Moxie Solar closed and my Sioux Falls system was never finished — what are my options?",
        a: "If Moxie Solar closed before completing your installation, you have strong grounds to cancel your GoodLeap or Mosaic loan entirely. South Dakota's consumer protection law and TILA both provide remedies when a financed product is never delivered as promised.",
      },
      {
        q: "What is the FTC Cooling-Off Rule and does it apply to my Sioux Falls solar contract?",
        a: "The FTC Cooling-Off Rule gives you 3 business days to cancel any door-to-door solar sale. If the dealer failed to provide the required written cancellation notice at signing, that window may never have legally closed.",
      },
    ],
  },

  // ─── MONTANA ──────────────────────────────────────────────────────────────
  {
    slug: "billings-mt",
    localHook:
      "Billings homeowners were targeted by out-of-state solar dealers during Montana's emerging clean energy market. Montana's extreme winter conditions and relatively low NorthWestern Energy rates make the economics of solar particularly challenging — and the savings projections particularly susceptible to misrepresentation. Montana's Consumer Protection Act and the FTC Cooling-Off Rule provide legal remedies.",
    topComplaints: [
      "System produces 45% less than projected — Montana's winter production losses not disclosed",
      "Dealer used summer production data to project annual savings — completely misleading",
      "Federal tax credit misrepresented as automatic loan balance reduction",
      "GoodLeap loan disbursed before system passed NorthWestern Energy interconnection",
      "Door-to-door sales team used high-pressure tactics and false urgency",
      "Dealer promised NorthWestern Energy bill would drop to zero — economics don't support this",
    ],
    stateLawExpanded:
      "Montana's Consumer Protection Act prohibits deceptive acts in commerce, including misrepresentation of solar savings, government incentives, and system performance. The FTC Cooling-Off Rule applies to all door-to-door solar sales. Montana's extreme winter conditions — with snow cover, low sun angles, and temperatures that affect panel efficiency — make production misrepresentation particularly egregious in Billings cases.",
    companyProblems: [
      {
        company: "GoodLeap",
        issue:
          "GoodLeap financed many Billings-area installations. Complaints include loan disbursement before NorthWestern Energy interconnection approval and misrepresentation of the federal ITC.",
      },
      {
        company: "Freedom Forever",
        issue:
          "Freedom Forever has expanded into the Billings market. Complaints focus on savings projections that dramatically overstated production in Montana's extreme winter climate.",
      },
      {
        company: "Sunrun",
        issue:
          "Sunrun has expanded into the Billings market. Complaints focus on PPA escalator clauses not disclosed at signing and savings projections that did not account for Montana's winter production losses.",
      },
    ],
    whyItHappens:
      "Billings's strong summer sun exposure made it look attractive in dealer sales tools. Dealers routinely failed to disclose that Montana's winters would reduce annual production dramatically, and that NorthWestern Energy's relatively low rates mean the payback period is much longer than in high-rate states.",
    marketStats: [
      { label: "City Population", value: "117K" },
      { label: "Solar Market", value: "Emerging Market" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "My Billings solar system barely produces anything in winter — is that normal?",
        a: "Montana's winter production losses are among the most severe in the country. A properly disclosed savings projection would have accounted for months of reduced production due to snow cover and low sun angles. If your dealer provided annual averages without disclosing this, that constitutes misrepresentation.",
      },
      {
        q: "Does solar make economic sense in Billings given Montana's climate and rates?",
        a: "For many Billings homeowners, the economics are very challenging. If your dealer promised savings that were based on summer production data or electricity rates higher than what NorthWestern Energy actually charges, that constitutes misrepresentation under Montana's Consumer Protection Act.",
      },
      {
        q: "Can I cancel my solar contract in Montana if my dealer used false urgency tactics?",
        a: "Yes. High-pressure sales tactics combined with misrepresentation of savings or production are actionable under Montana's Consumer Protection Act. The FTC Cooling-Off Rule also applies to all door-to-door solar sales.",
      },
    ],
  },

  // ─── WYOMING ──────────────────────────────────────────────────────────────
  {
    slug: "cheyenne-wy",
    localHook:
      "Cheyenne homeowners were targeted by out-of-state solar dealers during Wyoming's emerging clean energy market. Wyoming has no state income tax — meaning the federal Investment Tax Credit provides no benefit to homeowners who don't owe federal income tax, a fact that dealers frequently failed to disclose. Wyoming's Consumer Protection Act and the FTC Cooling-Off Rule provide legal remedies.",
    topComplaints: [
      "Dealer promised federal tax credit would reduce loan balance — it does not",
      "Many Cheyenne homeowners don't owe enough federal tax to use the ITC — never disclosed",
      "System produces 35% less than projected — Wyoming's winter production losses not disclosed",
      "GoodLeap loan disbursed before system passed Rocky Mountain Power interconnection",
      "Moxie Solar (closed 2023) sold Cheyenne contracts — systems abandoned, payments continue",
      "Door-to-door sales team used high-pressure tactics and false urgency",
    ],
    stateLawExpanded:
      "Wyoming's Consumer Protection Act prohibits deceptive acts in commerce, including misrepresentation of solar savings, government incentives, and system performance. The FTC Cooling-Off Rule applies to all door-to-door solar sales. The federal ITC misrepresentation is particularly egregious in Wyoming — many homeowners have low enough federal tax liability that they cannot fully use the credit, a fact that dealers routinely failed to disclose.",
    companyProblems: [
      {
        company: "Moxie Solar (Closed 2023)",
        issue:
          "Moxie Solar operated in the Cheyenne area before its 2023 closure. Homeowners report incomplete installations and GoodLeap loans with no recourse.",
      },
      {
        company: "GoodLeap",
        issue:
          "GoodLeap financed many Cheyenne-area installations. Complaints include loan disbursement before Rocky Mountain Power interconnection approval and misrepresentation of the federal ITC.",
      },
      {
        company: "Freedom Forever",
        issue:
          "Freedom Forever has expanded into the Cheyenne market. Complaints focus on savings projections that overstated production and misrepresentation of the federal ITC.",
      },
    ],
    whyItHappens:
      "Cheyenne's strong sun exposure made it look attractive in dealer sales tools. Dealers routinely misrepresented the federal ITC — a particularly harmful practice in Wyoming where many homeowners have low federal tax liability and cannot fully use the credit.",
    marketStats: [
      { label: "City Population", value: "65K" },
      { label: "Solar Market", value: "Emerging Market" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "My dealer said the federal tax credit would pay down my loan — is that true?",
        a: "No. This is one of the most common misrepresentations in Wyoming. The federal ITC reduces your income tax liability — it does not automatically reduce your loan balance. If you don't owe enough federal income tax to use the full credit, you lose that benefit. If your dealer told you otherwise, that is actionable under Wyoming's Consumer Protection Act.",
      },
      {
        q: "Moxie Solar closed and my Cheyenne system was never finished — what are my options?",
        a: "If Moxie Solar closed before completing your installation, you have strong grounds to cancel your GoodLeap or Mosaic loan entirely. Wyoming's Consumer Protection Act and TILA both provide remedies when a financed product is never delivered as promised.",
      },
      {
        q: "What is the FTC Cooling-Off Rule and does it apply to my Cheyenne solar contract?",
        a: "The FTC Cooling-Off Rule gives you 3 business days to cancel any door-to-door solar sale. If the dealer failed to provide the required written cancellation notice at signing, that window may never have legally closed.",
      },
    ],
  },

  // ─── ALASKA ───────────────────────────────────────────────────────────────
  {
    slug: "anchorage-ak",
    localHook:
      "Anchorage homeowners were sold solar during a period of aggressive expansion into Alaska's market — despite the state's extreme seasonal variation in sunlight making solar economics extraordinarily challenging. Dealers used summer production data to generate savings projections that bore no relationship to annual output. Alaska's Unfair Trade Practices and Consumer Protection Act provides legal remedies for homeowners who were misled.",
    topComplaints: [
      "System produces 60% less than projected — Alaska's winter darkness completely ignored",
      "Dealer used peak summer production data to project annual savings — fraudulent",
      "Federal tax credit misrepresented as automatic loan balance reduction",
      "GoodLeap loan disbursed before system passed Chugach Electric interconnection",
      "Dealer promised Chugach Electric bill would drop to zero — impossible in Alaska winters",
      "Door-to-door sales team used high-pressure tactics and false urgency",
    ],
    stateLawExpanded:
      "Alaska's Unfair Trade Practices and Consumer Protection Act prohibits deceptive acts in commerce, including misrepresentation of solar savings, government incentives, and system performance. The FTC Cooling-Off Rule applies to all door-to-door solar sales. Alaska's extreme seasonal variation — with near-total darkness in winter — makes production misrepresentation particularly egregious in Anchorage cases. Any dealer who used annual averages without disclosing Alaska's winter production reality engaged in material misrepresentation.",
    companyProblems: [
      {
        company: "GoodLeap",
        issue:
          "GoodLeap financed many Anchorage-area installations. Complaints include loan disbursement before Chugach Electric interconnection approval and misrepresentation of the federal ITC.",
      },
      {
        company: "Freedom Forever",
        issue:
          "Freedom Forever expanded into the Anchorage market. Complaints focus on savings projections that dramatically overstated annual production in Alaska's extreme seasonal climate.",
      },
      {
        company: "Sunrun",
        issue:
          "Sunrun expanded into Alaska. Complaints focus on PPA escalator clauses not disclosed at signing and savings projections that did not account for Alaska's winter production reality.",
      },
    ],
    whyItHappens:
      "Anchorage's strong summer sun exposure — with nearly 24 hours of daylight in June — made it look attractive in dealer sales tools that used peak-month production data. Dealers routinely failed to disclose that Alaska's winters, with near-total darkness, would reduce annual production to a fraction of what summer data suggested.",
    marketStats: [
      { label: "City Population", value: "291K" },
      { label: "Solar Market", value: "Emerging Market" },
      { label: "Avg. Resolution", value: "30–90 Days" },
      { label: "Case Review", value: "FREE" },
    ],
    localFaq: [
      {
        q: "My Anchorage solar system produces almost nothing in winter — is that normal?",
        a: "Alaska's winter production losses are the most extreme in the country. A properly disclosed savings projection would have accounted for months of near-zero production due to Alaska's winter darkness. If your dealer provided annual averages without disclosing this, that constitutes material misrepresentation under Alaska's consumer protection law.",
      },
      {
        q: "Does solar make economic sense in Anchorage given Alaska's extreme seasonal variation?",
        a: "For most Anchorage homeowners, the economics are very challenging. If your dealer promised savings that were based on summer production data without disclosing Alaska's winter reality, that constitutes misrepresentation under Alaska's Unfair Trade Practices Act.",
      },
      {
        q: "Can I cancel my solar contract in Alaska if my dealer used false urgency tactics?",
        a: "Yes. High-pressure sales tactics combined with misrepresentation of savings or production are actionable under Alaska's Unfair Trade Practices and Consumer Protection Act. The FTC Cooling-Off Rule also applies to all door-to-door solar sales.",
      },
    ],
  },
];

// Export lookup function
export function getCityDepthBatchE(slug: string): CityDepthData | undefined {
  return CITY_DEPTH_BATCH_E.find((c) => c.slug === slug);
}
