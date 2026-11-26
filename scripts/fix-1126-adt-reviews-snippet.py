#!/usr/bin/env python3
"""
Lead the ADT snippet with the concrete review facts.

Measured 26 Nov 2026: /blog/adt-solar-complaints holds `adt solar reviews` on
881 impressions at average position 13.3 with ZERO clicks. That is the first
statistically real CTR defect found on this site — expected clicks at the site's
own CTR curve for that position are 3.52, so the probability of zero by chance
is 0.0295, below the 0.05 threshold. The fourteen pages examined earlier today
were all noise (p 0.10 to 0.84); this one is not.

The served title promises "Who Services It Now" — a service question. The
searcher asked for reviews. The page's best differentiator is not its position
on anything, it is that it publishes concrete, sourced, dated review numbers
(404 BBB complaints in three years, 29 in twelve months, 75 customer reviews, no
rating because the business is out of business) and separates ADT's BBB file
from Sunpro's separate accredited file with 425 complaints and 80 reviews. That
is what a review searcher cannot find elsewhere in one place.

So the fix leads with the numbers and the distinction, keeps every word
defensible, and does not promise anything. Facts were read from the BBB profiles
on 25 November 2026 and are labelled with that date in the body, so a stale
figure in a snippet is avoided by naming the rating as absent rather than
quoting a number that moves.

Idempotent: refuses to write if the new description is already present.
"""
import sys, pathlib

P = pathlib.Path("client/src/data/blog-articles-batch6.ts")

NEW_TITLE = '    metaTitle: "ADT Solar Reviews & Complaints: 404 BBB Complaints, No Rating",'
NEW_DESC = '    metaDescription: "ADT Solar reviews: 404 BBB complaints in three years, no rating because it is out of business, and Sunpro\\u2019s separate file. Who services your system now.",'

MARKER = "404 BBB Complaints, No Rating"

OLD_TITLE = '    metaTitle: "ADT Solar Reviews & Complaints (2026): Who Services It Now",'
OLD_DESC = '    metaDescription: "ADT Solar reviews and complaints, what its customer service still handles after the 2024 shutdown, Sunpro warranty questions, and your contract options.",'

s = P.read_text(encoding="utf-8")
if MARKER in s:
    print("already applied — nothing written")
    sys.exit(0)

assert s.count(OLD_TITLE) == 1, f"title anchor count {s.count(OLD_TITLE)}"
assert s.count(OLD_DESC) == 1, f"desc anchor count {s.count(OLD_DESC)}"

# Scope to the owning slug so a replace can never land on another article.
i = s.find('slug: "adt-solar-complaints"')
j = s.find("slug:", i + 10)
assert i > 0 and j > i, "could not bound the ADT article"
art = s[i:j]
assert art.count(OLD_TITLE) == 1 and art.count(OLD_DESC) == 1, "anchors not inside the ADT article"

art = art.replace(OLD_TITLE, NEW_TITLE).replace(OLD_DESC, NEW_DESC)
s = s[:i] + art + s[j:]
P.write_text(s, encoding="utf-8")

# Report the rendered lengths, since Google measures the rendered string and
# &amp; counts as one character.
title_rendered = NEW_TITLE.split('"')[1].replace("&", "&")
desc_rendered = NEW_DESC.split('"')[1].replace("\\u2019", "\u2019")
print("applied")
print(f"  title rendered length: {len(title_rendered)} (limit 70)")
print(f"  desc  rendered length: {len(desc_rendered)} (limit 160)")
assert len(title_rendered) <= 70, "title over the 70-character limit"
assert len(desc_rendered) <= 160, "description over the 160-character limit"
