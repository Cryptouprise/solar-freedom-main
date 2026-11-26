#!/usr/bin/env python3
"""
Fix 10 (26 Nov 2026) — the /blog hub outranks the articles that can actually answer.

Evidence (Search Console, 1 Sep–22 Nov 2026):
  /blog holds 2,571 impressions across 149 queries and earned 2 clicks.
  119 of those 149 queries are also ranked by a dedicated article, carrying
  2,356 of the 2,571 impressions. On 61 of them — 1,248 impressions — the HUB
  outranks the best article:
    "can you cancel solar panel contract before installation"  hub pos 15.1 (154
      impr) vs /blog/how-to-get-out-of-a-solar-contract pos 36.8
    "how to cancel solar contract"            hub 18.3 (91)  vs article 55.4
    "cancel solar contract before installation" hub 16.8 (83) vs article 52.8
    "how to cancel sunrun contract before installation" hub 17.8 (68) vs
      /blog/sunrun-solar-contract-cancellation-2026 pos 10.4 (133)
  A hub cannot answer any of them. Its served content is 879 words of index
  prose: how to use the guides, what records to gather, editorial limits.
  It contains no cancellation procedure, no notice window, no company contact.

Why this is a defect rather than a neutral split: the hub is an index page
competing with its own library for question-shaped queries. Where the hub wins,
the searcher lands on a directory that must be searched again, which is the
worst possible outcome for a distressed visitor and produces the 0.08% CTR the
hub shows at position 11–20.

The fix adds a routing table to the hub's SERVED content (the pre-rendered
shell, which is what a crawler reads) that names the highest-volume question
clusters and points each at the article that answers it, with descriptive
anchor text. That does two things: it gives the crawler an unambiguous signal
that this page is a directory whose job is to route, and it passes descriptive
internal links — with the query words in the anchor — to the articles that
should own those queries.

Every figure below is the measured impression count for that query from the
same window, so the table doubles as a prioritised reading list rather than
decoration.
"""
import io
import re
import sys

PATH = 'scripts/prerender.assembled.mjs'
ANCHOR = '    "/blog": `      <h2>How to use the solar contract guides</h2>'
TAIL_MARKER = '      <h2>Records that make a guide usable</h2>'

ROUTING = '''      <h2>Which guide answers which question</h2>
      <p>This page is the index, not the answer. Search Console for 1 September to 22 November 2026 shows this hub appearing for 149 questions and earning 2 clicks, while the guides below it hold the actual procedures. If you arrived here from a search, the table below routes the most common questions to the guide that answers them. The impression figure beside each question is how many times that exact search reached this site in that window, so the list is ordered by real demand rather than by preference.</p>
      <ul>
        <li><strong>Can you cancel a solar panel contract before installation?</strong> (154 impressions) — <a href="/blog/how-to-get-out-of-a-solar-contract">how to get out of a solar contract</a> and <a href="/blog/cancel-sunrun-solar-contract-before-installation">cancelling before installation</a>.</li>
        <li><strong>How do I cancel a solar contract?</strong> (91 impressions) — <a href="/blog/how-to-get-out-of-a-solar-contract">the general cancellation walkthrough</a>.</li>
        <li><strong>How do I cancel a Sunrun contract?</strong> (60 impressions) — <a href="/blog/sunrun-solar-contract-cancellation-2026">the Sunrun cancellation guide</a>.</li>
        <li><strong>How do I get out of a GoodLeap solar loan?</strong> — <a href="/blog/goodleap-solar-loan-cancellation-hidden-fees-2026">the GoodLeap guide</a>.</li>
        <li><strong>How do I cancel a Sunnova contract?</strong> — <a href="/blog/how-to-cancel-sunnova-solar-contract-2026">the Sunnova guide</a>.</li>
        <li><strong>My installer went out of business. Now what?</strong> — <a href="/blog/solar-installer-out-of-business">the installer failure guide</a>.</li>
        <li><strong>What are my cancellation rights in the first days?</strong> — <a href="/blog/solar-contract-rescission-rights">rescission and the three-day rule</a>.</li>
        <li><strong>How do I sell a house with solar attached?</strong> — <a href="/blog/selling-house-with-solar-loan">selling with a loan</a>, <a href="/blog/selling-house-with-solar-lease">with a lease</a>, and <a href="/blog/selling-house-with-solar-contract">with a contract</a>.</li>
      </ul>
      <p>Each guide is written to be read against your own agreement: it names the documents to pull, the notice clause to find, and the official channel to use. Start with the question that matches your situation, then gather the records before requesting an individual review.</p>
'''


def main():
    t = io.open(PATH, encoding='utf-8').read()

    if 'Which guide answers which question' in t:
        print('skip: routing table already present')
        return 0

    i = t.find(ANCHOR)
    if i < 0:
        print('FAIL: /blog block anchor not found')
        return 1

    # insert the routing table just before the "Records that make a guide usable"
    # heading inside the /blog template literal
    j = t.find(TAIL_MARKER, i)
    if j < 0:
        print('FAIL: tail marker not found after the /blog anchor')
        return 1

    t = t[:j] + ROUTING + t[j:]
    io.open(PATH, 'w', encoding='utf-8').write(t)
    print('OK: routing table inserted into the /blog served content')
    print('  table rows: %d' % ROUTING.count('<li><strong>'))
    return 0


if __name__ == '__main__':
    sys.exit(main())
