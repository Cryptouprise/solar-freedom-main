// Batch 21 — How to get out of a solar lease (ranking experiment, group E, Nov 18, 2026).
//
// Why this page exists: Search Console shows lease searches ("how to get out of a
// solar lease", "get out of solar lease", "cancel solar lease") landing on the general
// guide at about position 52 (90 days to Nov 16, 2026). No live, indexable page owned
// the lease question. US demand (DataForSEO, Nov 18, 2026): about 140 + 30 + 10 a month.
// The older /blog/how-to-get-out-of-solar-lease-2026 draft was noindex; it now 301s here.
//
// Claims kept general and document-first. No outcome promises, no company-specific
// figures. The FTC Cooling-Off Rule and Texas 5-day rule are linked to their sources.
import type { BlogPost } from './blog';

export const batch21BlogPosts: BlogPost[] = [
  {
    slug: 'how-to-get-out-of-a-solar-lease',
    title: 'How to Get Out of a Solar Lease',
    metaTitle: 'How to Get Out of a Solar Lease (2026): 5 Options and Costs',
    metaDescription: 'Stuck in a solar lease? The 5 real ways out, what each costs, how a lease transfers when you sell, and what to do if the system stopped working.',
    category: 'Contract Guide',
    readTime: '7 min read',
    publishDate: 'November 18, 2026',
    excerpt: 'A solar lease usually runs for 20 years or more and has no penalty-free exit once the cancel window closes. The realistic ways out are a buyout, a transfer when you sell, prepaying the remaining payments, the company\'s own breach or bankruptcy, or a challenge to misleading sales claims.',
    heroImage: 'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=1200&q=80',
    heroAlt: 'Solar panels on a house roof under a leasing agreement',
    ctaText: 'Get Your Lease Reviewed',
    ctaSubtext: 'A short, no-obligation call to look at your lease and which way out fits.',
    relatedSlugs: ['how-to-get-out-of-a-solar-contract', 'solar-contract-rescission-rights', 'sunrun-solar-contract-cancellation-2026', 'how-to-cancel-sunnova-solar-contract-2026'],
    faq: [
      { q: 'Can you get out of a solar lease early?', a: 'Usually only through the terms in the lease: a buyout or purchase option, prepaying the remaining payments, or transferring it to a buyer when you sell. Outside those terms, the paths are the company\'s breach or bankruptcy, or a claim that you were misled when you signed.' },
      { q: 'How much does it cost to get out of a solar lease?', a: 'It depends on the lease. A buyout is usually priced from a schedule in the agreement or a quote from the company, and prepayment is roughly the remaining payments, sometimes discounted. Ask for the figure in writing and compare it with the calculator on this site.' },
      { q: 'What happens to a solar lease when I sell my house?', a: 'Most leases let you transfer the lease to the buyer if the buyer qualifies, or buy out or prepay the lease before closing. Start the transfer early, because company approval can take weeks.' },
      { q: 'Can I cancel a solar lease right after signing?', a: 'Often, if you act fast. The FTC Cooling-Off Rule gives 3 business days for many sales made at your home, and some states give longer. Texas gives 5 business days for solar purchases and leases signed since Sept 1, 2025.' },
      { q: 'What if my leased solar panels stopped working?', a: 'The leasing company usually owns, monitors and maintains the system. Report the problem in writing, keep every reply, and record your production and bills. Repeated failures to fix the system can support a dispute under the lease.' },
    ],
    content: [
      { type: 'p', content: 'Short answer: a solar lease usually runs for 20 years or more, and once the cancel window closes there is rarely a penalty-free exit. The realistic ways out are: buy out the lease, transfer it to the buyer when you sell the house, prepay the remaining payments, use the company\'s own breach or bankruptcy, or challenge misleading sales claims. Find your lease agreement first. The buyout, transfer and default sections decide most of this.' },
      { type: 'h2', content: 'Lease or PPA: check which one you signed' },
      { type: 'p', content: 'With a lease, you pay a fixed monthly amount to use panels someone else owns. With a power purchase agreement (PPA), you pay for the electricity the panels produce, at a rate per kilowatt-hour. Both usually come with the same exit options, but the price of getting out is calculated differently. Your agreement\'s title page and payment section tell you which one you have.' },
      { type: 'h2', content: 'The 5 ways out of a solar lease' },
      { type: 'list', items: [
        'Buy out the lease. Many leases include a purchase option or early buyout schedule. Ask the company for a written buyout quote, then you own the panels.',
        'Transfer the lease when you sell. The buyer applies to take over the lease. See [selling a house with solar panels](/selling-house-with-solar).',
        'Prepay the remaining payments. Some leases allow prepayment, sometimes at a discount, which ends the monthly bill but not the agreement.',
        'Use the company\'s breach or bankruptcy. If the system was never finished, keeps failing, or the company closed and stopped servicing it, document everything. See [what to do if your solar company went bankrupt](/blog/solar-company-went-bankrupt).',
        'Challenge misleading sales claims. If you were promised savings or terms the lease does not deliver, state consumer protection law may give you a claim. See [solar panel scams and warning signs](/solar-panel-scam).'
      ] },
      { type: 'p', content: 'To compare what each path costs, use the [solar cancellation fee calculator](/calculator).' },
      { type: 'h2', content: 'Signed in the last few days?' },
      { type: 'p', content: 'Move fast. The [FTC Cooling-Off Rule](https://consumer.ftc.gov/articles/buyers-remorse-ftcs-cooling-rule-may-help) gives 3 business days to cancel many sales made at your home, and some states give longer. Texas gives 5 business days for solar purchases and leases signed since Sept 1, 2025; see [how to get out of a solar contract in Texas](/solar-contract-laws/texas). Follow the cancellation instructions in the lease exactly and keep proof of when you sent your notice. More detail: [your right to cancel a solar contract](/blog/solar-contract-rescission-rights).' },
      { type: 'h2', content: 'Who services your lease now?' },
      { type: 'p', content: 'Leases are often sold or handed to a different company after signing, and several solar companies have gone through bankruptcy since 2024. Your latest bill names the company you pay now. That company is the one that quotes buyouts and approves transfers. If your bill says Sunrun or Sunnova, see the [Sunrun guide](/blog/sunrun-solar-contract-cancellation-2026) or the [Sunnova guide](/blog/how-to-cancel-sunnova-solar-contract-2026).' },
      { type: 'warning', content: 'Do not stop paying or disconnect the system on your own. Missed lease payments can lead to collection and credit damage, and removing equipment can break the lease. Raise the problem in writing while you keep the account current.' },
      { type: 'h2', content: 'What to gather' },
      { type: 'list', items: [
        'The full lease or PPA, including any escalator (yearly price increase) and the buyout or purchase option section.',
        'The sales proposal and any savings estimate you were shown.',
        'Bills from the leasing company and your utility, before and after the install.',
        'Production or monitoring records, and every repair request and reply.'
      ] },
      { type: 'p', content: 'For every type of solar contract, not only leases, see [how to get out of a solar contract](/blog/how-to-get-out-of-a-solar-contract).' },
    ],
  },
];
