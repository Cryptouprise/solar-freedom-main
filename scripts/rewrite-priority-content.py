#!/usr/bin/env python3
"""Replace the three highest-opportunity articles with answer-first, source-backed copy."""
from __future__ import annotations

from pathlib import Path

ROOT = Path("/home/ubuntu/solar-freedom-main")


def replace_object(text: str, start_marker: str, end_marker: str, replacement: str) -> str:
    start = text.index(start_marker)
    end = text.index(end_marker, start)
    return text[:start] + replacement.rstrip() + "\n\n" + text[end:]


SUNRUN = r'''  {
    slug: "sunrun-solar-contract-cancellation-2026",
    title: "How to Cancel a Sunrun Contract: Before or After Installation",
    metaTitle: "How to Cancel a Sunrun Contract: Your Options",
    metaDescription: "Trying to cancel a Sunrun contract? Review the agreement, timing, written notice, post-installation options, fees, home-sale transfer, and official contacts.",
    category: "Contract Help",
    readTime: "9 min read",
    publishDate: "August 16, 2026",
    excerpt: "A Sunrun cancellation is not one universal process. The practical path depends on when and where you signed, whether installation started, and whether your agreement is a lease, PPA, loan, or purchase contract.",
    heroImage: "/manus-storage/ff-attorney-contracts-review_1d59e4bb.png",
    heroAlt: "Homeowner reviewing a Sunrun solar agreement and supporting documents",
    ctaText: "Review Your Sunrun Agreement",
    ctaSubtext: "Organize the agreement, notices, sales materials, bills, and service records for a fact-specific review.",
    relatedSlugs: ["cancel-sunrun-solar-contract-before-installation", "sunrun-complaints-california", "solar-contract-rescission-rights", "how-to-file-a-complaint-against-solar-company-attorney-general", "how-to-get-out-of-a-solar-contract", "goodleap-solar-loan-cancellation-hidden-fees-2026"],
    faq: [
      { q: "Can I cancel my Sunrun contract?", a: "Possibly, but the answer depends on the signed agreement, transaction date and location, contract type, installation status, and applicable law. Start with the cancellation notice and termination, transfer, purchase, and dispute sections rather than relying on a generic policy summary." },
      { q: "How do I cancel a Sunrun contract before installation?", a: "Act promptly. Locate every signed document and any Notice of Cancellation, follow the exact address and delivery method in the agreement, retain proof of delivery, and request written confirmation of project status. The FTC Cooling-Off Rule applies only to certain covered sales, not every solar transaction." },
      { q: "Can I cancel a Sunrun contract after installation?", a: "Post-installation options are agreement-specific and may include a contractual purchase or prepayment option, a service-transfer process when selling a home, or a documented dispute. Installation alone does not establish a universal right to cancel." },
      { q: "What is the Sunrun cancellation fee?", a: "There is no reliable universal fee. A purchase, prepayment, termination, removal, or transfer amount must come from the signed agreement or a current written quote from Sunrun. Ask for an itemized written explanation before making a decision." },
      { q: "Can I sell my house with a Sunrun agreement?", a: "Sunrun publishes a service-transfer process that involves buyer and escrow information, digital signatures, and a soft credit check. Sunrun also describes prepaying the remaining service if a buyer will not assume the agreement. The actual options depend on the agreement." },
      { q: "What is Sunrun customer service for an existing account?", a: "Sunrun currently lists 855-478-6786 for existing customers. Its home-transfer page lists the same number with extension 3 for transfer questions. Verify current contact details on Sunrun's official website before relying on them." },
      { q: "Should I stop paying while I dispute a Sunrun contract?", a: "Do not assume a dispute pauses payment obligations or credit reporting. Review the payment and dispute terms and obtain qualified advice before withholding a payment or taking any action that could create a default." },
    ],
    content: [
      { type: "p", content: "Direct answer: a Sunrun contract may have a cancellation, purchase, prepayment, transfer, or dispute path, but no single path applies to every customer. The fastest first step is to identify your agreement type, signing date and location, installation status, and the exact written notice requirements." },
      { type: "callout", content: "Use the signed agreement as the source of truth. A website article cannot determine whether a cancellation right, breach, remedy, fee, deadline, or credit consequence applies to an individual account." },
      { type: "h2", content: "What should you check first in a Sunrun agreement?" },
      { type: "list", items: [
        "The full agreement, all addenda, and any separate loan or financing documents.",
        "Any Notice of Cancellation and the stated deadline, mailing address, email address, or delivery method.",
        "Sections labeled cancellation, termination, purchase option, prepayment, transfer, default, dispute resolution, arbitration, warranty, and production guarantee.",
        "The legal names of the seller, installer, system owner, lender, and account servicer; they may not be the same company.",
        "The sales proposal, savings illustration, texts, emails, recordings where lawful, utility bills, system-production records, and service history."
      ] },
      { type: "h2", content: "How do you cancel a Sunrun contract before installation?" },
      { type: "p", content: "If installation has not started, act quickly. Follow the notice in your documents exactly, keep a signed copy, preserve delivery proof, and ask Sunrun to confirm the project and financing status in writing. Do not rely only on a phone call or a salesperson's verbal assurance." },
      { type: "p", content: "The [FTC Cooling-Off Rule](https://consumer.ftc.gov/articles/buyers-remorse-ftcs-cooling-rule-may-help) gives consumers three business days to cancel certain sales made at a home, workplace, dormitory, or a seller's temporary location. The FTC also lists important exclusions, including transactions made entirely online, by mail, or by telephone. Confirm coverage before treating the rule as applicable to your transaction." },
      { type: "h2", content: "What changes after installation?" },
      { type: "p", content: "After installation, review the agreement rather than assuming either that cancellation is impossible or that an equipment problem automatically ends the contract. Identify any written purchase, prepayment, removal, service, production, warranty, default, and dispute provisions. Request current terms or quotes in writing and compare them with the signed documents." },
      { type: "p", content: "If a sales statement, promised savings figure, design, equipment description, utility-bill representation, or service commitment differs from the written agreement or actual records, preserve both sides of the comparison. A qualified consumer attorney or regulator can assess whether the discrepancy is legally significant in the applicable jurisdiction." },
      { type: "h2", content: "What if you are selling the home?" },
      { type: "p", content: "Sunrun's official [home-sale transfer page](https://www.sunrun.com/moving-made-easy) describes a process using buyer and escrow information, digital signatures, and a soft credit check. Sunrun says a seller may also be able to prepay the remaining service when a buyer does not want to assume the agreement. Start early, obtain every requirement and amount in writing, and coordinate the timeline with escrow." },
      { type: "h2", content: "How do you evaluate a cancellation fee or buyout quote?" },
      { type: "list", items: [
        "Ask whether the figure is a purchase price, service prepayment, early-termination amount, removal amount, transfer amount, or another charge.",
        "Request an itemized written quote with its calculation date and expiration date.",
        "Compare the quote with the exact contract section and remaining payment schedule.",
        "Do not use an internet-wide dollar range as a substitute for your written documents.",
        "If the amount or basis is disputed, preserve the quote and seek qualified review before paying or defaulting."
      ] },
      { type: "h2", content: "How should you document a Sunrun dispute?" },
      { type: "list", items: [
        "Create a one-page timeline with signing, installation, activation, service, and complaint dates.",
        "Match each disputed statement to a proposal, email, text, advertisement, recording, or witness.",
        "Compare promised and actual system production using the same time period and units.",
        "Keep pre-solar and post-solar utility bills together with Sunrun invoices.",
        "Send factual written requests and retain confirmation numbers, names, dates, and complete responses."
      ] },
      { type: "warning", content: "Do not stop paying, disable equipment, remove panels, sign a release, or agree to new terms based only on general internet guidance. Those actions can have contract, property, safety, and credit consequences." },
      { type: "h2", content: "Where can you contact Sunrun or report a problem?" },
      { type: "p", content: "Sunrun's official [customer-support page](https://www.sunrun.com/contact-us) currently lists 855-478-6786 for existing customers. For a financial-product complaint, the [CFPB complaint portal](https://www.consumerfinance.gov/complaint/) may be relevant. The FTC accepts fraud reports at [ReportFraud.ftc.gov](https://reportfraud.ftc.gov/), and state attorneys general maintain consumer-complaint channels. Filing a complaint does not itself cancel a contract." },
      { type: "h2", content: "Bottom line" },
      { type: "p", content: "For the fastest accurate answer, assemble the agreement, cancellation notice, proposal, communications, bills, production data, and service record. Then compare the written options with current information from Sunrun and obtain qualified review for any disputed legal or credit issue." },
    ],
  },'''

GOODLEAP = r'''  {
    slug: "goodleap-solar-loan-cancellation-hidden-fees-2026",
    title: "How to Cancel a GoodLeap Solar Loan: Payoff, Fees and Home Sale",
    metaTitle: "Cancel a GoodLeap Solar Loan: Payoff, Fees & Sale",
    metaDescription: "Review a GoodLeap solar loan before payoff or cancellation: agreement documents, payment changes, prepayment policy, UCC-1, home-sale assumption, and complaints.",
    category: "Contract Help",
    readTime: "9 min read",
    publishDate: "August 16, 2026",
    excerpt: "A GoodLeap loan payoff, a dispute with an installer, and cancellation of a solar installation agreement are different issues. This guide separates them and links to GoodLeap and CFPB procedures.",
    heroImage: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&q=80",
    heroAlt: "Homeowner comparing a GoodLeap solar loan agreement with account records",
    ctaText: "Review Your GoodLeap Documents",
    ctaSubtext: "Organize the loan agreement, solar proposal, payoff quote, payment history, and installer records for a fact-specific review.",
    relatedSlugs: ["how-to-get-out-of-a-solar-contract", "cancel-solar-loan-or-lease-early", "solar-payments-too-high-help", "solar-contract-rescission-rights", "sell-house-with-solar-panels"],
    faq: [
      { q: "Can I cancel a GoodLeap solar loan?", a: "There is no universal cancellation process after funding. Review whether you are seeking to cancel an unfunded application, pay off a funded loan, dispute loan terms, or resolve a separate problem with the installer. Each path uses different documents and procedures." },
      { q: "Does GoodLeap charge a prepayment penalty?", a: "GoodLeap's current FAQ says it does not assess a fee or penalty for prepayments. Confirm that statement against your signed agreement and request a current payoff quote before relying on it for a transaction." },
      { q: "How do I get a GoodLeap payoff quote?", a: "GoodLeap's FAQ says a borrower can generate a payoff quote in the GoodLeap Home app by selecting the account and choosing Payoff Quote. Save the PDF and compare the amount and date with the agreement and payment history." },
      { q: "What happens to a GoodLeap solar loan when I sell my house?", a: "GoodLeap identifies two stated options: pay off the balance through sale proceeds, or request an assumption by a buyer who applies and satisfies GoodLeap's underwriting. GoodLeap reserves the right to decline an assumption." },
      { q: "Is a GoodLeap UCC-1 a lien on my home?", a: "GoodLeap describes its UCC-1 as a security interest in the solar equipment rather than the home, while noting that a county fixture filing may appear in property records. Ask the title or closing professional what appears in the specific property record." },
      { q: "Where can I find my GoodLeap agreement?", a: "GoodLeap says account documents can be downloaded in the GoodLeap Home app or at home.goodleap.com. If a document is missing, contact GoodLeap account support and keep the request and response." },
      { q: "How do I complain about a GoodLeap solar loan?", a: "GoodLeap publishes an internal consumer-complaint contact. Consumers can also submit eligible financial-product complaints to the CFPB. A complaint creates a record but does not automatically pause payments or cancel a loan." },
    ],
    content: [
      { type: "p", content: "Direct answer: first identify what you mean by cancel. An unfunded application, a funded GoodLeap loan payoff, a dispute about loan disclosures, and a dispute with the solar installer are not the same process. Do not assume that canceling installation work automatically cancels a separate financing obligation." },
      { type: "callout", content: "GoodLeap's current public FAQ says it does not charge a prepayment fee or penalty. That makes the signed agreement and a current written payoff quote more reliable than generic claims about a standard cancellation fee." },
      { type: "h2", content: "Which GoodLeap documents should you collect first?" },
      { type: "list", items: [
        "The promissory note, Truth in Lending disclosure, security agreement, and every addendum.",
        "The solar installation contract, cash-price proposal, system design, and change orders.",
        "The account payment history, current balance, target-balance details, and payoff quote.",
        "Any expected-prepayment or re-amortization schedule shown in the loan documents.",
        "Sales emails, texts, recordings where lawful, tax-credit statements, utility-bill projections, and installer service records."
      ] },
      { type: "p", content: "GoodLeap says customers can retrieve agreements and statements through the [GoodLeap Home account](https://home.goodleap.com). Its [official FAQ](https://www.goodleap.com/faq) also explains payoff quotes, payment structures, home-sale options, and UCC-1 filings." },
      { type: "h2", content: "Is payoff the same as cancellation?" },
      { type: "p", content: "No. Paying off a funded loan satisfies the balance shown in a valid payoff quote; it does not retroactively erase the transaction. A legal or disclosure dispute is a separate matter. If you want to challenge an obligation rather than pay it off, preserve the documents and obtain qualified advice before missing a payment or signing a settlement." },
      { type: "h2", content: "Does GoodLeap have a prepayment penalty?" },
      { type: "p", content: "GoodLeap's FAQ states that it never assesses a fee or penalty for prepayments. Confirm the policy in your specific agreement, generate a dated payoff quote, and ask account support to explain any amount you do not recognize. Interest may continue to accrue according to the agreement until payoff is received and processed." },
      { type: "h2", content: "What should you review for dealer fees or a financed-price difference?" },
      { type: "p", content: "The CFPB's [solar-financing issue spotlight](https://www.consumerfinance.gov/data-research/research-reports/issue-spotlight-solar-financing/) reports that some solar-specific loans include markups commonly called dealer, platform, program, or finance fees. The report is industry-wide; it does not prove that a particular GoodLeap account contains an undisclosed fee." },
      { type: "list", items: [
        "Compare the written cash price of the installed system with the amount financed.",
        "Review the APR, finance charge, amount financed, total of payments, and payment schedule together.",
        "Identify whether the proposal subtracts an estimated tax credit from the displayed cost.",
        "Ask in writing for an explanation of any difference rather than labeling it unlawful without evidence.",
        "Have a qualified consumer attorney review material disclosure discrepancies."
      ] },
      { type: "h2", content: "Why can a GoodLeap payment change after the introductory period?" },
      { type: "p", content: "GoodLeap says some solar loans were structured with lower payments for the first 18 months and then re-amortize based on how much principal was paid down. The exact date, amount, and calculation must come from the account's documents. A projected tax credit is not the same as a guaranteed cash refund, and tax eligibility is individual." },
      { type: "h2", content: "What happens when you sell a home with a GoodLeap loan?" },
      { type: "p", content: "GoodLeap's FAQ identifies two paths: pay the remaining balance from sale proceeds, or ask the buyer to apply to assume the loan. An assumption is subject to GoodLeap underwriting and approval; if it is declined, GoodLeap says the loan generally must be paid off as part of the sale. Start before closing and involve the title or escrow professional." },
      { type: "p", content: "GoodLeap describes its UCC-1 filing as a security interest in the solar equipment, not the home, while noting that a fixture filing can appear in property records. For a sale or refinance, obtain the exact recorded document and current instructions rather than relying on a generic description." },
      { type: "h2", content: "What if the installer did not perform as promised?" },
      { type: "p", content: "Separate the installer problem from the loan account. Build a timeline, preserve the installation agreement, warranty, production data, permits, inspection records, service requests, and all statements about cost or savings. Then ask the installer and lender for their positions in writing. Do not assume an installer dispute pauses the loan." },
      { type: "warning", content: "Do not stop payments, ignore collection notices, or promise a payoff at a home closing without checking the agreement and current quote. Those steps can affect credit, collections, and the sale timeline." },
      { type: "h2", content: "Where can you contact GoodLeap or file a complaint?" },
      { type: "p", content: "GoodLeap's [contact page](https://www.goodleap.com/contact-us) currently lists 1-800-345-9372 and customerservice@goodleapsupport.com for account support. GoodLeap also publishes an internal [consumer complaint channel](https://www.goodleap.com/complaints). The [CFPB complaint portal](https://www.consumerfinance.gov/complaint/) accepts complaints about eligible financial products, and the FTC accepts fraud reports at [ReportFraud.ftc.gov](https://reportfraud.ftc.gov/)." },
      { type: "h2", content: "Bottom line" },
      { type: "p", content: "The fastest useful review compares five things: the installation cash price, amount financed, disclosures, payment schedule, and current payoff quote. Add the home-sale or installer records if those issues apply, and seek qualified review before taking any step that could create a default or waive a claim." },
    ],
  },'''

GENERAL = r'''  {
    slug: "how-to-get-out-of-a-solar-contract",
    title: "How to Get Out of a Solar Contract: 7 Steps to Review",
    metaTitle: "How to Get Out of a Solar Contract: 7 Steps",
    metaDescription: "Want to cancel a solar loan, lease, or PPA? Identify the parties, check written cancellation terms, preserve records, compare exit paths, and report problems safely.",
    category: "Contract Guide",
    readTime: "10 min read",
    publishDate: "August 16, 2026",
    excerpt: "There is no universal solar-contract exit. The right process depends on the transaction, contract type, timing, parties, installation status, written terms, and applicable law.",
    heroImage: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&q=80",
    heroAlt: "Homeowner organizing a solar contract, proposal, bills, and service records",
    ctaText: "Review Your Solar Contract",
    ctaSubtext: "Organize the agreement, financing documents, proposal, bills, and communications for a fact-specific review.",
    faq: [
      { q: "Can you get out of a solar contract?", a: "Sometimes, but no universal rule applies. The answer depends on the signed documents, transaction channel, timing, contract type, installation status, facts, and law. Start with the written cancellation, termination, payoff, purchase, transfer, default, and dispute provisions." },
      { q: "Can you cancel a solar contract before installation?", a: "Act quickly and follow any written Notice of Cancellation or contract procedure exactly. The FTC Cooling-Off Rule covers certain sales made at a home or temporary location, but it excludes other transactions, including some completed entirely online, by mail, or by telephone." },
      { q: "Can you cancel a solar contract after installation?", a: "Installation usually makes the issue more complex. Possible paths may include a contractual buyout or prepayment, transfer, documented service or performance dispute, negotiated resolution, or legal claim. The available path is agreement- and fact-specific." },
      { q: "What happens if I stop paying a solar loan?", a: "Missed payments can create default, collection, credit, and other consequences. A complaint or dispute does not necessarily pause the payment obligation. Review the documents and obtain qualified advice before withholding payment." },
      { q: "Can a solar lease or PPA be transferred when I sell my home?", a: "Some agreements provide a transfer or prepayment process, often with company approval and buyer requirements. Start early, request the current procedure and amounts in writing, and coordinate with the buyer, lender, title company, and escrow professional." },
      { q: "Where can I report a solar loan or sales problem?", a: "Depending on the issue, consumers can contact the company, submit an eligible financial-product complaint to the CFPB, report suspected fraud to the FTC, and use a state attorney general or local consumer-protection channel. A complaint does not itself cancel an agreement." },
    ],
    relatedSlugs: ["solar-contract-rescission-rights", "cancel-solar-contract-after-installation", "sunrun-solar-contract-cancellation-2026", "goodleap-solar-loan-cancellation-hidden-fees-2026", "solar-payments-too-high-help"],
    content: [
      { type: "p", content: "Direct answer: you may have an exit, cancellation, payoff, transfer, purchase, or dispute option, but the correct path depends on the written agreement and facts. The most efficient approach is to identify the contract type and parties, check every notice and deadline, preserve evidence, and avoid actions that could create a default." },
      { type: "callout", content: "This guide is a document-review framework, not a determination that a contract is cancelable or that a legal violation occurred. A qualified attorney should review any consequential legal step." },
      { type: "h2", content: "Step 1: What type of solar agreement do you have?" },
      { type: "list", items: [
        "Loan: you generally own the equipment and owe a lender under separate financing documents.",
        "Lease: another party generally owns the equipment and you pay for use under a term agreement.",
        "Power purchase agreement: another party generally owns the system and bills for generated electricity under the contract rate.",
        "Cash purchase or installation contract: the payment, installation, warranty, and cancellation terms may sit in one or more documents."
      ] },
      { type: "p", content: "Do not identify the contract type from the salesperson's label alone. Read the legal names, ownership language, payment schedule, security terms, and signature pages." },
      { type: "h2", content: "Step 2: Who sold, installed, financed, owns, and services the system?" },
      { type: "p", content: "A solar transaction can involve a sales company, installer, lender, system owner, account servicer, warranty provider, and monitoring provider. List each legal name, address, account number, and role. A complaint against one party may not automatically change a separate agreement with another." },
      { type: "h2", content: "Step 3: Is there a written cancellation notice or deadline?" },
      { type: "p", content: "Search every document for Notice of Cancellation, cancellation, rescission, termination, change order, project approval, funding, purchase option, prepayment, transfer, default, dispute resolution, and arbitration. Follow the exact address and delivery method, keep a signed copy, and preserve proof of delivery." },
      { type: "p", content: "The [FTC Cooling-Off Rule](https://consumer.ftc.gov/articles/buyers-remorse-ftcs-cooling-rule-may-help) gives three business days to cancel certain sales made at a home, workplace, dormitory, or seller's temporary location. It does not cover every transaction. The FTC lists exclusions, including some sales completed entirely online, by mail, or by telephone. State law or the agreement may provide different rights, so do not assume coverage from the three-day phrase alone." },
      { type: "h2", content: "Step 4: Which records should you preserve?" },
      { type: "list", items: [
        "Every contract, addendum, disclosure, cancellation form, proposal, design, permit, and inspection record.",
        "Texts, emails, advertisements, recordings where lawful, and notes identifying who said what and when.",
        "Utility bills before and after solar, solar invoices, payment history, payoff quotes, and tax-credit representations.",
        "System-production data, monitoring screenshots, warranty claims, repair requests, and company responses.",
        "Home-sale, title, escrow, UCC-1, lease-transfer, or buyer-assumption records when a property transaction is involved."
      ] },
      { type: "h2", content: "Step 5: Does the financed amount match the sales presentation?" },
      { type: "p", content: "Compare the cash price, amount financed, APR, finance charge, total of payments, expected-prepayment schedule, and any displayed tax-credit estimate. The CFPB's [solar-financing report](https://www.consumerfinance.gov/data-research/research-reports/issue-spotlight-solar-financing/) identifies industry risks involving dealer-fee markups, uncertain tax-credit assumptions, payment increases after an expected prepayment, and savings claims. The report does not prove a violation in any individual account." },
      { type: "h2", content: "Step 6: Which practical exit path fits the documents?" },
      { type: "list", items: [
        "Timely written cancellation under an agreement or a law that actually covers the transaction.",
        "Loan payoff using a current written payoff quote.",
        "Lease or PPA purchase, service prepayment, or early-termination option stated in the agreement.",
        "Company-approved transfer or buyer assumption during a home sale.",
        "Documented warranty, service, production, billing, disclosure, or sales-practice dispute.",
        "Negotiated modification or resolution documented in a signed writing.",
        "Qualified legal review where the facts and documents support a possible claim or defense."
      ] },
      { type: "h2", content: "Step 7: How should you contact the company or a regulator?" },
      { type: "p", content: "Send a concise factual timeline, identify the account and requested response, attach only relevant documents, and keep the complete submission and confirmation. Ask the company to state its position, procedure, amount, and contract basis in writing." },
      { type: "p", content: "For an eligible financial-product issue, use the [CFPB complaint portal](https://www.consumerfinance.gov/complaint/). The FTC accepts suspected fraud reports at [ReportFraud.ftc.gov](https://reportfraud.ftc.gov/). State attorneys general and local consumer-protection offices also accept complaints. These channels create records and may prompt responses, but filing alone does not cancel a contract or suspend payments." },
      { type: "warning", content: "Do not stop payments, remove or disable equipment, sign a release, transfer property, or accept new terms based only on general online advice. Check the agreement and obtain qualified advice because those actions can affect credit, collections, title, warranties, and legal rights." },
      { type: "h2", content: "When is professional review most useful?" },
      { type: "p", content: "Seek qualified review when a deadline is close, installation or funding status is unclear, the contract and sales presentation conflict, a payoff or transfer blocks a home sale, a creditor threatens collection, a lien or fixture filing affects closing, or you are considering withholding payment or asserting a legal claim." },
      { type: "h2", content: "Bottom line" },
      { type: "p", content: "The fastest reliable path is document-first: identify the agreement and parties, preserve the timeline and evidence, obtain current written procedures or quotes, and choose only the option supported by the specific documents and applicable law." },
    ],
  },'''


def main() -> None:
    batch9_path = ROOT / "client/src/data/blog-articles-batch9.ts"
    batch9 = batch9_path.read_text(encoding="utf-8")
    batch9 = replace_object(
        batch9,
        "  {\n    slug: 'sunrun-solar-contract-cancellation-2026',",
        "  {\n    slug: 'cancel-sunrun-solar-contract-before-installation',",
        SUNRUN,
    )
    batch9 = replace_object(
        batch9,
        "  {\n    slug: 'goodleap-solar-loan-cancellation-hidden-fees-2026',",
        "  {\n    slug: 'how-to-cancel-sunnova-solar-contract-2026',",
        GOODLEAP,
    )
    batch9_path.write_text(batch9, encoding="utf-8")

    blog_path = ROOT / "client/src/data/blog.ts"
    blog = blog_path.read_text(encoding="utf-8")
    blog = replace_object(
        blog,
        "  {\n    slug: 'how-to-get-out-of-a-solar-contract',",
        "  {\n    slug: 'solar-company-went-bankrupt',",
        GENERAL,
    )
    blog_path.write_text(blog, encoding="utf-8")
    print("Rewrote Sunrun, GoodLeap, and general solar-contract exit winners.")


if __name__ == "__main__":
    main()
