// Batch 16 — Time-critical NV Energy demand-charge content.
//
// Why this page exists: NV Energy's Southern Nevada Daily Demand charge is
// scheduled for 1 January 2027 after being delayed twice from April 2026 and
// October 2026. It is on appeal to the Nevada Supreme Court with no hearing
// scheduled, so the date can still move. Roughly 128,861 Southern Nevada
// net-metered customers are receiving personalized notices about it, which means
// a large, dated, local search spike is predictable.
//
// Every figure below was verified on 3 Nov 2026. See
// docs/nevada-verified-facts-2026-11-03.md. The page is deliberately dated and
// hedged: it tells the reader the date could move and tells them how to check.

import type { BlogPost } from './blog';

export const batch16BlogPosts: BlogPost[] = [

  // ─── ARTICLE 1: The demand charge ─────────────────────────────────────────────
  {
    slug: 'nv-energy-demand-charge-solar-savings-2027',
    title: 'NV Energy\'s Demand Charge Starts 1 January 2027: What It Does to Your Solar Savings',
    metaTitle: 'NV Energy Demand Charge 2027 — What It Means for Solar Savings',
    metaDescription: `NV Energy's Southern Nevada demand charge is set for 1 January 2027 and is on appeal. Here is how it works, who it hits hardest, and what to check in your solar contract.`,
    category: 'Nevada',
    readTime: '11 min read',
    publishDate: 'November 3, 2026',
    excerpt: 'A demand charge bills your worst 15 minutes, not your monthly total. For a home with solar and no battery, that can undo savings the salesperson promised. The start date is 1 January 2027 — and it is on appeal.',
    heroImage: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&q=80',
    heroAlt: 'Solar panels on a Nevada home with desert mountains behind',
    ctaText: 'Check What Your Contract Promised About Rates',
    ctaSubtext: 'A no-obligation review compares what you were told about savings against what your documents actually say.',
    relatedSlugs: ['cancel-solar-contract-las-vegas-nv', 'titan-solar-nevada-out-of-business-contract-help', 'nevada-solar-contract-10-day-cancellation-seniors', 'solar-payments-too-high-help'],
    faq: [
      { q: 'When does the NV Energy demand charge start?', a: 'The Southern Nevada Daily Demand charge is scheduled to begin 1 January 2027. It has already been delayed twice, from April 2026 and then October 2026. Two district courts upheld it in late May 2026, and it is now on appeal to the Nevada Supreme Court with no hearing scheduled. Treat the date as movable and check the current status before relying on it.' },
      { q: 'What is a demand charge and how is it different from a normal electric bill?', a: 'A conventional bill charges you for total energy used, measured in kilowatt-hours. A demand charge adds a separate fee based on your single highest 15-minute period of usage during the billing cycle. So one short window — running the air conditioning while the oven and dryer are on — can set the charge for the whole month, regardless of how little you used the rest of the time.' },
      { q: 'Why does a demand charge hurt homes with solar but no battery?', a: 'Solar panels produce power while the sun is up, but a demand charge measures your peak draw, which often happens in the evening when production has fallen and the air conditioning is still running. Without a battery to shave that peak, the panels cannot reduce the demand component even though they reduced your total consumption.' },
      { q: 'Is the 15-minute netting change the same thing as the demand charge?', a: 'No, and this is widely confused. The 15-minute netting change applies to Northern Nevada, not Southern Nevada. The Southern Nevada change is the Daily Demand charge. If someone told you the 15-minute rule applies to your Las Vegas home, that is a different item.' },
      { q: 'What net metering tier am I on in Nevada?', a: 'Nevada has four tiers. Tier 4 credits excess generation at 75% of the retail rate, and the tier is locked to the installation address for 20 years. Tiers 1, 2 and 3 were closed at 95%, 88% and 81% respectively. Which tier you are on depends on when your system was approved, and it is stated in your interconnection paperwork.' },
      { q: 'Can I cancel my solar contract because of the demand charge?', a: 'Not automatically — a rate change the utility was entitled to make is generally not a breach by your installer. But it can matter in two specific ways. Nevada requires any agreement referencing utility electricity prices to carry a 12-point disclaimer that rates may go up or down and savings may vary (NRS 598.9819), and it bars a financier from advertising a misleading statement about a utility\'s rate (NRS 598.982183). If you were promised a specific outcome that ignored a known rate change, that is a different question from the rate change itself.' },
      { q: 'Does a battery eliminate the demand charge?', a: 'A battery can reduce it, because it can discharge during your peak window instead of drawing from the grid. Whether it eliminates the charge depends on the battery size, how your system is configured, and whether your rate plan actually credits battery discharge against the demand window. The Clark County battery attach rate on 2025 permits was only 4.2%, so most Nevada solar homes have no battery at all.' },
    ],
    content: [
      { type: 'p', content: 'If you have solar on your roof in Southern Nevada, a change to how your bill is calculated is scheduled to take effect on 1 January 2027. It is called a Daily Demand charge, and it works on a principle that catches most solar homeowners off guard: it bills your single worst 15-minute period of the month rather than your total usage.' },
      { type: 'callout', content: 'Dated page. Verified 3 November 2026. This charge has already been delayed twice and is currently on appeal to the Nevada Supreme Court with no hearing scheduled. Check the current status before making a decision based on the 1 January 2027 date.' },
      { type: 'h2', content: 'What a demand charge actually does' },
      { type: 'p', content: 'A normal electric bill charges you for energy: how many kilowatt-hours you used across the month. A demand charge adds a second, separate component based on power: the highest 15-minute average draw recorded during the billing cycle.' },
      { type: 'p', content: 'The practical effect is that one short window can set the charge for the entire month. Running the air conditioning on a 115-degree afternoon while the oven, the dryer and the pool pump are all going — that 15 minutes becomes the number you pay on, even if the rest of the month was modest.' },
      { type: 'p', content: 'This is a legitimate rate design that many utilities use for commercial customers. Applied to residential solar customers, it produces a specific and uncomfortable outcome, because it targets precisely the moment when a solar system without storage cannot help.' },
      { type: 'h2', content: 'Why solar without a battery struggles with this' },
      { type: 'p', content: 'Solar panels produce power while the sun is up. Your peak draw usually is not then. In a Las Vegas summer, the highest demand period tends to land in the late afternoon and early evening — the air conditioning is still working hard, the sun is low, and production has fallen off sharply.' },
      { type: 'p', content: 'A system without a battery has nothing to draw on at that moment, so it buys from the grid exactly when the demand window is being set. The panels still reduced your total consumption, which lowers the energy component. They do nothing for the demand component. That is the gap that makes savings projections built on pre-demand-charge assumptions unreliable.' },
      { type: 'p', content: 'The scale of the exposure is worth understanding. Clark County\'s battery attach rate on 2025 permits was just 4.2%, and 6.5% statewide. Most Nevada solar homes have no battery, which means most of them face this component without the one piece of equipment that can reduce it.' },
      { type: 'h2', content: 'Clear up a confusion that is costing people money' },
      { type: 'p', content: 'Two different changes get mixed together constantly, and the mix-up matters. The 15-minute netting change applies to Northern Nevada. It is not the Southern Nevada change. Southern Nevada\'s item is the Daily Demand charge.' },
      { type: 'p', content: 'If a salesperson, a forum post or an article told you the 15-minute netting rule applies to your Las Vegas home, you were given the wrong item. It is worth knowing the difference before you repeat it to anyone.' },
      { type: 'h2', content: 'The net metering tier you are on, and why it is locked' },
      { type: 'list', items: [
        'Tier 4 credits excess generation at 75% of the retail rate, and the tier is locked to the installation address for 20 years.',
        'Tiers 1, 2 and 3 were closed at 95%, 88% and 81% respectively.',
        'Which tier applies to you depends on when your system was approved, and it is stated in your interconnection paperwork rather than your sales contract.',
      ] },
      { type: 'p', content: 'The tier lock is genuinely valuable — it is one of the few things about a Nevada solar agreement that gets better with age, because the credit ratio does not follow the rate down. The tier you are on is worth confirming in writing, because it determines how much of each excess kilowatt-hour you actually get credit for.' },
      { type: 'h2', content: 'The context this lands in' },
      { type: 'p', content: 'Three things are happening at once, and together they explain why this is a sensitive moment for Nevada solar homeowners.' },
      { type: 'list', items: [
        'Nevada residential solar permitting fell 56%, from 20,736 permits in 2023 to 9,160 in 2025. Clark County fell 55% to 7,850.',
        'The 30% federal residential solar tax credit expired on 31 December 2025, which removed the assumption behind a lot of tax-credit arithmetic.',
        'A demand charge is arriving on a schedule that has already moved twice, which makes planning difficult for households and for the companies that sold them systems.',
      ] },
      { type: 'p', content: 'Roughly 128,861 Southern Nevada customers are on net metering out of about 1,064,543 total, and about 144,000 Nevada homes have solar. That is a large enough group that the notices going out are generating a predictable wave of searches from people trying to work out what it means for them.' },
      { type: 'h2', content: 'What this does and does not do to your contract' },
      { type: 'p', content: 'It is important to be precise here, because this is where a lot of bad advice circulates. A utility rate change that the utility was entitled to make is generally not a breach by your installer. If your contract says savings may vary and rates may change, a rate change alone does not cancel that contract.' },
      { type: 'p', content: 'What it can do is expose a specific kind of problem. Nevada law requires that any agreement referencing utility electricity prices carry a 12-point disclaimer stating that rates may go up or down and that savings may vary, under NRS 598.9819. Nevada also prohibits a financier from advertising a false or misleading statement about a utility\'s electricity rate, under NRS 598.982183.' },
      { type: 'p', content: 'So the question is not "did rates change." The question is whether you were told something about rates that was known to be wrong when it was said, or whether the required disclaimer was missing entirely. Those are documented, checkable things, and they are different from a rate change you simply did not like.' },
      { type: 'warning', content: 'Do not stop making payments over the demand charge. Missing payments creates default, collection and credit consequences, and raising a dispute does not pause your obligation. Review your documents and get qualified advice first.' },
      { type: 'h2', content: 'What to check in your own file, in order' },
      { type: 'list', items: [
        'Find the savings projection you were given. Look specifically at what it assumed about utility rates, and whether it mentioned demand charges at all.',
        'Find the required rate disclaimer. NRS 598.9819 requires it in at least 12-point type if the agreement references utility electricity prices. If it is absent, note that.',
        'Confirm your net metering tier and the approval date from your interconnection paperwork, not your sales contract.',
        'Check whether your system includes a battery, and if so, whether it is configured to discharge during your peak demand window.',
        'Look at your contract for the contractor licence number and the monetary limit on that licence, which NRS 624.875 requires to appear.',
        'Write down the date you signed, and whether a recorded verification call was made at signing or within 48 hours, as NRS 598.98213 requires before installation may begin.',
      ] },
      { type: 'h2', content: 'The realistic near-term moves' },
      { type: 'p', content: 'For most homeowners the practical question is not cancellation — it is how to reduce exposure to a component that solar alone cannot address. Shifting heavy appliance use out of the peak window, staggering the air conditioning and the dryer, and confirming which rate plan you are actually on are all things you can do without spending anything.' },
      { type: 'p', content: 'A battery is the equipment answer, and it is a real answer, but it is also a significant purchase and it only helps if it is configured against the demand window. Before buying anything, get the arithmetic in writing for your specific address and rate plan rather than a generic estimate.' },
      { type: 'p', content: 'And if you were sold a system on a savings promise that assumed a billing structure Nevada was already moving away from, that is worth reviewing while the documents are still findable. The most useful thing you can do this month is locate the original projection and compare it to what your contract actually guarantees.' },
    ],
  },
];
