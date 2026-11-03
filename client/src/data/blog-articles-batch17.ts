// Batch 17 — The survey-triggered rescission right.
//
// Why this page exists: Nevada's SB 379 (2025) created a separate, standalone
// rescission right that almost nobody knows about and no Nevada competitor
// covers. If a physical survey conducted AFTER the agreement was signed would
// raise the price or change the equipment, the homeowner gets a fresh 3-business-
// day window measured from receipt of those survey results — even if the original
// three days are long gone.
//
// This is a recurring Valley pattern: a rep closes at the kitchen table, then a
// post-sale survey "discovers" a panel upgrade, main-panel derate, trenching or a
// different inverter, and the price moves. Homeowners assume they are trapped.
//
// Every statutory reference below was read from the bill text of SB 379 (2025),
// 83rd Session, on 3 Nov 2026, and cross-checked against NRS 598.98216. See
// docs/nevada-verified-facts-2026-11-03.md and
// docs/verified-external-findings-2026-11-03.md.
import type { BlogPost } from './blog';
export const batch17BlogPosts: BlogPost[] = [
  {
    slug: 'nevada-solar-survey-price-increase-new-cancellation-window',
    title: 'They Changed the Price After You Signed: Nevada\'s Second Cancellation Window',
    metaTitle: 'Nevada: New 3-Day Window When Solar Price Changes After Survey',
    metaDescription: `If a post-signing solar survey raises your price or changes your equipment, Nevada law may give you a fresh 3-business-day cancellation window. Here is how it works.`,
    category: 'Nevada',
    readTime: '10 min read',
    publishDate: 'November 3, 2026',
    excerpt: 'Most Nevada homeowners are told the three-day cancellation window closed. But if a survey conducted after you signed would raise your price or change your equipment, a separate three-business-day clock may have started when you received those results.',
    heroImage: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=1200&q=80',
    heroAlt: 'Solar installer reviewing plans on a tablet at a residential property',
    ctaText: 'Was Your Price Changed After You Signed?',
    ctaSubtext: 'A no-obligation review compares the agreement you signed against the survey results you were later given.',
    relatedSlugs: ['nevada-solar-contract-10-day-cancellation-seniors', 'cancel-solar-contract-las-vegas-nv', 'titan-solar-nevada-out-of-business-contract-help', 'solar-payments-too-high-help'],
    faq: [
      { q: 'Does a price increase after I signed restart my cancellation window in Nevada?', a: 'It can, and this is a separate right rather than a restart. Under SB 379 (2025), section 23.2, if a physical survey performed after your agreement was executed reveals a condition that would require raising the price or changing the type of equipment, you may rescind within 3 business days after you receive the survey results. That window runs from receipt of the results, not from the original signing date.' },
      { q: 'I signed months ago. Is it too late to use this?', a: 'The original three-day window is measured from signing, so yes, that one has closed. The survey-triggered window is measured from a different event entirely: the date you received the survey results. If the survey happened recently, the clock for that right may still be running regardless of how long ago you signed the agreement.' },
      { q: 'What counts as a survey result that triggers this?', a: 'The statute describes a physical survey of the premises that reveals a condition necessitating either an increase in the price of the system or a change in the type of equipment used. Typical examples in Nevada homes include a required main-panel upgrade or derate, added trenching, a different inverter than the one quoted, or additional structural work. The trigger is the condition and the resulting change, not the label your installer gives the document.' },
      { q: 'Are there equipment substitutions that do not trigger a new window?', a: 'Yes. Subsection 3 of section 23.2 excludes a substitution when three things are all true: the substituted equipment is of equal or superior quality, the substitution does not make you incur any additional cost, and it does not reduce the estimated first-year production by more than 5 percent. If any one of those fails, the exclusion does not apply.' },
      { q: 'How do I actually send the notice, and to whom?', a: 'For a lease or purchase agreement or a power purchase agreement, written notice goes to the solar installation company. If you also financed the purchase, the loan agreement can be rescinded too, and that notice goes to the financier. The notice may be delivered, mailed, telegraphed or sent by email to the address set out in the agreement, and it must state your intent to rescind or cancel. Keep proof of the date it was sent.' },
      { q: 'Does the notice have to arrive before the deadline, or just be sent?', a: 'The statute sets the deadline by reference to the notice itself: not later than midnight of the third business day after receipt of the survey results. Because the deadline is tied to a document date you may not control, send it as soon as you can and keep evidence of when you sent it. If you are close to the deadline, do not wait to assemble a perfect case.' },
      { q: 'What if the company says the change was just a normal design update?', a: 'That is a common response, and it is worth testing against the actual documents rather than the phone call. Compare the equipment and price in the agreement you signed against the equipment and price in the final paperwork. If the price moved or the equipment type changed, the question is whether the change fits the narrow equal-or-superior exclusion above. That comparison is document work, not argument.' },
      { q: 'Should I stop making payments while I sort this out?', a: 'No. Missing payments creates default, collection and credit consequences, and raising a dispute does not pause your obligation. Keep paying while you review your documents and get qualified advice. Stopping payment is a separate decision with its own consequences that are usually worse than the problem you are trying to fix.' },
    ],
    content: [
      { type: 'p', content: 'There is a sentence that ends most conversations about cancelling a solar contract in Nevada: "You only had three days, and that was months ago." For a lot of homeowners in the Las Vegas Valley, that sentence is not actually the end of the story.' },
      { type: 'callout', content: 'The short version: if a physical survey done after you signed would raise your price or change your equipment, Nevada gives you a separate 3-business-day window that starts when you receive those survey results — not when you signed.' },
      { type: 'h2', content: 'The pattern this exists to address' },
      { type: 'p', content: 'The sequence is common enough in Southern Nevada that it is almost a script. A representative closes the deal at the kitchen table. The quoted price and equipment are written into the agreement. You sign. Then, some days or weeks later, someone comes out to look at the property properly.' },
      { type: 'p', content: 'The survey comes back and finds something the sales visit missed or did not mention. The electrical panel needs a heavy-up or a derate. Trenching is needed that was not in the original scope. The inverter quoted is not the inverter that will be installed. The roof plane needs work before panels can go on it.' },
      { type: 'p', content: 'The price goes up, or the equipment changes, or both. And the homeowner is left with the reasonable belief that they already used their cancellation right and now have to live with terms they never agreed to.' },
      { type: 'h2', content: 'What Nevada actually says' },
      { type: 'p', content: 'SB 379, passed in 2025, addressed this directly. Section 23.2 of the act requires the solar installation company to perform an on-site physical survey and provide the results to the customer — and it contemplates that the survey may happen before or after the agreement is executed.' },
      { type: 'p', content: 'It then creates a distinct remedy. If the results of a survey performed after the agreement was executed reveal a condition that would necessitate altering the agreement to increase the price, or to change the type of equipment used, the customer may rescind within 3 business days after receiving those survey results.' },
      { type: 'list', items: [
        'It covers lease agreements, purchase agreements and power purchase agreements.',
        'For a purchase that was financed, the loan agreement can be rescinded as well — the right extends to both documents.',
        'The window is measured from receipt of the survey results, which is a different date from the signing date.',
        'Notice may be delivered, mailed, telegraphed, or sent by email to the address in the agreement.',
      ] },
      { type: 'p', content: 'This right is written into the same statute that gives you the standard three-business-day cancellation period, NRS 598.98216, as a separate and additional trigger. It is not a favour the company extends. It is a right that runs on its own clock.' },
      { type: 'h2', content: 'The narrow exception worth knowing' },
      { type: 'p', content: 'There is one carve-out, and it is narrower than it sounds. A substitution of equipment does not trigger the right if all three of these are true at once: the substituted equipment is of equal or superior quality, the substitution does not make you incur any additional cost, and it does not reduce the estimated first-year production by more than 5 percent.' },
      { type: 'p', content: 'All three. Not one of them. If the substitution costs you money, or downgrades the equipment, or trims first-year production by more than 5 percent, the exception does not apply and the right stands.' },
      { type: 'p', content: 'This is worth reading carefully, because "we upgraded you to a better part at no cost" is the most common answer a homeowner gets when they raise this. Sometimes that answer is true and the exception applies. Sometimes it is not, and the way to find out is to compare the two documents rather than argue about the description.' },
      { type: 'h2', content: 'Why the date on the survey email matters more than anything else' },
      { type: 'p', content: 'Everything here turns on one date: when you received the survey results. Not when the survey was performed. Not when the price changed in the company\'s system. When the results reached you.' },
      { type: 'p', content: 'That makes your own records unusually valuable. A dated email with a PDF attached, a portal notification, a text message with a link, a signature on a revised proposal — any of these establishes the starting point. If the survey results were delivered verbally and nothing was written down, that is a harder position, and it is worth reconstructing the timeline from your phone records and emails while it is still recoverable.' },
      { type: 'warning', content: 'Deadlines in this area are short — three business days. If you believe a post-signing survey changed your price or equipment, gather your documents and get advice immediately rather than waiting for a clearer picture. Business days exclude weekends and holidays, so a Friday receipt can mean a Wednesday deadline.' },
      { type: 'h2', content: 'What to pull together' },
      { type: 'p', content: 'If you want this reviewed properly, four documents do most of the work. Each one answers a different question, and together they establish whether the window applies and whether it is still open.' },
      { type: 'list', items: [
        'The agreement you originally signed, including the equipment schedule and the price. This is your baseline for what was agreed.',
        'The survey results you were later given, with the date they were sent and the date you received them. This establishes the trigger and the clock.',
        'Any revised proposal, change order or updated price sheet that followed the survey. This is where a price increase or equipment change usually shows up.',
        'Your financing agreement, if the purchase was financed, so both the sale document and the loan document can be reviewed together.',
      ] },
      { type: 'p', content: 'If the two documents show the same price and the same equipment, you likely do not have a survey-triggered claim, and it is better to know that quickly. If they show a higher price or different equipment, the next question is simply whether the three-business-day window is still open.' },
      { type: 'h2', content: 'Where this fits with Nevada\'s other rescission rights' },
      { type: 'p', content: 'Nevada now has several distinct cancellation triggers, and they are easy to confuse. Sorting out which one applies to your file is most of the work.' },
      { type: 'list', items: [
        'Three business days from signing, for a homeowner under 60. This is the standard window most people are told about.',
        'Ten business days from signing, for a homeowner aged 60 or older. Same statute, longer period, and it is frequently omitted when the rule is explained.',
        'Three business days from receipt of post-signing survey results, when the survey would raise the price or change the equipment. This is the one on this page.',
      ] },
      { type: 'p', content: 'They run independently. Using one does not consume another, and the fact that the first window closed says nothing about whether the survey window opened later. That is the part almost nobody explains at the kitchen table.' },
      { type: 'h2', content: 'If the window has already closed' },
      { type: 'p', content: 'A closed window is not the same as having no options, though it does change the shape of the question. Nevada law also makes an agreement voidable in specific documented circumstances — for example, where the installer was unlicensed or operating beyond its licence limit when you signed, or where a company knowingly failed to follow the disclosure requirements. Those are conditions you check against public records and the contract itself rather than arguments about what someone said.' },
      { type: 'p', content: 'The practical next step is the same either way. Get the agreement, the survey results and the financing paperwork into one place, compare what was promised against what was delivered, and find out which of Nevada\'s cancellation rights applies to your file and whether it is still live. That is a document review, not a negotiation, and it takes far less time than most people assume.' },
    ],
  },
];
