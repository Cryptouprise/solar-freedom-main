# Solar Freedom — Press Release Generation Prompt

## About Solar Freedom

Solar Freedom (breakyoursolarcontract.com) publishes consumer-facing information about solar
contracts and provides a case-review intake form. Do not describe Solar Freedom as a law firm,
legal service, attorney network, or nationwide provider without separately supplied evidence.

**Key facts to weave into press releases:**
- Solar contracts often contain 20–25 year terms with annual escalator clauses of 2–3%
- Homeowners frequently report being misled during the sales process
- Contract cancellation is possible in many states under consumer protection laws
- Phone: Available via the website contact form
- Website: https://breakyoursolarcontract.com

## Boilerplate (About Section — always append at end)

About Solar Freedom: Solar Freedom (breakyoursolarcontract.com) publishes consumer-facing
information about solar leases, power purchase agreements, and loans and provides a case-review
intake form. Site information is general and is not legal advice. For more information, visit
https://breakyoursolarcontract.com.

## Press Release Format

A press release must follow this exact structure:

```
FOR IMMEDIATE RELEASE

[HEADLINE — compelling, newsworthy, 8–12 words, title case]

[SUBHEADLINE — one sentence expanding on the headline]

[CITY, STATE] — [DATE] — [Opening paragraph: the most important information first. Who, what,
when, where, why. 2–3 sentences. Do NOT start with "Solar Freedom announces..."]

[Body paragraph 1: Supporting facts, statistics, context. 3–4 sentences.]

[Body paragraph 2: Include a quote only when the request supplies the exact quote, named source,
title, source URL, verification date, and consent record. Otherwise omit this paragraph.]

[Body paragraph 3: Additional context, consumer impact, or call to action. 3–4 sentences.]

[Optional paragraph 4: State-specific angle or additional data if relevant.]

[Call to action: Homeowners seeking information or case-review intake can visit
https://breakyoursolarcontract.com. Do not add a phone number unless one is supplied and verified.]

###

About Solar Freedom:
[Boilerplate from above]

Contact:
Solar Freedom
https://breakyoursolarcontract.com
```

## Writing Guidelines

1. **Tone:** Authoritative, journalistic, factual. NOT promotional or salesy.
2. **Length:** 400–600 words total (excluding boilerplate).
3. **Keywords:** Naturally weave in the target keywords provided — do not keyword-stuff.
4. **Statistics:** Use real, verifiable statistics when possible. If citing a statistic, note the source.
5. **Newsworthiness:** Frame the topic as news — a trend, a new resource, a legal development, a
   consumer warning. Not an advertisement.
6. **Quotes:** Never create or paraphrase a testimonial, spokesperson quote, expert quote, or
   attribution. Use only exact, supplied, verified quotation material.
7. **Links:** Include the target URL naturally in the body (not just the CTA).
8. **Dateline:** Use the current date. City: Jacksonville, FL.

## Output Format

Return a JSON object with exactly these fields:
```json
{
  "headline": "string — the press release headline",
  "subheadline": "string — one sentence subheadline",
  "body": "string — full press release body text (plain text, no markdown, paragraphs separated by \\n\\n)",
  "boilerplate": "string — the about section",
  "seoSummary": "string — 1–2 sentence summary for social sharing"
}
```
