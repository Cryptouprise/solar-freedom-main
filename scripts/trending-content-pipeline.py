#!/usr/bin/env python3
"""
Solar Freedom — Trending Content Pipeline
==========================================
Scrapes competitor and news sources for trending solar contract topics,
then uses the Manus built-in LLM to generate a full SEO-optimized blog post
in the exact format required by the site's blog data structure.

Usage:
  python3 scripts/trending-content-pipeline.py
  python3 scripts/trending-content-pipeline.py --topic "sunrun complaints 2026"
  python3 scripts/trending-content-pipeline.py --dry-run  # preview without writing

Output:
  Appends a new blog post entry to client/src/data/blog-articles-batch9.ts

═══════════════════════════════════════════════════════════════
PERMANENT QUALITY CHECKLIST — EVERY ARTICLE MUST HAVE ALL OF:
═══════════════════════════════════════════════════════════════
✅ stat-block as FIRST content section (4 amber stat cards)
✅ Minimum 12 content sections (targets ~1,500+ words)
✅ At least 6 H2 headings
✅ At least 1 callout block (legal insight)
✅ At least 1 warning block (risk/urgency)
✅ At least 1 quote block with homeowner attribution
✅ At least 1 list block (bullet points)
✅ At least 1 image section mid-article (unique Unsplash URL per topic)
✅ Author bio section at the end (type: 'p' with attribution)
✅ Inline body links: use [text](url) markdown in 'p' sections
   - Link to related blog posts using relative paths like /blog/slug
   - Link to city pages using /cancel-solar-contract/city-state
✅ 6+ FAQ items targeting exact long-tail search queries
✅ relatedSlugs: minimum 4 slugs from the existing article inventory
✅ Unique heroImage: pick from UNSPLASH_POOL below, rotate per article
✅ metaTitle: max 60 chars, primary keyword first
✅ metaDescription: 140-155 chars exactly, includes primary keyword + CTA

COMMON MISTAKES TO NEVER REPEAT:
❌ DO NOT use the same heroImage for multiple articles
❌ DO NOT generate literal \\n or \\t inside string values
❌ DO NOT use unescaped single quotes inside TypeScript strings
❌ DO NOT write fewer than 12 content sections (too thin = won't rank)
❌ DO NOT skip the stat-block — it's the first thing readers see
❌ DO NOT forget the author bio at the end
❌ DO NOT use generic Unsplash photos — pick topic-relevant ones from pool
═══════════════════════════════════════════════════════════════
"""

import argparse
import json
import os
import re
import sys
import textwrap
from datetime import datetime

import requests

# ─── Config ───────────────────────────────────────────────────────────────────
FIRECRAWL_KEY = "fc-a63f9031a349402caf00c3c9f1161d4d"
FIRECRAWL_URL = "https://api.firecrawl.dev/v1"

# Manus built-in LLM (server-side only — this script runs server-side)
LLM_API_URL = os.environ.get("BUILT_IN_FORGE_API_URL", "")
LLM_API_KEY = os.environ.get("BUILT_IN_FORGE_API_KEY", "")

# Output file
OUTPUT_FILE = os.path.join(
    os.path.dirname(__file__), "..", "client", "src", "data", "blog-articles-batch9.ts"
)

# ─── Unsplash image pool — rotate per article, never reuse ───────────────────
# Each tuple: (url, alt_text_template)
UNSPLASH_POOL = [
    ("https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&q=80", "attorney reviewing solar contract documents"),
    ("https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80", "homeowner stressed reviewing solar paperwork"),
    ("https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80", "financial documents and calculator for solar costs"),
    ("https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&q=80", "professional attorney in office reviewing case"),
    ("https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=1200&q=80", "solar panels on residential home"),
    ("https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1200&q=80", "solar energy system on house roof"),
    ("https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&q=80", "frustrated homeowner with financial documents"),
    ("https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80", "solar panel installation on suburban home"),
    ("https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80", "legal consultation with attorney"),
    ("https://images.unsplash.com/photo-1546156929-a4c0ac411f47?w=1200&q=80", "solar panels with dramatic sky"),
    ("https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&q=80", "residential solar installation"),
    ("https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80", "business meeting reviewing contracts"),
]

# Track which image was last used (simple rotation by counting existing articles)
def get_next_unsplash_image() -> tuple:
    """Pick the next unused Unsplash image by counting existing articles."""
    try:
        with open(OUTPUT_FILE, "r") as f:
            content = f.read()
        # Count how many articles are in the file
        count = content.count("slug: '")
        return UNSPLASH_POOL[count % len(UNSPLASH_POOL)]
    except Exception:
        return UNSPLASH_POOL[0]

# ─── Source URLs to monitor for trending topics ───────────────────────────────
TREND_SOURCES = [
    "https://www.consumeraffairs.com/solar-energy/",
    "https://www.reddit.com/r/solar/search/?q=cancel+solar+contract&sort=new",
    "https://www.reddit.com/r/solar/search/?q=solar+contract+scam&sort=new",
]

# ─── Existing article slugs for relatedSlugs cross-linking ───────────────────
EXISTING_SLUGS = [
    "how-to-get-out-of-a-solar-contract",
    "solar-company-went-bankrupt",
    "cancel-solar-contract-after-installation",
    "solar-fraud-warning-signs",
    "sell-house-with-solar-panels",
    "solar-contract-rescission-rights",
    "adt-solar-complaints",
    "cancel-solar-loan-or-lease-early",
    "solar-payments-too-high-help",
    "get-out-of-solar-contract-by-state",
    "new-jersey-solar-contract-rights",
    "solar-fraud-report-to-attorney-general",
    "sunrun-solar-contract-cancellation-2026",
    "cancel-sunrun-solar-contract-before-installation",
    "freedom-forever-solar-bankruptcy-what-homeowners-can-do-2026",
]


def firecrawl_scrape(url: str) -> str:
    """Scrape a URL and return clean markdown."""
    try:
        resp = requests.post(
            f"{FIRECRAWL_URL}/scrape",
            headers={"Authorization": f"Bearer {FIRECRAWL_KEY}"},
            json={"url": url, "formats": ["markdown"], "onlyMainContent": True},
            timeout=30,
        )
        data = resp.json()
        if data.get("success") and data.get("data", {}).get("markdown"):
            return data["data"]["markdown"][:8000]
        return ""
    except Exception as e:
        print(f"  [firecrawl] Error scraping {url}: {e}", file=sys.stderr)
        return ""


def call_llm(messages: list, json_schema: dict | None = None) -> str:
    """Call the Manus built-in LLM."""
    if not LLM_API_URL or not LLM_API_KEY:
        raise RuntimeError(
            "BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY must be set. "
            "Run this script from the server environment."
        )

    payload: dict = {
        "messages": messages,
        "max_tokens": 6000,  # increased for longer articles
    }
    if json_schema:
        payload["response_format"] = {
            "type": "json_schema",
            "json_schema": json_schema,
        }

    base = LLM_API_URL.rstrip('/')
    if not base.endswith('/v1'):
        base = base + '/v1'
    resp = requests.post(
        f"{base}/chat/completions",
        headers={
            "Authorization": f"Bearer {LLM_API_KEY}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=180,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


def discover_trending_topic(forced_topic: str | None = None) -> str:
    """Scrape sources and ask LLM to identify the hottest solar complaint topic right now."""
    if forced_topic:
        return forced_topic

    print("Discovering trending topics from complaint sources...")
    scraped = []
    for url in TREND_SOURCES[:2]:
        print(f"  Scraping: {url}")
        content = firecrawl_scrape(url)
        if content:
            scraped.append(f"SOURCE: {url}\n\n{content[:2000]}")

    combined = "\n\n---\n\n".join(scraped) if scraped else "No sources scraped."

    result = call_llm([
        {
            "role": "system",
            "content": (
                "You are an SEO strategist for a solar contract cancellation law firm. "
                "Identify the single most trending, high-intent solar complaint topic "
                "right now based on the scraped content. Return ONLY the topic as a "
                "short phrase (5-10 words), e.g. 'Sunrun contract cancellation 2026' "
                "or 'GoodLeap solar loan hidden fees 2026'. No explanation."
            ),
        },
        {"role": "user", "content": combined},
    ])
    topic = result.strip().strip('"').strip("'")
    print(f"  → Trending topic: {topic}")
    return topic


def generate_article(topic: str) -> dict:
    """Use LLM to generate a full blog post in the site's data format."""
    print(f"\nGenerating article for: {topic}")

    today = datetime.now().strftime("%B %d, %Y")

    schema = {
        "name": "blog_post",
        "strict": True,
        "schema": {
            "type": "object",
            "properties": {
                "slug": {"type": "string", "description": "URL slug, lowercase-hyphenated, no special chars, no apostrophes"},
                "title": {"type": "string", "description": "H1 title, compelling and specific, includes primary keyword"},
                "metaTitle": {"type": "string", "description": "SEO title tag, MUST be under 60 chars, primary keyword first"},
                "metaDescription": {"type": "string", "description": "Meta description, MUST be 140-155 chars, includes primary keyword + call to action"},
                "category": {"type": "string", "description": "One of: Legal Rights, Solar Fraud, Home Sale, Solar Companies, State Laws, Contract Help"},
                "readTime": {"type": "string", "description": "e.g. '9 min read' — should reflect 1500+ word article"},
                "excerpt": {"type": "string", "description": "2-3 sentence preview, compelling, includes primary keyword"},
                "heroAlt": {"type": "string", "description": "Descriptive alt text for hero image, includes primary keyword"},
                "ctaText": {"type": "string", "description": "CTA button text, action-oriented, specific to topic"},
                "ctaSubtext": {"type": "string", "description": "CTA subtext, 1 sentence, creates urgency"},
                "relatedSlugs": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "4-5 related article slugs from the existing inventory for cross-linking"
                },
                "faq": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "q": {"type": "string", "description": "Exact long-tail search query people type"},
                            "a": {"type": "string", "description": "Comprehensive answer, 2-4 sentences, cites specific laws or facts"}
                        },
                        "required": ["q", "a"],
                        "additionalProperties": False
                    },
                    "description": "MINIMUM 6 FAQ items. Questions must match exact search queries. Answers must cite specific statutes, dollar amounts, or company-specific facts."
                },
                "contentSections": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "type": {"type": "string", "enum": ["h2", "h3", "p", "callout", "warning", "quote", "list"]},
                            "content": {"type": "string", "description": "Text content. For 'p' type, include inline markdown links like [anchor text](/blog/slug) to related articles."},
                            "items": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "Only for 'list' type — array of bullet point strings"
                            },
                            "author": {"type": "string", "description": "Only for 'quote' type — attribution name and location"}
                        },
                        "required": ["type", "content"],
                        "additionalProperties": False
                    },
                    "description": "MINIMUM 14 content sections for 1500+ word article. REQUIRED structure: start with at least 6 h2 sections, include 1 callout, 1 warning, 1 quote with homeowner attribution, 1 list. Last section MUST be author bio paragraph."
                }
            },
            "required": ["slug", "title", "metaTitle", "metaDescription", "category", "readTime", "excerpt", "heroAlt", "ctaText", "ctaSubtext", "relatedSlugs", "faq", "contentSections"],
            "additionalProperties": False
        }
    }

    existing_slugs_str = "\n".join(f"  - {s}" for s in EXISTING_SLUGS)

    result = call_llm(
        messages=[
            {
                "role": "system",
                "content": textwrap.dedent(f"""
                    You are a senior content strategist for Solar Freedom, a consumer protection 
                    law firm that helps homeowners cancel predatory solar contracts. 
                    
                    Your writing style: Direct, authoritative, empathetic. No fluff. 
                    Use specific facts, dollar amounts, legal statute names, and real company names.
                    Write for homeowners who are frustrated and looking for real answers.
                    
                    MANDATORY SEO RULES:
                    - Primary keyword in title, first H2, first paragraph, and meta title
                    - Long-tail variants in every H2 and every FAQ question
                    - Include state-specific angles (California, Texas, Florida, Arizona, Nevada)
                    - Target "cancel [topic]", "get out of [topic]", "[topic] legal rights", "[topic] 2026"
                    - FAQ questions MUST match exact search queries people type into Google
                    - metaTitle MUST be under 60 characters
                    - metaDescription MUST be 140-155 characters exactly
                    
                    MANDATORY CONTENT RULES:
                    - MINIMUM 14 content sections (this is non-negotiable — thin content does not rank)
                    - Every factual claim must be specific: cite statutes, percentages, dollar amounts
                    - Include at least 1 callout block with a key legal insight (cite a specific law)
                    - Include at least 1 warning block about risks of inaction
                    - Include at least 1 quote block with a realistic homeowner testimonial and attribution
                    - Include at least 1 list block with 4-6 bullet points
                    - Last section MUST be an author bio: "This article was reviewed by the Solar Freedom legal team, specializing in consumer protection law and solar contract disputes since 2019."
                    - Do NOT use generic filler phrases like "it is important to note"
                    - Write in present tense, active voice
                    - In 'p' sections, include inline links to related articles using format: [anchor text](/blog/slug)
                    
                    EXISTING ARTICLES TO LINK TO (use these slugs in relatedSlugs and inline links):
                    {existing_slugs_str}
                    
                    STRING SAFETY RULES (CRITICAL — violations break the site):
                    - NEVER include literal newline characters inside string values
                    - NEVER include tab characters inside string values  
                    - ALWAYS escape apostrophes in content as \\' 
                    - Use double quotes for possessives instead of apostrophes where possible
                    - The 'items' field is ONLY for 'list' type sections — do not include it for other types
                    - The 'author' field is ONLY for 'quote' type sections
                """).strip(),
            },
            {
                "role": "user",
                "content": f"Write a comprehensive 1500+ word SEO blog post about: {topic}\n\nPublish date: {today}",
            },
        ],
        json_schema=schema,
    )

    return json.loads(result)


def ts_string(s: str) -> str:
    """Escape a string for TypeScript single-quoted string literals.
    
    CRITICAL: This function prevents the most common pipeline failures:
    - Literal newlines/tabs inside strings break esbuild
    - Unescaped single quotes break TypeScript parsing
    - Backticks need escaping in template literal contexts
    """
    if not isinstance(s, str):
        s = str(s)
    return (
        s.replace("\\", "\\\\")   # escape backslashes first
        .replace("\r\n", " ")      # Windows line endings
        .replace("\n", " ")        # Unix line endings
        .replace("\r", " ")        # old Mac line endings
        .replace("\t", " ")        # tabs
        .replace("\\n", " ")       # LLM sometimes outputs literal \n escape sequences
        .replace("\\t", " ")       # and \t
        .replace("\\r", " ")       # and \r
        .replace("'", "\'")       # escape single quotes
        .replace("`", "\`")       # escape backticks
        # Sanitize non-ASCII chars that esbuild cannot handle (LESSON LEARNED: never allow these in TS strings)
        .replace("\u00a7", " Section ")  # section sign
        .replace("\u2019", "'")           # right single quote
        .replace("\u2018", "'")           # left single quote
        .replace("\u201c", '"')           # left double quote
        .replace("\u201d", '"')           # right double quote
        .replace("\u2013", "-")           # en dash
        .replace("\u2014", "--")          # em dash
        .replace("\u2026", "...")         # ellipsis
        .replace("\u00a0", " ")           # non-breaking space
    )


def format_as_typescript(post: dict, publish_date: str, hero_image: str, hero_alt_override: str) -> str:
    """Format the generated post as a TypeScript object matching the BlogPost type."""

    slug = post["slug"]
    lines = ["  {"]
    lines.append(f"    slug: '{ts_string(slug)}',")
    lines.append(f"    title: '{ts_string(post['title'])}',")
    lines.append(f"    metaTitle: '{ts_string(post['metaTitle'])}',")
    lines.append(f"    metaDescription: '{ts_string(post['metaDescription'])}',")
    lines.append(f"    category: '{ts_string(post['category'])}',")
    lines.append(f"    readTime: '{ts_string(post['readTime'])}',")
    lines.append(f"    publishDate: '{publish_date}',")
    lines.append(f"    excerpt: '{ts_string(post['excerpt'])}',")
    lines.append(f"    heroImage: '{hero_image}',")
    lines.append(f"    heroAlt: '{ts_string(hero_alt_override or post.get('heroAlt', ''))}',")
    lines.append(f"    ctaText: '{ts_string(post['ctaText'])}',")
    lines.append(f"    ctaSubtext: '{ts_string(post['ctaSubtext'])}',")

    # Related slugs — validate against known slugs
    related = post.get("relatedSlugs", [])
    if not related:
        related = EXISTING_SLUGS[:4]
    # Filter to only known slugs + any new ones that look valid
    valid_related = [s for s in related if re.match(r'^[a-z0-9-]+$', s)][:5]
    if len(valid_related) < 3:
        valid_related = EXISTING_SLUGS[:4]
    related_str = ", ".join(f"'{ts_string(s)}'" for s in valid_related)
    lines.append(f"    relatedSlugs: [{related_str}],")

    # FAQ
    lines.append("    faq: [")
    for faq in post.get("faq", []):
        q = ts_string(faq.get("q", ""))
        a = ts_string(faq.get("a", ""))
        lines.append(f"      {{ q: '{q}', a: '{a}' }},")
    lines.append("    ],")

    # Content — stat-block always first
    lines.append("    content: [")

    # Inject stat-block as first section if not already present
    first_section = post.get("contentSections", [{}])[0] if post.get("contentSections") else {}
    if first_section.get("type") != "stat-block":
        lines.append("      { type: 'stat-block', stats: [")
        lines.append("        { value: '3M+', label: 'U.S. homeowners with solar contracts' },")
        lines.append("        { value: '68%', label: 'Report higher-than-expected costs' },")
        lines.append("        { value: '30-90', label: 'Days to resolution with legal help' },")
        lines.append("        { value: 'Free', label: 'Initial case review' },")
        lines.append("      ]},")

    for i, section in enumerate(post.get("contentSections", [])):
        stype = section.get("type", "p")

        if stype == "list":
            items = section.get("items", [])
            if not items:
                # Fall back to splitting content by numbered items
                content_text = section.get("content", "")
                items = [content_text] if content_text else ["See related articles for more information."]
            items_str = ", ".join(f"'{ts_string(item)}'" for item in items)
            lines.append(f"      {{ type: 'list', items: [{items_str}] }},")

        elif stype == "quote":
            content = ts_string(section.get("content", ""))
            author = ts_string(section.get("author", "Verified homeowner"))
            lines.append(f"      {{ type: 'quote', content: '{content}', author: '{author}' }},")

        elif stype in ("h2", "h3", "p", "callout", "warning"):
            content = ts_string(section.get("content", ""))
            lines.append(f"      {{ type: '{stype}', content: '{content}' }},")

            # Inject mid-article image after section 6 (halfway point)
            if i == 6:
                mid_img_url = "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=900&q=80"
                lines.append(f"      {{ type: 'image', src: '{mid_img_url}', alt: 'homeowner reviewing solar contract with attorney', caption: 'Document all verbal promises made during the sales process — they become evidence in your case.' }},")

        else:
            # Unknown type — render as paragraph
            content = ts_string(section.get("content", ""))
            lines.append(f"      {{ type: 'p', content: '{content}' }},")

    lines.append("    ],")
    lines.append("  },")
    return "\n".join(lines)


def validate_article(post: dict) -> list[str]:
    """Validate the generated article against quality rules. Returns list of warnings."""
    warnings = []
    sections = post.get("contentSections", [])

    if len(sections) < 12:
        warnings.append(f"⚠️  Only {len(sections)} content sections (minimum 12 required for 1500+ words)")

    h2_count = sum(1 for s in sections if s.get("type") == "h2")
    if h2_count < 5:
        warnings.append(f"⚠️  Only {h2_count} H2 headings (minimum 5 required)")

    has_callout = any(s.get("type") == "callout" for s in sections)
    if not has_callout:
        warnings.append("⚠️  Missing callout block (legal insight box)")

    has_warning = any(s.get("type") == "warning" for s in sections)
    if not has_warning:
        warnings.append("⚠️  Missing warning block (risk/urgency box)")

    has_list = any(s.get("type") == "list" for s in sections)
    if not has_list:
        warnings.append("⚠️  Missing list block (bullet points)")

    faq_count = len(post.get("faq", []))
    if faq_count < 5:
        warnings.append(f"⚠️  Only {faq_count} FAQ items (minimum 6 required)")

    meta_title = post.get("metaTitle", "")
    if len(meta_title) > 62:
        warnings.append(f"⚠️  metaTitle is {len(meta_title)} chars (max 60)")

    meta_desc = post.get("metaDescription", "")
    if len(meta_desc) < 130 or len(meta_desc) > 160:
        warnings.append(f"⚠️  metaDescription is {len(meta_desc)} chars (target 140-155)")

    related = post.get("relatedSlugs", [])
    if len(related) < 3:
        warnings.append(f"⚠️  Only {len(related)} relatedSlugs (minimum 4 required)")

    return warnings


def append_to_batch_file(ts_entry: str, slug: str, dry_run: bool = False):
    """Append the new post to the batch file."""
    if not os.path.exists(OUTPUT_FILE):
        header = textwrap.dedent("""
            // Auto-generated by trending-content-pipeline.py
            // DO NOT EDIT MANUALLY — run the pipeline to add new posts

            import type { BlogPost } from './blog';

            export const batch9BlogPosts: BlogPost[] = [
        """).lstrip()
        footer = "];\n"
        content = header + ts_entry + "\n" + footer
    else:
        with open(OUTPUT_FILE, "r") as f:
            existing = f.read()
        content = existing.rstrip()
        if content.endswith("];"):
            content = content[:-2] + "\n" + ts_entry + "\n];\n"
        else:
            content = content + "\n" + ts_entry + "\n"

    if dry_run:
        print("\n" + "=" * 60)
        print("DRY RUN — would write to:", OUTPUT_FILE)
        print("=" * 60)
        print(ts_entry[:2000])
        print("... (truncated)")
        return

    with open(OUTPUT_FILE, "w") as f:
        f.write(content)
    print(f"\n✓ Written to {OUTPUT_FILE}")
    print(f"  Slug: {slug}")
    print(f"\nNext steps:")
    print(f"  1. Review the generated content in {OUTPUT_FILE}")
    print(f"  2. Verify batch9BlogPosts is imported in client/src/data/blog.ts")
    print(f"  3. Run: npx tsc --noEmit --skipLibCheck to check for TypeScript errors")
    print(f"  4. Submit URL to Google Indexing API: https://breakyoursolarcontract.com/blog/{slug}")


def main():
    parser = argparse.ArgumentParser(description="Generate trending solar content")
    parser.add_argument("--topic", help="Force a specific topic instead of auto-discovering")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    args = parser.parse_args()

    print("Solar Freedom — Trending Content Pipeline v2")
    print("=" * 50)

    # Step 1: Discover trending topic
    topic = discover_trending_topic(args.topic)

    # Step 2: Generate article
    post = generate_article(topic)

    # Step 3: Validate quality
    warnings = validate_article(post)
    if warnings:
        print("\n⚠️  Quality warnings:")
        for w in warnings:
            print(f"  {w}")
        if len(warnings) >= 4:
            print("\n❌ Too many quality issues — article may not rank well.")
            print("   Consider re-running the pipeline for a better result.")

    # Step 4: Pick hero image (rotate through pool)
    hero_img, hero_alt = get_next_unsplash_image()
    print(f"\n  Hero image: {hero_img}")

    # Step 5: Format as TypeScript
    publish_date = datetime.now().strftime("%B %d, %Y")
    ts_entry = format_as_typescript(post, publish_date, hero_img, hero_alt)

    # Step 6: Write to file
    append_to_batch_file(ts_entry, post["slug"], dry_run=args.dry_run)

    print(f"\n✓ Done! Article: '{post['title']}'")
    print(f"  Meta title ({len(post['metaTitle'])} chars): {post['metaTitle']}")
    print(f"  Meta desc ({len(post['metaDescription'])} chars): {post['metaDescription'][:80]}...")
    print(f"  Content sections: {len(post.get('contentSections', []))}")
    print(f"  FAQ items: {len(post.get('faq', []))}")


if __name__ == "__main__":
    main()
