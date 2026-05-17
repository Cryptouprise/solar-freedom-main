// Solar Freedom — State Solar Consumer Rights Data
// Tone: Pro-homeowner, pro-solar technology, anti-predatory-sales
// Every page: psychology hooks, real statute citations, AEO question structure, curiosity gaps

export interface StateLawFAQ {
  q: string;
  a: string;
}

export interface StateLawSection {
  type: 'h2' | 'h3' | 'p' | 'callout' | 'warning' | 'list' | 'stat-block' | 'law-card';
  content?: string;
  items?: string[];
  stats?: { value: string; label: string }[];
  statute?: string;
  statuteTitle?: string;
  statuteDescription?: string;
}

export interface StateLaw {
  slug: string;
  state: string;
  stateAbbr: string;
  metaTitle: string;
  metaDescription: string;
  heroHook: string;
  heroSubhook: string;
  primaryStatute: string;
  primaryStatuteTitle: string;
  coolingOffDays: number;
  coolingOffNote: string;
  aggressivenessRating: 1 | 2 | 3 | 4 | 5; // 5 = most aggressive solar sales market
  content: StateLawSection[];
  faq: StateLawFAQ[];
  relatedCities: string[];
}

export const stateLaws: StateLaw[] = [
  // ─── CALIFORNIA ──────────────────────────────────────────────────────────────
  {
    slug: 'california',
    state: 'California',
    stateAbbr: 'CA',
    metaTitle: 'California Solar Contract Rights: What Every Homeowner Must Know (2026)',
    metaDescription: `California has the strongest solar consumer protection laws in the US. If your contract is missing required disclosures, it may already be voidable. Learn your rights.`,
    heroHook: 'California Gave You More Rights Than Any Other State. Did Your Solar Company Follow the Rules?',
    heroSubhook: 'The Golden State has the most detailed solar consumer protection laws in the country. Most homeowners have no idea how many boxes their installer failed to check.',
    primaryStatute: 'Cal. Bus. & Prof. Code § 7159 / Civil Code § 1689.5',
    primaryStatuteTitle: 'Home Improvement Contract Law + Home Solicitation Sales Act',
    coolingOffDays: 3,
    coolingOffNote: 'Extended to 5 days for seniors (65+) under SB 784 (2026). If the Notice of Cancellation was not provided in 10-point font, the window may be legally extended indefinitely.',
    aggressivenessRating: 5,
    content: [
      {
        type: 'p',
        content: 'Let\'s be clear about something: solar energy is one of the best things to happen to California homeowners in decades. The technology is real. The savings potential is real. The environmental benefit is real. What is not okay — what has never been okay — is the way thousands of California families were sold these systems. Rushed signatures at kitchen tables. Savings projections that assumed utility rates would triple. Tax credit "refund checks" that never existed. That is not solar. That is fraud. And California law has very specific tools to address it.',
      },
      {
        type: 'stat-block',
        stats: [
          { value: '#1', label: 'State for solar consumer protection laws' },
          { value: '5 days', label: 'Cancellation window for seniors under SB 784' },
          { value: '80%', label: 'Reduction in export credits under NEM 3.0 vs. legacy net metering' },
          { value: '§ 7159', label: 'The California code that voids most bad solar contracts' },
        ],
      },
      {
        type: 'h2',
        content: 'The Question Every California Solar Homeowner Should Ask: Did They Follow the Law?',
      },
      {
        type: 'p',
        content: 'California Business & Professions Code § 7159 is the most detailed home improvement contract law in the country. It requires solar contracts to include specific language, specific font sizes, specific disclosures about the right to cancel, and a specific "Solar Energy System Disclosure Document" — all before you sign. If any of these elements are missing, the contract may be legally unenforceable. Not "hard to enforce." Unenforceable.',
      },
      {
        type: 'h3',
        content: 'What § 7159 Requires (And What Most Installers Skip)',
      },
      {
        type: 'list',
        items: [
          'The Solar Energy System Disclosure Document must be provided in 16-point bold type before signing — not buried in an appendix',
          'The contract must clearly state the total price including all dealer fees, finance charges, and soft costs',
          'The "Notice of Right to Cancel" must be on a separate page in 10-point font — not part of the main contract',
          'The installer\'s CSLB license number must appear on the contract — if it\'s missing or invalid, the contract is void',
          'If the salesperson spoke to you in Spanish, Mandarin, Tagalog, Vietnamese, or Korean, the contract must be provided in that language (Civil Code § 1632)',
        ],
      },
      {
        type: 'h2',
        content: 'The NEM 3.0 Betrayal: Why Thousands of California Homeowners Were Sold a System That No Longer Makes Sense',
      },
      {
        type: 'p',
        content: 'On April 15, 2023, the California Public Utilities Commission implemented Net Energy Metering 3.0 — the "Net Billing Tariff." For homeowners on legacy NEM 1.0 or NEM 2.0, nothing changed. But for anyone who signed a contract after that date, the math changed dramatically. Export credits dropped by 75–80%. A system that would have paid for itself in 7 years under NEM 2.0 now takes 12–15 years under NEM 3.0. If a sales rep promised you NEM 2.0 economics after April 2023 — or rushed you to sign "before the deadline" using false urgency — that is a material misrepresentation.',
      },
      {
        type: 'callout',
        content: 'The "sign before the deadline" tactic is one of the most common forms of solar fraud in California. If you were told you needed to sign immediately to "lock in" a rate, incentive, or program that was about to expire — and that claim was false — you may have grounds to void the contract entirely.',
      },
      {
        type: 'h2',
        content: 'SB 784: California\'s 2026 Solar Transparency Act',
      },
      {
        type: 'p',
        content: 'Effective January 1, 2026, SB 784 requires lenders to conduct a live "Confirmation Call" before any solar loan is finalized. The purpose is to ensure you actually understood what you were signing. If your lender skipped this call, rushed through it, or conducted it in a language you don\'t speak fluently, the loan agreement may be rescindable under this new law. Additionally, SB 784 extends the cancellation window to 5 business days for homeowners over 65.',
      },
      {
        type: 'h2',
        content: 'The Tax Credit Lie That Trapped Thousands of California Families',
      },
      {
        type: 'p',
        content: 'The federal Investment Tax Credit (ITC) is a powerful incentive — but it is a non-refundable tax credit, not a cash refund. If you owe $0 in federal taxes, you get $0 back. If you owe $5,000, you get $5,000 — not $15,000. Thousands of California homeowners were told by sales reps that they would receive a "check in the mail" for 30% of their system cost. When that check never arrived, their loan payment ballooned because the lender expected that credit to pay down the principal. If this happened to you, it is textbook fraud in the inducement — and it is one of the strongest grounds available to void a California solar contract.',
      },
      {
        type: 'warning',
        content: 'IMPORTANT: The federal residential solar tax credit (26 USC § 25D) expired for homeowners on December 31, 2025. If a sales rep promised you a 30% tax credit in 2026, they committed fraud. Full stop.',
      },
    ],
    faq: [
      { q: 'Can I cancel my California solar contract after installation?', a: 'Yes, in many cases. If the contract is missing required disclosures under § 7159, if the system was sold under false pretenses, or if the NEM 3.0 transition was misrepresented, you may have grounds for a post-install rescission.' },
      { q: 'What is the Solar Energy System Disclosure Document?', a: 'It is a standardized form required by California law that must be provided before you sign any solar contract. It outlines the total cost, expected production, and key terms in plain language. If you never received it, your contract may be voidable.' },
      { q: 'My solar company went bankrupt. What are my rights in California?', a: 'If your installer is gone, the focus shifts to the lender. You should not be obligated to pay a 25-year loan for a system with no active warranty. California law provides specific remedies for this situation.' },
      { q: 'The rep said I\'d get a $15,000 check. I got nothing. Is that fraud?', a: 'Almost certainly. Misrepresenting the federal tax credit as a cash refund is one of the most common forms of solar fraud in California. It is a primary basis for contract rescission.' },
      { q: 'Does California law protect me if I signed a PPA instead of a loan?', a: 'Yes. PPAs are regulated under California law, and the same disclosure requirements apply. PPA escalator clauses that were not clearly disclosed are a common basis for dispute.' },
      { q: 'What if the contract was in English but the rep spoke to me in Spanish?', a: 'Under California Civil Code § 1632, if the negotiation was conducted in Spanish, the contract must be provided in Spanish before signing. If it was not, the contract may be voidable.' },
    ],
    relatedCities: ['los-angeles-ca', 'san-diego-ca', 'san-jose-ca', 'sacramento-ca', 'fresno-ca'],
  },

  // ─── TEXAS ────────────────────────────────────────────────────────────────────
  {
    slug: 'texas',
    state: 'Texas',
    stateAbbr: 'TX',
    metaTitle: 'Texas Solar Contract Rights: DTPA, Cooling-Off Rules & How to Fight Back (2026)',
    metaDescription: `Texas homeowners have powerful rights under the DTPA. If your solar company lied about net metering, tax credits, or savings, Texas law may let you void the contract.`,
    heroHook: 'Texas Has Some of the Strongest Consumer Protection Laws in the Country. Your Solar Company Probably Hoped You\'d Never Find Out.',
    heroSubhook: 'The Lone Star State\'s Deceptive Trade Practices Act has real teeth. If a solar rep lied to you — about anything — you have legal options most homeowners never explore.',
    primaryStatute: 'Tex. Bus. & Com. Code § 17.46 (DTPA)',
    primaryStatuteTitle: 'Texas Deceptive Trade Practices Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Texas does not have a state-specific extended window, but DTPA violations can create independent grounds for cancellation regardless of when you signed.',
    aggressivenessRating: 5,
    content: [
      {
        type: 'p',
        content: 'Texas is the most deregulated energy market in the country. That complexity is exactly why solar sales teams love it — and exactly why so many Texans end up confused, overcharged, and trapped. The pitch sounds perfect: "Opt out of TXU\'s rate hikes. Lock in your energy costs forever. The sun is free." But in a deregulated market, the math is more complicated than any door-to-door rep is going to explain at your kitchen table. The good news? Texas law is built for exactly this situation.',
      },
      {
        type: 'stat-block',
        stats: [
          { value: 'DTPA', label: 'Texas\'s primary weapon against deceptive solar sales' },
          { value: '3–4¢', label: 'Per kWh that most Texas REPs pay for solar export (vs. 12–15¢ retail)' },
          { value: '3x', label: 'Damages available under DTPA for knowing violations' },
          { value: '§ 17.46', label: 'The Texas code with 27 specific "laundry list" violations' },
        ],
      },
      {
        type: 'h2',
        content: 'The Texas Net Metering Reality Nobody Told You About',
      },
      {
        type: 'p',
        content: 'Here is the thing about Texas solar that changes everything: Texas does not have mandatory statewide net metering. Each Retail Electric Provider (REP) sets its own buyback rate. Most pay 3–4 cents per kilowatt-hour for the power you send back to the grid — while charging you 12–15 cents for what you use at night. If your sales rep showed you a savings calculation based on 1:1 net metering, they either did not know this (incompetence) or did know it (fraud). Either way, the contract may be challengeable.',
      },
      {
        type: 'h2',
        content: 'What the Texas DTPA Actually Gives You',
      },
      {
        type: 'p',
        content: 'The Texas Deceptive Trade Practices Act is one of the most powerful consumer protection statutes in the country. Section 17.46 contains a "laundry list" of 27 specific prohibited acts — and solar sales teams routinely violate multiple items on that list in a single sales presentation.',
      },
      {
        type: 'list',
        items: [
          'Representing that goods or services have characteristics they do not have (§ 17.46(b)(5)) — like claiming panels will eliminate your electric bill',
          'Representing that an agreement confers rights that it does not confer (§ 17.46(b)(12)) — like claiming you\'re in a "government program"',
          'Failing to disclose information intended to induce a consumer into a transaction (§ 17.46(b)(24)) — like hiding the net metering buyback rate',
          'Using false or misleading statements of fact (§ 17.46(b)(5)) — like overstating the federal tax credit',
          'Unconscionable action or course of action (§ 17.50(a)(3)) — like targeting elderly homeowners with complex 25-year contracts',
        ],
      },
      {
        type: 'callout',
        content: 'Under the DTPA, if a company\'s violation was "knowing" or "intentional," you can recover up to three times your actual damages. This is not just about getting out of the contract — it is about being made whole.',
      },
      {
        type: 'h2',
        content: 'The Hidden Dealer Fee That Inflated Your Loan',
      },
      {
        type: 'p',
        content: 'In Texas, the average solar loan includes a dealer fee of 20–30% of the total system cost. This fee is paid by the lender to the installer as a commission — but it is baked into your loan principal. So a system that costs $25,000 to install might result in a $35,000 loan balance on day one. If this fee was not clearly disclosed in your contract, that is a TILA violation at the federal level and potentially a DTPA violation at the state level.',
      },
      {
        type: 'h2',
        content: 'What Happens If Your Texas Solar Company Went Out of Business?',
      },
      {
        type: 'p',
        content: 'Texas has seen a wave of solar installer bankruptcies and market exits — ADT Solar, Titan Solar, and others. If your installer is gone, you are still paying a lender like GoodLeap or Mosaic for a system that has no active warranty support. Texas law provides specific remedies when a contractor abandons a project or fails to perform promised services. The lender\'s security interest in your home does not disappear when the installer does — but your obligation to pay for a non-performing system is a very different legal question.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Texas solar contract after installation?', a: 'Yes, in many cases. DTPA violations, TILA violations, and breach of contract (system underperformance) all provide grounds for post-install cancellation in Texas.' },
      { q: 'What is the Texas DTPA and how does it apply to solar?', a: 'The Deceptive Trade Practices Act prohibits false, misleading, or deceptive acts in commerce. Solar sales reps who lie about savings, tax credits, or net metering rates are violating this law.' },
      { q: 'My Texas solar company went bankrupt. Do I still owe the loan?', a: 'The lender is separate from the installer. However, if the installer\'s failure means the system is not performing as promised, you have grounds to challenge the loan itself.' },
      { q: 'Can I sue my solar company in Texas?', a: 'Yes. The DTPA allows individual consumers to sue for actual damages, and in cases of knowing violations, up to three times those damages plus attorney\'s fees.' },
      { q: 'What if I was told the system would eliminate my electric bill?', a: 'That is a classic DTPA violation. No solar system in Texas can "eliminate" your bill because of fixed utility charges, demand fees, and the low buyback rate for exported power.' },
    ],
    relatedCities: ['houston-tx', 'dallas-tx', 'san-antonio-tx', 'austin-tx', 'fort-worth-tx'],
  },

  // ─── FLORIDA ──────────────────────────────────────────────────────────────────
  {
    slug: 'florida',
    state: 'Florida',
    stateAbbr: 'FL',
    metaTitle: 'Florida Solar Contract Rights: FDUTPA, Cooling-Off Rules & Your Legal Options (2026)',
    metaDescription: `Florida homeowners: FDUTPA, the Home Solicitation Sales Act, and solar disclosure requirements give you powerful tools to cancel a predatory solar contract.`,
    heroHook: 'Florida\'s "Free Solar" Pitch Was a Lie. The Law Knows It. Do You Know Your Rights?',
    heroSubhook: 'The phrase "government-funded solar program" has been used on thousands of Florida doorsteps. It is not a program. It is a 25-year private loan. And Florida law has something to say about that.',
    primaryStatute: 'Fla. Stat. § 501.201 (FDUTPA)',
    primaryStatuteTitle: 'Florida Deceptive and Unfair Trade Practices Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under Florida Statute § 501.021 (Home Solicitation Sales Act). The seller must provide a Home Solicitation Sales permit number and a written Notice of Right to Cancel. Missing either element may extend the cancellation window.',
    aggressivenessRating: 5,
    content: [
      {
        type: 'p',
        content: 'Florida is the third-largest solar market in the country — and one of the most complaint-heavy. The combination of abundant sunshine, a large retiree population, and aggressive out-of-state sales crews has created a perfect storm of predatory solar contracts. The Florida Attorney General has filed multiple enforcement actions against solar companies. The BBB has logged thousands of complaints. And yet, most homeowners still do not know that Florida law gives them specific, powerful tools to fight back.',
      },
      {
        type: 'stat-block',
        stats: [
          { value: '#3', label: 'Florida\'s rank in US solar installations' },
          { value: 'FDUTPA', label: 'Florida\'s primary consumer protection weapon' },
          { value: '§ 501.021', label: 'The Home Solicitation Sales Act that protects kitchen-table signers' },
          { value: '3 days', label: 'Minimum cancellation window — often legally extendable' },
        ],
      },
      {
        type: 'h2',
        content: 'The "Government Program" Lie: Why It\'s Fraud, Not Just a Sales Tactic',
      },
      {
        type: 'p',
        content: 'Across Florida — from Ocala to Homestead to Pensacola — homeowners have been told that their solar system is part of a "state-sponsored program," a "government initiative," or a "utility partnership." None of these programs exist. What does exist is a private, high-interest, 25-year loan. Representing a private financial product as a government program is not an aggressive sales tactic. It is fraud in the inducement — and under FDUTPA, it is a basis for voiding the entire contract.',
      },
      {
        type: 'h2',
        content: 'Florida\'s Home Solicitation Sales Act: The Law That Protects Kitchen-Table Signers',
      },
      {
        type: 'p',
        content: 'Under Florida Statute § 501.021, any salesperson who comes to your home to sell goods or services worth more than $25 must hold a valid Home Solicitation Sales permit. They must provide you with a written "Notice of Right to Cancel" at the time of sale. The notice must be in the same language used during the sales presentation. If any of these requirements were not met, your cancellation window may still be legally open — even if you signed months ago.',
      },
      {
        type: 'h2',
        content: 'The Insurance Bomb Nobody Mentioned',
      },
      {
        type: 'p',
        content: 'Florida\'s homeowners insurance market is already fragile. Adding solar panels can trigger a policy non-renewal, a premium increase of $1,500–$3,000 per year, or a requirement to add a separate equipment rider. In a state where Citizens Insurance is already overwhelmed, this is not a minor detail — it is a major financial impact. If your sales rep did not disclose this, they withheld material information that would have affected your decision. Under FDUTPA, that is an unfair trade practice.',
      },
      {
        type: 'callout',
        content: 'The Florida Attorney General\'s office has taken action against multiple solar companies for deceptive practices. You are not alone, and you are not without options. The law was written specifically for situations like yours.',
      },
      {
        type: 'h2',
        content: 'Hurricane Resilience and the Wind-Load Standard',
      },
      {
        type: 'p',
        content: 'Florida has some of the strictest building codes in the country for a reason. Solar panels must be installed to specific wind-load standards — particularly in High-Velocity Hurricane Zones (HVHZ) in Miami-Dade and Broward counties. Systems that do not meet these standards are not just a warranty issue — they are a safety issue and a building code violation. If your system was installed without a proper permit, without HVHZ-compliant hardware, or without a final inspection, the installation itself may be illegal — which is a powerful basis for contract rescission.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Florida solar contract after installation?', a: 'Yes. FDUTPA violations, missing Home Solicitation Sales permits, and fraud in the inducement all provide grounds for post-install cancellation in Florida.' },
      { q: 'What is FDUTPA and how does it apply to solar?', a: 'The Florida Deceptive and Unfair Trade Practices Act prohibits unfair or deceptive acts in commerce. Solar companies that lie about government programs, tax credits, or savings projections are violating this law.' },
      { q: 'My solar company told me it was a government program. Is that fraud?', a: 'Almost certainly. There is no state-sponsored free solar program in Florida. Representing a private loan as a government program is fraud in the inducement and a primary basis for contract rescission.' },
      { q: 'What if my system doesn\'t meet Florida\'s hurricane wind-load standards?', a: 'If the installation violates Florida Building Code, the contract may be unenforceable. This is particularly relevant in Miami-Dade and Broward counties.' },
      { q: 'Can I cancel if my installer went out of business?', a: 'Yes. If the company that promised you a 25-year warranty is gone, the contract may be in breach. The focus then shifts to the lender.' },
    ],
    relatedCities: ['miami-fl', 'tampa-fl', 'orlando-fl', 'jacksonville-fl', 'fort-lauderdale-fl'],
  },

  // ─── ARIZONA ──────────────────────────────────────────────────────────────────
  {
    slug: 'arizona',
    state: 'Arizona',
    stateAbbr: 'AZ',
    metaTitle: 'Arizona Solar Contract Rights: Consumer Fraud Act & Your Legal Options (2026)',
    metaDescription: `Arizona homeowners: the Consumer Fraud Act (A.R.S. § 44-1522), FTC cooling-off rule, and TILA give you real tools to cancel a predatory solar contract.`,
    heroHook: 'Arizona Has More Sun Than Almost Any State. It Also Has More Solar Fraud Complaints. Here\'s What the Law Says.',
    heroSubhook: 'The Valley of the Sun is ground zero for aggressive solar sales. Arizona\'s Consumer Fraud Act was built for exactly this situation.',
    primaryStatute: 'A.R.S. § 44-1522',
    primaryStatuteTitle: 'Arizona Consumer Fraud Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Arizona does not have a state-specific extended window, but Consumer Fraud Act violations create independent grounds for cancellation.',
    aggressivenessRating: 5,
    content: [
      {
        type: 'p',
        content: 'In the Phoenix metro, Tucson, and Scottsdale, solar sales teams operate like clockwork. They know the neighborhoods, they know the APS and SRP billing cycles, and they know exactly which emotional buttons to push. "Your neighbors are already doing it." "APS rates are going up 40% next year." "This is the last year for the tax credit." These are not sales tactics. They are psychological pressure tools designed to get a signature before you have time to think. Arizona law calls this what it is: fraud.',
      },
      {
        type: 'stat-block',
        stats: [
          { value: '300+', label: 'Days of sunshine per year in Phoenix' },
          { value: 'A.R.S. § 44-1522', label: 'Arizona\'s Consumer Fraud Act — your primary legal weapon' },
          { value: '25 years', label: 'Typical solar contract length — longer than most mortgages' },
          { value: 'UCC-1', label: 'The lien type placed on your home without most homeowners knowing' },
        ],
      },
      {
        type: 'h2',
        content: 'What Arizona\'s Consumer Fraud Act Actually Covers',
      },
      {
        type: 'p',
        content: 'A.R.S. § 44-1522 makes it unlawful to use any deception, deceptive act or practice, false pretense, false promise, or misrepresentation in connection with the sale of any merchandise. "Merchandise" includes services and contracts. This means that if a solar rep made any false statement — about your savings, about the tax credit, about the "government program," about the system\'s production — they violated Arizona law. The remedy is not just a complaint to the BBB. It is a legal basis to void the contract.',
      },
      {
        type: 'h2',
        content: 'The APS and SRP Demand Charge Reality',
      },
      {
        type: 'p',
        content: 'Here is what most Arizona solar reps do not tell you: APS and SRP have complex demand charge structures that can significantly reduce the value of solar. APS\'s Saver Choice Plus rate plan charges based on your peak 15-minute demand window — meaning one hot afternoon with the A/C and dryer running simultaneously can spike your bill regardless of how much solar you generate. SRP\'s E-27 rate plan has similar structures. If your savings projection was based on a simple offset model without accounting for demand charges, the math was wrong — and that is a material misrepresentation.',
      },
      {
        type: 'h2',
        content: 'The Transfer Trap: Why Your Solar System Is Making Your Home Harder to Sell',
      },
      {
        type: 'p',
        content: 'In competitive markets like Gilbert, Chandler, and Scottsdale, a solar lease or loan can kill a home sale. Buyers are required to either assume the contract (taking on your 25-year obligation) or you must pay it off at closing. Most buyers refuse to assume a $40,000 solar debt. If your sales rep told you "buyers love solar" or "the next owner will just take over the payments," they were either naive or dishonest. In Arizona\'s current market, a solar lien is a liability — and misrepresenting it is a Consumer Fraud Act violation.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Arizona solar contract after installation?', a: 'Yes. Consumer Fraud Act violations, TILA violations, and system underperformance all provide grounds for post-install cancellation in Arizona.' },
      { q: 'What is the Arizona Consumer Fraud Act?', a: 'A.R.S. § 44-1522 prohibits deception, false promises, and misrepresentation in any sale. Solar companies that lie about savings, tax credits, or the nature of the contract are violating this law.' },
      { q: 'My APS bill didn\'t go away after solar. Can I cancel?', a: 'If your system was sized or sold based on projections that didn\'t account for APS\'s demand charge structure, you may have grounds for cancellation based on material misrepresentation.' },
      { q: 'What is a UCC-1 lien and how does it affect my Arizona home?', a: 'A UCC-1 fixture filing is a lien placed on your home by the solar lender. It appears on your title and must be paid off or transferred when you sell. If this was not disclosed, it is a material omission.' },
    ],
    relatedCities: ['phoenix-az', 'tucson-az', 'scottsdale-az', 'mesa-az', 'chandler-az'],
  },

  // ─── NEVADA ───────────────────────────────────────────────────────────────────
  {
    slug: 'nevada',
    state: 'Nevada',
    stateAbbr: 'NV',
    metaTitle: 'Nevada Solar Contract Rights: SB 440, AB 458 & Your Legal Options (2026)',
    metaDescription: `Nevada homeowners: SB 440, AB 458, and NRS 598 give you some of the strongest solar consumer protections in the country. Learn your rights before it's too late.`,
    heroHook: 'Nevada Just Passed Some of the Toughest Solar Consumer Protection Laws in America. Does Your Contract Comply?',
    heroSubhook: 'SB 440 requires 16-point font disclosures and a recorded Welcome Call. If your company skipped these steps, your contract may already be voidable.',
    primaryStatute: 'NRS 598.9821 / SB 440 (2025)',
    primaryStatuteTitle: 'Nevada Solar Consumer Protection Act + SB 440',
    coolingOffDays: 3,
    coolingOffNote: 'Under NRS 598.9821. SB 440 (2025) strengthened disclosure requirements significantly. Missing the 16-point font disclosure or the recorded Welcome Call may extend the cancellation window.',
    aggressivenessRating: 4,
    content: [
      {
        type: 'p',
        content: 'Nevada has done something remarkable: it looked at the solar fraud epidemic sweeping the country and passed some of the most specific, detailed consumer protection laws anywhere in the United States. SB 440 and AB 458 are not vague consumer protection principles — they are precise checklists that solar companies must follow, item by item, before a contract is valid. The question is whether your company followed them.',
      },
      {
        type: 'h2',
        content: 'What SB 440 Requires (The Checklist Your Company Probably Skipped)',
      },
      {
        type: 'list',
        items: [
          '16-point bold font on the cover page disclosing the total cost, monthly payment, and contract length',
          'A recorded "Welcome Call" between the lender and homeowner before the loan is finalized — to confirm the homeowner understood the terms',
          'Clear disclosure of any dealer fee added to the loan principal',
          'A plain-language explanation of the difference between the tax credit and a cash refund',
          'Disclosure of the specific net metering tier the homeowner will be placed on (Tier 1, 2, 3, or 4)',
        ],
      },
      {
        type: 'h2',
        content: 'The NV Energy Demand Charge Reality',
      },
      {
        type: 'p',
        content: 'NV Energy\'s Time-of-Use rate plans mean that solar panels alone — without battery storage — may not deliver the savings promised. If your system was sold without a battery and the rep promised you would "eliminate" your NV Energy bill, the math was wrong. Nevada\'s Daily Demand Charges can keep your bill high even on days when your panels are producing at full capacity.',
      },
      {
        type: 'callout',
        content: 'Nevada\'s State Contractors Board now has a dedicated Solar Investigations Unit. If your installer lied about your net metering tier or misrepresented the tax credit, you can file a complaint that triggers a formal investigation — and that investigation creates a paper trail that strengthens your legal case.',
      },
    ],
    faq: [
      { q: 'What does SB 440 require for Nevada solar contracts?', a: 'SB 440 requires 16-point font disclosures, a recorded Welcome Call, clear dealer fee disclosure, and plain-language tax credit explanation. Missing any of these may make the contract voidable.' },
      { q: 'Can I cancel my Nevada solar contract after installation?', a: 'Yes. SB 440 violations, NRS 598 violations, and material misrepresentation all provide grounds for post-install cancellation.' },
      { q: 'What is the Nevada Solar Investigations Unit?', a: 'A dedicated unit within the Nevada State Contractors Board that investigates solar fraud complaints. Filing a complaint creates a formal record that supports your legal case.' },
    ],
    relatedCities: ['las-vegas-nv', 'henderson-nv', 'reno-nv', 'north-las-vegas-nv'],
  },

  // ─── COLORADO ─────────────────────────────────────────────────────────────────
  {
    slug: 'colorado',
    state: 'Colorado',
    stateAbbr: 'CO',
    metaTitle: 'Colorado Solar Contract Rights: SB25-299, CCPA & Your Legal Options (2026)',
    metaDescription: `Colorado homeowners: SB25-299, the Colorado Consumer Protection Act, and the Home Solicitation Sales Act give you new rights to cancel a predatory solar contract in 2026.`,
    heroHook: 'Colorado Just Passed SB25-299 Specifically to Stop Predatory Solar Sales. Here\'s What It Means for Your Contract.',
    heroSubhook: 'The 300 days of sunshine pitch was real. The "government program" pitch was not. Colorado law draws a very clear line between the two.',
    primaryStatute: 'C.R.S. § 6-1-105 (CCPA) / SB25-299',
    primaryStatuteTitle: 'Colorado Consumer Protection Act + SB25-299 Solar Disclosure Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under C.R.S. § 5-3-402 (Home Solicitation Sales Act). SB25-299 adds additional disclosure requirements. Missing the required 4-page disclosure form may extend the cancellation window significantly.',
    aggressivenessRating: 4,
    content: [
      {
        type: 'p',
        content: 'Colorado loves solar. The state has some of the best solar resources in the country, strong net metering policies, and a genuine commitment to clean energy. What Colorado does not love — and what the state legislature made very clear with SB25-299 — is the wave of out-of-state sales crews that descended on Denver, Colorado Springs, and Fort Collins with misleading pitches, fake government program claims, and contracts designed to confuse rather than inform.',
      },
      {
        type: 'h2',
        content: 'What SB25-299 Requires in 2026',
      },
      {
        type: 'p',
        content: 'Effective January 1, 2026, SB25-299 requires every solar company operating in Colorado to provide a standardized 4-page disclosure form before any contract is signed. The form must clearly state the total cost including all fees, the expected energy production based on the specific address (not a generic estimate), the identity of the actual installer (not just the sales company), and a plain-language explanation of the difference between the federal tax credit and a cash refund. If your company did not provide this form, your contract may be voidable under the Colorado Consumer Protection Act.',
      },
      {
        type: 'h2',
        content: 'The Xcel Energy Net Metering Reality',
      },
      {
        type: 'p',
        content: 'Xcel Energy\'s Solar*Rewards program is one of the better net metering programs in the country — but it has caps, waitlists, and complexity that most sales reps gloss over. If your savings projection assumed you would be in the Solar*Rewards program at full retail credit, but you were actually placed on a lower-value rate, your system is underperforming relative to what you were promised. That gap between promise and reality is the foundation of a Colorado Consumer Protection Act claim.',
      },
      {
        type: 'callout',
        content: 'Colorado\'s "Click to Cancel" rules (2025–2026) require companies to provide a simple, accessible way to exit service agreements. If your solar provider is making it impossible to reach support or process a cancellation request, they are in direct violation of state law.',
      },
    ],
    faq: [
      { q: 'What does SB25-299 require for Colorado solar contracts?', a: 'A standardized 4-page disclosure form covering total cost, expected production, installer identity, and tax credit explanation. Missing this form may make the contract voidable.' },
      { q: 'Can I cancel my Colorado solar contract after installation?', a: 'Yes. SB25-299 violations, CCPA violations, and the Home Solicitation Sales Act all provide grounds for post-install cancellation.' },
      { q: 'What is Colorado\'s "Click to Cancel" rule?', a: 'A 2025–2026 law requiring companies to provide a simple way to exit service agreements. Solar companies that make cancellation impossible or difficult are violating this rule.' },
    ],
    relatedCities: ['denver-co', 'colorado-springs-co', 'aurora-co', 'fort-collins-co'],
  },

  // ─── NORTH CAROLINA ───────────────────────────────────────────────────────────
  {
    slug: 'north-carolina',
    state: 'North Carolina',
    stateAbbr: 'NC',
    metaTitle: 'North Carolina Solar Contract Rights: Chapter 75 DTPA & Your Legal Options (2026)',
    metaDescription: `North Carolina homeowners: Chapter 75 of the NC General Statutes, the 3-day cooling-off rule, and Duke Energy NMB misrepresentation give you real grounds to cancel a bad solar deal.`,
    heroHook: 'Duke Energy Changed the Net Metering Rules. Did Your Solar Rep Tell You? North Carolina Law Says They Had To.',
    heroSubhook: 'The Net Metering Bridge tariff slashed export credits by 75%. If your contract was sold on the old math, you may have a legal case.',
    primaryStatute: 'N.C. Gen. Stat. § 75-1.1',
    primaryStatuteTitle: 'North Carolina Unfair and Deceptive Trade Practices Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. NC does not have a state-specific extended window, but Chapter 75 violations create independent grounds for cancellation.',
    aggressivenessRating: 3,
    content: [
      {
        type: 'p',
        content: 'North Carolina has become one of the fastest-growing solar markets in the Southeast — and one of the most complaint-heavy. The combination of Duke Energy\'s complex rate structures, a growing suburban population in the Charlotte and Raleigh metros, and aggressive out-of-state sales crews has created a perfect environment for predatory solar contracts. The state\'s Unfair and Deceptive Trade Practices Act (Chapter 75) is the primary tool for fighting back.',
      },
      {
        type: 'h2',
        content: 'The Duke Energy Net Metering Bridge: The Policy Change That Changed Everything',
      },
      {
        type: 'p',
        content: 'In 2023–2024, Duke Energy Carolinas and Duke Energy Progress transitioned new solar customers from Legacy Net Metering to the "Net Metering Bridge" (NMB) tariff. Under Legacy Net Metering, you received retail-rate credit (approximately 12–14 cents per kWh) for every unit you exported. Under the NMB, that credit dropped to approximately 3–4 cents per kWh — a reduction of 70–75%. If your sales rep used Legacy Net Metering economics to calculate your savings after the NMB transition was announced, they were using numbers they knew (or should have known) were wrong.',
      },
      {
        type: 'h2',
        content: 'What Chapter 75 Covers',
      },
      {
        type: 'p',
        content: 'N.C. Gen. Stat. § 75-1.1 prohibits "unfair or deceptive acts or practices in or affecting commerce." North Carolina courts have interpreted this broadly. Misrepresenting the value of net metering credits, overstating the federal tax credit, using false urgency ("sign today or lose the rate"), and failing to disclose the impact of a solar lien on home sales have all been found to constitute unfair or deceptive practices in North Carolina.',
      },
      {
        type: 'callout',
        content: 'North Carolina law allows homeowners to recover treble damages (three times actual damages) for willful violations of Chapter 75. This is not just about getting out of the contract — it is about being compensated for the harm caused.',
      },
    ],
    faq: [
      { q: 'What is the Duke Energy Net Metering Bridge and why does it matter?', a: 'The NMB tariff reduced export credits by 70–75% compared to Legacy Net Metering. If your system was sold using Legacy NMB economics after the transition was announced, you may have a misrepresentation claim.' },
      { q: 'Can I cancel my North Carolina solar contract after installation?', a: 'Yes. Chapter 75 violations, TILA violations, and system underperformance all provide grounds for post-install cancellation in North Carolina.' },
      { q: 'What does Chapter 75 cover?', a: 'N.C. Gen. Stat. § 75-1.1 prohibits unfair or deceptive acts in commerce. Solar companies that misrepresent net metering credits, tax credits, or savings projections are violating this law.' },
    ],
    relatedCities: ['charlotte-nc', 'raleigh-nc', 'durham-nc', 'greensboro-nc'],
  },

  // ─── GEORGIA ──────────────────────────────────────────────────────────────────
  {
    slug: 'georgia',
    state: 'Georgia',
    stateAbbr: 'GA',
    metaTitle: 'Georgia Solar Contract Rights: Fair Business Practices Act & Your Legal Options (2026)',
    metaDescription: `Georgia homeowners: the Fair Business Practices Act, 30-day cancellation expansion (2023), and FTC cooling-off rule give you real tools to exit a predatory solar contract.`,
    heroHook: 'Georgia Power Pays 3 Cents for Your Solar Power and Charges You 12 Cents for Theirs. Did Your Rep Explain That Math?',
    heroSubhook: 'The "avoided cost" rate is one of the worst in the country for solar owners. If your contract was built on different math, Georgia law gives you a path out.',
    primaryStatute: 'O.C.G.A. § 10-1-390 (FBPA)',
    primaryStatuteTitle: 'Georgia Fair Business Practices Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Georgia expanded protections for large home solicitations in 2023. For solar leases exceeding $10,000, an extended window may apply.',
    aggressivenessRating: 3,
    content: [
      {
        type: 'p',
        content: 'Georgia is a complicated solar market. Georgia Power\'s "avoided cost" buyback rate — approximately 3–4 cents per kWh — is one of the lowest in the country. This means that solar panels in Georgia are most valuable when the power is consumed directly in the home, and nearly worthless when exported to the grid. A well-designed, honestly-sold system can still make financial sense in Georgia. The problem is that most systems in Georgia were not sold honestly — they were sold using net metering math from states like California and New Jersey, where export credits are worth 5–10 times more.',
      },
      {
        type: 'h2',
        content: 'The Georgia Fair Business Practices Act: Your Primary Weapon',
      },
      {
        type: 'p',
        content: 'O.C.G.A. § 10-1-390 prohibits unfair or deceptive acts or practices in the conduct of consumer transactions. If a solar company used misleading savings calculators, made false claims about partnering with Georgia Power, or lied about tax credits, they violated the FBPA. The remedy includes actual damages, injunctive relief, and in some cases, attorney\'s fees.',
      },
      {
        type: 'h2',
        content: 'The 2023 Expansion: Extended Cancellation Rights for Large Home Solicitations',
      },
      {
        type: 'p',
        content: 'As of July 2023, Georgia expanded protections for certain large-scale home solicitations. For many solar leases and loans exceeding $10,000 where the salesperson came to your home, you may have an extended window to cancel if the paperwork was not handled with complete transparency. This is a relatively new protection that many homeowners — and many solar companies — are not yet aware of.',
      },
    ],
    faq: [
      { q: 'What is Georgia\'s "avoided cost" rate and why does it matter?', a: 'Georgia Power pays approximately 3–4 cents per kWh for solar power you export. If your savings projection assumed a higher credit rate, the math was wrong — and that is a basis for a FBPA claim.' },
      { q: 'Can I cancel my Georgia solar contract after installation?', a: 'Yes. FBPA violations, TILA violations, and the 2023 expanded cancellation rights all provide grounds for post-install cancellation in Georgia.' },
      { q: 'What is the Georgia Fair Business Practices Act?', a: 'O.C.G.A. § 10-1-390 prohibits unfair or deceptive acts in consumer transactions. Solar companies that misrepresent savings, tax credits, or utility partnerships are violating this law.' },
    ],
    relatedCities: ['atlanta-ga', 'savannah-ga', 'augusta-ga', 'columbus-ga'],
  },

  // ─── NEW JERSEY ───────────────────────────────────────────────────────────────
  {
    slug: 'new-jersey',
    state: 'New Jersey',
    stateAbbr: 'NJ',
    metaTitle: 'New Jersey Solar Contract Rights: CFA, SREC II & Your Legal Options (2026)',
    metaDescription: `New Jersey homeowners: the Consumer Fraud Act, SREC II program changes, and 3-day cooling-off rule give you powerful tools to cancel a predatory solar contract.`,
    heroHook: 'New Jersey\'s SREC Market Changed. Your Savings Projection Probably Didn\'t. That\'s a Legal Problem for Your Solar Company.',
    heroSubhook: 'The Garden State has some of the best solar economics in the country — when the deal is done right. When it\'s not, the Consumer Fraud Act is one of the most powerful in the nation.',
    primaryStatute: 'N.J.S.A. 56:8-1 et seq.',
    primaryStatuteTitle: 'New Jersey Consumer Fraud Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule and N.J.S.A. 56:12-14 (Home Improvement Practices). The NJ Home Improvement Contractor Registration requirement adds an additional layer of protection.',
    aggressivenessRating: 4,
    content: [
      {
        type: 'p',
        content: 'New Jersey has genuinely excellent solar economics — high electricity rates, strong net metering, and the SREC (Solar Renewable Energy Certificate) market that can generate real additional income. But the complexity of the SREC market is also a major source of misrepresentation. SREC values fluctuate based on market supply and demand. Sales reps who promised fixed SREC income based on peak market values from 2019–2021 were using numbers that no longer exist. That is a material misrepresentation under New Jersey\'s Consumer Fraud Act.',
      },
      {
        type: 'h2',
        content: 'The New Jersey Consumer Fraud Act: One of the Strongest in the Country',
      },
      {
        type: 'p',
        content: 'N.J.S.A. 56:8-1 et seq. is widely considered one of the most powerful consumer protection statutes in the United States. It provides for treble damages (three times actual damages), mandatory attorney\'s fees for successful plaintiffs, and a very broad definition of fraud that covers omissions as well as affirmative misrepresentations. If a solar company failed to disclose the volatility of SREC values, the impact of a solar lien on your home sale, or the true cost including dealer fees, they may have violated the CFA.',
      },
      {
        type: 'h2',
        content: 'Home Improvement Contractor Registration: The Requirement Most Installers Ignore',
      },
      {
        type: 'p',
        content: 'In New Jersey, solar installers are classified as home improvement contractors and must be registered with the Division of Consumer Affairs. If your installer was not registered, or if the contract did not include the required registration number, the contract may be unenforceable. This is a technical requirement that many out-of-state solar companies overlook — and it is a powerful legal lever for New Jersey homeowners.',
      },
    ],
    faq: [
      { q: 'What is the New Jersey Consumer Fraud Act?', a: 'N.J.S.A. 56:8-1 et seq. is one of the strongest consumer protection laws in the US. It provides for treble damages and mandatory attorney\'s fees for successful plaintiffs.' },
      { q: 'What are SRECs and why do they matter for my solar contract?', a: 'Solar Renewable Energy Certificates are tradeable credits that can generate additional income. If your savings projection included inflated SREC values, you may have a misrepresentation claim.' },
      { q: 'Does my New Jersey solar installer need to be registered?', a: 'Yes. Solar installers must be registered as home improvement contractors with the Division of Consumer Affairs. An unregistered installer may render the contract unenforceable.' },
    ],
    relatedCities: ['newark-nj', 'jersey-city-nj', 'trenton-nj', 'camden-nj'],
  },

  // ─── MASSACHUSETTS ────────────────────────────────────────────────────────────
  {
    slug: 'massachusetts',
    state: 'Massachusetts',
    stateAbbr: 'MA',
    metaTitle: 'Massachusetts Solar Contract Rights: Chapter 93A & Your Legal Options (2026)',
    metaDescription: `MA Chapter 93A allows triple damages against deceptive solar companies. SMART program misrepresentation gives strong grounds to cancel. Free case review.`,
    heroHook: 'Massachusetts Chapter 93A Allows Triple Damages Against Deceptive Solar Companies. Does Your Contract Qualify?',
    heroSubhook: 'The Bay State\'s consumer protection law is one of the most powerful in the country. If your solar company lied about SMART incentives, tax credits, or winter production, you may have a case.',
    primaryStatute: 'M.G.L. ch. 93A',
    primaryStatuteTitle: 'Massachusetts Consumer Protection Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under M.G.L. ch. 93, § 48 (Home Solicitation Sales). The company must provide two copies of a specific Notice of Cancellation form. Missing or defective forms may extend the window.',
    aggressivenessRating: 3,
    content: [
      {
        type: 'p',
        content: 'Massachusetts has high electricity rates, strong net metering, and the SMART (Solar Massachusetts Renewable Target) program — making it genuinely one of the better states for solar economics. The problem is that the complexity of the SMART program has become a major source of misrepresentation. SMART incentive rates vary by utility, by capacity block, and by system size. Sales reps who promised fixed SMART income without explaining the block structure were using numbers that may not apply to your specific situation. Under Chapter 93A, that is an unfair or deceptive act.',
      },
      {
        type: 'h2',
        content: 'Chapter 93A: Triple Damages for Willful Violations',
      },
      {
        type: 'p',
        content: 'M.G.L. ch. 93A is one of the most powerful consumer protection statutes in the country. For willful or knowing violations, it allows courts to award up to three times the actual damages — plus mandatory attorney\'s fees. This means that if a solar company knowingly misrepresented the SMART program, the federal tax credit, or winter production estimates, the financial consequences for them can be severe. This leverage is often what brings solar companies to the settlement table.',
      },
      {
        type: 'h2',
        content: 'The Winter Production Reality in New England',
      },
      {
        type: 'p',
        content: 'Boston averages 2,634 hours of sunshine per year — compared to Phoenix\'s 4,300. A system sized for California-style production will dramatically underperform in Massachusetts. If your sales rep used a generic national production estimate without adjusting for New England\'s shorter days, heavier cloud cover, and snow accumulation, the production guarantee in your contract is based on false premises. That is a material misrepresentation.',
      },
    ],
    faq: [
      { q: 'What is the SMART program and how does it affect my solar contract?', a: 'SMART is Massachusetts\'s solar incentive program. Rates vary by utility and capacity block. If your savings projection assumed a higher SMART rate than you actually received, you may have a misrepresentation claim.' },
      { q: 'What does Chapter 93A cover?', a: 'M.G.L. ch. 93A prohibits unfair or deceptive acts in commerce. For willful violations, it allows triple damages and mandatory attorney\'s fees.' },
      { q: 'Can I cancel my Massachusetts solar contract after installation?', a: 'Yes. Chapter 93A violations, Home Improvement Contractor law violations, and material misrepresentation all provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['boston-ma', 'worcester-ma', 'springfield-ma', 'cambridge-ma'],
  },

  // ─── WASHINGTON ───────────────────────────────────────────────────────────────
  {
    slug: 'washington',
    state: 'Washington',
    stateAbbr: 'WA',
    metaTitle: 'Washington Solar Contract Rights: RCW 19.95, Same-Language Rule & Your Options (2026)',
    metaDescription: `Washington homeowners: RCW 19.95 (Solar Consumer Protection Act), the same-language rule, and the 3-day cancellation right give you powerful tools to exit a predatory solar deal.`,
    heroHook: 'Washington\'s Solar Consumer Protection Act Has Very Specific Requirements. Your Company Probably Didn\'t Meet All of Them.',
    heroSubhook: 'RCW 19.95 mandates exact disclosures about dealer fees and production projections. If your contract is missing them, it may be unenforceable.',
    primaryStatute: 'RCW 19.95 / RCW 19.86',
    primaryStatuteTitle: 'Washington Solar Consumer Protection Act + Consumer Protection Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under RCW 63.14.154. RCW 19.95 has increased oversight of the standard cancellation window. Missing the bolded rescission notice may extend the window significantly.',
    aggressivenessRating: 3,
    content: [
      {
        type: 'p',
        content: 'Washington State has done something most states have not: it passed a specific Solar Consumer Protection Act (RCW 19.95) that goes beyond general consumer protection law and addresses the specific deceptions common in solar sales. This law was passed because the legislature recognized that solar contracts are uniquely complex, uniquely long-term, and uniquely vulnerable to misrepresentation. If your company did not follow RCW 19.95 to the letter, your contract may be legally unenforceable.',
      },
      {
        type: 'h2',
        content: 'The Same-Language Rule: A Protection Most Homeowners Don\'t Know About',
      },
      {
        type: 'p',
        content: 'Under Washington law, if your solar rep conducted the sales presentation in a language other than English — Spanish, Tagalog, Vietnamese, Russian, Cantonese — the written contract must be provided in that same language before you sign. This is not a suggestion. It is a legal requirement. If you were handed an English contract after a Spanish-language sales presentation, the contract may be voidable.',
      },
      {
        type: 'h2',
        content: 'The Net Metering Cap: The Policy Risk Nobody Disclosed',
      },
      {
        type: 'p',
        content: 'Washington law only requires utilities to offer 1:1 retail net metering credit until they reach a specific capacity threshold. Major utilities in Washington have been approaching these limits. If your contract was sold with the assumption of full retail net metering credit, but you were placed on a lower-value rate because the utility hit its cap, that is a material change from what you were promised.',
      },
    ],
    faq: [
      { q: 'What does RCW 19.95 require for Washington solar contracts?', a: 'Exact disclosures about dealer fees, production projections, and system components. The contract must include a bolded rescission notice. Missing these elements may make the contract unenforceable.' },
      { q: 'What is the same-language rule in Washington?', a: 'If the sales presentation was in a language other than English, the contract must be provided in that same language before signing. Failure to do so may make the contract voidable.' },
      { q: 'Can I cancel my Washington solar contract after installation?', a: 'Yes. RCW 19.95 violations, the Consumer Protection Act, and material misrepresentation all provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['seattle-wa', 'spokane-wa', 'tacoma-wa', 'bellevue-wa'],
  },

  // ─── OREGON ───────────────────────────────────────────────────────────────────
  {
    slug: 'oregon',
    state: 'Oregon',
    stateAbbr: 'OR',
    metaTitle: 'Oregon Solar Contract Rights: HB 4029, Licensed Agent Rule & Your Options (2026)',
    metaDescription: `Oregon homeowners: HB 4029 (Residential Solar Disclosure Act, effective 2026), the licensed agent requirement, and 3-day cancellation rights give you new tools to exit a bad solar deal.`,
    heroHook: 'Oregon\'s HB 4029 Took Effect January 1, 2026. If Your Contract Predates the Disclosures It Requires, You May Have New Legal Options.',
    heroSubhook: 'The Residential Solar Disclosure Act targets the exact deceptions that flooded Portland and Eugene neighborhoods. Here is how to use it.',
    primaryStatute: 'ORS 646.608 / HB 4029 (2026)',
    primaryStatuteTitle: 'Oregon Unlawful Trade Practices Act + HB 4029 Solar Disclosure Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under ORS 83.710 (Home Solicitation Sales Act). HB 4029 adds additional disclosure requirements effective January 1, 2026.',
    aggressivenessRating: 3,
    content: [
      {
        type: 'p',
        content: 'Oregon passed HB 4029 because the legislature saw what was happening in Portland, Eugene, and Bend: out-of-state sales crews arriving in neighborhoods, claiming to represent "Energy Trust of Oregon" or "Pacific Power\'s solar program," and signing homeowners up for 25-year private loans without adequate disclosure. HB 4029 is the state\'s response — and it is specific, detailed, and enforceable.',
      },
      {
        type: 'h2',
        content: 'The Licensed Agent Requirement: The Rule That Catches Fly-By-Night Operations',
      },
      {
        type: 'p',
        content: 'Under HB 4029, solar contracts in Oregon must be executed by licensed sales agents registered with the state. Many out-of-state solar companies use unlicensed door-to-door representatives who are not registered in Oregon. If your sales rep was not properly licensed, the validity of your contract is highly questionable — and this is one of the easiest violations to verify.',
      },
      {
        type: 'h2',
        content: 'The Energy Trust of Oregon: What It Actually Offers',
      },
      {
        type: 'p',
        content: 'The Energy Trust of Oregon offers real incentives — cash rebates for qualifying solar installations. But these are modest amounts ($0.20–$0.30 per watt in most cases), not the "free solar" or "government-funded program" that many reps claim. If a salesperson implied that the Energy Trust was paying for your system, or that you were enrolled in a government program, they misrepresented the nature of the incentive — and that is a violation of Oregon\'s Unlawful Trade Practices Act.',
      },
    ],
    faq: [
      { q: 'What does HB 4029 require for Oregon solar contracts?', a: 'A plain-language disclosure form, a licensed sales agent, and a good-faith production estimate based on the specific address. Missing these elements may make the contract voidable.' },
      { q: 'What is the Energy Trust of Oregon and how does it affect my contract?', a: 'The Energy Trust offers modest cash rebates for qualifying installations. If a rep claimed it was a "free solar program" or "government funding," that is a material misrepresentation.' },
      { q: 'Can I cancel my Oregon solar contract after installation?', a: 'Yes. HB 4029 violations, the Unlawful Trade Practices Act, and the licensed agent requirement all provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['portland-or', 'eugene-or', 'salem-or', 'bend-or'],
  },

  // ─── ILLINOIS ─────────────────────────────────────────────────────────────────
  {
    slug: 'illinois',
    state: 'Illinois',
    stateAbbr: 'IL',
    metaTitle: 'Illinois Solar Contract Rights: Consumer Fraud Act, SREC Market & Your Options (2026)',
    metaDescription: `Illinois homeowners: the Consumer Fraud and Deceptive Business Practices Act, Illinois SREC market changes, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'Illinois\'s SREC Market Has Changed Dramatically. If Your Solar Contract Was Built on 2021 SREC Values, the Math No Longer Works — and the Law Knows It.',
    heroSubhook: 'The Illinois Consumer Fraud Act is one of the broadest in the Midwest. Misrepresenting SREC income, tax credits, or ComEd savings is a violation.',
    primaryStatute: '815 ILCS 505/2',
    primaryStatuteTitle: 'Illinois Consumer Fraud and Deceptive Business Practices Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under 815 ILCS 505/2B (Home Repair and Remodeling Act). The contractor must be registered with the Illinois Attorney General. An unregistered contractor may render the contract void.',
    aggressivenessRating: 3,
    content: [
      {
        type: 'p',
        content: 'Illinois has a genuinely strong solar incentive program — the Illinois Shines SREC market can generate real additional income for homeowners. The problem is that SREC values in Illinois have been volatile, and many sales reps used peak 2021 values to calculate savings projections that no longer reflect market reality. If your contract was sold on inflated SREC income projections, the financial case for your system may have been fundamentally misrepresented.',
      },
      {
        type: 'h2',
        content: 'The Illinois Consumer Fraud Act: Broad, Powerful, and Frequently Applicable',
      },
      {
        type: 'p',
        content: '815 ILCS 505/2 prohibits unfair or deceptive acts or practices in the conduct of any trade or commerce. Illinois courts have interpreted this broadly to include omissions — not just affirmative misrepresentations. If your solar company failed to disclose the volatility of SREC values, the impact of a solar lien on your home sale, or the true cost including dealer fees, they may have violated the Consumer Fraud Act.',
      },
      {
        type: 'h2',
        content: 'The Home Repair and Remodeling Act: The Registration Requirement',
      },
      {
        type: 'p',
        content: 'Under 815 ILCS 513, solar installers in Illinois must be registered with the Illinois Attorney General as home repair contractors. If your installer was not registered, the contract may be unenforceable. This is a technical requirement that many out-of-state companies overlook.',
      },
    ],
    faq: [
      { q: 'What are Illinois SRECs and why do they matter?', a: 'Solar Renewable Energy Certificates generate additional income from your system. SREC values have been volatile. If your savings projection used inflated SREC values, you may have a misrepresentation claim.' },
      { q: 'Does my Illinois solar installer need to be registered?', a: 'Yes. Under the Home Repair and Remodeling Act, solar installers must be registered with the Illinois AG. An unregistered installer may render the contract void.' },
      { q: 'Can I cancel my Illinois solar contract after installation?', a: 'Yes. Consumer Fraud Act violations, registration requirement violations, and material misrepresentation all provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['chicago-il', 'aurora-il', 'rockford-il', 'joliet-il'],
  },

  // ─── MARYLAND ─────────────────────────────────────────────────────────────────
  {
    slug: 'maryland',
    state: 'Maryland',
    stateAbbr: 'MD',
    metaTitle: 'Maryland Solar Contract Rights: Consumer Protection Act, SREC Market & Your Options (2026)',
    metaDescription: `Maryland homeowners: the Consumer Protection Act, Maryland SREC market changes, and Home Improvement Law give you tools to cancel a predatory solar contract.`,
    heroHook: 'Maryland Has One of the Best SREC Markets in the Country — When the Deal Is Done Right. When It\'s Not, the Consumer Protection Act Is Your Tool.',
    heroSubhook: 'BGE and Pepco rate structures are complex. If your savings projection didn\'t account for them correctly, Maryland law may give you a way out.',
    primaryStatute: 'Md. Code, Com. Law § 13-301',
    primaryStatuteTitle: 'Maryland Consumer Protection Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Maryland Home Improvement Law (Md. Code, Bus. Reg. § 8-301) requires contractor licensing. An unlicensed contractor may render the contract void.',
    aggressivenessRating: 3,
    content: [
      {
        type: 'p',
        content: 'Maryland has a strong solar market — high electricity rates, a robust SREC program, and good net metering policies. But the complexity of the BGE and Pepco rate structures, combined with the volatility of the SREC market, has created significant opportunities for misrepresentation. The Maryland Consumer Protection Act provides a broad remedy for homeowners who were sold a system based on inaccurate financial projections.',
      },
      {
        type: 'h2',
        content: 'Maryland Home Improvement Law: The Licensing Requirement',
      },
      {
        type: 'p',
        content: 'Under Md. Code, Bus. Reg. § 8-301, solar installers in Maryland must be licensed as home improvement contractors. The license number must appear on the contract. If your installer was not licensed, or if the license number is missing from your contract, the agreement may be unenforceable under Maryland law.',
      },
    ],
    faq: [
      { q: 'Does my Maryland solar installer need to be licensed?', a: 'Yes. Under the Home Improvement Law, solar installers must be licensed. A missing or invalid license number may render the contract void.' },
      { q: 'Can I cancel my Maryland solar contract after installation?', a: 'Yes. Consumer Protection Act violations, licensing violations, and material misrepresentation all provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['baltimore-md', 'silver-spring-md', 'annapolis-md', 'rockville-md'],
  },

  // ─── VIRGINIA ─────────────────────────────────────────────────────────────────
  {
    slug: 'virginia',
    state: 'Virginia',
    stateAbbr: 'VA',
    metaTitle: 'Virginia Solar Contract Rights: Consumer Protection Act & Your Legal Options (2026)',
    metaDescription: `Virginia's Consumer Protection Act and Dominion Energy net metering changes give you tools to cancel a predatory solar contract. Free attorney review.`,
    heroHook: 'Dominion Energy Changed Its Net Metering Rules. If Your Solar Rep Used the Old Numbers, Virginia Law May Give You a Way Out.',
    heroSubhook: 'Virginia\'s Consumer Protection Act covers omissions as well as misrepresentations. Not telling you about Dominion\'s export credit changes is a violation.',
    primaryStatute: 'Va. Code § 59.1-200',
    primaryStatuteTitle: 'Virginia Consumer Protection Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Virginia Home Improvement Contractor Registration (Va. Code § 54.1-1100) requires registration. An unregistered contractor may render the contract void.',
    aggressivenessRating: 3,
    content: [
      {
        type: 'p',
        content: 'Virginia\'s solar market is growing rapidly, particularly in Northern Virginia and the Richmond metro. Dominion Energy\'s net metering policies have been evolving, and the transition to new rate structures has left many homeowners with systems that underperform relative to what was promised. The Virginia Consumer Protection Act provides a remedy for homeowners who were sold a system based on outdated or inaccurate financial projections.',
      },
      {
        type: 'h2',
        content: 'The Dominion Energy Net Metering Transition',
      },
      {
        type: 'p',
        content: 'Dominion Energy Virginia has been transitioning customers to new rate structures that affect the value of solar exports. If your sales rep used pre-transition net metering values to calculate your savings, the financial case for your system may have been misrepresented. Virginia law requires disclosure of material facts that would affect a consumer\'s decision — and the net metering rate is unquestionably material.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Virginia solar contract after installation?', a: 'Yes. Consumer Protection Act violations, contractor registration violations, and material misrepresentation all provide grounds for post-install cancellation.' },
      { q: 'Does my Virginia solar installer need to be registered?', a: 'Yes. Under Va. Code § 54.1-1100, solar installers must be registered as home improvement contractors. An unregistered contractor may render the contract void.' },
    ],
    relatedCities: ['virginia-beach-va', 'norfolk-va', 'richmond-va', 'arlington-va'],
  },

  // ─── TENNESSEE ────────────────────────────────────────────────────────────────
  {
    slug: 'tennessee',
    state: 'Tennessee',
    stateAbbr: 'TN',
    metaTitle: 'Tennessee Solar Contract Rights: Consumer Protection Act & Your Legal Options (2026)',
    metaDescription: `Tennessee homeowners: the Consumer Protection Act, TVA Green Power Switch changes, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'TVA\'s Green Power Switch Program Has Changed. If Your Solar Rep Promised TVA Incentives That No Longer Exist, Tennessee Law Is on Your Side.',
    heroSubhook: 'Tennessee\'s Consumer Protection Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'Tenn. Code Ann. § 47-18-104',
    primaryStatuteTitle: 'Tennessee Consumer Protection Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Tennessee does not have a state-specific extended window, but Consumer Protection Act violations create independent grounds for cancellation.',
    aggressivenessRating: 2,
    content: [
      {
        type: 'p',
        content: 'Tennessee is a growing solar market, but it faces unique challenges. TVA (Tennessee Valley Authority) sets the rules for most of the state, and TVA\'s net metering policies are less favorable than many other states. If your sales rep promised savings based on California-style net metering in a TVA service territory, the math was fundamentally wrong. Tennessee\'s Consumer Protection Act provides a remedy for homeowners who were misled.',
      },
      {
        type: 'h2',
        content: 'TVA Net Metering: The Reality Your Rep May Have Hidden',
      },
      {
        type: 'p',
        content: 'TVA\'s Generation Partners program pays approximately 3–4 cents per kWh for solar exports — significantly less than the retail rate. If your savings projection assumed retail-rate net metering, the financial case for your system was overstated. This is a material misrepresentation under Tennessee\'s Consumer Protection Act.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Tennessee solar contract after installation?', a: 'Yes. Consumer Protection Act violations and material misrepresentation provide grounds for post-install cancellation.' },
      { q: 'What is TVA\'s net metering rate?', a: 'TVA pays approximately 3–4 cents per kWh for solar exports. If your savings projection assumed a higher rate, you may have a misrepresentation claim.' },
    ],
    relatedCities: ['nashville-tn', 'memphis-tn', 'knoxville-tn', 'chattanooga-tn'],
  },

  // ─── SOUTH CAROLINA ───────────────────────────────────────────────────────────
  {
    slug: 'south-carolina',
    state: 'South Carolina',
    stateAbbr: 'SC',
    metaTitle: 'South Carolina Solar Contract Rights: UTPA & Your Legal Options (2026)',
    metaDescription: `South Carolina homeowners: the Unfair Trade Practices Act, Duke Energy Carolinas net metering changes, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'South Carolina\'s Solar Market Is Growing Fast. So Is the Number of Homeowners Who Were Misled About What They Were Signing.',
    heroSubhook: 'The Palmetto State\'s Unfair Trade Practices Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'S.C. Code § 39-5-20',
    primaryStatuteTitle: 'South Carolina Unfair Trade Practices Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. South Carolina does not have a state-specific extended window, but UTPA violations create independent grounds for cancellation.',
    aggressivenessRating: 2,
    content: [
      {
        type: 'p',
        content: 'South Carolina is a growing solar market, particularly in the Charleston, Columbia, and Greenville metros. Duke Energy Carolinas and Dominion Energy South Carolina have been transitioning to new net metering structures that affect the value of solar exports. If your sales rep used pre-transition values to calculate your savings, the financial case for your system may have been misrepresented.',
      },
    ],
    faq: [
      { q: 'Can I cancel my South Carolina solar contract after installation?', a: 'Yes. UTPA violations and material misrepresentation provide grounds for post-install cancellation.' },
      { q: 'What is South Carolina\'s net metering policy?', a: 'Net metering policies vary by utility. Duke Energy Carolinas and Dominion Energy SC have been transitioning to new structures. If your savings projection used outdated values, you may have a misrepresentation claim.' },
    ],
    relatedCities: ['columbia-sc', 'charleston-sc', 'greenville-sc', 'rock-hill-sc'],
  },

  // ─── NEW MEXICO ───────────────────────────────────────────────────────────────
  {
    slug: 'new-mexico',
    state: 'New Mexico',
    stateAbbr: 'NM',
    metaTitle: 'New Mexico Solar Contract Rights: UPA & Your Legal Options (2026)',
    metaDescription: `New Mexico homeowners: the Unfair Practices Act, PNM net metering changes, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'New Mexico Has Incredible Solar Resources. It Also Has a Growing Number of Homeowners Who Were Misled About Their Contracts.',
    heroSubhook: 'The Land of Enchantment\'s Unfair Practices Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'N.M. Stat. § 57-12-3',
    primaryStatuteTitle: 'New Mexico Unfair Practices Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. New Mexico does not have a state-specific extended window, but UPA violations create independent grounds for cancellation.',
    aggressivenessRating: 2,
    content: [
      {
        type: 'p',
        content: 'New Mexico has some of the best solar resources in the country — Albuquerque averages over 300 days of sunshine per year. PNM (Public Service Company of New Mexico) has been transitioning its net metering policies, and the changes have affected the financial case for solar. If your sales rep used pre-transition values to calculate your savings, the financial case for your system may have been misrepresented under New Mexico\'s Unfair Practices Act.',
      },
    ],
    faq: [
      { q: 'Can I cancel my New Mexico solar contract after installation?', a: 'Yes. UPA violations and material misrepresentation provide grounds for post-install cancellation.' },
      { q: 'What is PNM\'s net metering policy?', a: 'PNM has been transitioning to new net metering structures. If your savings projection used outdated values, you may have a misrepresentation claim.' },
    ],
    relatedCities: ['albuquerque-nm', 'las-cruces-nm', 'santa-fe-nm', 'rio-rancho-nm'],
  },

  // ─── UTAH ─────────────────────────────────────────────────────────────────────
  {
    slug: 'utah',
    state: 'Utah',
    stateAbbr: 'UT',
    metaTitle: 'Utah Solar Contract Rights: Consumer Sales Practices Act & Your Legal Options (2026)',
    metaDescription: `Utah's Consumer Sales Practices Act and Rocky Mountain Power net metering changes give you tools to cancel a predatory solar contract. Free case review.`,
    heroHook: 'Rocky Mountain Power Changed Its Net Metering Rules. If Your Utah Solar Contract Was Built on the Old Math, You May Have Legal Options.',
    heroSubhook: 'Utah\'s Consumer Sales Practices Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'Utah Code § 13-11-4',
    primaryStatuteTitle: 'Utah Consumer Sales Practices Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Utah does not have a state-specific extended window, but CSPA violations create independent grounds for cancellation.',
    aggressivenessRating: 3,
    content: [
      {
        type: 'p',
        content: 'Utah has seen significant solar growth, particularly in the Salt Lake Valley and St. George area. Rocky Mountain Power\'s transition to new net metering structures has affected the financial case for solar significantly. If your sales rep used pre-transition values, the financial case for your system may have been misrepresented. Utah\'s Consumer Sales Practices Act provides a remedy.',
      },
      {
        type: 'h2',
        content: 'Rocky Mountain Power\'s Net Metering Transition',
      },
      {
        type: 'p',
        content: 'Rocky Mountain Power has been transitioning Utah solar customers to a new rate structure that reduces the value of exported power. The transition has been phased, and many homeowners were sold systems based on pre-transition economics. If your savings projection assumed the old net metering rate, the financial case for your system was overstated.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Utah solar contract after installation?', a: 'Yes. Consumer Sales Practices Act violations and material misrepresentation provide grounds for post-install cancellation.' },
      { q: 'What is Rocky Mountain Power\'s net metering policy?', a: 'RMP has transitioned to a new rate structure. If your savings projection used pre-transition values, you may have a misrepresentation claim.' },
    ],
    relatedCities: ['salt-lake-city-ut', 'west-valley-city-ut', 'provo-ut', 'st-george-ut'],
  },

  // ─── HAWAII ───────────────────────────────────────────────────────────────────
  {
    slug: 'hawaii',
    state: 'Hawaii',
    stateAbbr: 'HI',
    metaTitle: 'Hawaii Solar Contract Rights: UDAP, NEM Transition & Your Legal Options (2026)',
    metaDescription: `Hawaii homeowners: UDAP law and HECO net metering changes give you strong grounds to cancel a predatory solar contract. Free case review.`,
    heroHook: 'Hawaii Ended Net Metering in 2015. If Your Solar Contract Was Sold on Net Metering Math After That Date, Something Is Very Wrong.',
    heroSubhook: 'Hawaii\'s UDAP law covers the exact deceptions used in solar sales. The islands have some of the most complex solar economics in the country.',
    primaryStatute: 'Haw. Rev. Stat. § 480-2',
    primaryStatuteTitle: 'Hawaii Unfair and Deceptive Acts and Practices Law',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Hawaii does not have a state-specific extended window, but UDAP violations create independent grounds for cancellation.',
    aggressivenessRating: 3,
    content: [
      {
        type: 'p',
        content: 'Hawaii has the highest electricity rates in the country — and was the first state to end traditional net metering. HECO\'s Customer Self-Supply (CSS) and Customer Grid-Supply (CGS) programs replaced net metering in 2015. If a sales rep in Hawaii is still using net metering language to sell a system, they are either uninformed or dishonest. Either way, the financial projections are wrong — and Hawaii\'s UDAP law provides a remedy.',
      },
    ],
    faq: [
      { q: 'Does Hawaii still have net metering?', a: 'No. Hawaii ended traditional net metering in 2015. HECO\'s CSS and CGS programs replaced it. If your sales rep used net metering language, the financial projections may be wrong.' },
      { q: 'Can I cancel my Hawaii solar contract after installation?', a: 'Yes. UDAP violations and material misrepresentation provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['honolulu-hi', 'hilo-hi', 'kailua-hi', 'pearl-city-hi'],
  },

  // ─── MINNESOTA ────────────────────────────────────────────────────────────────
  {
    slug: 'minnesota',
    state: 'Minnesota',
    stateAbbr: 'MN',
    metaTitle: 'Minnesota Solar Contract Rights: Consumer Fraud Act & Your Legal Options (2026)',
    metaDescription: `Minnesota homeowners: the Consumer Fraud Act, Xcel Energy solar program changes, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'Minnesota\'s Solar Incentives Are Real. The "Free Solar" Pitch Is Not. Here\'s What the Law Says.',
    heroSubhook: 'Xcel Energy\'s Solar*Rewards program is legitimate — but it has caps and waitlists that most reps don\'t mention. Minnesota law requires full disclosure.',
    primaryStatute: 'Minn. Stat. § 325F.69',
    primaryStatuteTitle: 'Minnesota Consumer Fraud Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Minnesota does not have a state-specific extended window, but Consumer Fraud Act violations create independent grounds for cancellation.',
    aggressivenessRating: 2,
    content: [
      {
        type: 'p',
        content: 'Minnesota has a growing solar market, particularly in the Twin Cities metro. Xcel Energy\'s Solar*Rewards program offers real incentives — but it has capacity caps and waitlists that many sales reps fail to disclose. If your savings projection assumed immediate enrollment in Solar*Rewards at the maximum incentive rate, the financial case for your system may have been overstated.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Minnesota solar contract after installation?', a: 'Yes. Consumer Fraud Act violations and material misrepresentation provide grounds for post-install cancellation.' },
      { q: 'What is Xcel Energy\'s Solar*Rewards program?', a: 'A solar incentive program with capacity caps and waitlists. If your savings projection assumed immediate enrollment at the maximum rate, you may have a misrepresentation claim.' },
    ],
    relatedCities: ['minneapolis-mn', 'saint-paul-mn', 'rochester-mn', 'duluth-mn'],
  },

  // ─── OHIO ─────────────────────────────────────────────────────────────────────
  {
    slug: 'ohio',
    state: 'Ohio',
    stateAbbr: 'OH',
    metaTitle: 'Ohio Solar Contract Rights: Consumer Sales Practices Act & Your Legal Options (2026)',
    metaDescription: `Ohio's Consumer Sales Practices Act and AEP/FirstEnergy net metering changes give you tools to cancel a predatory solar contract. Free case review.`,
    heroHook: 'Ohio\'s Net Metering Policies Are Among the Most Restrictive in the Midwest. Did Your Solar Rep Tell You That?',
    heroSubhook: 'Ohio\'s Consumer Sales Practices Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'Ohio Rev. Code § 1345.02',
    primaryStatuteTitle: 'Ohio Consumer Sales Practices Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Ohio does not have a state-specific extended window, but CSPA violations create independent grounds for cancellation.',
    aggressivenessRating: 2,
    content: [
      {
        type: 'p',
        content: 'Ohio has some of the most restrictive net metering policies in the Midwest. AEP Ohio and FirstEnergy have been transitioning to new rate structures that reduce the value of solar exports. If your sales rep used pre-transition values or California-style net metering math to calculate your savings, the financial case for your system was fundamentally wrong.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Ohio solar contract after installation?', a: 'Yes. Consumer Sales Practices Act violations and material misrepresentation provide grounds for post-install cancellation.' },
      { q: 'What is Ohio\'s net metering policy?', a: 'Ohio\'s net metering policies are among the most restrictive in the Midwest. AEP and FirstEnergy have been transitioning to new structures. If your savings projection used outdated values, you may have a misrepresentation claim.' },
    ],
    relatedCities: ['columbus-oh', 'cleveland-oh', 'cincinnati-oh', 'toledo-oh'],
  },

  // ─── PENNSYLVANIA ─────────────────────────────────────────────────────────────
  {
    slug: 'pennsylvania',
    state: 'Pennsylvania',
    stateAbbr: 'PA',
    metaTitle: 'Pennsylvania Solar Contract Rights: UTPCPL & Your Legal Options (2026)',
    metaDescription: `Pennsylvania homeowners: the Unfair Trade Practices and Consumer Protection Law, SREC market changes, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'Pennsylvania\'s SREC Market Has Changed. If Your Solar Contract Was Built on 2021 SREC Values, the Math No Longer Works.',
    heroSubhook: 'The UTPCPL is one of the strongest consumer protection laws in the Northeast. Misrepresenting SREC income, tax credits, or PECO/PPL savings is a violation.',
    primaryStatute: '73 P.S. § 201-3',
    primaryStatuteTitle: 'Pennsylvania Unfair Trade Practices and Consumer Protection Law',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Pennsylvania Home Improvement Consumer Protection Act (73 P.S. § 517.3) requires contractor registration. An unregistered contractor may render the contract void.',
    aggressivenessRating: 3,
    content: [
      {
        type: 'p',
        content: 'Pennsylvania has a strong solar market, particularly in the Philadelphia and Pittsburgh metros. The state\'s SREC market has been volatile, and many sales reps used peak SREC values to calculate savings projections that no longer reflect market reality. Pennsylvania\'s UTPCPL provides a broad remedy for homeowners who were misled.',
      },
      {
        type: 'h2',
        content: 'The Home Improvement Consumer Protection Act: The Registration Requirement',
      },
      {
        type: 'p',
        content: 'Under 73 P.S. § 517.3, solar installers in Pennsylvania must be registered as home improvement contractors. The registration number must appear on the contract. If your installer was not registered, or if the number is missing, the contract may be unenforceable.',
      },
    ],
    faq: [
      { q: 'Does my Pennsylvania solar installer need to be registered?', a: 'Yes. Under the Home Improvement Consumer Protection Act, solar installers must be registered. A missing registration number may render the contract void.' },
      { q: 'Can I cancel my Pennsylvania solar contract after installation?', a: 'Yes. UTPCPL violations, registration violations, and material misrepresentation all provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['philadelphia-pa', 'pittsburgh-pa', 'allentown-pa', 'erie-pa'],
  },

  // ─── NEW YORK ─────────────────────────────────────────────────────────────────
  {
    slug: 'new-york',
    state: 'New York',
    stateAbbr: 'NY',
    metaTitle: 'New York Solar Contract Rights: GBL § 349, NY-Sun Program & Your Legal Options (2026)',
    metaDescription: `New York homeowners: General Business Law § 349, the NY-Sun Incentive Program, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'New York\'s NY-Sun Program Is Real. The "Government-Funded Free Solar" Pitch Is Not. Here\'s What GBL § 349 Says About That.',
    heroSubhook: 'New York\'s consumer protection law covers the exact deceptions used in solar sales. Con Edison and PSEG rates are complex — and most reps get the math wrong.',
    primaryStatute: 'N.Y. Gen. Bus. Law § 349',
    primaryStatuteTitle: 'New York General Business Law § 349 (Consumer Protection)',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. New York Home Improvement Contractor Law (N.Y. Gen. Bus. Law § 770) requires licensing. An unlicensed contractor may render the contract void.',
    aggressivenessRating: 4,
    content: [
      {
        type: 'p',
        content: 'New York has some of the highest electricity rates in the country and a robust solar incentive program (NY-Sun). But the complexity of Con Edison, PSEG, and National Grid rate structures — combined with the NY-Sun program\'s capacity caps and incentive tiers — creates significant opportunities for misrepresentation. GBL § 349 is New York\'s primary consumer protection weapon, and it has been used successfully against solar companies.',
      },
      {
        type: 'h2',
        content: 'The NY-Sun Program: What It Actually Offers',
      },
      {
        type: 'p',
        content: 'NY-Sun offers incentives that vary by utility territory, system size, and capacity block. Many sales reps promise "NY-Sun funding" as if it covers the entire system cost. In reality, NY-Sun incentives typically reduce the cost by $0.20–$0.40 per watt — meaningful, but not "free solar." If a rep implied that NY-Sun was paying for your system, that is a material misrepresentation.',
      },
      {
        type: 'h2',
        content: 'Home Improvement Contractor Licensing: New York\'s Technical Requirement',
      },
      {
        type: 'p',
        content: 'Under N.Y. Gen. Bus. Law § 770, solar installers in New York must be licensed as home improvement contractors. The license number must appear on the contract. If your installer was not licensed, or if the number is missing, the contract may be unenforceable.',
      },
    ],
    faq: [
      { q: 'What is the NY-Sun program and how does it affect my contract?', a: 'NY-Sun offers incentives that vary by territory and capacity block. If a rep implied it was "free solar," that is a material misrepresentation.' },
      { q: 'Does my New York solar installer need to be licensed?', a: 'Yes. Under GBL § 770, solar installers must be licensed. A missing license number may render the contract void.' },
      { q: 'Can I cancel my New York solar contract after installation?', a: 'Yes. GBL § 349 violations, licensing violations, and material misrepresentation all provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['new-york-city-ny', 'buffalo-ny', 'rochester-ny', 'yonkers-ny'],
  },

  // ─── CONNECTICUT ──────────────────────────────────────────────────────────────
  {
    slug: 'connecticut',
    state: 'Connecticut',
    stateAbbr: 'CT',
    metaTitle: 'Connecticut Solar Contract Rights: CUTPA & Your Legal Options (2026)',
    metaDescription: `Connecticut homeowners: CUTPA, the ZREC/LREC program changes, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'Connecticut Has Some of the Highest Electricity Rates in the Northeast. That Made It a Target for Aggressive Solar Sales. CUTPA Is Your Defense.',
    heroSubhook: 'The Connecticut Unfair Trade Practices Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'Conn. Gen. Stat. § 42-110b',
    primaryStatuteTitle: 'Connecticut Unfair Trade Practices Act (CUTPA)',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Connecticut does not have a state-specific extended window, but CUTPA violations create independent grounds for cancellation.',
    aggressivenessRating: 3,
    content: [
      {
        type: 'p',
        content: 'Connecticut has some of the highest electricity rates in the country, making it a prime target for solar sales teams. The state\'s ZREC (Zero Emission Renewable Energy Credit) and LREC programs have been transitioning, and many sales reps used peak program values to calculate savings projections that no longer reflect reality. CUTPA provides a broad remedy for homeowners who were misled.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Connecticut solar contract after installation?', a: 'Yes. CUTPA violations and material misrepresentation provide grounds for post-install cancellation.' },
      { q: 'What is CUTPA?', a: 'The Connecticut Unfair Trade Practices Act prohibits unfair or deceptive acts in commerce. Solar companies that misrepresent ZREC/LREC income, tax credits, or savings projections are violating this law.' },
    ],
    relatedCities: ['bridgeport-ct', 'new-haven-ct', 'hartford-ct', 'stamford-ct'],
  },

  // ─── RHODE ISLAND ─────────────────────────────────────────────────────────────
  {
    slug: 'rhode-island',
    state: 'Rhode Island',
    stateAbbr: 'RI',
    metaTitle: 'Rhode Island Solar Contract Rights: DTPA & Your Legal Options (2026)',
    metaDescription: `Rhode Island homeowners: the Deceptive Trade Practices Act, National Grid net metering changes, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'Rhode Island Has Strong Solar Incentives. It Also Has a Growing Number of Homeowners Who Were Misled About Their Contracts.',
    heroSubhook: 'The Ocean State\'s Deceptive Trade Practices Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'R.I. Gen. Laws § 6-13.1-2',
    primaryStatuteTitle: 'Rhode Island Deceptive Trade Practices Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Rhode Island does not have a state-specific extended window, but DTPA violations create independent grounds for cancellation.',
    aggressivenessRating: 2,
    content: [
      {
        type: 'p',
        content: 'Rhode Island has strong solar economics — high electricity rates and good net metering policies. But National Grid\'s rate structure is complex, and many sales reps oversimplify the savings calculation. Rhode Island\'s Deceptive Trade Practices Act provides a remedy for homeowners who were misled.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Rhode Island solar contract after installation?', a: 'Yes. DTPA violations and material misrepresentation provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['providence-ri', 'cranston-ri', 'warwick-ri', 'pawtucket-ri'],
  },

  // ─── MICHIGAN ─────────────────────────────────────────────────────────────────
  {
    slug: 'michigan',
    state: 'Michigan',
    stateAbbr: 'MI',
    metaTitle: 'Michigan Solar Contract Rights: Consumer Protection Act & Your Legal Options (2026)',
    metaDescription: `Michigan homeowners: the Consumer Protection Act, DTE and Consumers Energy net metering changes, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'Michigan\'s Net Metering Policies Changed in 2024. If Your Solar Contract Was Built on the Old Math, You May Have Legal Options.',
    heroSubhook: 'Michigan\'s Consumer Protection Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'Mich. Comp. Laws § 445.903',
    primaryStatuteTitle: 'Michigan Consumer Protection Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Michigan does not have a state-specific extended window, but CPA violations create independent grounds for cancellation.',
    aggressivenessRating: 2,
    content: [
      {
        type: 'p',
        content: 'Michigan\'s net metering policies changed significantly in 2024, affecting the financial case for solar. DTE Energy and Consumers Energy have been transitioning to new rate structures that reduce the value of solar exports. If your sales rep used pre-transition values to calculate your savings, the financial case for your system may have been misrepresented.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Michigan solar contract after installation?', a: 'Yes. Consumer Protection Act violations and material misrepresentation provide grounds for post-install cancellation.' },
      { q: 'What changed with Michigan\'s net metering in 2024?', a: 'DTE and Consumers Energy transitioned to new rate structures that reduced export credit values. If your savings projection used pre-transition values, you may have a misrepresentation claim.' },
    ],
    relatedCities: ['detroit-mi', 'grand-rapids-mi', 'warren-mi', 'sterling-heights-mi'],
  },

  // ─── INDIANA ──────────────────────────────────────────────────────────────────
  {
    slug: 'indiana',
    state: 'Indiana',
    stateAbbr: 'IN',
    metaTitle: 'Indiana Solar Contract Rights: Deceptive Consumer Sales Act & Your Legal Options (2026)',
    metaDescription: `Indiana homeowners: the Deceptive Consumer Sales Act, Duke Energy Indiana net metering policies, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'Indiana\'s Net Metering Policies Are Among the Most Restrictive in the Midwest. Did Your Solar Rep Explain That?',
    heroSubhook: 'Indiana\'s Deceptive Consumer Sales Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'Ind. Code § 24-5-0.5-3',
    primaryStatuteTitle: 'Indiana Deceptive Consumer Sales Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Indiana does not have a state-specific extended window, but DCSA violations create independent grounds for cancellation.',
    aggressivenessRating: 2,
    content: [
      {
        type: 'p',
        content: 'Indiana has some of the most restrictive net metering policies in the Midwest. Duke Energy Indiana and AES Indiana have been transitioning to new rate structures that significantly reduce the value of solar exports. If your sales rep used California-style net metering math to calculate your savings in Indiana, the financial case for your system was fundamentally wrong.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Indiana solar contract after installation?', a: 'Yes. Deceptive Consumer Sales Act violations and material misrepresentation provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['indianapolis-in', 'fort-wayne-in', 'evansville-in', 'south-bend-in'],
  },

  // ─── WISCONSIN ────────────────────────────────────────────────────────────────
  {
    slug: 'wisconsin',
    state: 'Wisconsin',
    stateAbbr: 'WI',
    metaTitle: 'Wisconsin Solar Contract Rights: DATCP Rules & Your Legal Options (2026)',
    metaDescription: `Wisconsin homeowners: DATCP consumer protection rules, We Energies and WPS net metering policies, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'Wisconsin\'s Solar Market Is Growing. So Is the Number of Homeowners Who Were Misled About What They Were Signing.',
    heroSubhook: 'Wisconsin\'s DATCP consumer protection rules cover the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'Wis. Stat. § 100.18',
    primaryStatuteTitle: 'Wisconsin Deceptive Advertising and Trade Practices',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Wisconsin does not have a state-specific extended window, but § 100.18 violations create independent grounds for cancellation.',
    aggressivenessRating: 2,
    content: [
      {
        type: 'p',
        content: 'Wisconsin has a growing solar market, particularly in the Milwaukee and Madison metros. We Energies and Wisconsin Public Service have been transitioning to new net metering structures. If your sales rep used pre-transition values to calculate your savings, the financial case for your system may have been misrepresented.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Wisconsin solar contract after installation?', a: 'Yes. Wis. Stat. § 100.18 violations and material misrepresentation provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['milwaukee-wi', 'madison-wi', 'green-bay-wi', 'kenosha-wi'],
  },

  // ─── MISSOURI ─────────────────────────────────────────────────────────────────
  {
    slug: 'missouri',
    state: 'Missouri',
    stateAbbr: 'MO',
    metaTitle: 'Missouri Solar Contract Rights: Merchandising Practices Act & Your Legal Options (2026)',
    metaDescription: `Missouri homeowners: the Merchandising Practices Act, Ameren and KCP&L net metering policies, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'Missouri\'s Net Metering Policies Are Restrictive. If Your Solar Rep Used California Math in Missouri, That\'s a Problem.',
    heroSubhook: 'Missouri\'s Merchandising Practices Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'Mo. Rev. Stat. § 407.020',
    primaryStatuteTitle: 'Missouri Merchandising Practices Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Missouri does not have a state-specific extended window, but MPA violations create independent grounds for cancellation.',
    aggressivenessRating: 2,
    content: [
      {
        type: 'p',
        content: 'Missouri has restrictive net metering policies, and Ameren Missouri and KCP&L have been transitioning to new rate structures. If your sales rep used pre-transition values or California-style net metering math, the financial case for your system was fundamentally wrong. Missouri\'s Merchandising Practices Act provides a remedy.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Missouri solar contract after installation?', a: 'Yes. Merchandising Practices Act violations and material misrepresentation provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['kansas-city-mo', 'saint-louis-mo', 'springfield-mo', 'columbia-mo'],
  },

  // ─── KANSAS ───────────────────────────────────────────────────────────────────
  {
    slug: 'kansas',
    state: 'Kansas',
    stateAbbr: 'KS',
    metaTitle: 'Kansas Solar Contract Rights: Consumer Protection Act & Your Legal Options (2026)',
    metaDescription: `Kansas homeowners: the Consumer Protection Act, Evergy net metering policies, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'Kansas Has Good Solar Resources. It Also Has Utility Policies That Make Solar Math Complicated. Did Your Rep Explain That?',
    heroSubhook: 'Kansas\'s Consumer Protection Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'Kan. Stat. § 50-626',
    primaryStatuteTitle: 'Kansas Consumer Protection Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Kansas does not have a state-specific extended window, but KCPA violations create independent grounds for cancellation.',
    aggressivenessRating: 2,
    content: [
      {
        type: 'p',
        content: 'Kansas has good solar resources but complex utility policies. Evergy\'s net metering structure limits the value of solar exports, and many sales reps oversimplify the savings calculation. Kansas\'s Consumer Protection Act provides a remedy for homeowners who were misled.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Kansas solar contract after installation?', a: 'Yes. Consumer Protection Act violations and material misrepresentation provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['wichita-ks', 'overland-park-ks', 'kansas-city-ks', 'topeka-ks'],
  },

  // ─── OKLAHOMA ─────────────────────────────────────────────────────────────────
  {
    slug: 'oklahoma',
    state: 'Oklahoma',
    stateAbbr: 'OK',
    metaTitle: 'Oklahoma Solar Contract Rights: Consumer Protection Act & Your Legal Options (2026)',
    metaDescription: `Oklahoma homeowners: the Consumer Protection Act, OG&E net metering policies, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'Oklahoma Has Abundant Sun and Restrictive Net Metering. If Your Solar Rep Didn\'t Explain the Difference, Oklahoma Law Did.',
    heroSubhook: 'Oklahoma\'s Consumer Protection Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'Okla. Stat. tit. 15, § 753',
    primaryStatuteTitle: 'Oklahoma Consumer Protection Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Oklahoma does not have a state-specific extended window, but CPA violations create independent grounds for cancellation.',
    aggressivenessRating: 2,
    content: [
      {
        type: 'p',
        content: 'Oklahoma has abundant solar resources but restrictive net metering policies. OG&E and PSO have been transitioning to new rate structures that limit the value of solar exports. If your sales rep used California-style net metering math in Oklahoma, the financial case for your system was fundamentally wrong.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Oklahoma solar contract after installation?', a: 'Yes. Consumer Protection Act violations and material misrepresentation provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['oklahoma-city-ok', 'tulsa-ok', 'norman-ok', 'broken-arrow-ok'],
  },

  // ─── ARKANSAS ─────────────────────────────────────────────────────────────────
  {
    slug: 'arkansas',
    state: 'Arkansas',
    stateAbbr: 'AR',
    metaTitle: 'Arkansas Solar Contract Rights: Deceptive Trade Practices Act & Your Legal Options (2026)',
    metaDescription: `Arkansas homeowners: the Deceptive Trade Practices Act, Entergy and AEP net metering policies, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'Arkansas Has Good Solar Resources and Weak Net Metering Policies. If Your Rep Didn\'t Explain the Difference, Arkansas Law Is on Your Side.',
    heroSubhook: 'Arkansas\'s Deceptive Trade Practices Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'Ark. Code § 4-88-107',
    primaryStatuteTitle: 'Arkansas Deceptive Trade Practices Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Arkansas does not have a state-specific extended window, but DTPA violations create independent grounds for cancellation.',
    aggressivenessRating: 2,
    content: [
      {
        type: 'p',
        content: 'Arkansas has good solar resources but weak net metering policies. Entergy Arkansas and AEP pay low rates for solar exports, making the financial case for solar more dependent on self-consumption than in most states. If your sales rep used a simple offset model without explaining this, the financial projections were misleading.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Arkansas solar contract after installation?', a: 'Yes. Deceptive Trade Practices Act violations and material misrepresentation provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['little-rock-ar', 'fort-smith-ar', 'fayetteville-ar', 'springdale-ar'],
  },

  // ─── LOUISIANA ────────────────────────────────────────────────────────────────
  {
    slug: 'louisiana',
    state: 'Louisiana',
    stateAbbr: 'LA',
    metaTitle: 'Louisiana Solar Contract Rights: Unfair Trade Practices Act & Your Legal Options (2026)',
    metaDescription: `Louisiana's Unfair Trade Practices Act and Entergy Louisiana net metering policies give you tools to cancel a predatory solar contract. Free case review.`,
    heroHook: 'Louisiana Has Abundant Sun and a Growing Solar Market. It Also Has a Growing Number of Homeowners Who Were Misled About Their Contracts.',
    heroSubhook: 'Louisiana\'s Unfair Trade Practices Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'La. Rev. Stat. § 51:1405',
    primaryStatuteTitle: 'Louisiana Unfair Trade Practices and Consumer Protection Law',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Louisiana does not have a state-specific extended window, but UTPCPL violations create independent grounds for cancellation.',
    aggressivenessRating: 2,
    content: [
      {
        type: 'p',
        content: 'Louisiana has abundant solar resources and a growing market, particularly in the New Orleans and Baton Rouge metros. Entergy Louisiana\'s net metering policies have been evolving, and many sales reps oversimplify the savings calculation. Louisiana\'s Unfair Trade Practices Act provides a remedy for homeowners who were misled.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Louisiana solar contract after installation?', a: 'Yes. UTPCPL violations and material misrepresentation provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['new-orleans-la', 'baton-rouge-la', 'shreveport-la', 'lafayette-la'],
  },

  // ─── MISSISSIPPI ──────────────────────────────────────────────────────────────
  {
    slug: 'mississippi',
    state: 'Mississippi',
    stateAbbr: 'MS',
    metaTitle: 'Mississippi Solar Contract Rights: Consumer Protection Act & Your Legal Options (2026)',
    metaDescription: `Mississippi homeowners: the Consumer Protection Act, Entergy Mississippi net metering policies, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'Mississippi Has Good Solar Resources and Restrictive Net Metering. If Your Rep Didn\'t Explain the Difference, Mississippi Law Is on Your Side.',
    heroSubhook: 'Mississippi\'s Consumer Protection Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'Miss. Code § 75-24-5',
    primaryStatuteTitle: 'Mississippi Consumer Protection Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Mississippi does not have a state-specific extended window, but CPA violations create independent grounds for cancellation.',
    aggressivenessRating: 2,
    content: [
      {
        type: 'p',
        content: 'Mississippi has good solar resources but restrictive net metering policies. Entergy Mississippi and Mississippi Power pay low rates for solar exports. If your sales rep used California-style net metering math in Mississippi, the financial case for your system was fundamentally wrong.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Mississippi solar contract after installation?', a: 'Yes. Consumer Protection Act violations and material misrepresentation provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['jackson-ms', 'gulfport-ms', 'southaven-ms', 'hattiesburg-ms'],
  },

  // ─── ALABAMA ──────────────────────────────────────────────────────────────────
  {
    slug: 'alabama',
    state: 'Alabama',
    stateAbbr: 'AL',
    metaTitle: 'Alabama Solar Contract Rights: Deceptive Trade Practices Act & Your Legal Options (2026)',
    metaDescription: `Alabama's Deceptive Trade Practices Act and Alabama Power net metering policies give you tools to cancel a predatory solar contract. Free case review.`,
    heroHook: 'Alabama Power\'s Net Metering Rate Is One of the Lowest in the Country. Did Your Solar Rep Explain That Before You Signed?',
    heroSubhook: 'Alabama\'s Deceptive Trade Practices Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'Ala. Code § 8-19-5',
    primaryStatuteTitle: 'Alabama Deceptive Trade Practices Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Alabama does not have a state-specific extended window, but DTPA violations create independent grounds for cancellation.',
    aggressivenessRating: 2,
    content: [
      {
        type: 'p',
        content: 'Alabama Power\'s net metering rate is one of the lowest in the country — approximately 3–4 cents per kWh for solar exports. This makes the financial case for solar in Alabama almost entirely dependent on self-consumption. If your sales rep used a simple offset model or California-style net metering math, the financial projections were fundamentally misleading.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Alabama solar contract after installation?', a: 'Yes. Deceptive Trade Practices Act violations and material misrepresentation provide grounds for post-install cancellation.' },
      { q: 'What is Alabama Power\'s net metering rate?', a: 'Approximately 3–4 cents per kWh — one of the lowest in the country. If your savings projection assumed a higher rate, you may have a misrepresentation claim.' },
    ],
    relatedCities: ['birmingham-al', 'montgomery-al', 'huntsville-al', 'mobile-al'],
  },

  // ─── KENTUCKY ─────────────────────────────────────────────────────────────────
  {
    slug: 'kentucky',
    state: 'Kentucky',
    stateAbbr: 'KY',
    metaTitle: 'Kentucky Solar Contract Rights: Consumer Protection Act & Your Legal Options (2026)',
    metaDescription: `Kentucky homeowners: the Consumer Protection Act, LG&E and KU net metering policies, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'Kentucky\'s Solar Market Is Growing. So Is the Number of Homeowners Who Were Misled About What They Were Signing.',
    heroSubhook: 'Kentucky\'s Consumer Protection Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'Ky. Rev. Stat. § 367.170',
    primaryStatuteTitle: 'Kentucky Consumer Protection Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Kentucky does not have a state-specific extended window, but CPA violations create independent grounds for cancellation.',
    aggressivenessRating: 2,
    content: [
      {
        type: 'p',
        content: 'Kentucky has a growing solar market, but LG&E and KU have restrictive net metering policies. If your sales rep used California-style net metering math in Kentucky, the financial case for your system was fundamentally wrong. Kentucky\'s Consumer Protection Act provides a remedy.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Kentucky solar contract after installation?', a: 'Yes. Consumer Protection Act violations and material misrepresentation provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['louisville-ky', 'lexington-ky', 'bowling-green-ky', 'owensboro-ky'],
  },

  // ─── WEST VIRGINIA ────────────────────────────────────────────────────────────
  {
    slug: 'west-virginia',
    state: 'West Virginia',
    stateAbbr: 'WV',
    metaTitle: 'West Virginia Solar Contract Rights: Consumer Credit and Protection Act & Your Options (2026)',
    metaDescription: `West Virginia homeowners: the Consumer Credit and Protection Act, Mon Power net metering policies, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'West Virginia\'s Solar Market Is Small But Growing. If You Were Misled About Your Contract, State Law Is on Your Side.',
    heroSubhook: 'West Virginia\'s Consumer Credit and Protection Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'W. Va. Code § 46A-6-104',
    primaryStatuteTitle: 'West Virginia Consumer Credit and Protection Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. West Virginia does not have a state-specific extended window, but CCPA violations create independent grounds for cancellation.',
    aggressivenessRating: 1,
    content: [
      {
        type: 'p',
        content: 'West Virginia has a small but growing solar market. Mon Power and Appalachian Power have restrictive net metering policies. If your sales rep used optimistic savings projections that did not account for these restrictions, the financial case for your system may have been misrepresented.',
      },
    ],
    faq: [
      { q: 'Can I cancel my West Virginia solar contract after installation?', a: 'Yes. Consumer Credit and Protection Act violations and material misrepresentation provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['charleston-wv', 'huntington-wv', 'morgantown-wv', 'parkersburg-wv'],
  },

  // ─── IDAHO ────────────────────────────────────────────────────────────────────
  {
    slug: 'idaho',
    state: 'Idaho',
    stateAbbr: 'ID',
    metaTitle: 'Idaho Solar Contract Rights: Consumer Protection Act & Your Legal Options (2026)',
    metaDescription: `Idaho homeowners: the Consumer Protection Act, Idaho Power net metering changes, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'Idaho Power Changed Its Net Metering Rules. If Your Solar Contract Was Built on the Old Math, Idaho Law May Give You Options.',
    heroSubhook: 'Idaho\'s Consumer Protection Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'Idaho Code § 48-603',
    primaryStatuteTitle: 'Idaho Consumer Protection Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Idaho does not have a state-specific extended window, but CPA violations create independent grounds for cancellation.',
    aggressivenessRating: 2,
    content: [
      {
        type: 'p',
        content: 'Idaho Power has been transitioning to new net metering structures that reduce the value of solar exports. If your sales rep used pre-transition values to calculate your savings, the financial case for your system may have been misrepresented. Idaho\'s Consumer Protection Act provides a remedy.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Idaho solar contract after installation?', a: 'Yes. Consumer Protection Act violations and material misrepresentation provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['boise-id', 'nampa-id', 'meridian-id', 'idaho-falls-id'],
  },

  // ─── MONTANA ──────────────────────────────────────────────────────────────────
  {
    slug: 'montana',
    state: 'Montana',
    stateAbbr: 'MT',
    metaTitle: 'Montana Solar Contract Rights: Consumer Protection Act & Your Legal Options (2026)',
    metaDescription: `Montana's Consumer Protection Act and NorthWestern Energy net metering policies give you tools to cancel a predatory solar contract. Free case review.`,
    heroHook: 'Montana Has Good Solar Resources in the East. If Your Solar Rep Oversold the Economics, Montana Law Is on Your Side.',
    heroSubhook: 'Montana\'s Consumer Protection Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'Mont. Code § 30-14-103',
    primaryStatuteTitle: 'Montana Consumer Protection Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Montana does not have a state-specific extended window, but CPA violations create independent grounds for cancellation.',
    aggressivenessRating: 1,
    content: [
      {
        type: 'p',
        content: 'Montana has good solar resources in the eastern part of the state. NorthWestern Energy\'s net metering policies are modest, and the financial case for solar depends heavily on self-consumption. If your sales rep oversold the economics, Montana\'s Consumer Protection Act provides a remedy.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Montana solar contract after installation?', a: 'Yes. Consumer Protection Act violations and material misrepresentation provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['billings-mt', 'missoula-mt', 'great-falls-mt', 'bozeman-mt'],
  },

  // ─── WYOMING ──────────────────────────────────────────────────────────────────
  {
    slug: 'wyoming',
    state: 'Wyoming',
    stateAbbr: 'WY',
    metaTitle: 'Wyoming Solar Contract Rights: Consumer Protection Act & Your Legal Options (2026)',
    metaDescription: `Wyoming homeowners: the Consumer Protection Act, Rocky Mountain Power net metering policies, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'Wyoming Has Excellent Solar Resources. It Also Has One of the Most Utility-Friendly Regulatory Environments in the Country. Here\'s What That Means for Your Contract.',
    heroSubhook: 'Wyoming\'s Consumer Protection Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'Wyo. Stat. § 40-12-105',
    primaryStatuteTitle: 'Wyoming Consumer Protection Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Wyoming does not have a state-specific extended window, but CPA violations create independent grounds for cancellation.',
    aggressivenessRating: 2,
    content: [
      {
        type: 'p',
        content: 'Wyoming has excellent solar resources, particularly in the southern part of the state. Rocky Mountain Power\'s net metering policies have been transitioning, reducing the value of solar exports. If your sales rep used pre-transition values to calculate your savings, the financial case for your system may have been misrepresented.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Wyoming solar contract after installation?', a: 'Yes. Consumer Protection Act violations and material misrepresentation provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['cheyenne-wy', 'casper-wy', 'laramie-wy', 'gillette-wy'],
  },

  // ─── NORTH DAKOTA ─────────────────────────────────────────────────────────────
  {
    slug: 'north-dakota',
    state: 'North Dakota',
    stateAbbr: 'ND',
    metaTitle: 'North Dakota Solar Contract Rights: Consumer Fraud Act & Your Legal Options (2026)',
    metaDescription: `North Dakota homeowners: the Consumer Fraud Act, Xcel Energy and MDU net metering policies, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'North Dakota Has Surprising Solar Potential. If Your Contract Didn\'t Reflect the Real Economics, State Law Is on Your Side.',
    heroSubhook: 'North Dakota\'s Consumer Fraud Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'N.D. Cent. Code § 51-15-02',
    primaryStatuteTitle: 'North Dakota Consumer Fraud Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. North Dakota does not have a state-specific extended window, but Consumer Fraud Act violations create independent grounds for cancellation.',
    aggressivenessRating: 1,
    content: [
      {
        type: 'p',
        content: 'North Dakota has more solar potential than most people realize, but the market is small and utility policies are restrictive. If your sales rep oversold the economics, North Dakota\'s Consumer Fraud Act provides a remedy.',
      },
    ],
    faq: [
      { q: 'Can I cancel my North Dakota solar contract after installation?', a: 'Yes. Consumer Fraud Act violations and material misrepresentation provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['fargo-nd', 'bismarck-nd', 'grand-forks-nd', 'minot-nd'],
  },

  // ─── SOUTH DAKOTA ─────────────────────────────────────────────────────────────
  {
    slug: 'south-dakota',
    state: 'South Dakota',
    stateAbbr: 'SD',
    metaTitle: 'South Dakota Solar Contract Rights: Consumer Protection Act & Your Legal Options (2026)',
    metaDescription: `South Dakota homeowners: the Consumer Protection Act, Xcel Energy and Black Hills Energy net metering policies, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'South Dakota Has Good Solar Resources. If Your Contract Didn\'t Reflect the Real Utility Economics, State Law Is on Your Side.',
    heroSubhook: 'South Dakota\'s Consumer Protection Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'S.D. Codified Laws § 37-24-6',
    primaryStatuteTitle: 'South Dakota Consumer Protection Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. South Dakota does not have a state-specific extended window, but CPA violations create independent grounds for cancellation.',
    aggressivenessRating: 1,
    content: [
      {
        type: 'p',
        content: 'South Dakota has good solar resources and a small but growing market. Xcel Energy and Black Hills Energy have modest net metering policies. If your sales rep used optimistic savings projections that did not account for these limitations, the financial case for your system may have been misrepresented.',
      },
    ],
    faq: [
      { q: 'Can I cancel my South Dakota solar contract after installation?', a: 'Yes. Consumer Protection Act violations and material misrepresentation provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['sioux-falls-sd', 'rapid-city-sd', 'aberdeen-sd', 'brookings-sd'],
  },

  // ─── NEBRASKA ─────────────────────────────────────────────────────────────────
  {
    slug: 'nebraska',
    state: 'Nebraska',
    stateAbbr: 'NE',
    metaTitle: 'Nebraska Solar Contract Rights: Consumer Protection Act & Your Legal Options (2026)',
    metaDescription: `Nebraska homeowners: the Consumer Protection Act, OPPD and LES net metering policies, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'Nebraska Has Good Solar Resources and Public Power Utilities. If Your Solar Rep Misrepresented the Economics, Nebraska Law Is on Your Side.',
    heroSubhook: 'Nebraska\'s Consumer Protection Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'Neb. Rev. Stat. § 59-1602',
    primaryStatuteTitle: 'Nebraska Consumer Protection Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Nebraska does not have a state-specific extended window, but CPA violations create independent grounds for cancellation.',
    aggressivenessRating: 1,
    content: [
      {
        type: 'p',
        content: 'Nebraska has good solar resources and is served primarily by public power utilities (OPPD, LES, NPPD). These utilities have varying net metering policies. If your sales rep used projections that did not account for your specific utility\'s policies, the financial case for your system may have been misrepresented.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Nebraska solar contract after installation?', a: 'Yes. Consumer Protection Act violations and material misrepresentation provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['omaha-ne', 'lincoln-ne', 'bellevue-ne', 'grand-island-ne'],
  },

  // ─── IOWA ─────────────────────────────────────────────────────────────────────
  {
    slug: 'iowa',
    state: 'Iowa',
    stateAbbr: 'IA',
    metaTitle: 'Iowa Solar Contract Rights: Consumer Fraud Act & Your Legal Options (2026)',
    metaDescription: `Iowa homeowners: the Consumer Fraud Act, MidAmerican Energy and Alliant Energy net metering policies, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'Iowa Has Good Wind and Solar Resources. If Your Solar Contract Didn\'t Reflect the Real Utility Economics, Iowa Law Is on Your Side.',
    heroSubhook: 'Iowa\'s Consumer Fraud Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'Iowa Code § 714.16',
    primaryStatuteTitle: 'Iowa Consumer Fraud Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Iowa does not have a state-specific extended window, but Consumer Fraud Act violations create independent grounds for cancellation.',
    aggressivenessRating: 2,
    content: [
      {
        type: 'p',
        content: 'Iowa has good solar resources and a growing market. MidAmerican Energy and Alliant Energy have net metering policies that vary by customer class and system size. If your sales rep used a simplified savings model that did not account for these variations, the financial case for your system may have been misrepresented.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Iowa solar contract after installation?', a: 'Yes. Consumer Fraud Act violations and material misrepresentation provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['des-moines-ia', 'cedar-rapids-ia', 'davenport-ia', 'sioux-city-ia'],
  },

  // ─── ALASKA ───────────────────────────────────────────────────────────────────
  {
    slug: 'alaska',
    state: 'Alaska',
    stateAbbr: 'AK',
    metaTitle: 'Alaska Solar Contract Rights: Unfair Trade Practices Act & Your Legal Options (2026)',
    metaDescription: `Alaska homeowners: the Unfair Trade Practices Act, Chugach Electric net metering policies, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'Alaska Solar Is Real — But the Economics Are Unique. If Your Rep Used Lower-48 Math in Alaska, That\'s a Problem.',
    heroSubhook: 'Alaska\'s Unfair Trade Practices Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'Alaska Stat. § 45.50.471',
    primaryStatuteTitle: 'Alaska Unfair Trade Practices and Consumer Protection Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Alaska does not have a state-specific extended window, but UTPCPA violations create independent grounds for cancellation.',
    aggressivenessRating: 1,
    content: [
      {
        type: 'p',
        content: 'Alaska solar is a niche but real market, particularly in Anchorage and Fairbanks. The economics are unique — high electricity rates but seasonal production limitations. If your sales rep used Lower-48 production estimates without adjusting for Alaska\'s solar resource, the financial projections were wrong.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Alaska solar contract after installation?', a: 'Yes. Unfair Trade Practices Act violations and material misrepresentation provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['anchorage-ak', 'fairbanks-ak', 'juneau-ak', 'sitka-ak'],
  },

  // ─── VERMONT ──────────────────────────────────────────────────────────────────
  {
    slug: 'vermont',
    state: 'Vermont',
    stateAbbr: 'VT',
    metaTitle: 'Vermont Solar Contract Rights: Consumer Fraud Act & Your Legal Options (2026)',
    metaDescription: `Vermont homeowners: the Consumer Fraud Act, Green Mountain Power net metering, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'Vermont Has Some of the Best Solar Policy in New England. If Your Contract Didn\'t Deliver on Those Promises, Vermont Law Is on Your Side.',
    heroSubhook: 'Vermont\'s Consumer Fraud Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'Vt. Stat. tit. 9, § 2453',
    primaryStatuteTitle: 'Vermont Consumer Fraud Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Vermont does not have a state-specific extended window, but Consumer Fraud Act violations create independent grounds for cancellation.',
    aggressivenessRating: 2,
    content: [
      {
        type: 'p',
        content: 'Vermont has strong solar policy and Green Mountain Power has been a leader in innovative rate structures. But the complexity of Vermont\'s net metering and group net metering programs creates opportunities for misrepresentation. If your sales rep oversimplified the savings calculation, Vermont\'s Consumer Fraud Act provides a remedy.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Vermont solar contract after installation?', a: 'Yes. Consumer Fraud Act violations and material misrepresentation provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['burlington-vt', 'south-burlington-vt', 'rutland-vt', 'montpelier-vt'],
  },

  // ─── NEW HAMPSHIRE ────────────────────────────────────────────────────────────
  {
    slug: 'new-hampshire',
    state: 'New Hampshire',
    stateAbbr: 'NH',
    metaTitle: 'New Hampshire Solar Contract Rights: Consumer Protection Act & Your Legal Options (2026)',
    metaDescription: `New Hampshire homeowners: the Consumer Protection Act, Eversource net metering policies, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'New Hampshire Has High Electricity Rates and Good Solar Policy. If Your Contract Didn\'t Deliver, NH Law Is on Your Side.',
    heroSubhook: 'New Hampshire\'s Consumer Protection Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'N.H. Rev. Stat. § 358-A:2',
    primaryStatuteTitle: 'New Hampshire Consumer Protection Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. New Hampshire does not have a state-specific extended window, but CPA violations create independent grounds for cancellation.',
    aggressivenessRating: 2,
    content: [
      {
        type: 'p',
        content: 'New Hampshire has high electricity rates and good solar policy, making it a legitimate solar market. Eversource\'s net metering policies have been evolving. If your sales rep used outdated values to calculate your savings, the financial case for your system may have been misrepresented.',
      },
    ],
    faq: [
      { q: 'Can I cancel my New Hampshire solar contract after installation?', a: 'Yes. Consumer Protection Act violations and material misrepresentation provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['manchester-nh', 'nashua-nh', 'concord-nh', 'dover-nh'],
  },

  // ─── MAINE ────────────────────────────────────────────────────────────────────
  {
    slug: 'maine',
    state: 'Maine',
    stateAbbr: 'ME',
    metaTitle: 'Maine Solar Contract Rights: Unfair Trade Practices Act & Your Legal Options (2026)',
    metaDescription: `Maine homeowners: the Unfair Trade Practices Act, Central Maine Power net metering, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'Maine Has Strong Solar Policy and High Electricity Rates. If Your Solar Contract Didn\'t Deliver, Maine Law Is on Your Side.',
    heroSubhook: 'Maine\'s Unfair Trade Practices Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'Me. Rev. Stat. tit. 5, § 207',
    primaryStatuteTitle: 'Maine Unfair Trade Practices Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Maine does not have a state-specific extended window, but UTPA violations create independent grounds for cancellation.',
    aggressivenessRating: 2,
    content: [
      {
        type: 'p',
        content: 'Maine has strong solar policy and high electricity rates, making it a legitimate solar market. Central Maine Power\'s net metering policies have been evolving. If your sales rep used outdated values or oversimplified the savings calculation, Maine\'s Unfair Trade Practices Act provides a remedy.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Maine solar contract after installation?', a: 'Yes. Unfair Trade Practices Act violations and material misrepresentation provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['portland-me', 'lewiston-me', 'bangor-me', 'south-portland-me'],
  },

  // ─── DELAWARE ─────────────────────────────────────────────────────────────────
  {
    slug: 'delaware',
    state: 'Delaware',
    stateAbbr: 'DE',
    metaTitle: 'Delaware Solar Contract Rights: Consumer Fraud Act & Your Legal Options (2026)',
    metaDescription: `Delaware homeowners: the Consumer Fraud Act, Delmarva Power net metering policies, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'Delaware Has Good Solar Policy and High Electricity Rates. If Your Contract Didn\'t Deliver, Delaware Law Is on Your Side.',
    heroSubhook: 'Delaware\'s Consumer Fraud Act covers the exact deceptions used in solar sales. Here is what you need to know.',
    primaryStatute: 'Del. Code tit. 6, § 2513',
    primaryStatuteTitle: 'Delaware Consumer Fraud Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. Delaware does not have a state-specific extended window, but Consumer Fraud Act violations create independent grounds for cancellation.',
    aggressivenessRating: 2,
    content: [
      {
        type: 'p',
        content: 'Delaware has good solar policy and high electricity rates. Delmarva Power\'s net metering policies have been evolving. If your sales rep used outdated values or oversimplified the savings calculation, Delaware\'s Consumer Fraud Act provides a remedy.',
      },
    ],
    faq: [
      { q: 'Can I cancel my Delaware solar contract after installation?', a: 'Yes. Consumer Fraud Act violations and material misrepresentation provide grounds for post-install cancellation.' },
    ],
    relatedCities: ['wilmington-de', 'dover-de', 'newark-de', 'middletown-de'],
  },

  // ─── DISTRICT OF COLUMBIA ─────────────────────────────────────────────────────
  {
    slug: 'district-of-columbia',
    state: 'District of Columbia',
    stateAbbr: 'DC',
    metaTitle: 'DC Solar Contract Rights: Consumer Protection Procedures Act & Your Options (2026)',
    metaDescription: `DC homeowners: the Consumer Protection Procedures Act, Pepco net metering policies, and 3-day cooling-off rule give you tools to cancel a predatory solar contract.`,
    heroHook: 'DC Has Some of the Strongest Consumer Protection Laws in the Country. If Your Solar Contract Was Predatory, the CPPA Is Your Tool.',
    heroSubhook: 'The DC Consumer Protection Procedures Act allows individual homeowners to sue for triple damages. Here is what you need to know.',
    primaryStatute: 'D.C. Code § 28-3904',
    primaryStatuteTitle: 'DC Consumer Protection Procedures Act',
    coolingOffDays: 3,
    coolingOffNote: 'Under the FTC Cooling-Off Rule. DC does not have a specific extended window, but CPPA violations create independent grounds for cancellation.',
    aggressivenessRating: 3,
    content: [
      {
        type: 'p',
        content: 'The District of Columbia has some of the strongest consumer protection laws in the country. The CPPA allows individual consumers to sue for triple damages and attorney\'s fees. Pepco\'s net metering policies have been evolving, and DC\'s solar market has seen aggressive sales practices. If your contract was sold under false pretenses, the CPPA provides a powerful remedy.',
      },
    ],
    faq: [
      { q: 'Can I cancel my DC solar contract after installation?', a: 'Yes. CPPA violations and material misrepresentation provide grounds for post-install cancellation.' },
      { q: 'What does the DC CPPA allow?', a: 'The Consumer Protection Procedures Act allows individual consumers to sue for triple damages and attorney\'s fees for knowing violations.' },
    ],
    relatedCities: ['washington-dc'],
  },
];

// ─── LOOKUP FUNCTION ──────────────────────────────────────────────────────────

export function getStateLaw(slug: string): StateLaw | undefined {
  return stateLaws.find((s) => s.slug === slug);
}

export function getAllStateLaws(): StateLaw[] {
  return stateLaws;
}
