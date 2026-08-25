#!/usr/bin/env python3
"""Replace three secondary CTR-priority articles with source-backed, answer-first copy."""
from __future__ import annotations

from pathlib import Path

ROOT = Path("/home/ubuntu/solar-freedom-main")


def replace_object(text: str, start_marker: str, end_marker: str, replacement: str) -> str:
    start = text.index(start_marker)
    end = text.index(end_marker, start)
    return text[:start] + replacement.rstrip() + "\n\n" + text[end:]


BLUE_RAVEN = r'''  {
    slug: "blue-raven-solar-complaints",
    title: "Blue Raven Solar Complaints: Status, Support and Contract Help",
    metaTitle: "Blue Raven Solar Complaints: Status & Support",
    metaDescription: "Is Blue Raven Solar still in business? Check the SunPower acquisition timeline, project date, warranty route, lender, support number, records, and complaint options.",
    category: "Company Guide",
    readTime: "8 min read",
    publishDate: "August 16, 2026",
    excerpt: "Blue Raven's current support path depends heavily on when a project was completed and which company owns the loan, lease, PPA, equipment warranty, and service obligation.",
    heroImage: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=1200&q=80&auto=format&fit=crop",
    heroAlt: "Homeowner reviewing Blue Raven Solar project and warranty records",
    ctaText: "Review Your Blue Raven Records",
    ctaSubtext: "Organize the agreement, project date, lender, warranty, production data, and service history for a fact-specific review.",
    content: [
      { type: "p", content: "Direct answer: the Blue Raven name remains in use, but the correct support and responsibility path depends on the project date. SunPower's current acquisition FAQ says Complete Solar purchased certain Blue Raven assets from the former SunPower Corporation bankruptcy estate and obtained the right to operate under the Blue Raven name." },
      { type: "callout", content: "SunPower's FAQ says the asset purchaser did not assume ownership, benefits, or liabilities for Blue Raven or other SunPower projects completed on or before September 30, 2024. That statement makes the completion date and legal names in your documents essential." },
      { type: "h2", content: "Is Blue Raven Solar still in business?" },
      { type: "p", content: "The current [SunPower acquisition FAQ](https://us.sunpower.com/acquisition-announcement) says Complete Solar purchased selected Blue Raven assets and the right to continue operating a solar sales and installation business under the Blue Raven name. This is different from saying that the buyer assumed every historic project, warranty, debt, or customer obligation." },
      { type: "h2", content: "Which records determine who should handle your problem?" },
      { type: "list", items: [
        "The project completion and permission-to-operate dates, especially whether completion occurred on or before September 30, 2024.",
        "The legal names on the sales contract, installation contract, loan, lease, or PPA.",
        "The equipment manufacturers and separate manufacturer warranty documents.",
        "The workmanship, roof, production, and service warranty providers.",
        "The lender or financier that sends statements and accepts payments.",
        "Every service ticket, inspection, permit, monitoring record, photo, and written response."
      ] },
      { type: "h2", content: "Where should a Blue Raven customer start?" },
      { type: "p", content: "The current SunPower FAQ lists **800-377-4480** for Blue Raven Solar. It directs customers with pre-acquisition cash or loan purchases to their lender, and customers with leases or PPAs to their financier or SunStrong Management. Verify the current routing on the official page and keep the case number and written response." },
      { type: "h2", content: "What if the system, roof, rebate, or service was not delivered as expected?" },
      { type: "p", content: "Build a factual record before assigning legal conclusions. Match each disputed promise to a contract, proposal, email, text, advertisement, or witness. Preserve system-production data, utility bills, photos, inspection findings, warranty requests, rebate terms, payment history, and responses from Blue Raven, SunPower, the lender, and equipment manufacturer." },
      { type: "h2", content: "Does the SunPower bankruptcy cancel a Blue Raven contract or loan?" },
      { type: "p", content: "Not automatically. An asset sale, company bankruptcy, installation agreement, equipment warranty, and financing obligation are separate issues. Review the contract parties and any bankruptcy or acquisition notice, and obtain qualified advice before treating one event as termination of another party's agreement." },
      { type: "warning", content: "Do not stop loan, lease, or PPA payments solely because the original parent company entered bankruptcy. A missed payment can create collection or credit consequences even while a service or warranty dispute is pending." },
      { type: "h2", content: "How can you escalate a documented complaint?" },
      { type: "p", content: "Send a concise written timeline and requested resolution to the party identified in the agreement or official support route. For an eligible financing issue, use the [CFPB complaint portal](https://www.consumerfinance.gov/complaint/). Suspected fraud can be reported at [ReportFraud.ftc.gov](https://reportfraud.ftc.gov/), and state attorneys general accept consumer complaints. A complaint creates a record but does not itself cancel a contract." },
      { type: "h2", content: "Bottom line" },
      { type: "p", content: "The fastest useful path is to identify the completion date, contract parties, financing owner, warranty provider, and exact unresolved obligation. Then contact the correct party in writing and preserve the complete response before choosing a financial or legal next step." },
    ],
    faq: [
      { q: "Is Blue Raven Solar still in business?", a: "The current SunPower FAQ says Complete Solar purchased selected Blue Raven assets and the right to operate under the Blue Raven name. It also says the purchaser did not assume the liabilities of projects completed on or before September 30, 2024." },
      { q: "Did Blue Raven Solar go out of business or file bankruptcy?", a: "Blue Raven's former parent, SunPower Corporation, filed bankruptcy in August 2024. Complete Solar later purchased selected assets, including certain Blue Raven assets. The project date and legal parties determine which entity may be responsible for a particular issue." },
      { q: "What is the Blue Raven Solar support number?", a: "SunPower's current acquisition FAQ lists 800-377-4480 for Blue Raven Solar. Verify the number on the official page and retain the case number and written response." },
      { q: "What happened to my Blue Raven warranty?", a: "Do not assume every warranty disappeared or transferred. Identify the workmanship, roof, production, equipment, and financing documents separately, then use the project date and provider name to route each request." },
      { q: "Can I cancel a Blue Raven Solar contract?", a: "The acquisition or bankruptcy history does not create a universal cancellation right. Review the signed cancellation, termination, funding, warranty, default, and dispute terms and obtain qualified review of any documented breach or misrepresentation." },
      { q: "Should I stop paying my Blue Raven solar loan during a dispute?", a: "Do not assume a service or warranty dispute pauses a separate financing obligation. Check the loan and dispute terms and obtain qualified advice before missing a payment." },
    ],
    relatedSlugs: ["how-to-get-out-of-a-solar-contract", "solar-installer-out-of-business", "solar-contract-rescission-rights", "how-to-file-a-complaint-against-solar-company-attorney-general"],
  },'''

NEW_JERSEY = r'''  {
    slug: "new-jersey-solar-contract-rights",
    title: "New Jersey Solar Contract Rights: Cancellation and Complaints",
    metaTitle: "New Jersey Solar Contract Rights & Complaints",
    metaDescription: "Review a New Jersey solar contract safely: written cancellation terms, contractor registration, financing documents, evidence, official complaints, and next steps.",
    excerpt: "New Jersey homeowners should start with the signed cancellation notice, contractor registration, financing documents, and official complaint procedures—not a universal promise that every solar deal can be canceled.",
    category: "State Guide",
    heroImage: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=1200&q=80",
    heroAlt: "New Jersey homeowner reviewing a solar contract and contractor records",
    readTime: "9 min read",
    publishDate: "August 16, 2026",
    ctaText: "Review Your New Jersey Solar Documents",
    ctaSubtext: "Organize the agreement, cancellation notice, contractor registration, financing disclosures, bills, and project records.",
    content: [
      { type: "p", content: "Direct answer: a New Jersey solar cancellation or dispute depends on the signed agreement, transaction channel, contract type, timing, project status, contractor registration, financing documents, and facts. Start with the written notice and official state records before asserting a remedy." },
      { type: "callout", content: "The New Jersey Division of Consumer Affairs warns that its contractor FAQ is not a complete legal explanation. Use official records for fact finding, and have qualified counsel review a consequential legal position." },
      { type: "h2", content: "What should a New Jersey homeowner check first?" },
      { type: "list", items: [
        "Every signed contract, addendum, financing disclosure, proposal, and Notice of Cancellation.",
        "The contractor's exact legal name and New Jersey registration status.",
        "The seller, installer, lender, system owner, servicer, and warranty provider; they may be different companies.",
        "The signing method and location, project, permit, inspection, installation, funding, and activation dates.",
        "Utility bills, production data, payment history, payoff quotes, sales messages, and service records."
      ] },
      { type: "h2", content: "Does New Jersey regulate home-improvement contractors?" },
      { type: "p", content: "The New Jersey Division of Consumer Affairs says businesses selling or making home improvements in the state generally must register unless exempt. Its [home-improvement contractor page](https://www.njconsumeraffairs.gov/ocp/Pages/hic.aspx) provides registration verification, statutes, regulations, and a contractor-complaint form. Its FAQ also states that written contracts are required for covered home-improvement jobs over $500." },
      { type: "p", content: "Solar projects can involve multiple contracts and entities. Confirm whether the seller or installer falls within the cited registration framework and whether another agency or exemption applies rather than assuming a registration rule resolves the financing agreement." },
      { type: "h2", content: "Is there a three-business-day cancellation right?" },
      { type: "p", content: "Check the New Jersey contract and cancellation notice immediately. The federal [FTC Cooling-Off Rule](https://consumer.ftc.gov/articles/buyers-remorse-ftcs-cooling-rule-may-help) covers certain sales made at a home or temporary location and provides three business days, but the FTC lists exclusions, including some transactions completed entirely online, by mail, or by telephone. State law or the agreement may provide separate rights; confirm coverage before relying on a deadline." },
      { type: "h2", content: "How should you document a New Jersey solar dispute?" },
      { type: "list", items: [
        "Create a dated timeline from the sales contact through signing, permitting, installation, activation, billing, and service requests.",
        "Compare written cost, production, equipment, incentive, tax-credit, and utility-bill statements with actual documents and records.",
        "Preserve photos, inspection findings, permit records, monitoring data, and warranty communications.",
        "Request the company's position, cure plan, cancellation procedure, payoff, or transfer terms in writing.",
        "Do not submit Social Security numbers, bank credentials, or unnecessary sensitive data in public-facing complaint materials."
      ] },
      { type: "h2", content: "Where can a New Jersey homeowner file a complaint?" },
      { type: "p", content: "The Division of Consumer Affairs provides an official [consumer complaint portal](https://www.njconsumeraffairs.gov/Pages/Consumer-Complaints.aspx) and a dedicated path for home-improvement contractor complaints. The Division cautions that submitted information may be subject to public disclosure, so provide the necessary facts and redact unnecessary sensitive information." },
      { type: "p", content: "For an eligible solar loan or other financial-product issue, use the [CFPB complaint portal](https://www.consumerfinance.gov/complaint/). The FTC accepts suspected fraud reports at [ReportFraud.ftc.gov](https://reportfraud.ftc.gov/). A regulatory complaint does not automatically cancel an agreement, stop collection, or determine damages." },
      { type: "warning", content: "Do not stop payments, remove equipment, sign a release, or transfer the property based only on a general state-law summary. Those decisions can affect credit, collections, title, warranties, and legal rights." },
      { type: "h2", content: "Bottom line" },
      { type: "p", content: "Use a document-first sequence: check the written cancellation notice, verify the contractor and contract parties, preserve evidence, obtain current written procedures or quotes, and then choose the path supported by the agreement and applicable law." },
    ],
    faq: [
      { q: "Can I cancel a residential solar contract in New Jersey?", a: "Possibly, but the answer depends on the agreement, transaction, timing, project status, and law. Check the signed Notice of Cancellation and contract terms immediately, and confirm whether any federal or state rule actually covers the transaction." },
      { q: "How do I verify a New Jersey solar contractor?", a: "Use the New Jersey Division of Consumer Affairs home-improvement contractor page and registration verification tools. Search the exact legal name shown on the contract, not only the salesperson's brand name." },
      { q: "What documents should a New Jersey solar contract include?", a: "Collect the complete signed agreement, addenda, proposal, cancellation notice, financing disclosures, project scope, payment schedule, warranties, and contractor registration information. The specific legal requirements depend on the transaction." },
      { q: "Where do I file a complaint about a New Jersey solar company?", a: "The New Jersey Division of Consumer Affairs provides general business and home-improvement contractor complaint forms. It warns that submitted information may be publicly disclosed, so redact unnecessary sensitive information." },
      { q: "Can I stop paying during a New Jersey solar dispute?", a: "Do not assume a complaint or installer dispute pauses a separate loan, lease, or PPA. Review the payment and dispute terms and obtain qualified advice before withholding payment." },
      { q: "What evidence helps with a New Jersey solar complaint?", a: "Preserve the contracts, sales statements, dates, contractor registration, permits, inspections, system-production data, utility bills, payment history, photos, service requests, and complete written responses." },
    ],
    relatedSlugs: ["solar-contract-rescission-rights", "how-to-file-a-complaint-against-solar-company-attorney-general", "how-to-get-out-of-a-solar-contract", "solar-payments-too-high-help"],
  },'''

ADT = r'''  {
    slug: "adt-solar-complaints",
    title: "ADT Solar Complaints: Shutdown, Support and Contract Options",
    metaTitle: "ADT Solar Complaints: Shutdown & Support Options",
    metaDescription: "ADT exited residential solar. Learn how to identify the current installer, lender, warranty provider, service route, evidence, and contract or complaint options.",
    excerpt: "ADT's exit from residential solar does not automatically cancel every loan, installation agreement, or warranty. The right next step depends on the legal names and obligations in each customer's records.",
    category: "Company Guide",
    heroImage: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=1200&q=80",
    heroAlt: "Homeowner reviewing ADT Solar and Sunpro contract and warranty records",
    readTime: "8 min read",
    publishDate: "August 16, 2026",
    ctaText: "Review Your ADT Solar Records",
    ctaSubtext: "Organize the contract, lender, warranties, production data, permits, service tickets, and company responses.",
    content: [
      { type: "p", content: "Direct answer: ADT officially announced in January 2024 that it was exiting the residential solar business. That business decision does not by itself cancel a customer's installation contract, loan, lease, PPA, equipment warranty, or workmanship claim." },
      { type: "callout", content: "Treat the project, financing, equipment warranties, workmanship warranty, monitoring, and service obligations as separate records. The company named on one document may not control the others." },
      { type: "h2", content: "Did ADT Solar shut down or file bankruptcy?" },
      { type: "p", content: "ADT's official [solar business update](https://newsroom.adt.com/corporate-news/adt-provides-solar-business-update-and-advances-capital-allocation-strategy) says the company approved an exit from residential solar and could transfer components to other parties. The announcement describes a business exit, not a statement that all customer contracts or warranties were voided." },
      { type: "h2", content: "Who should an ADT Solar or Sunpro customer identify?" },
      { type: "list", items: [
        "The legal seller and installer named in the original ADT Solar or Sunpro contract.",
        "The lender, lease owner, PPA owner, or account servicer receiving payments.",
        "The manufacturer of the panels, inverter, battery, racking, and other equipment.",
        "The provider named in each workmanship, roof, production, and equipment warranty.",
        "The current monitoring portal, service contact, permit holder, and inspection authority."
      ] },
      { type: "h2", content: "Where should you request ADT Solar support?" },
      { type: "p", content: "Start with ADT's current [Solar Support Center](https://help.adt.com/article/adt-solar-customer-support), then use the names and contacts in the signed contract, warranty, equipment documents, and lender statements. Ask for a case number, the responsible entity, the requested next step, and the response in writing." },
      { type: "h2", content: "What evidence helps with an unfinished, damaged, or underperforming system?" },
      { type: "list", items: [
        "The full contract, proposal, system design, change orders, permits, inspections, and permission-to-operate record.",
        "Dated photos, roof or electrical inspection reports, monitoring screenshots, and production data.",
        "Utility bills before and after solar, loan statements, payment history, and tax-credit or savings representations.",
        "Every service request, voicemail, email, text, case number, appointment, and written response.",
        "Manufacturer serial numbers and warranty registrations for each major component."
      ] },
      { type: "h2", content: "Does ADT's exit cancel a solar loan?" },
      { type: "p", content: "Not automatically. A lender or servicer may be legally separate from the installer. Preserve both agreements and ask each party to state its position in writing. A possible installer claim or defense requires fact-specific legal analysis; it is not a blanket instruction to stop payment." },
      { type: "h2", content: "Can an ADT Solar contract be canceled after installation?" },
      { type: "p", content: "There is no universal post-installation cancellation right. Review the termination, warranty, performance, default, financing, dispute, and transfer provisions. Document any mismatch between the written promises and actual work, then obtain qualified review before demanding cancellation, withholding payment, or signing a settlement." },
      { type: "warning", content: "Do not assume that ADT's business exit voided your debt, transferred your warranty, or authorized equipment removal. Verify the controlling document and responsible entity for each issue." },
      { type: "h2", content: "Where can you report an unresolved ADT Solar problem?" },
      { type: "p", content: "After using the contractual and current support channels, an eligible financing complaint can be submitted to the [CFPB](https://www.consumerfinance.gov/complaint/). Suspected fraud can be reported to the [FTC](https://reportfraud.ftc.gov/), and state contractor boards or attorneys general accept complaints involving local work or sales. A complaint does not itself cancel an agreement." },
      { type: "h2", content: "Bottom line" },
      { type: "p", content: "Build a responsibility map showing the installer, lender, system owner, servicer, manufacturer, and each warranty provider. Route each documented issue to the party named in the controlling record, and obtain qualified review before any action that could affect payment, credit, title, or legal rights." },
    ],
    faq: [
      { q: "Is ADT Solar out of business?", a: "ADT officially announced in January 2024 that it was exiting residential solar. Customers should use ADT's current support center and their own contracts, warranties, lender statements, and equipment records to identify the party responsible for each issue." },
      { q: "Did ADT Solar file bankruptcy?", a: "ADT's official announcement describes an exit from residential solar, not a bankruptcy filing. Do not use the terms shutdown, exit, and bankruptcy interchangeably when evaluating a contract or claim." },
      { q: "What happened to an ADT Solar warranty?", a: "Do not assume every warranty is void or transferred. Separate the workmanship, roof, production, and manufacturer warranties and identify the provider named in each document." },
      { q: "Do I still owe an ADT Solar loan?", a: "ADT's business exit does not automatically cancel a separate financing agreement. Review the lender and installer documents and obtain qualified advice before missing a payment or asserting a defense." },
      { q: "Can I cancel an ADT Solar contract?", a: "The answer depends on the agreement, timing, project status, facts, and applicable law. Review the written cancellation, termination, warranty, default, dispute, and financing terms rather than relying on a universal online answer." },
      { q: "How do I document an ADT Solar complaint?", a: "Create a timeline and preserve contracts, permits, inspections, photos, production data, utility bills, payment history, service tickets, warranty records, and every written response." },
    ],
    relatedSlugs: ["solar-installer-out-of-business", "how-to-get-out-of-a-solar-contract", "solar-contract-rescission-rights", "how-to-file-a-complaint-against-solar-company-attorney-general"],
  },'''


def main() -> None:
    batch8_path = ROOT / "client/src/data/blog-articles-batch8.ts"
    batch8 = batch8_path.read_text(encoding="utf-8")
    batch8 = replace_object(
        batch8,
        '  {\n    slug: "blue-raven-solar-complaints",',
        '  {\n    slug: "complete-solaria-complaints",',
        BLUE_RAVEN,
    )
    batch8_path.write_text(batch8, encoding="utf-8")

    batch6_path = ROOT / "client/src/data/blog-articles-batch6.ts"
    batch6 = batch6_path.read_text(encoding="utf-8")
    batch6 = replace_object(
        """{}""".format(batch6),
        "  {\n    slug: `new-jersey-solar-contract-rights`,",
        "  {\n    slug: `solar-fraud-warning-signs-you-missed`,",
        NEW_JERSEY,
    )
    batch6 = replace_object(
        batch6,
        "  {\n    slug: `adt-solar-complaints`,",
        "  {\n    slug: `momentum-solar-complaints`,",
        ADT,
    )
    batch6_path.write_text(batch6, encoding="utf-8")
    print("Rewrote Blue Raven, New Jersey, and ADT Solar priority winners.")


if __name__ == "__main__":
    main()
