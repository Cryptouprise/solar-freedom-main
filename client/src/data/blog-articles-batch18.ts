// Batch 18 — The pre-PTO payment ceiling.
//
// Why this page exists: Nevada caps what a solar company may collect before the
// system is actually turned on. SB 379 (2025) added this as a required contract
// provision: beyond an initial down payment or deposit of the lesser of $1,000 or
// 10 percent of the aggregate contract price, the purchaser is not required to
// pay the installer until the system receives permission to operate from the
// utility, or passes final inspection where it will not be grid-connected.
//
// Southern Nevada has a real cohort here. NV Energy interconnection runs two
// sequential documentation reviews, and projects can sit for months. A homeowner
// paying a loan on a system that was never switched on is a specific, documented,
// local pattern — and almost nobody has built the page.
//
// Statutory text read from SB 379 (2025), 83rd Session, on 3 Nov 2026. The
// provision appears as item 16 of the required contents of a purchase agreement
// and again in the lease/PPA required-contents list. Cross-checked against
// NRS 598.982185. See docs/nevada-verified-facts-2026-11-03.md.
import type { BlogPost } from './blog';
export const batch18BlogPosts: BlogPost[] = [
  {
    slug: 'nevada-solar-payment-before-permission-to-operate',
    title: 'Paying for Solar That Was Never Switched On: Nevada\'s Pre-PTO Payment Cap',
    metaTitle: 'Nevada: How Much You Can Be Charged Before Solar Is Turned On',
    metaDescription: `Nevada caps what a solar company may collect before your system is switched on. If you were billed more than the limit before PTO, here is what the law says.`,
    category: 'Nevada',
    readTime: '9 min read',
    publishDate: 'November 3, 2026',
    excerpt: 'Nevada limits what a solar company may collect before your system actually receives permission to operate: the lesser of $1,000 or 10 percent of the contract price. If you were billed far beyond that while the system sat unconnected, the contract provision itself is worth checking.',
    heroImage: 'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=1200&q=80',
    heroAlt: 'Residential electrical panel and utility meter beside a solar inverter',
    ctaText: 'Were You Billed Before the System Was On?',
    ctaSubtext: 'A no-obligation review compares your payment schedule against the date your system actually received permission to operate.',
    relatedSlugs: ['nevada-solar-survey-price-increase-new-cancellation-window', 'titan-solar-nevada-out-of-business-contract-help', 'cancel-solar-contract-las-vegas-nv', 'solar-payments-too-high-help'],
    faq: [
      { q: 'How much can a Nevada solar company collect before the system is turned on?', a: 'Nevada law requires the agreement to state that, apart from an initial down payment or deposit, you are not required to pay the installer until the system either receives permission to operate from the utility, if it will be grid-connected, or passes final inspection and becomes operational, if it will not be. That down payment or deposit may not exceed the lesser of $1,000 or 10 percent of the aggregate contract price.' },
      { q: 'What is permission to operate, and why does it matter?', a: 'Permission to operate, usually shortened to PTO, is the utility\'s written approval for your system to send power to the grid. Until it is granted, the system may be physically installed but is not authorized to operate. Nevada ties the payment restriction to that approval rather than to installation, which is the part most homeowners are never told.' },
      { q: 'I have been paying a loan for months and the system is still not on. Is that allowed?', a: 'It depends on which document you are paying under. The statutory restriction is framed around amounts paid to the solar installation company, and it is written to account for a separate loan payment made to a financier. So the honest answer needs the two documents read together: what the installer collected, and what the lender has been collecting since. That comparison is exactly what a document review does.' },
      { q: 'Does this mean I can stop paying my loan?', a: 'No. The payment restriction is a rule about what the contract may require and what the installer may collect before PTO. It is not a general permission to stop paying a lender. Missing payments creates default, collection and credit consequences, and a dispute does not pause the obligation. Keep paying while the documents are reviewed and qualified advice is obtained.' },
      { q: 'What happens if the required provision is missing from my contract?', a: 'The provision is one of the items Nevada requires a residential solar purchase agreement to contain. Under NRS 598.9822, a knowing failure to comply with the required contents makes the agreement voidable by the purchaser. That is a document question: you can check whether the provision appears in your agreement rather than relying on what anyone tells you about it.' },
      { q: 'Why do Southern Nevada projects stall before PTO?', a: 'The interconnection step involves utility review of the system documentation, and in NV Energy territory it can involve more than one sequential review round. Each round has its own turnaround, and a deficiency in the paperwork restarts it. That is why a project can be physically complete on the roof and still sit for weeks or months without authorization to operate.' },
      { q: 'What should I gather if I want this reviewed?', a: 'The signed agreement with the payment schedule, the financing agreement if the purchase was financed, the date of installation, any utility correspondence about interconnection or PTO, and your payment history showing what was collected and when. The comparison that matters is money collected before PTO against the date PTO was actually granted.' },
      { q: 'Is this the same as the three-day cancellation right?', a: 'No. The three-day and ten-day rescission windows are about changing your mind after signing. The payment ceiling is a separate requirement about when money may be collected. They can both be relevant to the same file, but they answer different questions and one does not depend on the other.' },
    ],
    content: [
      { type: 'p', content: 'There is a specific kind of stuck that happens to solar homeowners in Southern Nevada. The panels are on the roof. The inverter is mounted. The work looks finished. And the system has never been switched on, because the utility has not yet granted permission to operate.' },
      { type: 'p', content: 'Meanwhile, the payments started months ago.' },
      { type: 'callout', content: 'Nevada limits what a solar company may require you to pay before the system is actually authorized to run: apart from an initial down payment or deposit, no more than the lesser of $1,000 or 10 percent of the contract price until permission to operate is granted.' },
      { type: 'h2', content: 'What permission to operate actually is' },
      { type: 'p', content: 'Permission to operate, almost always shortened to PTO, is the utility\'s written authorization for your system to connect to the grid and begin exporting power. It is a separate step from installation and a separate step from inspection. A system can be completely installed, pass its local inspection, and still be sitting there waiting.' },
      { type: 'p', content: 'The reason is that the interconnection application has to be reviewed by the utility, and the review depends on documentation submitted on your behalf. In NV Energy territory that process can involve more than one sequential review round, each with its own turnaround. If a document is missing or wrong, the round resets. Weeks become months without anyone doing anything obviously wrong.' },
      { type: 'p', content: 'This is precisely why Nevada ties the payment rule to PTO rather than to installation. Installation is when the equipment arrives. PTO is when the thing you are paying for actually starts working.' },
      { type: 'h2', content: 'What the statute requires' },
      { type: 'p', content: 'Nevada requires a residential solar purchase agreement to contain a specific provision about payment timing. In plain terms, it must state that the purchaser is not required to pay the installation company any money, other than an initial down payment or deposit, until one of two things happens.' },
      { type: 'list', items: [
        'If the system will be connected to the grid: the system receives permission from the utility to connect.',
        'If the system will not be connected to the grid: the system passes a final inspection and becomes operational.',
      ] },
      { type: 'p', content: 'The down payment or deposit is capped at the lesser of $1,000 or 10 percent of the aggregate contract price. "Whichever is less" matters: on a $40,000 system, 10 percent is $4,000, so the cap is $1,000. On a small system where 10 percent falls under $1,000, the percentage controls instead.' },
      { type: 'p', content: 'The same requirement appears in the list of provisions a lease or power purchase agreement must contain. It is not limited to purchases.' },
      { type: 'h2', content: 'The nuance that decides most files' },
      { type: 'p', content: 'Here is the part that requires care, because it is where a lot of online advice goes wrong in both directions.' },
      { type: 'p', content: 'The restriction is written around money paid to the solar installation company, and it is drafted to account for the fact that many purchases are financed. A financed purchase has two parties collecting money at different times: the installer, and the lender. The statute coordinates the two rather than treating them as one.' },
      { type: 'p', content: 'So the useful question is not "did I make payments before PTO." Almost everyone financed did. The useful question is: what did the installer collect, when, and what does the contract say about the timing? That requires reading the sale agreement and the financing agreement together and lining them up against the date PTO was actually granted.' },
      { type: 'p', content: 'That is document work, and it produces a real answer rather than an opinion.' },
      { type: 'h2', content: 'Why the missing provision matters as much as the money' },
      { type: 'p', content: 'The payment timing rule is not just a suggestion about billing practice. It is one of the items Nevada requires to appear in the agreement itself. A contract that omits a required item is a different kind of problem from a contract that contains it and was violated.' },
      { type: 'p', content: 'Under NRS 598.9822, a knowing failure to comply with the required contents of a residential solar agreement makes that agreement voidable by the purchaser. So "is the provision in my contract at all" is a checkable question with a defined consequence, and it is worth checking before anything else.' },
      { type: 'p', content: 'Practically: open the agreement, find the payment terms section, and look for language about permission to operate or final inspection and a dollar or percentage cap on the deposit. If that language is present, the question becomes whether it was followed. If it is absent, that is its own finding.' },
      { type: 'warning', content: 'Do not stop making payments over this. The payment ceiling is a rule about what the contract may require and what the installer may collect — it is not a general licence to stop paying a lender. Missing payments creates default, collection and credit consequences, and raising a dispute does not pause the obligation. Review the documents and get qualified advice first.' },
      { type: 'h2', content: 'What to pull together, in order' },
      { type: 'list', items: [
        'The signed purchase, lease or power purchase agreement, specifically the payment terms and the required-provisions pages.',
        'The financing agreement, if the purchase was financed, showing the first payment date and the amount.',
        'The installation date, from the completion paperwork or the permit record.',
        'Every piece of utility correspondence about interconnection, including any deficiency notices and the final PTO grant with its date.',
        'Your payment history — bank or lender statements — showing each amount collected and when it was collected.',
      ] },
      { type: 'p', content: 'With those five things in one place, the comparison is straightforward: money collected before PTO, against the date PTO was granted, against what the contract said was allowed. That is the whole analysis, and it is far more useful than a general complaint.' },
      { type: 'h2', content: 'If the system is still not on' },
      { type: 'p', content: 'A stalled interconnection is its own problem, separate from the payment question, and it is worth chasing in parallel. The utility can usually tell you the current status of the application and what, if anything, is outstanding. That answer identifies whether the delay sits with the utility, with the installer, or with a missing document nobody has supplied.' },
      { type: 'p', content: 'If the installing company is no longer operating, the interconnection question and the payment question both become harder but not unanswerable. Nevada\'s contractor licensing framework provides a complaint route with a four-year filing window, and the state operates a recovery fund for certain claims against licensed contractors. Those are real channels, and they are covered in more detail on our Nevada complaint timeline page.' },
      { type: 'h2', content: 'Where this fits' },
      { type: 'p', content: 'Nevada now has several distinct protections that apply at different moments: the three-day and ten-day rescission windows measured from signing, a separate three-day window triggered by post-signing survey results, this payment ceiling tied to permission to operate, and the voidability rules for missing required provisions or an unlicensed installer.' },
      { type: 'p', content: 'They are independent of one another, and knowing which one applies to your file is most of the work. The starting point is always the same: gather the agreement, the financing paperwork, the utility correspondence and the payment history, and compare what was promised with what actually happened. That is a review, not a negotiation, and it is the step that turns a bad feeling about a bill into a documented question with an answer.' },
    ],
  },
];