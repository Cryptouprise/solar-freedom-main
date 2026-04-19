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
  Prints the slug and title for manual review before publishing.
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

# ─── Source URLs to monitor for trending topics ───────────────────────────────
TREND_SOURCES = [
    # News / complaint aggregators
    "https://www.bbb.org/search?find_text=solar+contract&find_country=US&find_type=Business",
    "https://www.consumeraffairs.com/solar-energy/",
    # Reddit solar complaints
    "https://www.reddit.com/r/solar/search/?q=cancel+solar+contract&sort=new",
    "https://www.reddit.com/r/solar/search/?q=solar+contract+scam&sort=new",
    # Google Trends proxies — solar complaint keywords
    "https://trends.google.com/trends/explore?q=cancel+solar+contract&geo=US",
]

# ─── Competitor content to analyze for gaps ──────────────────────────────────
COMPETITOR_URLS = [
    "https://www.solarcancellationattorney.com/blog/",
    "https://www.solarcontracthelp.com/blog/",
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
            return data["data"]["markdown"][:8000]  # cap at 8K chars
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
        "max_tokens": 4000,
    }
    if json_schema:
        payload["response_format"] = {
            "type": "json_schema",
            "json_schema": json_schema,
        }

    # Normalize URL — append /v1 if not already present
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
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


def discover_trending_topic(forced_topic: str | None = None) -> str:
    """Scrape sources and ask LLM to identify the hottest solar complaint topic right now."""
    if forced_topic:
        return forced_topic

    print("Discovering trending topics from complaint sources...")
    scraped = []
    for url in TREND_SOURCES[:3]:  # limit to 3 to save credits
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
                "or 'solar loan dealer fee hidden charges'. No explanation."
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
                "slug": {"type": "string", "description": "URL slug, lowercase-hyphenated, no special chars"},
                "title": {"type": "string", "description": "H1 title, compelling and specific"},
                "metaTitle": {"type": "string", "description": "SEO title tag, max 60 chars"},
                "metaDescription": {"type": "string", "description": "Meta description, 140-155 chars, includes primary keyword"},
                "category": {"type": "string", "description": "One of: Legal Rights, Solar Fraud, Home Sale, Solar Companies, State Laws, Contract Help"},
                "readTime": {"type": "string", "description": "e.g. '8 min read'"},
                "excerpt": {"type": "string", "description": "2-3 sentence preview, compelling"},
                "heroAlt": {"type": "string", "description": "Alt text for hero image"},
                "ctaText": {"type": "string", "description": "CTA button text, action-oriented"},
                "ctaSubtext": {"type": "string", "description": "CTA subtext, 1 sentence"},
                "faq": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "q": {"type": "string"},
                            "a": {"type": "string"}
                        },
                        "required": ["q", "a"],
                        "additionalProperties": False
                    },
                    "description": "5-7 FAQ items targeting long-tail keywords"
                },
                "contentSections": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "type": {"type": "string", "enum": ["h2", "p", "callout"]},
                            "content": {"type": "string"}
                        },
                        "required": ["type", "content"],
                        "additionalProperties": False
                    },
                    "description": "Article body: 6-8 sections alternating h2/p/callout"
                }
            },
            "required": ["slug", "title", "metaTitle", "metaDescription", "category", "readTime", "excerpt", "heroAlt", "ctaText", "ctaSubtext", "faq", "contentSections"],
            "additionalProperties": False
        }
    }

    result = call_llm(
        messages=[
            {
                "role": "system",
                "content": textwrap.dedent("""
                    You are a senior content strategist for Solar Freedom, a consumer protection 
                    law firm that helps homeowners cancel predatory solar contracts. 
                    
                    Your writing style: Direct, authoritative, empathetic. No fluff. 
                    Use specific facts, dollar amounts, legal statute names, and real company names.
                    Write for homeowners who are frustrated and looking for real answers.
                    
                    SEO rules:
                    - Primary keyword in title, H1, first paragraph, and meta title
                    - Long-tail variants in H2s and FAQ questions
                    - Include state-specific angles where relevant
                    - Target "cancel [topic]", "get out of [topic]", "[topic] legal rights"
                    - FAQ questions should match exact search queries people type
                    
                    Content rules:
                    - Every claim should be specific (cite statutes, percentages, dollar amounts)
                    - Include at least one callout block with a key legal insight
                    - End with a clear path to action (free case review)
                    - Do NOT use generic filler phrases like "it is important to note"
                    - Write in present tense, active voice
                """).strip(),
            },
            {
                "role": "user",
                "content": f"Write a comprehensive SEO blog post about: {topic}\n\nPublish date: {today}",
            },
        ],
        json_schema=schema,
    )

    return json.loads(result)


def format_as_typescript(post: dict, publish_date: str) -> str:
    """Format the generated post as a TypeScript object matching the BlogPost type."""

    def ts_string(s: str) -> str:
        """Escape a string for TypeScript."""
        return s.replace("\\", "\\\\").replace("'", "\\'").replace("`", "\\`")

    slug = post["slug"]
    lines = [f"  {{"]
    lines.append(f"    slug: '{ts_string(slug)}',")
    lines.append(f"    title: '{ts_string(post['title'])}',")
    lines.append(f"    metaTitle: '{ts_string(post['metaTitle'])}',")
    lines.append(f"    metaDescription: '{ts_string(post['metaDescription'])}',")
    lines.append(f"    category: '{ts_string(post['category'])}',")
    lines.append(f"    readTime: '{ts_string(post['readTime'])}',")
    lines.append(f"    publishDate: '{publish_date}',")
    lines.append(f"    excerpt: '{ts_string(post['excerpt'])}',")
    lines.append(f"    heroImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80',")
    lines.append(f"    heroAlt: '{ts_string(post['heroAlt'])}',")
    lines.append(f"    ctaText: '{ts_string(post['ctaText'])}',")
    lines.append(f"    ctaSubtext: '{ts_string(post['ctaSubtext'])}',")
    lines.append(f"    relatedSlugs: ['how-to-get-out-of-a-solar-contract', 'solar-fraud-warning-signs', 'get-out-of-solar-contract-by-state'],")

    # FAQ
    lines.append(f"    faq: [")
    for faq in post["faq"]:
        lines.append(f"      {{ q: '{ts_string(faq['q'])}', a: '{ts_string(faq['a'])}' }},")
    lines.append(f"    ],")

    # Content
    lines.append(f"    content: [")
    for section in post["contentSections"]:
        lines.append(f"      {{ type: '{section['type']}', content: '{ts_string(section['content'])}' }},")
    lines.append(f"    ],")

    lines.append(f"  }},")
    return "\n".join(lines)


def append_to_batch_file(ts_entry: str, slug: str, dry_run: bool = False):
    """Append the new post to the batch file."""
    if not os.path.exists(OUTPUT_FILE):
        # Create the file with proper TypeScript structure
        header = textwrap.dedent("""
            // Auto-generated by trending-content-pipeline.py
            // DO NOT EDIT MANUALLY — run the pipeline to add new posts

            import type { BlogPost } from './blog';

            export const batch9BlogPosts: BlogPost[] = [
        """).lstrip()
        footer = "];\n"
        content = header + ts_entry + "\n" + footer
    else:
        # Read existing file and insert before closing bracket
        with open(OUTPUT_FILE, "r") as f:
            existing = f.read()
        # Insert before the closing ]
        content = existing.rstrip()
        if content.endswith("];"):
            content = content[:-2] + "\n" + ts_entry + "\n];\n"
        else:
            content = content + "\n" + ts_entry + "\n"

    if dry_run:
        print("\n" + "=" * 60)
        print("DRY RUN — would write to:", OUTPUT_FILE)
        print("=" * 60)
        print(ts_entry)
        return

    with open(OUTPUT_FILE, "w") as f:
        f.write(content)
    print(f"\n✓ Written to {OUTPUT_FILE}")
    print(f"  Slug: {slug}")
    print(f"\nNext steps:")
    print(f"  1. Review the generated content in {OUTPUT_FILE}")
    print(f"  2. Import batch9BlogPosts in client/src/data/blog.ts")
    print(f"  3. Add heroImage URL (replace Unsplash placeholder)")
    print(f"  4. Run: pnpm build && submit to Google Indexing API")


def main():
    parser = argparse.ArgumentParser(description="Generate trending solar content")
    parser.add_argument("--topic", help="Force a specific topic instead of auto-discovering")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    args = parser.parse_args()

    print("Solar Freedom — Trending Content Pipeline")
    print("=" * 50)

    # Step 1: Discover trending topic
    topic = discover_trending_topic(args.topic)

    # Step 2: Generate article
    post = generate_article(topic)

    # Step 3: Format as TypeScript
    publish_date = datetime.now().strftime("%B %d, %Y")
    ts_entry = format_as_typescript(post, publish_date)

    # Step 4: Write to file
    append_to_batch_file(ts_entry, post["slug"], dry_run=args.dry_run)

    print(f"\n✓ Done! Article: '{post['title']}'")
    print(f"  Meta: {post['metaTitle']}")
    print(f"  Description: {post['metaDescription'][:80]}...")


if __name__ == "__main__":
    main()
