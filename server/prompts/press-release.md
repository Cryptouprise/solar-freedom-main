# Solar Freedom — Press Release Generation Prompt

## About Solar Freedom

Solar Freedom (breakyoursolarcontract.com) is a consumer advocacy resource that helps homeowners
understand their legal rights regarding solar contracts. The site connects distressed solar
customers with attorneys who specialize in solar contract cancellation, rescission, and dispute
resolution. Solar Freedom does not provide legal advice directly — it connects homeowners with
qualified attorneys.

**Key facts to weave into press releases:**
- Solar contracts often contain 20–25 year terms with annual escalator clauses of 2–3%
- Homeowners frequently report being misled during the sales process
- Contract cancellation is possible in many states under consumer protection laws
- Solar Freedom covers all 50 states and provides free case reviews
- Phone: Available via the website contact form
- Website: https://www.breakyoursolarcontract.com

## Boilerplate (About Section — always append at end)

About Solar Freedom: Solar Freedom (breakyoursolarcontract.com) is a consumer advocacy resource
dedicated to helping homeowners understand their legal rights regarding solar energy contracts.
The platform connects homeowners with attorneys who specialize in solar contract cancellation,
rescission, and consumer protection law. Solar Freedom provides free educational resources
covering all 50 states and offers free case reviews for homeowners seeking to exit predatory
solar agreements. For more information, visit https://www.breakyoursolarcontract.com.

## Press Release Format

A press release must follow this exact structure:

```
FOR IMMEDIATE RELEASE

[HEADLINE — compelling, newsworthy, 8–12 words, title case]

[SUBHEADLINE — one sentence expanding on the headline]

[CITY, STATE] — [DATE] — [Opening paragraph: the most important information first. Who, what,
when, where, why. 2–3 sentences. Do NOT start with "Solar Freedom announces..."]

[Body paragraph 1: Supporting facts, statistics, context. 3–4 sentences.]

[Body paragraph 2: Quote from a spokesperson or expert. Format: "Quote text," said [Name],
[Title] at Solar Freedom. "Second sentence of quote."]

[Body paragraph 3: Additional context, consumer impact, or call to action. 3–4 sentences.]

[Optional paragraph 4: State-specific angle or additional data if relevant.]

[Call to action: Homeowners seeking a free case review can visit
https://www.breakyoursolarcontract.com or call [phone] to speak with a case specialist.]

###

About Solar Freedom:
[Boilerplate from above]

Contact:
Solar Freedom
https://www.breakyoursolarcontract.com
```

## Writing Guidelines

1. **Tone:** Authoritative, journalistic, factual. NOT promotional or salesy.
2. **Length:** 400–600 words total (excluding boilerplate).
3. **Keywords:** Naturally weave in the target keywords provided — do not keyword-stuff.
4. **Statistics:** Use real, verifiable statistics when possible. If citing a statistic, note the source.
5. **Newsworthiness:** Frame the topic as news — a trend, a new resource, a legal development, a
   consumer warning. Not an advertisement.
6. **Quotes:** Create a realistic quote from "a Solar Freedom spokesperson" or "a consumer
   protection attorney" — do not fabricate named individuals.
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
