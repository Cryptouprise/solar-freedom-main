// Batch 19 — Selling a Las Vegas home with leased or financed solar.
//
// Why this page exists: the research swarm found this is the single most
// commercially urgent topic in the Las Vegas market — there is a closing date and
// money at stake. Southern Nevada agents have described solar as a "hindrance" in
// the Review-Journal (Nov 2025), noting buyers must qualify for the transfer
// payment on top of their mortgage, and that it "can even be the deciding factor
// in whether they qualify for the home."
//
// The coverage that exists is split three ways and each part is incomplete:
// national vendor pages are California-patterned and generic; cash-buyer content
// explains the problem accurately in order to sell a discounted cash offer; and
// real-estate guides are incentivised toward "solar adds value."
//
// The Nevada-specific mechanics nobody assembles in one place: UCC-1 fixture
// filings in Nevada are filed with the Secretary of State, NOT with Clark County.
// Verified 3 Nov 2026 at nvsos.gov/sos/businesses/ucc — UCC is administered
// centrally by the Secretary of State, a UCC11 Information Request is the search
// mechanism, and the online filing fee is $30.
import type { BlogPost } from './blog';
export const batch19BlogPosts: BlogPost[] = [
  {
    slug: 'selling-las-vegas-home-with-solar-lease-or-loan',
    title: 'Selling a Las Vegas Home With Solar: The Transfer Problem Nobody Explains',
    metaTitle: 'Selling a Las Vegas Home With Solar Lease or Loan: What to Check',
    metaDescription: `Selling a Las Vegas home with leased or financed solar? Here is where the UCC filing actually sits in Nevada, what stalls escrow, and what to check before you list.`,
    category: 'Nevada',
    readTime: '11 min read',
    publishDate: 'November 3, 2026',
    excerpt: 'Solar does not automatically hurt a Las Vegas home sale, but an unexplained transfer clause can stall one. The buyer has to qualify for the transfer payment on top of the mortgage — and in Nevada the UCC filing sits with the Secretary of State, not the county.',
    heroImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80',
    heroAlt: 'Sold sign in front of a suburban home with rooftop solar panels',
    ctaText: 'Find Out What Your Solar Agreement Does to a Sale',
    ctaSubtext: 'A no-obligation review checks the transfer, payoff and UCC terms before they become an escrow problem.',
    relatedSlugs: ['nevada-solar-survey-price-increase-new-cancellation-window', 'solar-lien-removal', 'cancel-solar-contract-las-vegas-nv', 'selling-house-with-solar'],
    faq: [
      { q: 'Does solar make a Las Vegas home harder to sell?', a: 'Not by itself — the equipment is usually not the issue. The issue is an unresolved financial obligation attached to the property. If a buyer has to qualify for a transfer payment on top of their mortgage, that is a second underwriting hurdle, and Las Vegas agents have said publicly it can be the deciding factor in whether a buyer qualifies at all. A clean payoff or a pre-approved transfer removes that hurdle before it becomes a problem.' },
      { q: 'Where is a solar UCC filing actually recorded in Nevada?', a: 'With the Nevada Secretary of State, not with Clark County. This is the detail most national guides get wrong, because several states record fixture filings at the county level. Nevada administers UCC filings centrally through the Secretary of State, so a county search will not necessarily find it. The search mechanism is a UCC11 Information Request, which is available online.' },
      { q: 'How do I find out if there is a UCC filing on my property?', a: 'File a UCC11 Information Request through the Nevada Secretary of State, searching under your name and any name that appeared on the solar paperwork. The online fee is $30. A search that comes back clear tells you there is no financing statement recorded against you in that name — which is useful to know early, because it is far cheaper than discovering it during escrow.' },
      { q: 'What is the difference between a UCC filing and a lien on my house?', a: 'They are related but not identical. A UCC-1 financing statement is a recorded notice that a creditor claims an interest in specified collateral, and in a solar context it is typically filed as a fixture filing against the equipment. Whether and how it affects title, a refinance or a sale depends on the filing, the agreement and how the closing is structured. A title company will tell you what it needs cleared before it will insure the transfer.' },
      { q: 'Can a buyer be denied the transfer of a solar lease?', a: 'Yes, transfers are commonly subject to company approval and buyer credit requirements. What many homeowners do not realise is that a denial is often a starting point for a negotiation rather than a final answer. The practical move is to find out the specific reason in writing and ask what the company requires to approve it, rather than accepting the first no and letting the closing date pass.' },
      { q: 'Should I deal with this before I list or after I get an offer?', a: 'Before you list. The arithmetic — payoff amount, transfer terms, or whether the buyer will qualify — determines how you price and how you market the home. Handling it after an offer means negotiating under a deadline with a buyer who is already committed, and that is when homeowners accept terms they would have refused with more time.' },
      { q: 'What if my solar company is no longer in business?', a: 'This is where it gets genuinely harder, and it is common in Nevada. A servicing company, an assignee or a lender may still hold the financial interest even when the original installer is gone, and the transfer or payoff process runs through whoever holds it now. Locating that party is the first step, and the recorded UCC filing is often the fastest way to identify them.' },
      { q: 'Does any of this mean I should stop making payments during a sale?', a: 'No. Missing payments during a sale creates default, collection and credit consequences at the worst possible moment, and a dispute does not pause the obligation. Keep paying while you work through the transfer or payoff, and get the terms confirmed in writing before your closing date.' },
    ],
    content: [
      { type: 'p', content: 'A Las Vegas home with solar on the roof is not automatically harder to sell. What makes it harder is an unresolved financial obligation attached to the property — and the difference between those two things is where most of the stress in this market actually comes from.' },
      { type: 'p', content: 'The sequence is familiar. The home goes on the market. An offer comes in. Everyone is happy. Then the buyer\'s lender discovers a solar lease or a financed system with a recorded financing statement, and the transaction slows down while two parties who have never met try to work out what happens to an obligation that was signed at a kitchen table years earlier.' },
      { type: 'callout', content: 'The single most useful thing to know before you list: in Nevada, solar UCC filings are recorded with the Secretary of State, not with Clark County. A county search can come back clean while a financing statement is sitting in the state registry.' },
      { type: 'h2', content: 'Why buyers hesitate' },
      { type: 'p', content: 'It is worth being honest about what a buyer is actually looking at, because the objection is usually rational rather than cosmetic.' },
      { type: 'p', content: 'If the system is leased or under a power purchase agreement, the obligation typically has to move to the buyer for the sale to proceed. That means the buyer has to be approved by the solar company, and it means the transfer payment is an additional monthly obligation that the lender has to see them qualify for — on top of the mortgage they are already taking on.' },
      { type: 'p', content: 'In a market where buyers are already stretching, that second qualification can be the thing that ends the deal. Las Vegas and Henderson agents have said this publicly, describing solar as a hindrance in the current market and noting that the transfer payment can be the deciding factor in whether a buyer qualifies for the home at all.' },
      { type: 'p', content: 'That is not an argument against solar. It is an argument for knowing exactly what your agreement requires before your home goes on the market, so the answer can be given to a buyer\'s lender in days rather than weeks.' },
      { type: 'h2', content: 'The Nevada detail most guides get wrong' },
      { type: 'p', content: 'Several states record fixture filings at the county level. Nevada does not. UCC filings are administered centrally by the Nevada Secretary of State, which means the Clark County recorder is not where you look for a solar financing statement.' },
      { type: 'p', content: 'This matters practically because a homeowner who searches locally, finds nothing, and concludes they are clear can be wrong. The filing may exist. It is simply recorded somewhere else.' },
      { type: 'p', content: 'The search mechanism is a UCC11 Information Request, available through the Secretary of State, with an online fee of $30. You search under your own name and under any variation of your name that appeared on the solar paperwork, because filings are indexed by debtor name and a misspelling or a maiden name can hide a filing from a search.' },
      { type: 'p', content: 'If the search comes back clear, you have eliminated a whole category of escrow delay for thirty dollars. If it does not, you have found the problem while there is still time to solve it.' },
      { type: 'h2', content: 'What a UCC filing is, and what it is not' },
      { type: 'p', content: 'A UCC-1 financing statement is a recorded notice that a creditor claims an interest in specified collateral. In a solar context it is usually filed as a fixture filing, meaning it attaches to equipment that has been affixed to the property rather than to the real estate itself.' },
      { type: 'p', content: 'That distinction matters, but it does not make the filing irrelevant to a sale. Whether it affects title, a refinance or a closing depends on the filing, the agreement behind it, and how the transaction is structured. The title company is the party that decides what must be cleared before it will insure the transfer, and its answer is the one that controls your closing.' },
      { type: 'p', content: 'Which is why the practical advice is not "figure out the law yourself." It is: get the filing identified, give it to the title company early, and let the people who do this daily tell you what they need. The failure mode is discovering it at the point where the closing date is fixed and your negotiating position is gone.' },
      { type: 'h2', content: 'The lease transfer conversation, and the "no" that is not final' },
      { type: 'p', content: 'Transfers are commonly subject to company approval and to the buyer meeting credit requirements. A denial on those grounds feels final, and it is often treated as final by everyone involved.' },
      { type: 'p', content: 'It frequently is not. The useful move is to ask for the specific reason in writing and to ask what the company would require to approve the transfer — a co-signer, a larger prepayment, a different structure. Companies have an interest in the obligation continuing, and that interest is a basis for negotiation that does not exist if nobody asks.' },
      { type: 'p', content: 'The one thing you cannot negotiate is time. Every round of questions and answers consumes days, and the closing date does not move to accommodate them. That is the entire argument for resolving the transfer question before you list rather than after you accept an offer.' },
      { type: 'h2', content: 'If the company that sold it is gone' },
      { type: 'p', content: 'This is the situation that turns a manageable problem into a hard one, and in Nevada it is common enough that it deserves its own answer.' },
      { type: 'p', content: 'When an installer stops operating, the financial interest often does not disappear with it. A servicing company, an assignee, or the original lender may still hold the rights under the agreement, and the transfer or payoff process runs through whoever holds it now. The recorded financing statement is frequently the fastest way to identify that party, because the filing names the secured party.' },
      { type: 'p', content: 'So the two questions — who holds this obligation, and is there a recorded interest against my property — are usually answered by the same document. That is another reason to search the state registry early.' },
      { type: 'warning', content: 'Do not stop making payments while you work through a transfer or payoff. Default, collection and credit consequences do not pause because you are selling, and they will follow you to your next home. Raise the dispute, negotiate the terms, and keep paying in the meantime.' },
      { type: 'h2', content: 'A practical order of operations' },
      { type: 'list', items: [
        'Find the agreement and identify whether it is a lease, a power purchase agreement, or a loan on an owned system. The obligations are different in each case.',
        'Identify the current counterparty — who actually holds the obligation today, which may not be who sold it to you.',
        'Search the Nevada Secretary of State for a UCC filing under every version of your name that appears in the paperwork.',
        'Request the transfer or payoff terms in writing, with amounts and dates, before you list.',
        'Give the filing and the terms to your title company and your agent early, and ask what they need cleared before closing.',
        'If the transfer is denied, request the specific reason in writing and ask what would be required to approve it.',
      ] },
      { type: 'p', content: 'None of these steps is difficult. What makes them valuable is doing them in this order, while there is still time to act on the answers.' },
      { type: 'h2', content: 'If the terms do not work for a sale' },
      { type: 'p', content: 'Sometimes the payoff is unaffordable, the transfer terms are unacceptable, and the buyer will not take it on. At that point the question shifts from "how do I transfer this" to "what are my options on this agreement" — and that is a different review with a different set of answers.' },
      { type: 'p', content: 'Nevada has several distinct consumer protections that apply to residential solar agreements, including rescission rights measured from signing, a separate window triggered by post-signing survey results, limits on what may be collected before the system is authorised to operate, and voidability rules that apply where required provisions are missing or the installer was unlicensed. Which of those applies to a given file depends on the documents and the dates.' },
      { type: 'p', content: 'The starting point is always the same, and it is the same starting point as the sale: gather the agreement, the financing paperwork, the recorded filing if there is one, and the transfer or payoff terms in writing. With those four things, the question stops being stressful and becomes specific — which is the only state in which it can actually be answered.' },
    ],
  },
];