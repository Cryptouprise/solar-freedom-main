#!/usr/bin/env python3
"""Replace the legacy rescission article with a source-backed, fact-specific guide."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "client/src/data/blog-extra.ts"

START = "  {\n    slug: 'solar-contract-rescission-rights',"
END = "  {\n    slug: 'solar-fraud-warning-signs',"

REPLACEMENT = """  {
    slug: 'solar-contract-rescission-rights',
    title: 'Solar Contract Rescission Rights: Check the 3-Day Rule',
    metaTitle: 'Solar Contract Rescission Rights: 3-Day Rule Checklist',
    metaDescription: `Check whether the FTC Cooling-Off Rule covers your solar sale, find the notice, calculate the deadline, preserve delivery proof, and review other written procedures.`,
    category: 'Legal Rights',
    readTime: '7 min read',
    publishDate: 'August 16, 2026',
    excerpt: 'The FTC Cooling-Off Rule covers certain sales made at a home or temporary location, but it does not cover every solar agreement. Start with where and how you signed, the transaction type, the dated cancellation notice, and the actual delivery deadline.',
    heroImage: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80',
    heroAlt: 'homeowner reviewing a written solar contract cancellation notice',
    ctaText: 'Request a Document Review',
    ctaSubtext: 'Submit the agreement, cancellation notice, financing records, and delivery proof for a fact-specific review. No result or deadline determination is guaranteed.',
    relatedSlugs: ['how-to-get-out-of-a-solar-contract', 'new-jersey-solar-contract-rights', 'sunrun-solar-contract-cancellation-2026', 'how-to-file-a-complaint-against-solar-company-attorney-general'],
    faq: [
      { q: 'Does the FTC 3-day Cooling-Off Rule cover every solar contract?', a: 'No. The rule covers certain sales made at a home, workplace, dormitory, or temporary seller location and has important exclusions. Check the signing method, location, transaction, seller, and current official rule before relying on it.' },
      { q: 'How is the 3-business-day deadline calculated?', a: 'Use the dated contract and cancellation notice, then follow the official instructions for the covered transaction. Saturdays may count as business days; Sundays and federal holidays generally do not. Act promptly and preserve proof of timely delivery.' },
      { q: 'What if I cannot find the required cancellation notice?', a: 'A missing or defective notice is important evidence, but it does not justify assuming that an unlimited cancellation window exists. Preserve the full contract file and obtain qualified, transaction-specific guidance.' },
      { q: 'What if the stated cancellation deadline has passed?', a: 'Review the agreement, financing disclosures, installation status, sales records, service history, state-specific rules, and written dispute procedures. Different issues may create different options, but none can be determined from a general article.' },
      { q: 'Should I stop loan or lease payments while disputing the contract?', a: 'Do not change payments or other obligations based only on general online information. Check the account status and obtain advice specific to the agreement and dispute before acting.' },
    ],
    content: [
      { type: 'p', content: 'Direct answer: the FTC Cooling-Off Rule gives a short cancellation period for certain sales made away from a seller’s permanent place of business, including some in-home sales. It does not apply to every solar contract, loan, online transaction, or completed service. Start with the [FTC consumer guide](https://consumer.ftc.gov/articles/buyers-remorse-ftcs-cooling-rule-may-help) and the current [federal rule in 16 CFR Part 429](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-D/part-429).' },
      { type: 'h2', content: 'First Check Whether the Rule Covers the Transaction' },
      { type: 'p', content: 'Record where the sales presentation occurred, where and how the agreement was signed, the seller’s permanent business location, the transaction amount, whether work was requested as an emergency, and whether any exclusion appears relevant. A door-to-door presentation followed by electronic signatures still requires a fact-specific coverage review.' },
      { type: 'list', items: [
        'Save the complete signed agreement and every addendum.',
        'Locate each Notice of Cancellation and note the stated deadline.',
        'Preserve emails, text messages, portal records, and signing timestamps.',
        'Identify the seller, installer, lender, system owner, and servicer separately.',
        'Do not assume a federal rule, state rule, or loan rule applies simply because the transaction involved solar equipment.',
      ] },
      { type: 'h2', content: 'Check the Notice and Deadline' },
      { type: 'p', content: 'For a covered transaction, the seller must provide the required written information about cancellation. Compare the notice with the contract date, the location and method of signing, the seller information, and the delivery instructions. If the notice is missing, inconsistent, undated, or difficult to identify, preserve the original file rather than editing or annotating it.' },
      { type: 'callout', content: 'A missing notice can be relevant, but this article does not determine whether a deadline was extended or whether a contract can be rescinded. Those conclusions depend on the transaction and applicable law.' },
      { type: 'h2', content: 'Send Any Timely Notice Exactly as Directed' },
      { type: 'p', content: 'If the transaction is covered and the deadline is still open, follow the cancellation form and official instructions. Use a delivery method that creates a reliable record, keep a complete copy, and save the receipt, tracking history, email headers, portal confirmation, or other proof. Do not rely on an unrecorded phone call.' },
      { type: 'h2', content: 'If the Stated Deadline Has Passed' },
      { type: 'p', content: 'Do not jump from a missed deadline to the conclusion that no options exist—or that cancellation is guaranteed. Review the written cancellation and termination sections, financing disclosures, installation status, permit and interconnection records, sales representations, production data, service history, company status, and dispute procedure.' },
      { type: 'h2', content: 'Separate a Sales Cancellation Rule From Loan Rescission' },
      { type: 'p', content: 'The FTC Cooling-Off Rule and the Truth in Lending Act address different transactions and requirements. Whether a credit transaction is secured by a principal dwelling, what disclosures were delivered, and what exceptions apply are legal questions. Compare the signed loan disclosures and security documents, and do not send a legal rescission notice based only on a template or general article.' },
      { type: 'h2', content: 'Build a Reviewable Evidence File' },
      { type: 'list', items: [
        'Signed contract, addenda, and cancellation forms',
        'Loan or lease disclosures and current account statements',
        'Proposal, production estimate, utility bills, and monitoring exports',
        'Permit, inspection, installation, and interconnection records',
        'Written sales claims, support requests, denials, and delivery proof',
        'A dated timeline that separates what was said, signed, installed, billed, and disputed',
      ] },
      { type: 'h2', content: 'Use Official Complaint Channels for Documented Issues' },
      { type: 'p', content: 'A complaint is not an automatic cancellation. It can create a dated record and request a response. Financing issues can be submitted through the [Consumer Financial Protection Bureau](https://www.consumerfinance.gov/complaint/). Deceptive sales concerns can be reported through [ReportFraud.ftc.gov](https://reportfraud.ftc.gov/). State attorney general, contractor, utility, and licensing channels vary by jurisdiction.' },
      { type: 'warning', content: 'This guide is educational information, not legal advice. Do not stop payments, remove equipment, sign a release, or transfer property based only on this page.' },
    ],
  },

"""

text = PATH.read_text(encoding="utf-8")
start = text.index(START)
end = text.index(END, start)
updated = text[:start] + REPLACEMENT + text[end:]
PATH.write_text(updated, encoding="utf-8")
print("Rewrote solar-contract-rescission-rights")
