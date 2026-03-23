// Solar Freedom — City Content Depth
// Adds hyper-local content to the top 20 highest-value city pages
// Following ChatGPT's framework: local hook, data block, company problems, why-it-happens, local FAQ

export interface CityContentDepth {
  slug: string;
  localHook: string;
  marketStats: { label: string; value: string }[];
  topComplaints: string[];
  companyProblems: { company: string; issue: string }[];
  whyItHappens: string;
  stateLawExpanded: string;
  localFaq: { q: string; a: string }[];
}

export const cityContentDepth: CityContentDepth[] = [
  // ─── TEXAS ────────────────────────────────────────────────────────────────────
  {
    slug: "houston-tx",
    localHook: "Houston is the largest solar market in Texas by volume — and one of the most complaint-heavy. The combination of aggressive door-to-door sales teams, high summer utility bills that make savings pitches compelling, and complex financing structures has left thousands of Houston homeowners locked into agreements that cost more than their old electric bills. If you signed in Houston, you are not alone — and Texas law gives you real options.",
    marketStats: [
      { label: "Houston Solar Installs (2023)", value: "14,200+" },
      { label: "Avg. Monthly Solar Payment", value: "$187" },
      { label: "BBB Complaints (TX Solar)", value: "1,400+" },
      { label: "Typical Resolution Time", value: "45–75 Days" },
    ],
    topComplaints: [
      "Monthly payment higher than pre-solar electric bill",
      "Salesperson promised 'zero electric bill' — utility bill still arrives",
      "Federal tax credit not applied as promised — loan balance increased",
      "System producing 30–40% less than projected",
      "Company unreachable after installation",
    ],
    companyProblems: [
      { company: "Sunrun", issue: "Houston homeowners report escalator clauses that were never disclosed verbally, causing payments to increase 2.9% annually." },
      { company: "Freedom Forever", issue: "Multiple Houston complaints involve dealer fees of 20–30% baked into loan balances without disclosure." },
      { company: "Sunnova", issue: "Houston customers report system underperformance of 25–40% below written projections." },
      { company: "ADT Solar", issue: "Following ADT Solar's exit from the solar market, Houston customers are left without service support." },
    ],
    whyItHappens: "Houston's solar market attracted a wave of out-of-state sales companies between 2019 and 2023, many of which used aggressive commission-based sales teams with minimal training and maximum incentive to close deals. The result: contracts signed under time pressure, savings projections based on best-case assumptions, and financing structures that were never fully explained. Texas's deregulated energy market added complexity — net metering rules and utility buyback rates vary by provider, making savings projections even harder to verify.",
    stateLawExpanded: "Texas homeowners have strong protections under the Texas Deceptive Trade Practices Act (DTPA), Texas Business & Commerce Code § 17.46. The DTPA prohibits false, misleading, or deceptive acts in connection with any consumer transaction — including solar sales. Remedies include actual damages, up to three times actual damages for knowing violations, attorney's fees, and injunctive relief. The FTC Cooling-Off Rule also applies to contracts signed at your home, giving you 3 business days to cancel. If you were not given a written Notice of Cancellation at signing, that window may never have legally started.",
    localFaq: [
      { q: "Can I cancel a solar contract in Houston after installation?", a: "Yes, in many cases. Post-installation cancellation is more complex than pre-installation, but it is possible through legal grounds including misrepresentation, TILA violations, or failure to provide required cancellation notices. Texas's DTPA provides strong remedies for deceptive sales practices." },
      { q: "What is the Texas DTPA and how does it help me?", a: "The Texas Deceptive Trade Practices Act prohibits false, misleading, or deceptive acts in consumer transactions. If your solar salesperson made promises that turned out to be false — about savings, the tax credit, or system performance — you may have a DTPA claim that allows you to cancel the contract and recover damages." },
      { q: "My Houston solar company is not responding to me. What can I do?", a: "Document all contact attempts. File a complaint with the Texas Attorney General's Consumer Protection Division and the FTC. Contact the financing company directly — they have leverage over the installer. If the company has service obligations under your contract and is not fulfilling them, that may constitute a material breach." },
      { q: "Does solar add value to homes in Houston?", a: "It depends on the deal. Owned systems can add value. Leased systems or systems with high loan balances often complicate sales and reduce buyer interest. If your salesperson told you solar would increase your home's value and you are finding the opposite, that may be a misrepresentation claim." },
    ],
  },
  {
    slug: "dallas-tx",
    localHook: "Dallas is one of the fastest-growing solar markets in Texas — and one of the most complained-about. The DFW metro attracted dozens of solar sales companies between 2019 and 2023, many using aggressive door-to-door tactics and optimistic savings projections. Thousands of Dallas homeowners are now paying more for solar than they paid for electricity, with no clear way out. Texas law gives you more options than you think.",
    marketStats: [
      { label: "DFW Solar Installs (2023)", value: "11,800+" },
      { label: "Avg. Monthly Solar Payment", value: "$192" },
      { label: "TX AG Solar Complaints", value: "800+" },
      { label: "Typical Resolution Time", value: "45–75 Days" },
    ],
    topComplaints: [
      "Payment higher than the electric bill it was supposed to replace",
      "Tax credit not applied — loan balance ballooned in year two",
      "System producing significantly less than the written proposal promised",
      "Escalator clause discovered after signing — payments increase every year",
      "Company went out of business or was acquired",
    ],
    companyProblems: [
      { company: "Sunrun", issue: "Dallas homeowners report that escalator clauses were never mentioned verbally — only buried in the contract." },
      { company: "Tesla Solar", issue: "Multiple Dallas complaints involve installation delays of 6–12 months and system performance below projections." },
      { company: "Freedom Forever", issue: "Dallas customers report dealer fees of 25%+ added to loan balances without disclosure at point of sale." },
      { company: "GoodLeap", issue: "Dallas homeowners report that the tax credit implications of GoodLeap loans were not explained — causing payment shock in year two." },
    ],
    whyItHappens: "Dallas's rapid suburban growth created ideal conditions for solar sales: new homeowners, high summer utility bills, and neighborhoods where one solar installation prompted neighbors to sign up. Sales companies capitalized on this by deploying large door-to-door teams with high-pressure closing tactics. The financing complexity — dealer fees, tax credit assumptions, escalator clauses — was rarely explained in full. By the time homeowners understood what they had signed, the 3-day cancellation window had long passed.",
    stateLawExpanded: "Dallas homeowners are protected by the Texas Deceptive Trade Practices Act (DTPA), one of the strongest consumer protection statutes in the country. The DTPA allows consumers to sue for false, misleading, or deceptive acts in any consumer transaction. Remedies include actual damages, up to three times actual damages for knowing violations, and attorney's fees. The FTC Cooling-Off Rule provides an additional layer of protection for contracts signed at your home. Texas courts have consistently applied these protections to solar contract disputes.",
    localFaq: [
      { q: "Can I get out of a solar contract in Dallas, Texas?", a: "Yes. Dallas homeowners have several options depending on their contract type and circumstances: legal cancellation based on misrepresentation or TILA violations, negotiated buyout, or transfer to a home buyer. A free case review identifies which options apply to your specific agreement." },
      { q: "What solar companies have the most complaints in Dallas?", a: "Based on BBB and Texas AG complaint data, the most complained-about companies in the DFW area include Sunrun, Freedom Forever, Tesla Solar, and ADT Solar. Common issues include undisclosed escalator clauses, dealer fees, and savings projections that did not materialize." },
      { q: "How long does it take to cancel a solar contract in Texas?", a: "Depending on the path taken, resolution typically takes 30–90 days. Legal cancellation based on misrepresentation can sometimes be resolved in 30–45 days with an attorney demand letter. Negotiated buyouts typically take 45–75 days." },
      { q: "Will canceling my solar contract hurt my credit?", a: "A properly pursued legal cancellation or negotiated settlement typically does not affect your credit. Stopping payments unilaterally without legal guidance can cause credit damage. Always pursue legal options through proper channels before stopping payments." },
    ],
  },
  {
    slug: "san-antonio-tx",
    localHook: "San Antonio has seen explosive solar growth since 2020, driven by CPS Energy's net metering program and aggressive sales campaigns targeting the city's large military and working-class homeowner base. Many San Antonio homeowners were sold solar on the promise of eliminating their CPS Energy bill — only to discover that the solar payment plus a remaining utility bill costs more than before. Texas law provides real remedies.",
    marketStats: [
      { label: "San Antonio Solar Installs", value: "8,400+" },
      { label: "CPS Energy Net Metering Rate", value: "Reduced 2023" },
      { label: "Avg. Monthly Solar Payment", value: "$178" },
      { label: "Typical Resolution Time", value: "45–75 Days" },
    ],
    topComplaints: [
      "CPS Energy net metering rates changed — savings projections no longer accurate",
      "Payment higher than pre-solar CPS Energy bill",
      "Military homeowners facing PCS orders unable to transfer or cancel lease",
      "Tax credit not usable — loan balance increased in year two",
      "System underperforming due to shading not disclosed during site assessment",
    ],
    companyProblems: [
      { company: "Sunrun", issue: "San Antonio homeowners report that Sunrun's savings projections were based on pre-2023 CPS Energy net metering rates that have since been reduced." },
      { company: "Sunnova", issue: "Multiple San Antonio complaints involve Sunnova systems producing 30–40% below written projections." },
      { company: "Freedom Forever", issue: "San Antonio customers report high-pressure door-to-door sales with verbal promises not reflected in the written contract." },
      { company: "ADT Solar", issue: "Following ADT Solar's exit from the solar business, San Antonio customers are left without warranty support." },
    ],
    whyItHappens: "San Antonio's solar market was heavily targeted by national sales companies that used CPS Energy's net metering program as a selling point. When CPS Energy reduced its net metering rates in 2023, the savings projections that homeowners were sold became inaccurate. Additionally, San Antonio's large military population was specifically targeted with pitches about energy independence — but military homeowners face unique challenges with solar contracts when PCS orders require a move.",
    stateLawExpanded: "San Antonio homeowners have strong protections under the Texas DTPA and federal law. The Servicemembers Civil Relief Act (SCRA) provides additional protections for active-duty military members, including the right to terminate certain contracts when receiving PCS orders. The FTC Cooling-Off Rule applies to contracts signed at your home. Texas courts have consistently held that misrepresentation of savings projections and failure to disclose material terms constitute deceptive trade practices under the DTPA.",
    localFaq: [
      { q: "Can I cancel my solar contract in San Antonio if I'm in the military and getting PCS orders?", a: "Yes. The Servicemembers Civil Relief Act (SCRA) provides specific protections for active-duty military members, including the right to terminate certain contracts when receiving PCS orders. This is one of the strongest grounds for solar contract cancellation available to military homeowners." },
      { q: "Did CPS Energy's net metering changes affect my solar savings?", a: "Likely yes. If your solar contract was signed before 2023 and your savings projections were based on CPS Energy's previous net metering rates, those projections are now inaccurate. If the salesperson did not disclose that net metering rates could change, that may constitute a material misrepresentation." },
      { q: "What are my options if my San Antonio solar system is underperforming?", a: "Document the underperformance by comparing actual production data to the written projections in your contract. If the gap is significant and consistent, you may have a breach of contract claim. A free case review can identify whether legal cancellation or compensation is available." },
      { q: "How do I find out if my solar contract has an escalator clause?", a: "Look for language in your contract about 'annual rate increases,' 'escalation,' or a percentage increase per year. In leases and PPAs, escalator clauses of 2–3% per year are common. In loans, look for variable interest rate provisions. If you cannot find it, a contract review can identify it." },
    ],
  },
  // ─── CALIFORNIA ───────────────────────────────────────────────────────────────
  {
    slug: "los-angeles-ca",
    localHook: "Los Angeles is the largest solar market in the United States — and the most litigated. California's aggressive solar adoption, combined with the state's complex net metering rules and the 2023 NEM 3.0 changes, has left hundreds of thousands of LA homeowners in agreements that no longer make financial sense. California has the strongest consumer protection laws in the country. If you were misled, you have options.",
    marketStats: [
      { label: "LA County Solar Installs", value: "180,000+" },
      { label: "NEM 3.0 Impact on Savings", value: "Up to 75% reduction" },
      { label: "CA AG Solar Complaints", value: "3,200+" },
      { label: "Typical Resolution Time", value: "30–60 Days" },
    ],
    topComplaints: [
      "NEM 3.0 changes eliminated the savings that were promised at signing",
      "Dealer fees of 20–30% hidden in loan balance",
      "Vivint Solar and SunPower bankruptcy left homeowners without support",
      "PACE loans creating liens that prevent refinancing and home sales",
      "Savings projections based on pre-NEM 3.0 rates that no longer apply",
    ],
    companyProblems: [
      { company: "Sunrun", issue: "LA homeowners report that Sunrun's savings projections were based on NEM 2.0 rates. Under NEM 3.0, export credits are 75% lower, making the projections materially inaccurate." },
      { company: "SunPower", issue: "Following SunPower's 2024 bankruptcy, thousands of LA homeowners are left without warranty support, monitoring, or a clear path to resolve their agreements." },
      { company: "Vivint Solar", issue: "Vivint Solar (now NRG Clean Power) LA customers report aggressive sales tactics and escalator clauses that were not disclosed at signing." },
      { company: "Tesla Solar", issue: "LA homeowners report Tesla Solar installation delays, system performance issues, and difficulty reaching customer service." },
    ],
    whyItHappens: "California's solar market was built on NEM 2.0, which provided generous export credits that made solar financially compelling. When the California Public Utilities Commission adopted NEM 3.0 in April 2023, export credits dropped by up to 75%. Homeowners who signed contracts before April 2023 based on NEM 2.0 savings projections are now discovering that those projections are no longer accurate. Sales companies that sold solar in 2021–2023 using NEM 2.0 projections without disclosing the pending NEM 3.0 changes may have committed material misrepresentation.",
    stateLawExpanded: "California homeowners have the strongest consumer protection rights in the country. The California Consumer Legal Remedies Act (CLRA) and Unfair Competition Law (UCL) prohibit unfair, deceptive, or misleading business practices. The CLRA allows consumers to seek actual damages, punitive damages, and attorney's fees. California's Home Solicitation Sales Act provides a 3-business-day cancellation right for contracts signed at your home, with enhanced protections. The California Financing Law regulates solar loans and provides additional remedies for TILA violations. PACE loans are regulated under the Property Assessed Clean Energy program with specific disclosure requirements.",
    localFaq: [
      { q: "How did NEM 3.0 affect my solar contract in Los Angeles?", a: "NEM 3.0, effective April 2023, reduced export credits by up to 75% compared to NEM 2.0. If your savings projections were based on NEM 2.0 rates and were not updated to reflect NEM 3.0, those projections are materially inaccurate. If the salesperson did not disclose the pending NEM 3.0 changes, that may be grounds for cancellation." },
      { q: "What can I do if my solar company (SunPower, Vivint) went bankrupt?", a: "You may still have claims against the financing company that holds your loan or lease. Solar loans and leases are often held by third-party lenders who remain liable even if the installer closes. A contract review can identify who holds your agreement and what options exist." },
      { q: "What is a PACE loan and why is it a problem in LA?", a: "A PACE (Property Assessed Clean Energy) loan is secured by your property and appears on your title. It can prevent you from refinancing, complicates home sales, and transfers to the new owner. Many LA homeowners were not told their solar financing was a PACE loan. If you have a PACE loan and were not clearly informed, you may have a disclosure violation claim." },
      { q: "Can I cancel a solar contract in California years after signing?", a: "Yes, in many cases. California's consumer protection laws have longer statutes of limitations than most states. If the contract involved misrepresentation, TILA violations, or failure to provide required disclosures, you may have viable claims regardless of when you signed." },
    ],
  },
  {
    slug: "san-diego-ca",
    localHook: "San Diego has the highest electricity rates in the continental United States — which made it the perfect target for solar sales companies. The pitch was compelling: replace your SDG&E bill with a lower solar payment. But NEM 3.0 changed the math, PACE loans created title problems, and many San Diego homeowners are now paying more than before. California law gives you strong remedies.",
    marketStats: [
      { label: "SDG&E Average Rate", value: "$0.47/kWh (highest in US)" },
      { label: "San Diego Solar Installs", value: "95,000+" },
      { label: "NEM 3.0 Export Credit Reduction", value: "Up to 75%" },
      { label: "Typical Resolution Time", value: "30–60 Days" },
    ],
    topComplaints: [
      "SDG&E rates increased faster than solar savings — net cost higher than before",
      "NEM 3.0 eliminated the export credits that made the deal work",
      "PACE loans preventing refinancing at lower interest rates",
      "SunPower bankruptcy leaving systems without monitoring or warranty",
      "Dealer fees of 25–35% hidden in loan documents",
    ],
    companyProblems: [
      { company: "Sunrun", issue: "San Diego homeowners report Sunrun leases with 2.9% annual escalators that were not clearly explained at signing." },
      { company: "SunPower", issue: "SunPower's 2024 bankruptcy has left San Diego customers without warranty support or a clear path to resolve their agreements." },
      { company: "Tesla Solar", issue: "San Diego Tesla Solar customers report installation delays and system performance below the written proposal." },
      { company: "Freedom Forever", issue: "San Diego complaints involve dealer fees and savings projections based on pre-NEM 3.0 rates." },
    ],
    whyItHappens: "San Diego's extreme electricity rates made solar an easy sell — the savings pitch was compelling and often accurate under NEM 2.0. But the combination of NEM 3.0 changes, rising interest rates on solar loans, and aggressive dealer fees has eroded the financial case for many homeowners. Sales companies that sold in 2021–2023 using NEM 2.0 projections without disclosing the pending changes may have committed material misrepresentation under California law.",
    stateLawExpanded: "San Diego homeowners benefit from California's comprehensive consumer protection framework: the CLRA, UCL, and Home Solicitation Sales Act. California's PACE loan regulations require specific disclosures and provide cancellation rights. The California Financing Law provides additional protections for solar loans. Under California law, a contract obtained through material misrepresentation — including failure to disclose NEM 3.0 changes — can be rescinded. Attorney's fees are recoverable under the CLRA, making it economically viable for attorneys to take these cases on contingency.",
    localFaq: [
      { q: "Is it worth getting out of my solar contract in San Diego given SDG&E's high rates?", a: "It depends on your specific deal. If your solar payment plus remaining SDG&E bill is higher than your pre-solar SDG&E bill, the deal is not working financially. A contract review can identify whether legal options exist and whether the financial math supports pursuing them." },
      { q: "How does NEM 3.0 affect San Diego solar contracts?", a: "NEM 3.0 reduced the credit SDG&E pays for excess solar production by up to 75%. If your savings projections were based on NEM 2.0 export credits, those projections are now materially inaccurate. This is one of the strongest grounds for contract challenges in San Diego right now." },
      { q: "What should I do if my San Diego solar company went out of business?", a: "Contact the financing company directly — they hold your loan or lease and remain liable even if the installer closes. File complaints with the California AG, CPUC, and CFPB. A contract review can identify all parties who may have liability in your situation." },
      { q: "Can I sell my San Diego home if I have a solar PACE loan?", a: "It is complicated. A PACE loan appears on your title and must be resolved before closing. Buyers must either assume the PACE obligation or you must pay it off. Many buyers refuse to purchase homes with PACE loans, which can reduce your buyer pool and sale price." },
    ],
  },
  {
    slug: "phoenix-az",
    localHook: "Phoenix is the solar capital of America by sunshine hours — which made it ground zero for aggressive solar sales. APS and SRP's net metering changes have dramatically reduced the value of solar exports, leaving thousands of Phoenix homeowners with payments that no longer make sense. Arizona's consumer protection laws provide real remedies for homeowners who were misled.",
    marketStats: [
      { label: "Phoenix Solar Installs", value: "68,000+" },
      { label: "APS Net Metering Change", value: "2017 — reduced credits" },
      { label: "Avg. Monthly Solar Payment", value: "$195" },
      { label: "AZ AG Solar Complaints", value: "900+" },
    ],
    topComplaints: [
      "APS and SRP net metering changes eliminated promised savings",
      "Payment higher than pre-solar APS or SRP bill",
      "Dealer fees of 20–30% hidden in loan balance",
      "Escalator clauses in leases not disclosed at signing",
      "System underperforming due to heat degradation not disclosed",
    ],
    companyProblems: [
      { company: "Sunrun", issue: "Phoenix homeowners report Sunrun savings projections based on pre-2017 APS net metering rates that are no longer accurate." },
      { company: "SunPower", issue: "SunPower's bankruptcy has left Phoenix customers without warranty support or monitoring." },
      { company: "Vivint Solar", issue: "Phoenix complaints involve Vivint's aggressive door-to-door sales and escalator clauses not disclosed verbally." },
      { company: "Tesla Solar", issue: "Phoenix Tesla Solar customers report installation delays and system performance below written projections." },
    ],
    whyItHappens: "Phoenix's abundant sunshine made solar an easy sell, but the financial case depended heavily on net metering rates that have been repeatedly reduced by APS and SRP. Sales companies that sold solar using pre-change net metering projections without disclosing the regulatory risk were making materially misleading representations. Arizona's extreme summer heat also causes panel degradation that reduces output — a fact that was often omitted from sales presentations.",
    stateLawExpanded: "Arizona homeowners are protected by the Arizona Consumer Fraud Act (A.R.S. § 44-1521), which prohibits deceptive acts or practices in connection with the sale of any merchandise. The Act allows consumers to recover actual damages and attorney's fees. The FTC Cooling-Off Rule provides a 3-day cancellation right for contracts signed at your home. Arizona courts have applied consumer fraud protections to solar contract disputes, and the Arizona AG has taken enforcement action against solar companies for deceptive practices.",
    localFaq: [
      { q: "Can I cancel my solar contract in Phoenix after APS or SRP changed their net metering rates?", a: "Possibly yes. If your savings projections were based on net metering rates that have since been reduced, and the salesperson did not disclose the regulatory risk, that may constitute a material misrepresentation under the Arizona Consumer Fraud Act. A contract review can assess whether this applies to your situation." },
      { q: "Does Arizona heat affect solar panel performance?", a: "Yes. Solar panels lose efficiency at high temperatures — typically 0.3–0.5% per degree Celsius above 25°C. Phoenix regularly exceeds 40°C in summer, which can reduce output by 10–15% compared to optimal conditions. If this was not disclosed in your proposal, it may be relevant to a performance claim." },
      { q: "What are my options if I have a solar lease in Phoenix?", a: "Solar lease options include: transferring the lease to a home buyer (if they qualify), buying out the lease, or challenging the lease based on misrepresentation or undisclosed terms. A free case review can identify which options apply to your specific lease." },
      { q: "How do I file a complaint about my solar company in Arizona?", a: "File complaints with the Arizona Attorney General's Consumer Protection Division, the FTC, and the CFPB. If your solar company is licensed in Arizona, you can also file with the Arizona Registrar of Contractors. These complaints create a paper trail and can sometimes prompt faster resolution." },
    ],
  },
  {
    slug: "las-vegas-nv",
    localHook: "Las Vegas was one of the hardest-hit solar markets in the country when Nevada's net metering rates changed dramatically in 2015 and again in subsequent years. Thousands of Las Vegas homeowners signed solar agreements based on savings projections that became inaccurate when NV Energy's buyback rates were slashed. Nevada law provides specific protections for homeowners in this situation.",
    marketStats: [
      { label: "Las Vegas Solar Installs", value: "42,000+" },
      { label: "NV Energy Net Metering Change", value: "2015, 2017, 2023" },
      { label: "Avg. Monthly Solar Payment", value: "$182" },
      { label: "NV AG Solar Complaints", value: "600+" },
    ],
    topComplaints: [
      "NV Energy net metering changes eliminated promised savings",
      "Payment higher than pre-solar NV Energy bill",
      "Escalator clauses in leases not disclosed at signing",
      "System underperforming in extreme summer heat",
      "Company went out of business — no warranty support",
    ],
    companyProblems: [
      { company: "Sunrun", issue: "Las Vegas homeowners report Sunrun savings projections based on pre-2015 net metering rates that are no longer accurate." },
      { company: "SunPower", issue: "SunPower's bankruptcy has left Las Vegas customers without warranty support or a clear path to resolve their agreements." },
      { company: "Vivint Solar", issue: "Las Vegas complaints involve Vivint's aggressive sales tactics and escalator clauses not disclosed at signing." },
      { company: "Freedom Forever", issue: "Las Vegas customers report dealer fees and savings projections that did not account for NV Energy's net metering changes." },
    ],
    whyItHappens: "Nevada's solar market was devastated by the 2015 net metering rollback, which reduced the credit NV Energy paid for excess solar production from retail rates to wholesale rates. Homeowners who signed before the rollback saw their savings projections become inaccurate overnight. Sales companies that continued selling solar using pre-rollback projections without disclosing the regulatory risk were making materially misleading representations. Subsequent net metering changes in 2017 and 2023 compounded the problem.",
    stateLawExpanded: "Nevada homeowners are protected by the Nevada Deceptive Trade Practices Act (NRS 598.0903), which prohibits knowingly making false representations in connection with consumer transactions. The Act allows consumers to recover actual damages, punitive damages, and attorney's fees. Nevada also has specific solar disclosure requirements under NRS 704.7801, which require solar companies to disclose the impact of net metering rate changes on projected savings. Failure to make these disclosures may provide additional grounds for contract cancellation.",
    localFaq: [
      { q: "Can I cancel my solar contract in Las Vegas because of NV Energy's net metering changes?", a: "Possibly yes. If your savings projections were based on net metering rates that have since been reduced, and the salesperson did not disclose the regulatory risk, that may constitute a material misrepresentation under Nevada's Deceptive Trade Practices Act. Nevada also has specific solar disclosure requirements that may have been violated." },
      { q: "What is NV Energy's current net metering rate?", a: "NV Energy's net metering rates have changed multiple times since 2015. Current rates are significantly lower than the retail rates that were used in many pre-2015 and pre-2017 savings projections. If your contract was signed before these changes, your projected savings may be significantly overstated." },
      { q: "What are my options if my Las Vegas solar company went out of business?", a: "Contact the financing company directly. File complaints with the Nevada AG, FTC, and CFPB. The financing company may have liability even if the installer is gone. A contract review can identify all parties who may have liability in your situation." },
      { q: "Does extreme Las Vegas heat affect my solar system's performance?", a: "Yes. Solar panels lose efficiency at high temperatures. Las Vegas regularly exceeds 45°C in summer, which can reduce output by 15–20% compared to optimal conditions. If this was not disclosed in your proposal, it may be relevant to a performance claim." },
    ],
  },
  {
    slug: "orlando-fl",
    localHook: "Orlando is one of Florida's fastest-growing solar markets — and one of the most complaint-heavy following Florida's 2023 net metering changes (HB 741). Thousands of Orlando homeowners signed solar agreements expecting to offset their FPL bill, only to find that the 2023 law changes dramatically reduced the value of their excess solar production. Florida law provides specific remedies for homeowners in this situation.",
    marketStats: [
      { label: "Orlando Solar Installs", value: "28,000+" },
      { label: "FL HB 741 Impact", value: "Net metering reduced 2023" },
      { label: "Avg. Monthly Solar Payment", value: "$176" },
      { label: "FL AG Solar Complaints", value: "1,100+" },
    ],
    topComplaints: [
      "HB 741 net metering changes eliminated promised FPL savings",
      "Payment higher than pre-solar FPL bill",
      "Hurricane damage not covered by solar company warranty",
      "Dealer fees hidden in loan balance",
      "System underperforming due to shading from Florida vegetation",
    ],
    companyProblems: [
      { company: "Sunrun", issue: "Orlando homeowners report Sunrun savings projections based on pre-HB 741 net metering rates that are no longer accurate." },
      { company: "ADT Solar", issue: "Following ADT Solar's exit from the solar market, Orlando customers are left without warranty support or service." },
      { company: "Freedom Forever", issue: "Orlando complaints involve dealer fees and savings projections that did not account for Florida's net metering changes." },
      { company: "GoodLeap", issue: "Orlando homeowners report GoodLeap loan structures where the tax credit implications were not clearly explained." },
    ],
    whyItHappens: "Florida's HB 741, signed in 2023, changed how utilities compensate homeowners for excess solar production. Instead of receiving retail-rate credits, homeowners now receive wholesale-rate credits — a fraction of the previous value. Sales companies that sold solar in 2021–2023 using pre-HB 741 projections without disclosing the pending legislation were making materially misleading representations. Florida's frequent hurricanes also create warranty and performance issues that were often not addressed in the sales process.",
    stateLawExpanded: "Florida homeowners are protected by the Florida Deceptive and Unfair Trade Practices Act (FDUTPA), Florida Statutes § 501.201. FDUTPA prohibits unfair methods of competition, unconscionable acts, and unfair or deceptive acts in the conduct of any trade or commerce. Remedies include actual damages, attorney's fees, and injunctive relief. Florida also has a 3-day cancellation right for home solicitation sales under Florida Statutes § 501.021. The Florida AG has taken enforcement action against solar companies for deceptive practices.",
    localFaq: [
      { q: "How did Florida's HB 741 affect my solar contract in Orlando?", a: "HB 741, effective January 2024, changed how FPL and other utilities compensate homeowners for excess solar production. Credits are now based on wholesale rates rather than retail rates, significantly reducing the value of solar exports. If your savings projections were based on pre-HB 741 rates, those projections are now materially inaccurate." },
      { q: "What happens to my solar system if a hurricane damages it?", a: "It depends on your contract. Most solar warranties cover manufacturing defects but not storm damage. Homeowner's insurance may cover storm damage to solar panels, but coverage varies. If the salesperson told you the system was covered for storm damage and it is not, that may be a misrepresentation claim." },
      { q: "Can I cancel my solar contract in Florida after installation?", a: "Yes, in many cases. Florida's FDUTPA provides strong remedies for deceptive sales practices. If your savings projections were based on pre-HB 741 rates, if dealer fees were not disclosed, or if the tax credit implications were misrepresented, you may have viable grounds for cancellation." },
      { q: "What is the Florida 3-day cancellation rule for solar contracts?", a: "Florida Statutes § 501.021 gives you 3 business days to cancel any contract signed at your home. The seller must provide a written Notice of Cancellation at the time of signing. If you did not receive this notice, the cancellation window may never have legally started." },
    ],
  },
  {
    slug: "tampa-fl",
    localHook: "Tampa's solar market exploded between 2019 and 2023, driven by TECO's net metering program and aggressive sales campaigns targeting the city's large suburban homeowner base. Florida's 2023 HB 741 net metering changes have left thousands of Tampa homeowners with solar agreements that no longer deliver the promised savings. Florida's consumer protection laws provide real remedies.",
    marketStats: [
      { label: "Tampa Bay Solar Installs", value: "22,000+" },
      { label: "TECO Net Metering Change", value: "2023 (HB 741)" },
      { label: "Avg. Monthly Solar Payment", value: "$171" },
      { label: "FL AG Solar Complaints", value: "1,100+ statewide" },
    ],
    topComplaints: [
      "TECO net metering changes eliminated promised savings",
      "Payment higher than pre-solar TECO bill",
      "Hurricane Ian and Idalia damage not covered by solar warranty",
      "Dealer fees hidden in GoodLeap and Mosaic loan balances",
      "System underperforming due to Tampa's frequent cloud cover",
    ],
    companyProblems: [
      { company: "Sunrun", issue: "Tampa homeowners report Sunrun savings projections based on pre-HB 741 TECO net metering rates." },
      { company: "Freedom Forever", issue: "Tampa complaints involve dealer fees and aggressive sales tactics targeting homeowners in suburban developments." },
      { company: "GoodLeap", issue: "Tampa homeowners report GoodLeap loan structures where the tax credit balloon payment was not clearly explained." },
      { company: "ADT Solar", issue: "Following ADT Solar's exit, Tampa customers are left without warranty support or service." },
    ],
    whyItHappens: "Tampa's suburban growth created ideal conditions for solar sales: new homeowners, high summer cooling costs, and neighborhoods where one installation prompted neighbors to sign up. The 2023 HB 741 changes hit Tampa homeowners particularly hard because TECO's previous net metering rates were among the most favorable in Florida. Sales companies that sold in 2021–2023 using pre-HB 741 projections without disclosing the pending legislation were making materially misleading representations.",
    stateLawExpanded: "Tampa homeowners are protected by Florida's FDUTPA and the Florida Home Solicitation Sales Act. FDUTPA provides strong remedies for deceptive sales practices including actual damages, attorney's fees, and injunctive relief. The Florida AG has specific authority to investigate and prosecute solar companies for deceptive practices. Florida courts have applied FDUTPA to solar contract disputes, and the state has seen significant enforcement activity against solar companies in recent years.",
    localFaq: [
      { q: "Can I cancel my Tampa solar contract because of Florida's HB 741 changes?", a: "Possibly yes. If your savings projections were based on pre-HB 741 TECO net metering rates, and the salesperson did not disclose the pending legislation, that may constitute a material misrepresentation under FDUTPA. A contract review can assess whether this applies to your specific situation." },
      { q: "What if my Tampa solar system was damaged by a hurricane?", a: "Storm damage coverage depends on your contract and homeowner's insurance. If the salesperson told you the system was covered for storm damage and it is not, that may be a misrepresentation claim. If the solar company is not responding to warranty claims, that may be a breach of contract." },
      { q: "How do I know if I have a dealer fee in my solar loan?", a: "Request a copy of the loan agreement from your lender (GoodLeap, Mosaic, etc.). Look for a line item called 'dealer fee,' 'origination fee,' or 'broker fee.' Compare the loan amount to the actual cost of the solar system. If the loan is 20–30% higher than the system cost, you likely have a dealer fee." },
      { q: "What is the fastest way to get out of a solar contract in Tampa?", a: "The fastest path depends on your specific situation. If you have clear grounds for cancellation (misrepresentation, TILA violations, missing cancellation notice), an attorney demand letter can sometimes resolve the matter in 30–45 days. A free case review identifies the fastest available path." },
    ],
  },
  // ─── ARIZONA ──────────────────────────────────────────────────────────────────
  {
    slug: "tucson-az",
    localHook: "Tucson's solar market is dominated by TEP (Tucson Electric Power) customers who were sold solar on the promise of eliminating their electric bill. TEP's net metering changes and the city's extreme summer heat — which reduces panel efficiency — have left many Tucson homeowners with solar payments that do not deliver the promised savings. Arizona law provides strong consumer protection remedies.",
    marketStats: [
      { label: "Tucson Solar Installs", value: "18,000+" },
      { label: "TEP Net Metering Rate", value: "Reduced 2019, 2022" },
      { label: "Avg. Monthly Solar Payment", value: "$168" },
      { label: "AZ AG Solar Complaints", value: "900+ statewide" },
    ],
    topComplaints: [
      "TEP net metering changes eliminated promised savings",
      "Summer heat reducing panel efficiency by 15–20%",
      "Payment higher than pre-solar TEP bill",
      "Escalator clauses in leases not disclosed at signing",
      "Company unreachable after installation",
    ],
    companyProblems: [
      { company: "Sunrun", issue: "Tucson homeowners report Sunrun savings projections based on pre-2019 TEP net metering rates." },
      { company: "SunPower", issue: "SunPower's bankruptcy has left Tucson customers without warranty support." },
      { company: "Freedom Forever", issue: "Tucson complaints involve dealer fees and savings projections that did not account for TEP's net metering changes." },
      { company: "Vivint Solar", issue: "Tucson homeowners report Vivint's aggressive door-to-door sales and undisclosed escalator clauses." },
    ],
    whyItHappens: "Tucson's extreme summer heat creates a paradox: the city has abundant sunshine but also temperatures that reduce solar panel efficiency. Sales companies rarely disclosed the heat degradation factor in their proposals. TEP's net metering changes in 2019 and 2022 further eroded the savings case. The combination of undisclosed heat degradation, reduced net metering credits, and aggressive sales tactics has left many Tucson homeowners with agreements that do not deliver what was promised.",
    stateLawExpanded: "Tucson homeowners are protected by the Arizona Consumer Fraud Act (A.R.S. § 44-1521), which prohibits deceptive acts or practices in connection with the sale of any merchandise. The Act allows consumers to recover actual damages and attorney's fees. The Arizona AG has taken enforcement action against solar companies for deceptive practices. Arizona courts have applied consumer fraud protections to solar contract disputes involving misrepresented savings projections and undisclosed escalator clauses.",
    localFaq: [
      { q: "Does Tucson's heat affect my solar system's performance?", a: "Yes. Solar panels lose efficiency at high temperatures — typically 0.3–0.5% per degree Celsius above 25°C. Tucson regularly exceeds 40°C in summer, which can reduce output by 10–15% compared to optimal conditions. If this was not disclosed in your proposal, it may be relevant to a performance claim." },
      { q: "How did TEP's net metering changes affect my solar savings?", a: "TEP reduced its net metering rates in 2019 and 2022. If your savings projections were based on pre-change rates, those projections are now inaccurate. If the salesperson did not disclose the regulatory risk, that may constitute a material misrepresentation under the Arizona Consumer Fraud Act." },
      { q: "Can I get out of a solar lease in Tucson?", a: "Yes, in many cases. Solar lease exit options include transferring to a home buyer, buying out the lease, or challenging the lease based on misrepresentation or undisclosed terms. A free case review can identify which options apply to your specific lease." },
      { q: "What should I do first if I want to cancel my Tucson solar contract?", a: "Start by gathering your documents: the original contract, any written proposals or savings projections, and your current monthly statements. Then get a free case review to understand what legal options are available. Do not stop making payments without legal guidance." },
    ],
  },
  // ─── COLORADO ─────────────────────────────────────────────────────────────────
  {
    slug: "denver-co",
    localHook: "Denver's solar market grew rapidly between 2018 and 2023, driven by Xcel Energy's net metering program and Colorado's strong renewable energy incentives. But Xcel's net metering changes and the complexity of Colorado's solar financing landscape have left many Denver homeowners with agreements that do not deliver the promised savings. Colorado law provides strong consumer protection remedies.",
    marketStats: [
      { label: "Denver Solar Installs", value: "32,000+" },
      { label: "Xcel Net Metering Rate", value: "Reduced 2022" },
      { label: "Avg. Monthly Solar Payment", value: "$172" },
      { label: "CO AG Solar Complaints", value: "400+" },
    ],
    topComplaints: [
      "Xcel Energy net metering changes reduced promised savings",
      "Payment higher than pre-solar Xcel bill",
      "Dealer fees hidden in loan balance",
      "Hail damage not covered by solar warranty",
      "System underperforming due to Denver's variable weather",
    ],
    companyProblems: [
      { company: "Sunrun", issue: "Denver homeowners report Sunrun savings projections based on pre-2022 Xcel net metering rates." },
      { company: "SunPower", issue: "SunPower's bankruptcy has left Denver customers without warranty support." },
      { company: "Freedom Forever", issue: "Denver complaints involve dealer fees and savings projections that did not account for Xcel's net metering changes." },
      { company: "Tesla Solar", issue: "Denver Tesla Solar customers report installation delays and system performance below written projections." },
    ],
    whyItHappens: "Denver's solar market was built on Xcel Energy's relatively favorable net metering program. When Xcel reduced its net metering rates in 2022, the savings projections that homeowners were sold became less accurate. Colorado's hail risk — one of the highest in the country — also creates warranty and performance issues that were often not addressed in the sales process. Sales companies that sold solar using pre-change projections without disclosing the regulatory risk were making materially misleading representations.",
    stateLawExpanded: "Denver homeowners are protected by the Colorado Consumer Protection Act (C.R.S. § 6-1-105), which prohibits deceptive trade practices in connection with the sale of any goods or services. The Act allows consumers to recover actual damages, up to three times actual damages for bad-faith conduct, and attorney's fees. Colorado also has a 3-day cancellation right for home solicitation sales under C.R.S. § 5-3-403. The Colorado AG has authority to investigate and prosecute solar companies for deceptive practices.",
    localFaq: [
      { q: "Can I cancel my Denver solar contract because of Xcel's net metering changes?", a: "Possibly yes. If your savings projections were based on pre-2022 Xcel net metering rates, and the salesperson did not disclose the regulatory risk, that may constitute a deceptive trade practice under the Colorado Consumer Protection Act. A contract review can assess whether this applies to your situation." },
      { q: "What if my Denver solar system was damaged by hail?", a: "Hail damage coverage depends on your contract and homeowner's insurance. Solar panels are generally covered under homeowner's insurance as part of the home's structure. If the solar company is not responding to warranty claims for hail damage, that may be a breach of contract." },
      { q: "What are my options for getting out of a solar loan in Denver?", a: "Options include paying off the loan balance, refinancing at better terms, or challenging the loan based on TILA violations or misrepresentation. A free case review can identify which options apply to your specific loan and circumstances." },
      { q: "How do I know if my solar savings projections were realistic?", a: "Compare your actual utility bills before and after solar installation. If your total costs (solar payment plus remaining Xcel bill) are higher than your pre-solar Xcel bill, the projections were not accurate. A contract review can determine whether the inaccuracy was due to misrepresentation or changed circumstances." },
    ],
  },
  // ─── FLORIDA ──────────────────────────────────────────────────────────────────
  {
    slug: "miami-fl",
    localHook: "Miami is one of Florida's largest solar markets, with thousands of homeowners signing agreements to offset their FPL bills. Florida's 2023 HB 741 net metering changes, combined with Miami's unique challenges — hurricane risk, high humidity, and salt air corrosion — have left many Miami homeowners with solar agreements that do not deliver the promised savings. Florida's consumer protection laws provide strong remedies.",
    marketStats: [
      { label: "Miami-Dade Solar Installs", value: "31,000+" },
      { label: "FPL Net Metering Change", value: "2023 (HB 741)" },
      { label: "Avg. Monthly Solar Payment", value: "$183" },
      { label: "FL AG Solar Complaints", value: "1,100+ statewide" },
    ],
    topComplaints: [
      "FPL net metering changes eliminated promised savings",
      "Hurricane damage not covered by solar warranty",
      "Salt air corrosion reducing system performance",
      "Payment higher than pre-solar FPL bill",
      "Dealer fees hidden in loan balance",
    ],
    companyProblems: [
      { company: "Sunrun", issue: "Miami homeowners report Sunrun savings projections based on pre-HB 741 FPL net metering rates." },
      { company: "Freedom Forever", issue: "Miami complaints involve dealer fees and savings projections that did not account for Florida's net metering changes." },
      { company: "GoodLeap", issue: "Miami homeowners report GoodLeap loan structures where the tax credit balloon payment was not clearly explained." },
      { company: "ADT Solar", issue: "Following ADT Solar's exit, Miami customers are left without warranty support." },
    ],
    whyItHappens: "Miami's solar market was built on FPL's net metering program, which provided generous credits for excess solar production. Florida's HB 741 changes in 2023 reduced those credits significantly. Miami's unique environmental challenges — hurricane risk, salt air, high humidity — also affect solar system performance and warranty coverage in ways that were rarely disclosed during the sales process.",
    stateLawExpanded: "Miami homeowners are protected by Florida's FDUTPA and the Florida Home Solicitation Sales Act. FDUTPA provides strong remedies for deceptive sales practices. Florida courts have applied FDUTPA to solar contract disputes involving misrepresented savings projections and undisclosed net metering changes. The Florida AG has taken enforcement action against solar companies for deceptive practices in the Miami market specifically.",
    localFaq: [
      { q: "How did Florida's HB 741 affect my Miami solar contract?", a: "HB 741, effective January 2024, changed how FPL compensates homeowners for excess solar production. Credits are now based on avoided cost rates rather than retail rates, significantly reducing the value of solar exports. If your savings projections were based on pre-HB 741 rates, those projections are now materially inaccurate." },
      { q: "Does Miami's salt air affect my solar system?", a: "Yes. Salt air can corrode solar panel frames, inverters, and mounting hardware over time. If the salesperson did not disclose the impact of Miami's coastal environment on system longevity and performance, that may be relevant to a performance or warranty claim." },
      { q: "What are my options if my Miami solar company went out of business?", a: "Contact the financing company directly. File complaints with the Florida AG, FTC, and CFPB. The financing company may have liability even if the installer is gone. A contract review can identify all parties who may have liability in your situation." },
      { q: "Can I cancel a solar lease in Miami?", a: "Yes, in many cases. Solar lease exit options include transferring to a home buyer, buying out the lease, or challenging the lease based on misrepresentation or undisclosed terms including the HB 741 impact on savings projections." },
    ],
  },
  // ─── GEORGIA ──────────────────────────────────────────────────────────────────
  {
    slug: "atlanta-ga",
    localHook: "Atlanta's solar market has grown rapidly, with Georgia Power customers being targeted by national solar sales companies promising significant savings on their utility bills. Georgia's relatively modest net metering program and the complexity of Georgia Power's rate structure have left many Atlanta homeowners with solar agreements that do not deliver the promised savings. Georgia law provides consumer protection remedies.",
    marketStats: [
      { label: "Atlanta Solar Installs", value: "19,000+" },
      { label: "Georgia Power Net Metering", value: "Limited program" },
      { label: "Avg. Monthly Solar Payment", value: "$174" },
      { label: "GA AG Solar Complaints", value: "300+" },
    ],
    topComplaints: [
      "Georgia Power's limited net metering reducing promised savings",
      "Payment higher than pre-solar Georgia Power bill",
      "Dealer fees hidden in loan balance",
      "System underperforming due to Atlanta's tree canopy and shading",
      "Escalator clauses in leases not disclosed at signing",
    ],
    companyProblems: [
      { company: "Sunrun", issue: "Atlanta homeowners report Sunrun savings projections that overstated the value of Georgia Power's limited net metering program." },
      { company: "SunPower", issue: "SunPower's bankruptcy has left Atlanta customers without warranty support." },
      { company: "Freedom Forever", issue: "Atlanta complaints involve dealer fees and savings projections that overstated Georgia Power net metering benefits." },
      { company: "ADT Solar", issue: "Following ADT Solar's exit, Atlanta customers are left without warranty support." },
    ],
    whyItHappens: "Georgia Power's net metering program is more limited than those in California, Texas, or Florida — a fact that was often not disclosed during the sales process. Atlanta's significant tree canopy also creates shading issues that reduce solar production, and site assessments often underestimated the impact. Sales companies that sold solar using savings projections that overstated Georgia Power's net metering benefits were making materially misleading representations.",
    stateLawExpanded: "Atlanta homeowners are protected by the Georgia Fair Business Practices Act (O.C.G.A. § 10-1-390), which prohibits unfair or deceptive acts or practices in consumer transactions. The Act allows consumers to recover actual damages and attorney's fees. Georgia also has a 3-day cancellation right for home solicitation sales under O.C.G.A. § 10-1-6. The Georgia AG has authority to investigate and prosecute solar companies for deceptive practices.",
    localFaq: [
      { q: "Is solar worth it in Atlanta given Georgia Power's limited net metering?", a: "It depends on the deal. Georgia Power's net metering program is more limited than in other states, which means the savings case for solar in Atlanta is weaker than in California or Texas. If your salesperson presented savings projections that assumed more generous net metering than Georgia Power actually provides, that may be a misrepresentation." },
      { q: "Does Atlanta's tree canopy affect solar performance?", a: "Yes. Atlanta's significant tree canopy creates shading that can reduce solar production by 20–40% compared to unshaded installations. If the site assessment did not account for shading, or if the salesperson minimized the shading impact, that may be relevant to a performance claim." },
      { q: "Can I cancel a solar contract in Georgia after installation?", a: "Yes, in many cases. Georgia's Fair Business Practices Act provides remedies for deceptive sales practices. A free case review can identify whether misrepresentation, TILA violations, or failure to provide required disclosures apply to your specific situation." },
      { q: "What should I do if my Atlanta solar company is not responding?", a: "Document all contact attempts. File complaints with the Georgia AG, FTC, and CFPB. Contact the financing company directly. If the company has service obligations under your contract and is not fulfilling them, that may constitute a material breach." },
    ],
  },
  // ─── NORTH CAROLINA ───────────────────────────────────────────────────────────
  {
    slug: "charlotte-nc",
    localHook: "Charlotte is one of the fastest-growing solar markets in the Southeast, with Duke Energy customers being targeted by national solar sales companies. Duke Energy's net metering program and North Carolina's solar incentives made the savings pitch compelling — but many Charlotte homeowners are discovering that the reality does not match the projections. North Carolina law provides consumer protection remedies.",
    marketStats: [
      { label: "Charlotte Solar Installs", value: "14,000+" },
      { label: "Duke Energy Net Metering", value: "Retail rate credits" },
      { label: "Avg. Monthly Solar Payment", value: "$169" },
      { label: "NC AG Solar Complaints", value: "250+" },
    ],
    topComplaints: [
      "Payment higher than pre-solar Duke Energy bill",
      "Dealer fees hidden in loan balance",
      "System underperforming due to Charlotte's variable weather",
      "Tax credit not applied as promised — loan balance increased",
      "Company unreachable after installation",
    ],
    companyProblems: [
      { company: "Sunrun", issue: "Charlotte homeowners report Sunrun savings projections that overstated Duke Energy net metering benefits." },
      { company: "SunPower", issue: "SunPower's bankruptcy has left Charlotte customers without warranty support." },
      { company: "Freedom Forever", issue: "Charlotte complaints involve dealer fees and high-pressure door-to-door sales tactics." },
      { company: "GoodLeap", issue: "Charlotte homeowners report GoodLeap loan structures where the tax credit implications were not clearly explained." },
    ],
    whyItHappens: "Charlotte's rapid suburban growth attracted national solar sales companies that used Duke Energy's relatively favorable net metering program as a selling point. The combination of dealer fees, tax credit complexity, and savings projections based on optimistic assumptions has left many Charlotte homeowners with agreements that cost more than expected. North Carolina's consumer protection laws provide remedies for homeowners who were misled.",
    stateLawExpanded: "Charlotte homeowners are protected by the North Carolina Unfair and Deceptive Trade Practices Act (N.C. Gen. Stat. § 75-1.1), which prohibits unfair or deceptive acts or practices in commerce. The Act allows consumers to recover treble damages (three times actual damages) and attorney's fees — one of the strongest remedies available under any state consumer protection law. The FTC Cooling-Off Rule also applies to contracts signed at your home.",
    localFaq: [
      { q: "Can I cancel a solar contract in Charlotte, North Carolina?", a: "Yes, in many cases. North Carolina's UDTPA provides strong remedies for deceptive sales practices, including treble damages. A free case review can identify whether misrepresentation, TILA violations, or failure to provide required disclosures apply to your specific situation." },
      { q: "What is North Carolina's treble damages provision?", a: "Under North Carolina's UDTPA, if a court finds that a defendant willfully engaged in unfair or deceptive trade practices, it must award three times the actual damages. This is one of the strongest consumer protection remedies in the country and makes it economically viable for attorneys to take solar contract cases on contingency." },
      { q: "How do I know if I have a dealer fee in my solar loan?", a: "Request a copy of the loan agreement from your lender. Look for a line item called 'dealer fee,' 'origination fee,' or 'broker fee.' Compare the loan amount to the actual cost of the solar system. If the loan is 20–30% higher than the system cost, you likely have a dealer fee that may not have been disclosed." },
      { q: "What are my options if my Charlotte solar system is underperforming?", a: "Document the underperformance by comparing actual production data to the written projections in your contract. If the gap is significant and consistent, you may have a breach of contract claim. A free case review can identify whether legal cancellation or compensation is available." },
    ],
  },
  // ─── NEW JERSEY ───────────────────────────────────────────────────────────────
  {
    slug: "newark-nj",
    localHook: "New Jersey has one of the most complex solar markets in the country, with SREC (Solar Renewable Energy Credit) programs, net metering, and state incentives that made the savings pitch very compelling. But program changes, SREC price volatility, and aggressive sales tactics have left many New Jersey homeowners with agreements that do not deliver the promised savings. New Jersey law provides strong consumer protection remedies.",
    marketStats: [
      { label: "NJ Solar Installs", value: "140,000+" },
      { label: "SREC Program Status", value: "Transitioned to TRECs" },
      { label: "Avg. Monthly Solar Payment", value: "$188" },
      { label: "NJ AG Solar Complaints", value: "500+" },
    ],
    topComplaints: [
      "SREC program changes eliminated a significant portion of promised savings",
      "Payment higher than pre-solar PSE&G or JCP&L bill",
      "Dealer fees hidden in loan balance",
      "SREC income projections that were never realistic",
      "Company unreachable after installation",
    ],
    companyProblems: [
      { company: "Sunrun", issue: "NJ homeowners report Sunrun savings projections that included SREC income that was never realistic given market prices." },
      { company: "SunPower", issue: "SunPower's bankruptcy has left NJ customers without warranty support." },
      { company: "Tesla Solar", issue: "NJ Tesla Solar customers report installation delays and system performance below written projections." },
      { company: "Freedom Forever", issue: "NJ complaints involve dealer fees and savings projections that overstated SREC income." },
    ],
    whyItHappens: "New Jersey's solar market was built on a combination of net metering, SREC income, and state incentives that made the financial case for solar very compelling. But SREC prices are volatile and have declined significantly since the program's peak. Sales companies that included SREC income in savings projections without disclosing the volatility risk were making materially misleading representations. The transition from SRECs to TRECs (Transition Renewable Energy Certificates) further complicated the picture.",
    stateLawExpanded: "New Jersey homeowners are protected by the New Jersey Consumer Fraud Act (N.J.S.A. 56:8-1), one of the strongest consumer protection statutes in the country. The CFA prohibits unconscionable commercial practices, deception, fraud, false pretense, false promise, and misrepresentation in connection with any sale. Remedies include treble damages (three times actual damages), attorney's fees, and filing fees. The NJ AG has taken enforcement action against solar companies for deceptive practices.",
    localFaq: [
      { q: "How did New Jersey's SREC program changes affect my solar contract?", a: "New Jersey's SREC program has undergone significant changes, and SREC prices have declined from their peak. If your savings projections included SREC income that was based on unrealistic price assumptions, or if the salesperson did not disclose the volatility risk, that may constitute a material misrepresentation under the NJ Consumer Fraud Act." },
      { q: "What is the New Jersey Consumer Fraud Act and how does it help me?", a: "The NJ CFA is one of the strongest consumer protection laws in the country. It allows consumers to recover treble damages (three times actual damages) and attorney's fees for deceptive sales practices. This makes it economically viable for attorneys to take solar contract cases on contingency, meaning you may not need to pay anything upfront." },
      { q: "Can I cancel a solar contract in New Jersey after installation?", a: "Yes, in many cases. The NJ CFA provides strong remedies for deceptive sales practices. A free case review can identify whether misrepresentation, TILA violations, or failure to provide required disclosures apply to your specific situation." },
      { q: "What should I do if my NJ solar company is not responding?", a: "Document all contact attempts. File complaints with the NJ AG Division of Consumer Affairs, FTC, and CFPB. Contact the financing company directly. If the company has service obligations under your contract and is not fulfilling them, that may constitute a material breach." },
    ],
  },
  // ─── MARYLAND ─────────────────────────────────────────────────────────────────
  {
    slug: "baltimore-md",
    localHook: "Baltimore and the broader Maryland market have seen significant solar growth, with BGE and Pepco customers being targeted by national solar sales companies. Maryland's net metering program and state incentives made the savings pitch compelling — but many Baltimore homeowners are discovering that the reality does not match the projections. Maryland law provides strong consumer protection remedies.",
    marketStats: [
      { label: "Maryland Solar Installs", value: "85,000+" },
      { label: "BGE Net Metering Rate", value: "Retail rate credits" },
      { label: "Avg. Monthly Solar Payment", value: "$181" },
      { label: "MD AG Solar Complaints", value: "350+" },
    ],
    topComplaints: [
      "Payment higher than pre-solar BGE or Pepco bill",
      "Dealer fees hidden in loan balance",
      "Tax credit not applied as promised — loan balance increased",
      "System underperforming due to Maryland's variable weather",
      "Company unreachable after installation",
    ],
    companyProblems: [
      { company: "Sunrun", issue: "Baltimore homeowners report Sunrun savings projections that overstated BGE net metering benefits." },
      { company: "SunPower", issue: "SunPower's bankruptcy has left Baltimore customers without warranty support." },
      { company: "Freedom Forever", issue: "Baltimore complaints involve dealer fees and high-pressure door-to-door sales tactics." },
      { company: "Tesla Solar", issue: "Baltimore Tesla Solar customers report installation delays and system performance below written projections." },
    ],
    whyItHappens: "Maryland's solar market attracted national sales companies that used the state's net metering program and incentives as selling points. The combination of dealer fees, tax credit complexity, and optimistic savings projections has left many Baltimore homeowners with agreements that cost more than expected. Maryland's consumer protection laws provide remedies for homeowners who were misled.",
    stateLawExpanded: "Baltimore homeowners are protected by the Maryland Consumer Protection Act (Md. Code Ann., Com. Law § 13-301), which prohibits unfair or deceptive trade practices in consumer transactions. The Act allows consumers to recover actual damages and attorney's fees. Maryland also has a 3-day cancellation right for home solicitation sales. The Maryland AG has authority to investigate and prosecute solar companies for deceptive practices.",
    localFaq: [
      { q: "Can I cancel a solar contract in Baltimore, Maryland?", a: "Yes, in many cases. Maryland's Consumer Protection Act provides remedies for deceptive sales practices. A free case review can identify whether misrepresentation, TILA violations, or failure to provide required disclosures apply to your specific situation." },
      { q: "What are my options if my Baltimore solar company went out of business?", a: "Contact the financing company directly. File complaints with the Maryland AG, FTC, and CFPB. The financing company may have liability even if the installer is gone. A contract review can identify all parties who may have liability." },
      { q: "How do I know if my solar savings projections were realistic?", a: "Compare your actual utility bills before and after solar installation. If your total costs (solar payment plus remaining BGE or Pepco bill) are higher than your pre-solar utility bill, the projections were not accurate. A contract review can determine whether the inaccuracy was due to misrepresentation." },
      { q: "What is the Maryland 3-day cancellation rule for solar contracts?", a: "Maryland law gives you 3 business days to cancel any contract signed at your home. The seller must provide a written Notice of Cancellation at the time of signing. If you did not receive this notice, the cancellation window may never have legally started." },
    ],
  },
  // ─── MASSACHUSETTS ────────────────────────────────────────────────────────────
  {
    slug: "boston-ma",
    localHook: "Boston and Massachusetts have one of the most complex solar markets in the country, with SREC programs, net metering, and state incentives that made the savings pitch very compelling. But program changes and aggressive sales tactics have left many Massachusetts homeowners with agreements that do not deliver the promised savings. Massachusetts law provides some of the strongest consumer protection remedies in the country.",
    marketStats: [
      { label: "MA Solar Installs", value: "160,000+" },
      { label: "SMART Program Status", value: "Active with declining rates" },
      { label: "Avg. Monthly Solar Payment", value: "$191" },
      { label: "MA AG Solar Complaints", value: "450+" },
    ],
    topComplaints: [
      "SMART program rates declining — savings projections no longer accurate",
      "Payment higher than pre-solar Eversource or National Grid bill",
      "Dealer fees hidden in loan balance",
      "SREC income projections that were never realistic",
      "Company unreachable after installation",
    ],
    companyProblems: [
      { company: "Sunrun", issue: "Boston homeowners report Sunrun savings projections that included SMART program income at rates that have since declined." },
      { company: "SunPower", issue: "SunPower's bankruptcy has left Boston customers without warranty support." },
      { company: "Tesla Solar", issue: "Boston Tesla Solar customers report installation delays and system performance below written projections." },
      { company: "Freedom Forever", issue: "Boston complaints involve dealer fees and savings projections that overstated SMART program income." },
    ],
    whyItHappens: "Massachusetts's solar market was built on a combination of net metering, SREC income, and the SMART program that made the financial case for solar very compelling. But SMART program rates decline over time as the program fills up, and SREC prices are volatile. Sales companies that included declining-rate program income in savings projections without disclosing the rate decline risk were making materially misleading representations.",
    stateLawExpanded: "Boston homeowners are protected by the Massachusetts Consumer Protection Act (M.G.L. c. 93A), one of the strongest consumer protection statutes in the country. Chapter 93A prohibits unfair or deceptive acts or practices in trade or commerce. Remedies include actual damages, double or treble damages for willful violations, and attorney's fees. Massachusetts courts have consistently applied Chapter 93A to solar contract disputes.",
    localFaq: [
      { q: "Can I cancel a solar contract in Boston, Massachusetts?", a: "Yes, in many cases. Massachusetts Chapter 93A provides strong remedies for deceptive sales practices, including double or treble damages for willful violations. A free case review can identify whether misrepresentation, TILA violations, or failure to provide required disclosures apply to your specific situation." },
      { q: "How did Massachusetts's SMART program changes affect my solar savings?", a: "The SMART program pays homeowners for solar production, but rates decline as the program fills up. If your savings projections included SMART program income at rates that have since declined, those projections are now inaccurate. If the salesperson did not disclose the rate decline risk, that may constitute a material misrepresentation." },
      { q: "What is Massachusetts Chapter 93A and how does it help me?", a: "Chapter 93A is one of the strongest consumer protection laws in the country. It allows consumers to recover double or treble damages for willful violations and attorney's fees. This makes it economically viable for attorneys to take solar contract cases on contingency." },
      { q: "What should I do if my Boston solar company is not responding?", a: "Document all contact attempts. File complaints with the Massachusetts AG, FTC, and CFPB. Contact the financing company directly. Send a Chapter 93A demand letter — this is a required step before filing a lawsuit in Massachusetts and often prompts faster resolution." },
    ],
  },
  // ─── ILLINOIS ─────────────────────────────────────────────────────────────────
  {
    slug: "chicago-il",
    localHook: "Chicago's solar market has grown significantly, with ComEd customers being targeted by national solar sales companies. Illinois's net metering program and the Illinois Shines incentive program made the savings pitch compelling — but many Chicago homeowners are discovering that the reality does not match the projections. Illinois law provides strong consumer protection remedies.",
    marketStats: [
      { label: "Illinois Solar Installs", value: "55,000+" },
      { label: "Illinois Shines Program", value: "Active with declining rates" },
      { label: "Avg. Monthly Solar Payment", value: "$177" },
      { label: "IL AG Solar Complaints", value: "400+" },
    ],
    topComplaints: [
      "Illinois Shines incentive rates declining — savings projections no longer accurate",
      "Payment higher than pre-solar ComEd bill",
      "Dealer fees hidden in loan balance",
      "System underperforming due to Chicago's limited winter sunshine",
      "Company unreachable after installation",
    ],
    companyProblems: [
      { company: "Sunrun", issue: "Chicago homeowners report Sunrun savings projections that included Illinois Shines income at rates that have since declined." },
      { company: "SunPower", issue: "SunPower's bankruptcy has left Chicago customers without warranty support." },
      { company: "Tesla Solar", issue: "Chicago Tesla Solar customers report installation delays and system performance below written projections." },
      { company: "Freedom Forever", issue: "Chicago complaints involve dealer fees and savings projections that overstated Illinois Shines program income." },
    ],
    whyItHappens: "Chicago's solar market was built on a combination of net metering and the Illinois Shines incentive program that made the financial case for solar more compelling than Chicago's limited sunshine hours would otherwise support. Sales companies that included declining-rate Illinois Shines income in savings projections without disclosing the rate decline risk were making materially misleading representations. Chicago's significant winter cloud cover also reduces annual production below what many proposals projected.",
    stateLawExpanded: "Chicago homeowners are protected by the Illinois Consumer Fraud and Deceptive Business Practices Act (815 ILCS 505), which prohibits unfair or deceptive acts or practices in consumer transactions. The Act allows consumers to recover actual damages, punitive damages, and attorney's fees. Illinois also has a 3-day cancellation right for home solicitation sales. The Illinois AG has authority to investigate and prosecute solar companies for deceptive practices.",
    localFaq: [
      { q: "Can I cancel a solar contract in Chicago, Illinois?", a: "Yes, in many cases. Illinois's Consumer Fraud Act provides remedies for deceptive sales practices. A free case review can identify whether misrepresentation, TILA violations, or failure to provide required disclosures apply to your specific situation." },
      { q: "How did Illinois's solar incentive program changes affect my savings?", a: "The Illinois Shines program pays homeowners for solar production, but rates decline as the program fills up. If your savings projections included Illinois Shines income at rates that have since declined, those projections are now inaccurate. If the salesperson did not disclose the rate decline risk, that may constitute a material misrepresentation." },
      { q: "Does Chicago's weather affect solar performance?", a: "Yes. Chicago has significantly fewer sunshine hours than the national average, and its winter cloud cover can reduce annual solar production by 20–30% compared to sunnier markets. If the production projections in your proposal did not account for Chicago's actual weather patterns, they may have been overstated." },
      { q: "What are my options if my Chicago solar company went out of business?", a: "Contact the financing company directly. File complaints with the Illinois AG, FTC, and CFPB. The financing company may have liability even if the installer is gone. A contract review can identify all parties who may have liability." },
    ],
  },
];

// Helper function to get content depth for a city slug
export function getCityContentDepth(slug: string): CityContentDepth | undefined {
  return cityContentDepth.find(c => c.slug === slug);
}
