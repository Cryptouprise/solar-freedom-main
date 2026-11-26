#!/usr/bin/env python3
"""
Adds the /blog hub cannibalization entry to BOTH shared/changeLog.ts and
docs/CHANGE-LOG.md. Keyed on the title, so it is safe to re-run.
"""
import io
import re
import sys

TS = 'shared/changeLog.ts'
MD = 'docs/CHANGE-LOG.md'

TITLE = 'Blog hub was outranking the guides that answer its queries on 1,248 impressions'

ENTRY_TS = '''  {
    date: "2026-11-26",
    title: "Blog hub was outranking the guides that answer its queries on 1,248 impressions",
    class: "SEO",
    changed: [
      "scripts/prerender.assembled.mjs — added a 'Which guide answers which question' routing table to the /blog served content, naming eight question clusters and linking each to the guide that answers it with the query words in the anchor text",
      "Verified every anchor before shipping: two slugs in the first draft did not resolve to an indexable page, so they were replaced rather than shipped broken",
    ],
    evidence:
      "Search Console (1 Sep–22 Nov 2026): /blog holds 2,571 impressions across 149 queries and earned 2 clicks. 119 of those 149 queries are also ranked by a dedicated article, and those 119 carry 2,356 of the 2,571 impressions. On 61 of them — 1,248 impressions — the HUB outranks the best article: 'can you cancel solar panel contract before installation' hub position 15.1 on 154 impressions against /blog/how-to-get-out-of-a-solar-contract at position 36.8; 'how to cancel solar contract' hub 18.3 on 91 against the article at 55.4; 'cancel solar contract before installation' hub 16.8 on 83 against 52.8; 'how to cancel sunrun contract before installation' hub 17.8 on 68 against /blog/sunrun-solar-contract-cancellation-2026 at 10.4 on 133. The hub's served content was 879 words of index prose — how to use the guides, what records to gather, editorial limits — containing no cancellation procedure, no notice window and no company contact. Its CTR at position 11 to 20 is 0.08% on 1,182 impressions.",
    reasoning:
      "A hub cannot answer a procedure question. Where the hub wins one of these queries the searcher lands on a directory and has to search a second time, which is the worst outcome for a distressed visitor and is exactly what a 0.08% CTR looks like. The hub was competing with its own library rather than organising it. The fix routes rather than duplicates: naming the question clusters and pointing each at the answering guide gives the crawler an unambiguous statement that this page is a directory whose job is to route, and passes descriptive internal links — with the query words themselves in the anchor — to the articles that should own those queries. The impression figure beside each question is the measured count from the same window, so the table is a prioritised reading list rather than decoration. What would have falsified the diagnosis: if the hub's impressions sat on queries no article ranked for, the hub would be adding reach rather than absorbing it. 2,356 of 2,571 do overlap, so it is absorbing.",
    confidence: "measured",
    verifiedBy:
      "python3 -c on near-winners.json comparing the hub query set against every article query set; node scripts/find-orphan-pages.mjs; every href in the routing table checked against dist/public for existence and robots; pnpm build pre-rendered 583 pages",
    preventsRecurrence:
      "Any index or hub page must be checked for query overlap with the pages it links to before its content is expanded. An index page that ranks for procedure questions is a cannibalization defect, not a ranking win. The overlap check is one comparison of the hub query set against the article query sets and should be run whenever a hub gains content.",
    measureAfter: "2026-12-05",
  },
'''

MD_ENTRY = '''## 2026-11-26 — Blog hub was outranking the guides that answer its queries on 1,248 impressions
**Class:** SEO
**Changed:** `scripts/prerender.assembled.mjs` — added a "Which guide answers which question" routing table to the `/blog` served content, naming eight question clusters and linking each to the guide that answers it with the query words in the anchor text. Every anchor was verified against the built output before shipping; two slugs in the first draft did not resolve to an indexable page and were replaced rather than shipped broken.
**Why:** Search Console (1 Sep–22 Nov 2026) shows `/blog` holding **2,571 impressions across 149 queries and earning 2 clicks**. **119 of those 149 queries are also ranked by a dedicated article**, and those 119 carry **2,356 of the 2,571 impressions**. On **61 of them — 1,248 impressions — the hub outranks the best article**:

| Query | Hub | Answering article |
|---|---|---|
| can you cancel solar panel contract before installation | pos **15.1** (154 impr) | `/blog/how-to-get-out-of-a-solar-contract` pos 36.8 |
| how to cancel solar contract | pos **18.3** (91) | same article pos 55.4 |
| cancel solar contract before installation | pos **16.8** (83) | same article pos 52.8 |
| how to cancel sunrun contract before installation | pos **17.8** (68) | `/blog/sunrun-solar-contract-cancellation-2026` pos 10.4 (133) |

The hub's served content was **879 words of index prose** — how to use the guides, what records to gather, editorial limits — containing no cancellation procedure, no notice window and no company contact. Its CTR at position 11–20 is **0.08% on 1,182 impressions**. A hub cannot answer a procedure question: where it wins, the searcher lands on a directory and must search again. The fix routes rather than duplicates — naming the question clusters and pointing each at the answering guide tells the crawler this page is a directory whose job is to route, and passes descriptive internal links with the query words in the anchor to the articles that should own those queries. What would have falsified the diagnosis: if the hub's impressions sat on queries no article ranked for, the hub would be adding reach rather than absorbing it. **2,356 of 2,571 do overlap**, so it is absorbing.
**Verified:** `python3` comparison of the hub query set against every article query set in `near-winners.json`; every `href` in the routing table checked against `dist/public` for existence and robots; `pnpm build` pre-rendered 583 pages.
**Recurrence guard:** any index or hub page must be checked for query overlap with the pages it links to before its content is expanded. An index page that ranks for procedure questions is a cannibalization defect, not a ranking win.
**Measure after:** 2026-12-05.
'''


def main():
    ok = False

    t = io.open(TS, encoding='utf-8').read()
    if TITLE in t:
        print('skip: entry already in changeLog.ts')
    else:
        m = re.search(r'export const CHANGE_LOG: ChangeEntry\[\] = \[\n', t)
        if not m:
            print('FAIL: could not locate the CHANGE_LOG array opening'); return 1
        t = t[:m.end()] + ENTRY_TS + t[m.end():]
        io.open(TS, 'w', encoding='utf-8').write(t)
        print('OK: added entry to changeLog.ts')
        ok = True

    d = io.open(MD, encoding='utf-8').read()
    if 'Blog hub was outranking the guides' in d:
        print('skip: entry already in CHANGE-LOG.md')
    else:
        m = re.search(r'^## ', d, re.M)
        if not m:
            print('FAIL: no existing entry headings found in CHANGE-LOG.md'); return 1
        d = d[:m.start()] + MD_ENTRY + d[m.start():]
        io.open(MD, 'w', encoding='utf-8').write(d)
        print('OK: added entry to CHANGE-LOG.md')
        ok = True

    if not ok:
        print('no changes needed')
    return 0


if __name__ == '__main__':
    sys.exit(main())
