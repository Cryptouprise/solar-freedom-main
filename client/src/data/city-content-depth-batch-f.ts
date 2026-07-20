// Solar Freedom — City Content Depth Batch F
// 7 indexed cities that were missing depth data (added July 2026 for SEO recovery)
// These are all in the INDEXED_CITY_SLUGS whitelist and need unique local content

import { CityContentDepth } from "./city-content-depth";

export const CITY_DEPTH_BATCH_F: CityContentDepth[] = [
  {
    slug: "greenville-sc",
    localHook: "In Greenville, most homeowners are tied to Duke Energy Carolinas' Solar Choice tariff, which uses time-of-use rates, a non-bypassable minimum bill, and export credits that aren't 1:1. Just a few miles outside the city limits, Upstate SC homeowners may fall under Laurens Electric or Blue Ridge Electric cooperatives — each with different interconnection rules that aggressive solar sales reps rarely explain before you sign. If your salesperson promised 'zero electric bill' or full retail net metering, that promise almost certainly doesn't match how Duke Energy actually credits your system.",
    marketStats: [
      { label: "Greenville County Residential Solar Adoption", value: "≈5.3% of detached homes (~7,500 rooftops)" },
      { label: "Typical System Size Installed Locally", value: "8.2 kW DC (median for Greenville single-family homes)" },
      { label: "Duke Energy Carolinas SC Average Rate", value: "~14.5¢/kWh all-in (2025)" },
      { label: "Contract-to-PTO Timeline (Greenville)", value: "6–12 weeks; Duke meter swap adds 2–4 weeks" },
    ],
    topComplaints: [
      "Sales reps promised 'no power bill' but Duke Energy's Solar Choice tariff has a minimum monthly bill and lower export credits",
      "Unexpected main panel or service-mast upgrades in older Augusta Road and North Main homes added thousands to the price after site survey",
      "Months-long wait for Duke meter swap/PTO left customers paying both the solar loan and the full utility bill simultaneously",
      "System producing 20–35% less than projected due to Upstate SC tree shading not accounted for in the sales proposal",
      "Salesperson claimed SC state tax credit would offset the loan — the 25% SC credit has an annual cap that wasn't disclosed",
    ],
    companyProblems: [
      { company: "Sunrun", issue: "Greenville homeowners report that Sunrun's lease escalator clauses (2.9%/year) were never verbally disclosed, causing payments to exceed original utility bills within 5 years." },
      { company: "Tesla Solar", issue: "Multiple Greenville customers report Tesla's remote monitoring showed full production while Duke Energy bills remained unchanged — Tesla support was unresponsive for months." },
      { company: "Freedom Forever", issue: "Freedom Forever subcontractors in the Greenville area have left homeowners with unpermitted installations that failed Duke Energy's interconnection inspection." },
    ],
    whyItHappens: "Greenville's rapid population growth and high summer utility bills make it a prime target for aggressive solar sales teams. The Upstate SC market is relatively new — Duke Energy's interconnection process is slower than in mature markets like California — creating a window where homeowners pay both their loan and utility bill for months. Many Greenville homeowners are first-time solar buyers with no reference point for what a legitimate solar proposal looks like.",
    stateLawExpanded: "South Carolina's Unfair Trade Practices Act (S.C. Code § 39-5-10) prohibits unfair or deceptive acts in commerce and allows consumers to recover actual damages plus attorney's fees. If a solar salesperson made false promises about savings, net metering credits, or tax incentives, you may have a claim under SCUTPA. South Carolina also has a 3-day right of rescission for door-to-door sales under the FTC Cooling-Off Rule, which applies to contracts signed at your home. A legal review can determine whether the specific misrepresentations in your case meet the threshold for a SCUTPA claim.",
    localFaq: [
      { q: "How does Duke Energy Carolinas' Solar Choice tariff affect my solar savings in Greenville?", a: "New enrollments typically use time-of-use rates with a non-bypassable minimum bill and export credits below retail. Savings depend on shifting usage to off-peak hours and correct inverter programming — most Greenville customers will still see a Duke bill even with a well-sized array. If your salesperson promised otherwise, that may constitute a material misrepresentation." },
      { q: "Can I cancel my solar contract in South Carolina if the system isn't producing what was promised?", a: "Yes — South Carolina's Unfair Trade Practices Act and the FTC Cooling-Off Rule both provide avenues for relief. If your system is producing significantly less than the written proposal projected, you may have grounds for cancellation or compensation. Document your actual production vs. the proposal and gather all communications with the company." },
      { q: "What should I do if my solar company in Greenville won't respond to service requests?", a: "File a complaint with the South Carolina Department of Consumer Affairs and the Better Business Bureau. If the company is licensed, you can also file with the SC Contractor's Licensing Board. Keep records of every unanswered call, email, and ticket — this documentation is critical if you pursue a legal remedy through SCUTPA." },
    ],
  },
  {
    slug: "youngstown-oh",
    localHook: "Youngstown is one of Ohio's most aggressively targeted solar markets despite having some of the lowest average solar irradiance in the continental US — making the 'massive savings' pitches from door-to-door reps particularly misleading. The city's working-class homeowners, many on fixed incomes, are disproportionately targeted by high-pressure sales tactics that exploit rising FirstEnergy/Ohio Edison utility rates. If you were told your solar system would 'pay for itself in 7 years' in Youngstown, the math almost certainly doesn't work.",
    marketStats: [
      { label: "Youngstown Area Solar Installs (2023)", value: "~1,200 residential systems" },
      { label: "Ohio Edison Average Residential Rate", value: "~13.8¢/kWh (2025)" },
      { label: "Average Youngstown Solar Production", value: "15–20% below national average due to cloud cover" },
      { label: "BBB Complaints (OH Solar Companies)", value: "800+ in the last 3 years" },
    ],
    topComplaints: [
      "System producing far less than projected due to Youngstown's lower-than-average solar irradiance",
      "Salesperson used inflated utility rate escalation assumptions to make savings projections look better than reality",
      "Federal tax credit not applied to loan balance — homeowners didn't qualify but were told they would",
      "Company went out of business or sold contracts, leaving homeowners with no service contact",
      "Roof damage during installation with no response from the company",
    ],
    companyProblems: [
      { company: "Sunrun", issue: "Youngstown homeowners report Sunrun's production guarantees are based on national averages, not local irradiance data — actual production is consistently 15–25% below the guaranteed amount." },
      { company: "ADT Solar", issue: "ADT Solar (formerly Sunpro) exited the market, leaving Youngstown customers with no service provider for warranty claims and monitoring issues." },
      { company: "Sunnova", issue: "Sunnova's bankruptcy proceedings have left Youngstown homeowners uncertain about who services their panels and whether their production guarantees remain valid." },
    ],
    whyItHappens: "Youngstown's economic challenges make homeowners particularly vulnerable to promises of 'free electricity' and 'energy independence.' Solar companies target the area knowing that residents are eager to reduce utility costs, but rarely disclose that Youngstown's latitude and cloud cover significantly reduce solar output compared to the national averages used in sales projections. Many homeowners don't discover the shortfall until they've been paying for 12–18 months.",
    stateLawExpanded: "Ohio's Consumer Sales Practices Act (O.R.C. § 1345.01) prohibits unfair or deceptive acts in consumer transactions and allows consumers to recover actual damages, rescission, and attorney's fees. Ohio also has a 3-day right of rescission for home solicitation sales under O.R.C. § 1345.21. If a solar salesperson made false or misleading statements about production, savings, or tax credits, you may have a claim under the CSPA. Ohio's Attorney General actively investigates solar fraud complaints — filing a complaint creates a public record that strengthens any legal action.",
    localFaq: [
      { q: "Is solar worth it in Youngstown, Ohio given the weather?", a: "Youngstown receives 15–20% less solar irradiance than the national average used in most sales projections. A legitimate solar proposal should use local production data from NREL's PVWatts tool — if yours used generic national figures, the savings projections were likely inflated. A legal review can determine whether the misrepresentation rises to the level of fraud." },
      { q: "What are my rights if my solar company in Ohio went out of business?", a: "Ohio's Consumer Sales Practices Act still applies — you can file a complaint with the Ohio Attorney General's office and pursue claims against the original company's assets or any successor company. If the panels were financed, the lender may have obligations under the FTC Holder Rule. Document everything and seek a legal review of your specific contract." },
      { q: "Can I get out of my solar contract in Ohio if the system doesn't produce what was promised?", a: "Yes — if your system consistently produces significantly less than the written proposal guaranteed, you may have grounds for cancellation under Ohio's CSPA or breach of contract. Gather 12 months of production data, your original proposal, and all communications with the company. Ohio courts have awarded rescission in cases where production shortfalls were caused by inflated projections." },
    ],
  },
  {
    slug: "west-valley-city-ut",
    localHook: "West Valley City sits in the heart of Utah's most aggressive solar sales market — a state where door-to-door solar sales tactics have drawn more consumer complaints per capita than almost any other state in the country. Rocky Mountain Power's net metering program has been progressively reduced, meaning the savings projections from 2021–2023 sales pitches are now significantly overstated. If you were sold a system in West Valley City based on full retail net metering credits, your actual savings are likely a fraction of what was promised.",
    marketStats: [
      { label: "Utah Residential Solar Installs (2023)", value: "28,000+ (one of highest per-capita nationally)" },
      { label: "Rocky Mountain Power Net Metering Rate", value: "~7.5¢/kWh export credit (vs. 11¢ retail)" },
      { label: "Utah BBB Solar Complaints (2022–2024)", value: "2,100+ filed" },
      { label: "Avg. Monthly Solar Payment (West Valley)", value: "$165–$210" },
    ],
    topComplaints: [
      "Rocky Mountain Power's reduced net metering means export credits are far below what was promised during the sale",
      "Vivint Solar door-to-door reps promised 'locking in' utility rates — no such protection exists",
      "Federal tax credit applied to loan balance never happened — homeowners didn't qualify or credit was smaller than promised",
      "System oversized for actual consumption — homeowners exporting power at a loss",
      "Lien placed on home without homeowner's full understanding during financing",
    ],
    companyProblems: [
      { company: "Vivint Solar", issue: "West Valley City homeowners report Vivint reps promised 'rate lock' protection against Rocky Mountain Power increases — this is not a feature of any residential solar contract and constitutes a material misrepresentation." },
      { company: "Tesla Solar", issue: "Tesla's remote monitoring app shows production data but doesn't account for Rocky Mountain Power's reduced export credits — homeowners discover the savings gap only after comparing utility bills." },
      { company: "Sunrun", issue: "Sunrun's lease agreements in Utah include 2.9% annual escalators that were rarely disclosed verbally, causing payments to exceed original utility bills within 4–6 years for many West Valley City homeowners." },
    ],
    whyItHappens: "Utah's high solar irradiance and historically favorable net metering made it a legitimate solar market — but the aggressive door-to-door sales culture that developed here, combined with Rocky Mountain Power's subsequent reduction of net metering credits, has left thousands of homeowners with systems that don't deliver the promised savings. West Valley City's diverse, working-class population is disproportionately targeted, and language barriers sometimes prevent homeowners from fully understanding what they're signing.",
    stateLawExpanded: "Utah's Consumer Sales Practices Act (Utah Code § 13-11-1) prohibits deceptive acts in consumer transactions and provides for rescission and damages. Utah also has a 3-day right of rescission for door-to-door sales under the FTC Cooling-Off Rule. The Utah Division of Consumer Protection actively investigates solar fraud complaints and has taken enforcement action against multiple solar companies operating in the state. If a salesperson made false promises about net metering credits, tax credits, or savings guarantees, a legal review can determine whether you have grounds for rescission under Utah law.",
    localFaq: [
      { q: "How has Rocky Mountain Power's net metering change affected solar savings in West Valley City?", a: "Rocky Mountain Power reduced export credits from near-retail rates to approximately 7.5¢/kWh — roughly half the retail rate. If your sales proposal was based on full retail net metering, your actual savings are significantly lower than projected. This change affects all Utah solar customers and may constitute grounds for a misrepresentation claim if the salesperson promised stable or full-retail credits." },
      { q: "Can I cancel my Vivint Solar contract in Utah?", a: "Potentially yes — Utah's Consumer Sales Practices Act and the FTC Cooling-Off Rule both provide avenues. If Vivint reps made false promises about rate locks, net metering, or tax credits, you may have grounds for rescission. Document all verbal promises and gather your original proposal, contract, and 12 months of utility bills to support a legal review." },
      { q: "What should I do if a solar company placed a UCC lien on my home in Utah without fully explaining it?", a: "A UCC-1 financing statement is a lien that can complicate home sales and refinancing. If you weren't clearly informed that signing the financing agreement would result in a lien, this may constitute a deceptive practice under Utah's CSPA. File a complaint with the Utah Division of Consumer Protection and seek a legal review to determine your options for removing the lien." },
    ],
  },
  {
    slug: "shreveport-la",
    localHook: "Shreveport homeowners face a uniquely challenging solar market — Cleco and SWEPCO (AEP) serve most of the area with net metering programs that are less favorable than what most sales reps describe, and Louisiana's humid subtropical climate means panel degradation and maintenance issues are more common than in drier markets. The combination of aggressive out-of-state solar companies targeting the area, complex financing structures, and limited local service infrastructure has left many Shreveport homeowners paying for systems that underperform and companies that are difficult to reach.",
    marketStats: [
      { label: "Shreveport Area Solar Installs (2023)", value: "~800 residential systems" },
      { label: "SWEPCO/Cleco Average Residential Rate", value: "~11.5¢/kWh (among lowest in US)" },
      { label: "Louisiana Solar Payback Period", value: "12–18 years (vs. 7–9 years nationally)" },
      { label: "LA AG Solar Complaints (2022–2024)", value: "340+ filed" },
    ],
    topComplaints: [
      "Low Shreveport utility rates mean solar payback periods are 12–18 years, not the 7 years promised",
      "Out-of-state companies with no local service presence are unreachable for warranty and maintenance issues",
      "Humidity and heat degradation causing panels to underperform faster than projected",
      "Salesperson promised Louisiana state tax incentives that were reduced or eliminated",
      "Financing company placed a lien on the home that wasn't clearly explained during the sale",
    ],
    companyProblems: [
      { company: "Sunrun", issue: "Shreveport homeowners report that Sunrun's savings projections used utility rate escalation assumptions far above Cleco/SWEPCO's historical rate increases, making the economics appear far better than reality." },
      { company: "Freedom Forever", issue: "Freedom Forever's production guarantee claims in Louisiana don't account for the state's humidity-related panel degradation, leaving homeowners with shortfalls that the company disputes." },
      { company: "ADT Solar", issue: "ADT Solar's exit from the market left Shreveport homeowners with no service provider — warranty claims and monitoring issues go unresolved." },
    ],
    whyItHappens: "Louisiana's low utility rates make solar economics marginal at best, but sales reps rarely disclose this — instead using inflated rate escalation assumptions and overstated production projections to make the numbers work on paper. Shreveport's market is served primarily by out-of-state companies with no local infrastructure, meaning service and warranty issues frequently go unresolved. The city's economic challenges make homeowners particularly vulnerable to promises of 'energy independence' and 'guaranteed savings.'",
    stateLawExpanded: "Louisiana's Unfair Trade Practices and Consumer Protection Law (La. R.S. 51:1401) prohibits unfair or deceptive acts in commerce and allows consumers to recover actual damages plus attorney's fees. Louisiana also recognizes fraud in the inducement as grounds for contract rescission — if a salesperson made material misrepresentations about savings, production, or incentives that induced you to sign, you may have grounds to void the contract. The Louisiana Attorney General's Consumer Protection Section actively investigates solar fraud complaints and has pursued enforcement actions against multiple solar companies operating in the state.",
    localFaq: [
      { q: "Is solar worth it in Shreveport given Louisiana's low utility rates?", a: "Shreveport's utility rates from Cleco and SWEPCO are among the lowest in the country — around 11.5¢/kWh. This means solar payback periods are typically 12–18 years, not the 7–9 years commonly promised. If your salesperson used higher utility rate assumptions or promised a shorter payback period, that may constitute a material misrepresentation under Louisiana's consumer protection law." },
      { q: "What are my options if my solar company in Shreveport has gone out of business or won't respond?", a: "File a complaint with the Louisiana Attorney General's Consumer Protection Section and the Better Business Bureau. If the panels were financed, the lender may have obligations under the FTC Holder Rule to address your complaints. Document all unanswered service requests and gather your original contract — a legal review can determine whether you have grounds for relief against the financing company or any successor entity." },
      { q: "Can I cancel my solar contract in Louisiana if the savings aren't what was promised?", a: "Yes — Louisiana's Unfair Trade Practices Law and fraud in the inducement doctrine both provide potential avenues. If your actual utility savings are significantly below what the written proposal projected, gather 12 months of utility bills, your original proposal, and all sales communications. A legal review can determine whether the gap between promised and actual savings meets the threshold for a viable claim." },
    ],
  },
  {
    slug: "santa-ana-ca",
    localHook: "Santa Ana is served by Southern California Edison, which implemented NEM 3.0 in April 2023 — reducing export credits by approximately 75% compared to NEM 2.0. Any homeowner sold a solar system in Santa Ana before April 2023 under NEM 2.0 projections, and who hasn't yet been grandfathered in, may be facing dramatically lower savings than promised. Santa Ana's dense urban environment and high proportion of renters-turned-owners also means many installations face shading issues and HOA complications that were never disclosed during the sales process.",
    marketStats: [
      { label: "SCE NEM 3.0 Export Credit Rate", value: "~2–4¢/kWh (vs. ~30¢ retail under NEM 2.0)" },
      { label: "Santa Ana Avg. Monthly Solar Payment", value: "$195–$240" },
      { label: "CA CSLB Solar Contractor Complaints", value: "3,200+ statewide (2022–2024)" },
      { label: "SCE Average Residential Rate (2025)", value: "~30¢/kWh (one of highest in US)" },
    ],
    topComplaints: [
      "NEM 3.0 transition drastically reduced export credits — savings are a fraction of what was promised under NEM 2.0 projections",
      "Salesperson promised specific SCE rate schedules that have since changed",
      "Shading from neighboring buildings and trees not accounted for in Santa Ana's dense urban environment",
      "Unlicensed or improperly licensed contractors used for installation — CSLB violations",
      "HOA approval required but never obtained — homeowners facing fines and forced removal",
    ],
    companyProblems: [
      { company: "SunPower", issue: "SunPower's bankruptcy and restructuring has left many Santa Ana homeowners uncertain about warranty coverage and monitoring support — service requests go unanswered for weeks." },
      { company: "Sunrun", issue: "Santa Ana homeowners report Sunrun's NEM 2.0-based proposals were still being used after the NEM 3.0 transition date, resulting in actual savings far below projections." },
      { company: "Vivint Solar", issue: "Vivint's door-to-door reps in Santa Ana's Latino communities have faced complaints about Spanish-language misrepresentations — promises made verbally in Spanish that contradicted the English-language contract." },
    ],
    whyItHappens: "Santa Ana's high SCE rates make solar genuinely attractive — but the NEM 3.0 transition fundamentally changed the economics, and many sales reps continued using pre-transition projections. The city's large Spanish-speaking population is disproportionately targeted by sales tactics that exploit language barriers, and the dense urban environment creates shading issues that are rarely disclosed. California's high solar adoption rate means there's intense competition among installers, driving aggressive and sometimes deceptive sales practices.",
    stateLawExpanded: "California's Consumer Legal Remedies Act (CLRA, Civil Code § 1750) and the Contractor State License Law (Bus. & Prof. Code § 7000) provide strong protections for Santa Ana homeowners. The CLRA prohibits misrepresentation of a product's characteristics, benefits, or qualities and allows for actual damages, punitive damages, and attorney's fees. California also has a 3-day right of rescission for home improvement contracts under Civil Code § 1689.7. If your installer was unlicensed or used unlicensed subcontractors, you may be entitled to full contract rescission under the Contractor State License Law — a powerful remedy unique to California.",
    localFaq: [
      { q: "How does SCE's NEM 3.0 affect my solar savings in Santa Ana?", a: "NEM 3.0 reduced export credits from near-retail rates (about 30¢/kWh) to approximately 2–4¢/kWh for most hours. If your proposal was based on NEM 2.0 projections, your actual savings could be 50–75% lower than promised. If you signed after April 2023 and were shown NEM 2.0 projections, that may constitute a material misrepresentation under California's CLRA." },
      { q: "What are my rights if my solar installer in Santa Ana was unlicensed?", a: "California's Contractor State License Law gives you powerful remedies — an unlicensed contractor cannot enforce the contract, and you may be entitled to full rescission and return of all payments. Check your installer's CSLB license number at cslb.ca.gov. If the license was invalid, expired, or the work was performed by unlicensed subcontractors, file a complaint with the CSLB immediately and seek a legal review." },
      { q: "Can I cancel my solar contract in California if the salesperson made promises in Spanish that weren't in the contract?", a: "Yes — California Civil Code § 1632 requires that contracts negotiated in Spanish must be provided in Spanish before signing. If you negotiated in Spanish but only received an English contract, you have the right to rescind. Additionally, verbal misrepresentations made in Spanish that induced you to sign may constitute fraud in the inducement under California law. Document the promises made and seek a legal review." },
    ],
  },
  {
    slug: "new-haven-ct",
    localHook: "New Haven homeowners are served by Eversource Energy, which has some of the highest residential electricity rates in the country — making solar genuinely attractive on paper. But Connecticut's solar market has been plagued by aggressive sales tactics targeting Yale University-area homeowners and working-class neighborhoods alike, with promises about Connecticut's Residential Solar Investment Program (RSIP) that are frequently outdated or inaccurate. If you were sold a system based on RSIP incentives that were no longer available at your contract date, you may have a viable misrepresentation claim.",
    marketStats: [
      { label: "Eversource Average Residential Rate (CT)", value: "~28¢/kWh (2nd highest in continental US)" },
      { label: "New Haven Area Solar Installs (2023)", value: "~2,100 residential systems" },
      { label: "CT DEEP Solar Complaints (2022–2024)", value: "520+ filed" },
      { label: "Typical CT Solar Payback Period", value: "6–9 years (one of best in US due to high rates)" },
    ],
    topComplaints: [
      "RSIP incentives promised during sale were no longer available or had been reduced by the time of installation",
      "Eversource interconnection delays of 3–6 months left homeowners paying both the loan and full utility bills",
      "Historic New Haven homes with older electrical systems required expensive upgrades not disclosed upfront",
      "Salesperson promised specific Eversource rate schedules that have since increased beyond projections",
      "Company installed panels on a rented roof without verifying homeowner vs. renter status",
    ],
    companyProblems: [
      { company: "Sunrun", issue: "New Haven homeowners report Sunrun's RSIP incentive projections were based on program terms that had already changed — actual incentives were lower than the signed proposal indicated." },
      { company: "SunPower", issue: "SunPower's bankruptcy has left New Haven homeowners with unresolved warranty claims and no clear path to service — monitoring systems show alerts with no response from support." },
      { company: "Tesla Solar", issue: "Tesla's New Haven installations have faced complaints about long delays between contract signing and installation, during which the homeowner's Eversource rate tier changed, affecting the economics." },
    ],
    whyItHappens: "New Haven's exceptionally high Eversource rates make solar one of the most financially viable markets in the country — but this also makes it a prime target for aggressive sales tactics. Connecticut's complex incentive landscape (RSIP, virtual net metering, group net metering) creates opportunities for misrepresentation, and the state's older housing stock means unexpected upgrade costs are common. The presence of Yale University and a large student/young professional population creates a market segment that is targeted with sophisticated but sometimes misleading financial modeling.",
    stateLawExpanded: "Connecticut's Unfair Trade Practices Act (CUTPA, C.G.S. § 42-110a) is one of the strongest consumer protection statutes in the country — it prohibits unfair or deceptive acts in commerce and allows for actual damages, punitive damages up to $5,000 per violation, and attorney's fees. Connecticut also has a 3-day right of rescission for home solicitation sales. The CT Department of Energy and Environmental Protection (DEEP) and the Attorney General's office both actively investigate solar fraud complaints. If a salesperson misrepresented RSIP incentives, Eversource rates, or system production, a legal review can determine whether you have a CUTPA claim.",
    localFaq: [
      { q: "What is Connecticut's Residential Solar Investment Program (RSIP) and was I misled about it?", a: "RSIP provides incentive payments for solar installations in Connecticut, but the program has gone through multiple changes — incentive levels have been reduced and waitlists have closed at various points. If your salesperson promised specific RSIP incentives that were no longer available at your contract date, that may constitute a material misrepresentation under CUTPA. Check with CT DEEP's Energize Connecticut program for the current status of any incentives you were promised." },
      { q: "Can I cancel my solar contract in Connecticut if Eversource's interconnection took much longer than promised?", a: "Potentially yes — if the delay caused you to pay both your solar loan and full Eversource bills for an extended period, and the salesperson promised a specific timeline that wasn't met, you may have grounds under CUTPA. Document the promised timeline, the actual interconnection date, and the financial harm caused by the delay. A legal review can assess whether the delay constitutes a breach of contract or deceptive practice." },
      { q: "What should I do if my solar company in New Haven isn't responding to warranty claims?", a: "File a complaint with the Connecticut Department of Consumer Protection and the CT Attorney General's office. If the company is registered with CT DEEP's solar program, file there as well. Connecticut's CUTPA allows you to pursue damages for failure to honor warranty obligations — document every unanswered service request with dates and methods of contact. A legal review can determine the best path to enforcement." },
    ],
  },
  {
    slug: "murfreesboro-tn",
    localHook: "Murfreesboro is one of the fastest-growing cities in Tennessee, and solar companies have followed the population boom — targeting new homeowners with aggressive pitches that rarely account for Middle Tennessee Electric Membership Corporation's (MTEMC) net metering policies, which are significantly less favorable than what most sales reps describe. If you were sold a system in Murfreesboro based on TVA or Nashville Electric Service projections but you're actually served by MTEMC, your savings calculations are likely wrong from the start.",
    marketStats: [
      { label: "Murfreesboro Area Solar Installs (2023)", value: "~1,400 residential systems" },
      { label: "MTEMC Average Residential Rate", value: "~11.8¢/kWh (2025)" },
      { label: "Tennessee Solar Payback Period", value: "10–15 years (due to low utility rates)" },
      { label: "TN AG Solar Complaints (2022–2024)", value: "280+ filed" },
    ],
    topComplaints: [
      "MTEMC's net metering policy is less favorable than what was presented — export credits are well below retail rates",
      "Salesperson used TVA or Nashville Electric projections for a home served by MTEMC — completely different rates",
      "Tennessee's low utility rates mean payback periods are 10–15 years, not the 7 years promised",
      "New construction homes in Rutherford County developments targeted with inflated savings projections",
      "Financing company placed a UCC lien on the home that wasn't clearly explained during the sale",
    ],
    companyProblems: [
      { company: "Sunrun", issue: "Murfreesboro homeowners report Sunrun reps used generic Tennessee utility rate projections rather than MTEMC's actual rates, resulting in savings projections 30–40% above actual performance." },
      { company: "Tesla Solar", issue: "Tesla's online proposal tool doesn't differentiate between TVA-served and MTEMC-served homes in Rutherford County — multiple Murfreesboro homeowners received incorrect utility rate assumptions." },
      { company: "Freedom Forever", issue: "Freedom Forever's production guarantees in Tennessee don't account for the state's lower-than-average solar irradiance in winter months, leading to shortfalls that the company disputes." },
    ],
    whyItHappens: "Murfreesboro's rapid growth has attracted solar companies that treat it as a generic 'Tennessee market' without accounting for the specific utility serving each neighborhood. MTEMC's net metering policies are less favorable than TVA's direct-served areas, and many sales reps either don't know the difference or deliberately use more favorable projections. Tennessee's low utility rates also mean the economics of solar are marginal, but sales pitches rarely reflect this reality.",
    stateLawExpanded: "Tennessee's Consumer Protection Act (T.C.A. § 47-18-101) prohibits unfair or deceptive acts in commerce and allows consumers to recover actual damages, treble damages for willful violations, and attorney's fees. Tennessee also has a 3-day right of rescission for door-to-door sales under the FTC Cooling-Off Rule. The Tennessee Attorney General's Consumer Protection Division investigates solar fraud complaints and has taken action against multiple companies operating in the state. If a salesperson used incorrect utility rate data or misrepresented MTEMC's net metering policy, a legal review can determine whether you have grounds for a Tennessee CPA claim.",
    localFaq: [
      { q: "Is my Murfreesboro home served by MTEMC or TVA directly, and does it matter for solar savings?", a: "Most of Murfreesboro and Rutherford County is served by Middle Tennessee Electric Membership Corporation (MTEMC), not directly by TVA. MTEMC's net metering policy and rate structure differ from TVA's direct-served areas — if your sales proposal used TVA or Nashville Electric Service rate data, the savings projections may be significantly overstated. Contact MTEMC directly to confirm your rate schedule and compare it to your proposal." },
      { q: "Can I cancel my solar contract in Tennessee if the savings projections were based on the wrong utility rates?", a: "Yes — Tennessee's Consumer Protection Act prohibits deceptive acts in consumer transactions, and using incorrect utility rate data to generate inflated savings projections may constitute a deceptive practice. Gather your original proposal, 12 months of MTEMC bills, and any communications with the sales rep. A legal review can determine whether the discrepancy meets the threshold for a viable TCA claim." },
      { q: "What should I do if a solar company placed a lien on my Murfreesboro home without fully explaining it?", a: "A UCC-1 financing statement filed against your home can complicate sales and refinancing. If the financing agreement's lien implications weren't clearly disclosed, this may constitute a deceptive practice under Tennessee's Consumer Protection Act. File a complaint with the Tennessee Attorney General's Consumer Protection Division and seek a legal review to determine your options for addressing the lien." },
    ],
  },
];
