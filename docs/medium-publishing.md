# Medium Publishing — Daily Instructions

**Two articles a day, republished to Medium with links back to the site.**

Last verified against the live site: 2026-08-29.

---

## Read this first: what changed and why

The previous version of these instructions was written before the August 2026
spam recovery cut the indexable site from 299 URLs to 68. It was never updated,
so it had gone quietly wrong in ways that made the daily work actively harmful:

| Checked against the live site | Result |
|---|---|
| Internal link table (11 phrases) | **4 usable.** 5 pointed at `noindex` pages, 2 at 301 redirects |
| Publishing queue (34 sampled of ~180) | **15 usable.** 16 `noindex`, 2 redirects, 1 hard 404 |
| `cancelyoursolar.co`, listed as a required link on every article | **Does not resolve** (DNS failure) |
| `/cancel-solar-contract-houston-tx` in the link table | **404** — the live format is `/cancel-solar-contract/houston-tx`, and that page 301s anyway |

A Medium article that links to a `noindex` page spends a backlink on a page
Google has been told to ignore, and sends the reader to a page the site is
deliberately suppressing. More than half of every day's linking was doing that.

**So the URLs are no longer written down here.** They are generated from the same
source of truth the sitemap and the robots tags use, and the generator refuses to
produce a brief for a page that is not index-eligible.

---

## The daily process

### 1. Generate the brief

```bash
node scripts/medium-publish-brief.mjs --list          # what is safe to publish
node scripts/medium-publish-brief.mjs <article-slug>  # the paste-ready brief
```

The brief contains every block in publishing order, with the correct canonical
URL and a verified link map. If the slug is not publishable, the generator exits
non-zero and tells you which reason applies — noindex, redirecting, or held in
the trust quarantine.

**The queue is 33 articles, not 180.** That is the entire indexable blog
inventory. Do not publish anything the generator will not produce a brief for.

### 2. Open Medium

<https://medium.com/me/stories/drafts>

Check your published stories before starting. Never post a duplicate.

### 3. Paste the six blocks in order

The generator emits them numbered:

1. **Intro block** — fill in the three "In this article you'll learn" lines from
   the actual article. Everything else is fixed copy.
2. **Watch / listen block** — goes in the first third, after the intro, before
   the first major section.
3. **Internal links** — target 15–25. Link a phrase only where it already reads
   naturally in the text; never force one in.
4. **What you can walk away with** — bolded, just before the close.
5. **From Trapped to Free** — every article, no exceptions. This is the brand.
6. **Closing CTA** — the very last thing, including the `Originally published
   at:` line so Google can see the canonical source.

### 4. Cover image

If the imported draft has no cover image, add one before publishing. Medium
suppresses distribution for posts without one.

### 5. Tags

`Solar`, `Solar Energy`, `Solar Contract`, `Consumer Rights`, `Personal Finance`

### 6. Publish

---

## Linking technique (browser agent notes)

- `Ctrl+K` (or the link icon) after selecting the phrase.
- Use `scrollIntoView()` before selecting text that is off-screen.
- Click at phrase start, `Shift+Click` at the end to select across lines.
- Check `tagName === 'A'` before linking, to avoid nesting a link inside a link.
- Medium auto-saves — watch the "Saved" indicator at the top left.

---

## Tone

Direct, bold, human. Not a law firm. We are the people who actually get
homeowners out of these contracts.

Fan the pain, give hope, show them the door. Every article should feel written
for a homeowner who is frustrated, confused, and looking for a way out.

For the record: the closing copy and the four-step block were run through
`scripts/audit-indexable-trust-claims.py`, the same claim scanner that gates
every indexable page on the site. All 14 rules, zero flags. The brand voice is
not the compliance risk — the dead links were.

---

## Domains

| Use | Domain |
|---|---|
| Primary, every article | `https://breakyoursolarcontract.com` |
| Secondary, every article | `https://solarcomplaints.co` |
| YouTube, every article | `https://www.youtube.com/@BreakYourSolarContract` |

**Do not use `cancelyoursolar.co`.** It appeared in the old instructions as a
required link on every article and it does not resolve. It is referenced in one
other place in this repo and should be removed or pointed at a live host.

---

## Known issue: backlink tracking will not see this work

`server/cron/mediumBacklinkTracker.ts` hardcodes 20 URLs under
`medium.com/@solarfreedom`. The August 2026 audit found that profile's feed
returns 404 and reported the real profile as `@chase_12624`. Both profiles return
403 to a scripted request, so this could not be re-verified here — **confirm
which profile is correct, then fix the tracker**, otherwise `discoveredBacklinks`
stays empty and the scorecard's verified-backlink count stays at 0 no matter how
many articles get published.

---

## Why this is not a scheduled routine

Publishing to Medium needs an authenticated Medium session in a real browser.
Medium retired its Integration Token publishing API, there is no Medium
connector available to the agent, and a scheduled cloud session has no logged-in
browser. A routine that claimed to publish would run, report success, and change
nothing — the same failure this repo has been unwinding all week.

The browser extension stays the thing that publishes. The generator's job is to
make sure that when it publishes, every link it places actually counts.
