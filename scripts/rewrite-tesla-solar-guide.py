#!/usr/bin/env python3
"""Replace the Tesla/SolarCity indexed article with an official-procedure guide."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "client/src/data/blog-articles-batch10.ts"
START = "  {\n    slug: 'tesla-solar-solarcity-complaints-cancel-2026',"
END = "  {\n    slug: 'goodleap-solar-loan-hidden-dealer-fees-2026',"

REPLACEMENT = """  {
    slug: 'tesla-solar-solarcity-complaints-cancel-2026',
    title: 'Tesla Solar and SolarCity: Contract, Billing, Service, and Home-Sale Checklist',
    metaTitle: 'Tesla Solar / SolarCity Contract, Billing and Transfer Checklist',
    metaDescription: `Find your Tesla Solar or SolarCity agreement, identify the contract type, retrieve billing and service records, follow Tesla’s transfer process, and preserve a dispute file.`,
    category: 'Company Guide',
    readTime: '10 min read',
    publishDate: 'August 16, 2026',
    excerpt: 'Tesla’s current support procedures differ by cash purchase, third-party loan, Tesla financing, lease, PPA, and subscription. The first step is to identify your agreement and collect the records that apply to it.',
    heroImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
    heroAlt: 'residential solar panels on a home roof',
    ctaText: 'Request a Document Review',
    ctaSubtext: 'Submit your agreement, billing records, transfer documents, service history, and written communications for a fact-specific review. No outcome is guaranteed.',
    relatedSlugs: ['selling-home-with-solar-ppa-panels-transfer-or-cancel', 'how-to-get-out-of-a-solar-contract', 'solar-loan-document-checklist'],
    faq: [
      { q: 'How do I tell which Tesla solar agreement I have?', a: 'Check the Energy Products Order Agreement and account documents. Tesla distinguishes cash purchase, third-party loan, Tesla loan, lease, PPA, MyPower loan, and subscription arrangements; the process depends on the agreement type.' },
      { q: 'How does a Tesla solar agreement transfer when a home is sold?', a: 'Tesla’s official process differs by contract type. The seller generally initiates the request, the assuming party reviews and signs the transfer documents, and closing confirmation is required. Begin early and confirm the agreement-specific requirements with Tesla and the title or escrow team.' },
      { q: 'Is a Tesla UCC-1 filing the same as a lien on the home?', a: 'Tesla states that its UCC-1 fixture filing is a notice of its interest in the solar equipment and is not itself a lien against the real property. Review the title report, agreement, and lender requirements for the specific transaction.' },
      { q: 'Where can I find Tesla solar billing records?', a: 'Tesla directs customers to the Tesla app or account billing portal for statements, payment history, and billing preferences. Third-party-financed systems may require records from the lender as well.' },
      { q: 'What should I do if I think service, billing, or sales information is wrong?', a: 'Preserve the agreement, billing history, support requests, service records, proposal, production information, and written communications. Use Tesla’s support path and any agreement-specific dispute procedure; do not change payments or other obligations based only on general information.' },
    ],
    content: [
      { type: 'p', content: 'Direct answer: do not start by assuming that a Tesla Solar or legacy SolarCity contract can be cancelled, transferred, paid off, or treated the same way as another owner’s agreement. Tesla’s current procedures differ for cash purchases, third-party loans, Tesla financing, leases, PPAs, MyPower loans, and subscriptions. Start with the signed Energy Products Order Agreement and your Tesla account records.' },
      { type: 'h2', content: 'Identify the Agreement and the Parties' },
      { type: 'p', content: 'Collect the signed agreement, addenda, financing disclosures, any UCC-1 or title document, the current statement, proof of permission to operate, the installation address, and your account history. Identify separately the installer, system owner, lender, servicer, and utility. A company name in the sales paperwork may not be the party that currently handles billing or transfer.' },
      { type: 'h2', content: 'Access Billing, Contract, and Service Records' },
      { type: 'p', content: 'Tesla directs solar customers to the Tesla app or account to view billing, statements, and payment history. Its [billing guide](https://www.tesla.com/support/energy/solar-panels/after-installation/billing) distinguishes purchase, financing, lease, and PPA billing. Keep downloaded invoices and screenshots with their dates; they help reconcile the agreement, the account status, and any disputed charges.' },
      { type: 'h2', content: 'If You Are Selling or Refinancing the Home' },
      { type: 'p', content: 'Tesla’s [ownership-transfer guide](https://www.tesla.com/support/energy/solar-panels/after-installation/transferring-ownership) describes separate paths for PPAs, leases, MyPower loans, subscriptions, cash purchases, third-party loans, and Tesla loans. In a home sale, start the process once there is a buyer, share the agreement with title or escrow as appropriate, and follow the official sequence for the seller, assuming party, transfer agreement, title documents, closing confirmation, and account update.' },
      { type: 'callout', content: 'Tesla states that a UCC-1 financing statement is a notice of its interest in the solar equipment and is not itself a lien on the home. The recorded document, contract type, account status, and lender requirements still matter for any specific transaction.' },
      { type: 'h2', content: 'Check the Written Warranty and Performance Terms' },
      { type: 'p', content: 'Tesla publishes current [service and warranty information](https://www.tesla.com/support/energy/solar-panels/learn/solar-service-warranty), but coverage depends on the applicable warranty and agreement. Compare your system model, purchase date, performance terms, service history, and monitoring records with the written documents that apply to your account.' },
      { type: 'h2', content: 'Create a Fact-Specific Support or Dispute File' },
      { type: 'list', items: [
        'Signed agreement, order documents, and financing disclosures',
        'Monthly statements, payment records, payoff or transfer documentation',
        'Proposal, production estimate, monitoring exports, and utility bills',
        'Service tickets, appointment records, photographs, inspection records, and warranty communications',
        'Written sales claims, emails, text messages, and a dated timeline of events',
      ] },
      { type: 'h2', content: 'Use the Official Support Path First' },
      { type: 'p', content: 'Tesla directs customers with an operating system to support through the Tesla app. The [contact guide](https://www.tesla.com/support/energy/more/additional-support/contact-us) says third-party-installed systems may display installer contact information in the app. Ask for written confirmation of the issue, request, case number, and next step, then preserve the reply.' },
      { type: 'h2', content: 'Questions This Guide Cannot Answer' },
      { type: 'p', content: 'A general article cannot determine whether a contract is enforceable, whether a payment should change, whether a title document must be released, whether a warranty applies, or whether an account can be transferred. Those answers depend on the signed documents, account status, transaction type, property, parties, and applicable law.' },
      { type: 'warning', content: 'This guide is educational information, not legal advice. Do not stop payments, remove equipment, sign a release, or change a home-sale transaction based only on this page.' },
    ],
  },

"""

text = PATH.read_text(encoding="utf-8")
start = text.index(START)
end = text.index(END, start)
PATH.write_text(text[:start] + REPLACEMENT + text[end:], encoding="utf-8")
print("Rewrote tesla-solar-solarcity-complaints-cancel-2026")
