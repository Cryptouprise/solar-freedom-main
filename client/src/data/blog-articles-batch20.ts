// Batch 20 — Which net metering tier am I in, and why does my neighbour pay less?
//
// Why this page exists: the research swarm called this the GATEWAY search — it is
// how a homeowner discovers they may have a claim rather than just a complaint.
// Nevada's tier system produces materially different economics on the same street,
// and the tier is assigned by WHEN THE NET METERING APPLICATION WAS RECEIVED, not
// when the system was installed. Two neighbours who installed the same month can be
// in different tiers. A savings projection that ignored the applicable tier is a
// documentable problem, not a matter of opinion.
//
// Every figure below was read from NV Energy's own net metering FAQ on 3 Nov 2026:
// https://www.nvenergy.com/account-services/energy-pricing-plans/net-metering/net-metering-faqs
//   NMR-G   — installed before 31 Dec 2015; 1:1 kilowatt-hour credits, banked.
//   NMR-A   — southern Nevada, installed 1 Jan 2016 – 14 Jun 2017; monetary credit
//             for all exported energy; remaining credits paid by cheque annually.
//   NMR-405 — 25 kW or less, applied for and/or installed from 15 Jun 2017; the
//             default rate for southern Nevada. Tiers 1–4 at 95 / 88 / 81 / 75% of
//             the consumption charge. Tier assigned by when the APPLICATION was
//             received. Each tier closed at 80 MW of applied capacity; Tier 4 stays
//             open. Southern Nevada remains MONTHLY netting.
//   NMR-2025— northern Nevada default from 1 Oct 2025; 15-minute netting. Does NOT
//             apply to existing northern customers or to any southern customer.
//   NMR-B   — systems over 25 kW.
// The 20-year tier lock at the original installation address is documented by the
// PUCN and by Solar United Neighbors.
import type { BlogPost } from './blog';
export const batch20BlogPosts: BlogPost[] = [
  {
    slug: 'nevada-net-metering-tier-which-one-am-i',
    title: 'Which Nevada Net Metering Tier Are You In? And Why Your Neighbour Pays Less',
    metaTitle: 'Nevada Net Metering Tiers Explained: NMR-G, NMR-A, NMR-405',
    metaDescription: `Nevada assigns your net metering tier by the date your application was received, not the install date. Here is how to find yours and check your savings projection.`,
    category: 'Nevada',
    readTime: '11 min read',
    publishDate: 'November 3, 2026',
    excerpt: 'Two Las Vegas homes on the same street, panels installed the same month, can be credited at different rates for twenty years. Nevada assigns your net metering tier by the date the application was received — and that is the number a savings projection had to get right.',
    heroImage: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=1200&q=80',
    heroAlt: 'Rooftop solar array above a suburban Nevada neighbourhood at sunset',
    ctaText: 'Was Your Savings Projection Built on the Wrong Tier?',
    ctaSubtext: 'A no-obligation review compares what your proposal assumed about net metering against the tier you were actually assigned.',
    relatedSlugs: ['nv-energy-demand-charge-solar-savings-2027', 'cancel-solar-contract-las-vegas-nv', 'solar-payments-too-high-help', 'nevada-solar-complaint-timeline-and-cost'],
    faq: [
      { q: 'How is my Nevada net metering tier decided?', a: 'By when your net metering application was received, not when your system was installed. NV Energy states this directly: for NMR-405 customers the credit amount is based on their tier, which is assigned based on when their net metering application was received. That is why two homes that installed in the same month can sit in different tiers.' },
      { q: 'What are the Nevada net metering tiers and their credit rates?', a: 'NMR-405 has four tiers: Tier 1 at 95 percent of the consumption charge, Tier 2 at 88 percent, Tier 3 at 81 percent, and Tier 4 at 75 percent. Each tier closed to new customers once 80 megawatts of solar capacity had been applied for, with Tier 4 remaining open for all future net metering customers.' },
      { q: 'Which tier am I on if I installed recently?', a: 'If your system is 25 kilowatts or less and your application was received from 15 June 2017 onward, you are in NMR-405, and in practice that means Tier 4 at 75 percent. Tier 4 is the open tranche, so almost every southern Nevada system installed in recent years sits there.' },
      { q: 'What is the difference between NMR-G, NMR-A and NMR-405?', a: 'They are different rate classes for different eras. NMR-G applies to systems installed before 31 December 2015 and credits excess energy at one kilowatt-hour for one kilowatt-hour, banked and rolled forward. NMR-A covers southern Nevada systems installed between 1 January 2016 and 14 June 2017 and pays a monetary credit for all exported energy, with any remaining credit paid out by cheque at year end. NMR-405 covers systems of 25 kilowatts or less from 15 June 2017 and uses the four-tier structure.' },
      { q: 'Does the 15-minute netting change apply to my Las Vegas home?', a: 'No. Fifteen-minute netting belongs to NMR-2025, which is the northern Nevada default rate effective 1 October 2025, and NV Energy states plainly that it is not applicable to existing northern Nevada net metering customers or to southern Nevada net metering customers. Southern Nevada remains on monthly netting. This is one of the most widely repeated errors in the market right now.' },
      { q: 'Is my rate locked, and for how long?', a: 'The tier is locked to the original installation address for 20 years. That is a genuine advantage of an older system, because the credit ratio does not follow the retail rate down. It also means the tier your system was placed in is one of the most financially consequential facts about your agreement, and it is worth confirming in writing rather than assuming.' },
      { q: 'How do I find out which tier I am actually in?', a: 'Check your interconnection paperwork first, because the tier follows the application rather than the sales contract. Your NV Energy bill and your PowerClerk application record are the other two places to look. If the paperwork is unclear, the utility can confirm the rate class on your account. The date that matters is the application receipt date, so find that before anything else.' },
      { q: 'Why does this matter for whether I was oversold?', a: 'Because a savings projection has to use the correct credit rate to be honest. If a proposal was built on a 95 or 88 percent assumption when the system was actually placed in Tier 4 at 75 percent, the projected savings were overstated by construction — not by bad luck with the weather. That is a checkable arithmetic problem, and the documents needed to check it are the proposal and the tier confirmation.' },
    ],
    content: [
      { type: 'p', content: 'Two houses on the same Las Vegas street. Panels installed within weeks of each other. Same utility, same sun, same size system. And for the next twenty years, one of them is credited for its excess power at a meaningfully better rate than the other.' },
      { type: 'p', content: 'That is not a glitch. It is how Nevada\'s net metering tiers work, and it is the mechanism by which a large number of Nevada savings projections quietly stopped matching reality.' },
      { type: 'callout', content: 'The single fact that explains most of it: Nevada assigns your tier by the date your net metering application was received — not the date your system was installed, and not the date you signed anything.' },
      { type: 'h2', content: 'The rate classes, in plain terms' },
      { type: 'p', content: 'Nevada does not have one net metering rate. It has a set of them, and which one applies to you depends on when your system went through the interconnection process. NV Energy publishes the distinctions clearly, and they are worth reading directly rather than through a sales brochure.' },
      { type: 'list', items: [
        'NMR-G — systems installed before 31 December 2015. Excess energy is credited one kilowatt-hour for one kilowatt-hour, and credits bank and roll forward. This is the original full net metering class, and it is closed.',
        'NMR-A — southern Nevada systems installed between 1 January 2016 and 14 June 2017. Exported energy earns a monetary credit regardless of how much electricity was delivered, and anything left at year end is paid out by cheque.',
        'NMR-405 — systems of 25 kilowatts or less from 15 June 2017 onward. This is the default rate for southern Nevada, and it is the one with the tiers.',
        'NMR-2025 — northern Nevada only, default from 1 October 2025, using 15-minute netting.',
        'NMR-B — systems larger than 25 kilowatts.',
      ] },
      { type: 'p', content: 'Most Las Vegas homeowners reading this will be in NMR-405. That is where the tier question lives.' },
      { type: 'h2', content: 'The four tiers, and why the assignment date decides everything' },
      { type: 'p', content: 'NMR-405 credits excess energy at a percentage of the consumption charge, and the percentage depends on which tier the system landed in.' },
      { type: 'list', items: [
        'Tier 1 — 95 percent of the consumption charge.',
        'Tier 2 — 88 percent.',
        'Tier 3 — 81 percent.',
        'Tier 4 — 75 percent.',
      ] },
      { type: 'p', content: 'Each tier closed to new customers once 80 megawatts of solar capacity had been applied for. Tier 4 remains open for all future net metering customers, which is why almost every recent southern Nevada system sits in Tier 4.' },
      { type: 'p', content: 'And the assignment rule is the part that matters: the tier is set by when the net metering application was received. Not the installation date. Not the signature date. The application receipt date.' },
      { type: 'p', content: 'So a homeowner whose installer submitted paperwork promptly could land in Tier 3, while a neighbour whose installer sat on the same paperwork for a few weeks landed in Tier 4 — a 6-point difference in credit rate, locked for twenty years, from a filing delay nobody mentioned at the time.' },
      { type: 'h2', content: 'The 20-year lock, and why it cuts both ways' },
      { type: 'p', content: 'The tier is locked to the original installation address for twenty years. That is genuinely valuable: as retail rates rise, the ratio stays where it was, so an older system\'s credit does not erode along with the rate.' },
      { type: 'p', content: 'It also means the tier is one of the most financially consequential facts about your system, and it is not something you can renegotiate later. If your system was placed in a lower tier than your proposal assumed, that gap runs for two decades. It is worth ten minutes to confirm in writing.' },
      { type: 'p', content: 'There is also a cohort angle that most people have never considered. NMR-G and NMR-A customers from the 2015–2017 era hold grandfathered terms that are materially better than anything available now. Those locks run through the mid-2030s. If you are in one of those classes and someone is trying to talk you out of your agreement, the rate class you would be giving up is part of the arithmetic.' },
      { type: 'h2', content: 'The error being repeated across the market right now' },
      { type: 'p', content: 'Fifteen-minute netting is frequently described as a Nevada-wide change. It is not. It is the NMR-2025 rate, which became the northern Nevada default on 1 October 2025.' },
      { type: 'p', content: 'NV Energy states explicitly that NMR-2025 does not apply to existing northern Nevada net metering customers or to southern Nevada net metering customers. Southern Nevada remains on monthly netting under NMR-405.' },
      { type: 'p', content: 'If someone has told you the 15-minute rule governs your Las Vegas home, they have given you the wrong rate. That confusion is worth clearing up before it gets repeated to a lender, a buyer or a neighbour.' },
      { type: 'h2', content: 'Where the tier connects to whether you were oversold' },
      { type: 'p', content: 'This is the reason this page exists, and it is worth stating carefully.' },
      { type: 'p', content: 'A savings projection is arithmetic. It takes your usage, the system\'s expected production, and the credit rate you will receive for exported power, and it produces a number. If the credit rate used was 95 percent and the system was actually placed in Tier 4 at 75 percent, the projection was wrong before a single panel was installed.' },
      { type: 'p', content: 'That is not a complaint about the weather or about rates changing. It is a checkable discrepancy between a document you were given and a rate class you were assigned, and both are things you can obtain.' },
      { type: 'p', content: 'Nevada also requires that any agreement referencing utility electricity prices carry a 12-point disclaimer stating that rates may go up or down and that savings may vary, and it prohibits a financier from advertising a false or misleading statement about a utility\'s rate. So the question is not simply whether the projection turned out to be optimistic. It is whether the numbers used to build it were the ones that actually applied.' },
      { type: 'warning', content: 'Do not stop making payments while you check any of this. A dispute does not pause your obligation, and default creates collection and credit consequences that are worse than the problem you are trying to solve. Gather the documents and get qualified advice first.' },
      { type: 'h2', content: 'How to find your tier, in order' },
      { type: 'list', items: [
        'Find the net metering application receipt date — PowerClerk records, interconnection paperwork, or the utility directly. This is the date that decides your tier.',
        'Confirm the rate class and tier on your account with NV Energy, in writing if you can get it.',
        'Pull the original savings proposal and identify the credit rate it assumed.',
        'Compare the assumed rate against the assigned tier.',
        'Note the system size, because anything over 25 kilowatts falls under NMR-B rather than NMR-405.',
      ] },
      { type: 'p', content: 'Five steps, and at the end of them you either have a match or a documented gap. Either answer is worth having, and both are better than not knowing which rate governs your next twenty years.' },
      { type: 'h2', content: 'What this means alongside the demand charge' },
      { type: 'p', content: 'Southern Nevada also has a separate change coming: a Daily Demand charge scheduled for 1 January 2027, which bills your single highest 15-minute period of the month and is currently on appeal to the Nevada Supreme Court. That is a different mechanism from net metering, affecting how you are charged rather than how you are credited.' },
      { type: 'p', content: 'Both matter, and they interact. A Tier 4 credit rate at 75 percent combined with a demand charge that a battery-less system cannot avoid is a materially different financial picture from the one most Nevada homeowners were shown. If your proposal assumed a friendlier version of both, the gap is in the documents rather than in the market.' },
      { type: 'p', content: 'The practical move in either case is the same, and it is not complicated: locate the proposal, locate the rate class, and compare them. That comparison is the whole point, and it is the step that turns a general sense of having been misled into something specific enough to act on.' },
    ],
  },
];