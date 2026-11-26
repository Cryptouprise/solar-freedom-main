#!/usr/bin/env node
/**
 * Rewrites the Freedom Forever bankruptcy article from the conditional tense
 * ("if Freedom Forever files") to the verified past tense.
 *
 * WHY: the page earns 97 impressions across 28 bankruptcy-intent queries
 * (1 Sep - 22 Nov 2026) at an average position near 18. Every one of those
 * queries is someone looking for what actually happened. The article instead
 * speculated about a filing that occurred on 15 April 2026, and never mentioned
 * the August 2026 conversion to Chapter 7, the trustee, or the claim deadline.
 * A reader who arrives and sees "if they file" leaves immediately, which is
 * consistent with the 1 click that page earned.
 *
 * All facts below were read on 26 Nov 2026 from the ElevenFlo case analysis of
 * Freedom Forever LLC, No. 26-10522 (D. Del.), which cites docket numbers.
 */
import fs from "node:fs";
import path from "node:path";

const FILE = path.resolve(process.cwd(), "client/src/data/blog-articles-batch9.ts");
let src = fs.readFileSync(FILE, "utf8");

const START = src.indexOf("slug: 'freedom-forever-solar-bankruptcy-what-homeowners-can-do-2026'");
if (START === -1) throw new Error("Freedom Forever slug not found");
// The object ends at the next "\n  },\n" after START
const END = src.indexOf("\n  },\n", START);
if (END === -1) throw new Error("Freedom Forever object end not found");

const NEW = `slug: 'freedom-forever-solar-bankruptcy-what-homeowners-can-do-2026',
    title: 'Freedom Forever Bankruptcy: Do You Still Have to Pay? (2026)',
    metaTitle: "Freedom Forever Bankruptcy 2026: Chapter 7 & Your Loan",
    metaDescription: "Freedom Forever is in Chapter 7 liquidation. The trustee was appointed 7 August 2026 and claims closed 16 October. What that means for your loan, warranty and system.",
    category: 'Solar Companies',
    readTime: '9 min read',
    publishDate: 'April 19, 2026',
    updatedDate: 'November 26, 2026',
    excerpt: 'Freedom Forever filed Chapter 11 on 15 April 2026 and converted to Chapter 7 liquidation on 7 August 2026. There is no reorganisation and no buyer. Your loan or lease is a separate agreement with a lender that is still collecting, so here is what actually changed and what did not.',
    heroImage: '/manus-storage/freedom-forever-investigation-texas_f07bc483.png',
    heroAlt: 'Freedom Forever Solar bankruptcy documents and consumer contract review',
    ctaText: 'Get Your Free Case Review',
    ctaSubtext: 'Bring the agreement, the financing documents and the service history. We will map which entity still owes you what.',
    relatedSlugs: ['how-to-get-out-of-a-solar-contract', 'solar-company-went-out-of-business', 'get-out-of-solar-contract-by-state'],
    faq: [
      { q: 'Did Freedom Forever go out of business?', a: 'Yes. Freedom Forever LLC filed Chapter 11 on 15 April 2026 and the court converted all three debtor cases to Chapter 7 liquidation on 7 August 2026 after its sale process ended without a buyer. Alfred T. Giuliano was appointed trustee. There is no reorganisation and no successor taking over the business as a going concern.' },
      { q: 'Do I still have to pay my Freedom Forever solar loan?', a: 'In most cases yes, because the loan is a separate agreement with a lender rather than with Freedom Forever. The lender did not file for bankruptcy and is still collecting. Whether the lender has any liability to you is a separate question that depends on what it knew about the installer and what your documents say, so treat the payment obligation and the dispute as two different things.' },
      { q: 'What happens to my Freedom Forever warranty?', a: 'The workmanship warranty was Freedom Forever's own promise, and there is no operating company left to perform it, so it is effectively unenforceable in practice. Manufacturer warranties on panels and inverters are separate and usually survive, because they are issued by the equipment maker. A general unsecured claim against the estate is not a realistic substitute for warranty service, since the company estimated nothing would be left for unsecured creditors.' },
      { q: 'Can I still file a claim against Freedom Forever?', a: 'The general proof of claim deadline passed on 16 October 2026, so a homeowner claim filed now would normally be late. Government units have until 3 February 2027. If you believe you have a claim and missed the date, that is a question for a bankruptcy attorney rather than a general guide, because the rules for a late claim are specific.' },
      { q: 'Who finishes a Freedom Forever installation that was never completed?', a: 'Not the trustee. The conversion order lets the project financing partners use their contract remedies, including step-in rights to complete open installations. Those partners included Sunrun, EverBright, Project Solar, EnFin, GoodLeap, Credit Human and Participate. Whether your specific project gets completed depends on which partner financed it, so identify your financier first.' },
      { q: 'Was there a buyer for Freedom Forever?', a: 'No. The debtors ran a sale process and named Velera Energy as stalking horse, but the official committee of unsecured creditors declined to qualify that bid and the debtors cancelled the sale hearing on 30 July 2026. They moved to convert on 3 August and the court converted the cases on 7 August.' },
      { q: 'What should I do first as a Freedom Forever customer?', a: 'Identify which entity actually holds your agreement: the installer, the lender, the lease or PPA owner, or a servicer. Then gather the signed agreement, the financing documents, the completion and permission-to-operate records, and the service history. Most of the practical answers depend on that entity map rather than on the bankruptcy itself.' },
    ],
    content: [
      { type: 'p', content: 'Direct answer: Freedom Forever is not reorganising. The company filed Chapter 11 on 15 April 2026, the sale process ended without a buyer, and on 7 August 2026 the court converted all three debtor cases to Chapter 7 liquidation. A trustee administers what is left. That changes what you can recover from Freedom Forever, but it does not by itself cancel a loan or lease that a separate lender still owns.' },
      { type: 'stat-block', stats: [
        { value: '15 Apr 2026', label: 'Chapter 11 petition date' },
        { value: '7 Aug 2026', label: 'Converted to Chapter 7' },
        { value: '16 Oct 2026', label: 'General claim deadline (passed)' },
        { value: '$111.8M', label: 'Owed to secured lender SolarEdge' },
      ] },
      { type: 'callout', content: 'The distinction that decides most of these files: Freedom Forever is gone, but the entity that holds your loan or lease is usually a different company that is still operating and still collecting. Check the names on your statements before you act on the word "bankruptcy".' },
      { type: 'h2', content: 'What actually happened, in order' },
      { type: 'list', items: [
        '15 April 2026: Freedom Forever LLC files Chapter 11 in the District of Delaware, case No. 26-10522. Two affiliates filed on 2 May 2026.',
        '23 April 2026: the company\'s chief executive gives three reasons for the filing: the One Big Beautiful Bill Act\'s repeal of the residential solar tax credit, executive orders aimed at solar subsidies, and repeated payment breaches by certain finance partners.',
        '28 to 30 July 2026: the auction runs and closes without a sale. Velera Energy had been named stalking horse, but the official committee of unsecured creditors declined to qualify that bid on 30 July.',
        '3 August 2026: the debtors move to convert, telling the court they could not fund a Chapter 11 and had no reasonable likelihood of confirming a plan.',
        '7 August 2026: the court converts all three cases to Chapter 7. Alfred T. Giuliano is appointed interim trustee.',
        '16 October 2026: the general proof of claim deadline passes. Government units have until 3 February 2027.',
      ] },
      { type: 'image', src: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&q=80', alt: 'Bankruptcy case documents and a solar contract laid out for review', caption: 'The case is in Chapter 7, not Chapter 11. That single word changes whether anyone is trying to keep the business alive, and nobody is.' },
      { type: 'h2', content: 'Do you still owe the money?' },
      { type: 'p', content: 'Usually yes, and this is the part that surprises homeowners most. If you financed the system, the loan is owed to a lender, not to Freedom Forever. That lender did not file for bankruptcy. It is still servicing the account and still expecting payment. Stopping payments because the installer failed generally creates a default, collection activity, and possible credit consequences on an obligation that was never part of the bankruptcy.' },
      { type: 'p', content: 'The same structure applies to a lease or a power purchase agreement. Those agreements are typically held by the entity that owns the equipment, which may be a fund or a finance partner rather than the installer. The bankruptcy of the installer and the survival of the financing are two separate facts, and conflating them is the most common mistake in this situation.' },
      { type: 'callout', content: 'Do not stop paying as a negotiating tactic. A dispute does not pause the obligation, and a payment default gives the lender a remedy that has nothing to do with the installer\'s failure.' },
      { type: 'h2', content: 'Who finishes an incomplete installation' },
      { type: 'p', content: 'The trustee is not going to finish your roof. What the conversion order did was let the project financing partners use their own contract remedies without asking the court for permission, including step-in rights to complete open installations. The partners identified in the order were Sunrun, EverBright, Project Solar, EnFin, GoodLeap, Credit Human and Participate.' },
      { type: 'p', content: 'That means the practical answer for an unfinished system depends on who financed your project rather than on the bankruptcy. GoodLeap may take possession of and complete projects under its agreements but is not required to. EnFin\'s equipment is to be returned. On 6 August 2026 the court approved terminating Freedom Forever\'s agreements with EverBright specifically so that EverBright could take over that pipeline. Start by identifying your financier, then ask that company directly what it intends to do with your project.' },
      { type: 'h2', content: 'What happened to the 25-year warranty' },
      { type: 'p', content: 'Freedom Forever promoted a 25-year production guarantee and a workmanship warranty. Both were the company\'s own promises, and there is no operating company left to perform them. In practice that means the workmanship coverage is not something you can enforce, and the production guarantee is not something you can call in.' },
      { type: 'p', content: 'Two things do survive. Manufacturer warranties on panels and inverters are issued by the equipment maker, not the installer, and usually remain valid for equipment defects. And a homeowner claim in the bankruptcy is theoretically possible, but the company told the court at filing that it estimated nothing would be left for unsecured creditors after administrative expenses, so a general unsecured claim is not a realistic replacement for warranty service.' },
      { type: 'h2', content: 'If you have a claim, the deadline has passed' },
      { type: 'p', content: 'The general bar date was 16 October 2026. If you did not file by then, a claim now would ordinarily be late. Government units have until 3 February 2027, which does not help a homeowner directly. Whether a late claim can still be allowed is a specific bankruptcy question, so take it to a bankruptcy attorney rather than treating a general guide as an answer.' },
      { type: 'p', content: 'It is also worth being clear about what a claim would have been worth. SolarEdge, the secured lender, was owed about $111.8 million at the petition date and holds a first-priority lien on substantially all of the company\'s assets. Tesla held a narrower security interest of about $22.09 million. Those liens rank ahead of unsecured creditors, which is why the estate\'s own filing projected no recovery for them.' },
      { type: 'h2', content: 'What a Freedom Forever homeowner should do now' },
      { type: 'list', items: [
        'Build the entity map. Write down every name that appears on your agreement, your loan statements, your invoices and your service records. These are often three or four different companies.',
        'Separate the two questions. Whether the installer failed is one question. Whether the lender has any liability to you is a different question that depends on what it knew and what your documents say.',
        'Keep paying unless and until qualified advice says otherwise, and get that advice in writing.',
        'Preserve the completion record: permits, inspection results, permission to operate, production data, and every service request with its date.',
        'If the system was never completed, contact the financing partner identified above rather than the trustee.',
        'If you were sold a system on representations that do not match the documents, preserve both sides of that comparison. That is a separate claim from the bankruptcy and it is not extinguished by it.',
      ] },
      { type: 'h2', content: 'Why this matters beyond one company' },
      { type: 'p', content: 'Freedom Forever is not an isolated failure. Sunnova sold substantially all of its assets through a Chapter 11 process in 2025 and has ceased independent operations, with SunStrong Management servicing most in-service systems. Titan Solar Power ceased operations on 13 June 2024 and filed Chapter 7. Mosaic Sustainable Finance confirmed a Chapter 11 plan that took effect on 22 September 2025, moving loan servicing to a Forbright Bank unit. SunPower and ADT Solar both exited before that.' },
      { type: 'p', content: 'The pattern is consistent: the installer fails, the financing survives, and the homeowner is left holding an obligation attached to equipment nobody is maintaining. That is why the useful work in these cases is identifying which entity holds which obligation, and then asking the right question of the right company.' },
      { type: 'video', src: '/manus-storage/ff-breaking-solar-contracts-video_aed64619.mp4', caption: 'Watch: how the installer and the lender end up as two separate problems, and which one you can actually negotiate with.' },
      { type: 'callout', content: 'Bring the agreement, the loan documents and the service history to a free review. The goal of that call is to establish which entity holds which obligation and whether there is a fact-specific path forward. It is a 15 to 20 minute conversation with no obligation.' },
    ],`;

src = src.slice(0, START) + NEW + src.slice(END);
fs.writeFileSync(FILE, src);
console.log("Freedom Forever article rewritten with verified Chapter 7 facts.");
