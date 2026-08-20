#!/usr/bin/env python3
"""Read-only live indexability audit for Solar Freedom priority URLs."""
from __future__ import annotations

import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

import requests
from bs4 import BeautifulSoup

BASE = 'https://breakyoursolarcontract.com'
PATHS = [
    '/blog/goodleap-solar-loan-cancellation-guide',
    '/blog/sunrun-solar-contract-cancellation-2026',
    '/blog/how-to-get-out-of-a-solar-contract',
    '/blog/new-jersey-solar-contract-cancellation',
    '/blog/blue-raven-solar-complaints',
    '/blog/solar-contract-rescission-rights',
    '/blog/sunrun-complaints-california',
    '/blog/cancel-sunrun-solar-contract',
    '/blog/adt-solar-complaints',
    '/blog/cancel-solar-contract-houston',
    '/blog/goodleap-solar-loan-hidden-dealer-fees-2024',
    '/blog/freedom-forever-solar-bankruptcy-problems',
    '/blog/how-to-file-a-complaint-against-solar-company',
    '/blog/tesla-solar-solarcity-complaints',
    '/blog/solar-contract-escalator-clause',
    '/blog/sell-house-with-solar-panels',
    '/blog/selling-home-with-solar-ppa',
    '/blog/solar-payment-shock-help',
    '/blog/sunnova-contract-transfer-problems',
    '/blog/cancel-vivint-solar-contract',
]
OUT = Path('/home/ubuntu/solar-freedom-main/reports/operator-review/live_priority_url_audit.json')
HEADERS = {'User-Agent': 'SolarFreedomOperatorReview/1.0 (+https://breakyoursolarcontract.com)'}


def get(url: str):
    return requests.get(url, headers=HEADERS, timeout=6, allow_redirects=True)


def sitemap_locs(url: str) -> set[str]:
    response = get(url)
    if response.status_code != 200:
        return set()
    try:
        root = ET.fromstring(response.content)
    except ET.ParseError:
        return set()
    ns = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    return {loc.text.strip() for loc in root.findall('.//sm:loc', ns) if loc.text}


def inspect_page(url: str, sitemap_urls: set[str]) -> dict:
    item = {'requested_url': url}
    try:
        response = get(url)
        item.update({
            'status_code': response.status_code,
            'final_url': response.url,
            'redirect_count': len(response.history),
            'x_robots_tag': response.headers.get('X-Robots-Tag', ''),
            'content_type': response.headers.get('Content-Type', ''),
        })
        soup = BeautifulSoup(response.text, 'html.parser')
        canonical = soup.find('link', attrs={'rel': lambda r: r and 'canonical' in r.lower()})
        robots = soup.find('meta', attrs={'name': lambda n: n and n.lower() == 'robots'})
        title = soup.title.get_text(' ', strip=True) if soup.title else ''
        description = soup.find('meta', attrs={'name': lambda n: n and n.lower() == 'description'})
        schemas = []
        for tag in soup.find_all('script', attrs={'type': 'application/ld+json'}):
            if tag.string and tag.string.strip():
                try:
                    data = json.loads(tag.string)
                    candidates = data if isinstance(data, list) else data.get('@graph', [data]) if isinstance(data, dict) else []
                    schemas.extend(str(x.get('@type', 'unknown')) for x in candidates if isinstance(x, dict))
                except json.JSONDecodeError:
                    schemas.append('invalid-jsonld')
        text = soup.get_text(' ', strip=True)
        item.update({
            'title': title,
            'meta_description_present': bool(description and description.get('content', '').strip()),
            'canonical': canonical.get('href', '').strip() if canonical else '',
            'meta_robots': robots.get('content', '').strip() if robots else '',
            'schema_types': sorted(set(schemas)),
            'visible_text_characters': len(text),
            'sitemap_covered': url in sitemap_urls or response.url in sitemap_urls,
        })
        directives = ' '.join([item['x_robots_tag'], item['meta_robots']]).lower()
        item['apparent_indexability'] = (
            'blocked_or_noindex' if 'noindex' in directives else
            'redirect' if response.url != url else
            'eligible_from_live_signals'
        )
    except Exception as exc:
        item.update({'error': str(exc), 'apparent_indexability': 'unavailable'})
    return item


def main() -> None:
    robots_url = f'{BASE}/robots.txt'
    sitemap_urls = set()
    sitemap_checks = {}
    for candidate in (f'{BASE}/sitemap.xml', f'{BASE}/sitemap-index.xml'):
        try:
            locs = sitemap_locs(candidate)
            sitemap_checks[candidate] = {'loc_count': len(locs)}
            sitemap_urls.update(locs)
        except Exception as exc:
            sitemap_checks[candidate] = {'error': str(exc)}
    try:
        robots_response = get(robots_url)
        robots = {'status_code': robots_response.status_code, 'body': robots_response.text[:10000]}
    except Exception as exc:
        robots = {'error': str(exc)}
    rows_by_url = {}
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(inspect_page, f'{BASE}{path}', sitemap_urls): f'{BASE}{path}' for path in PATHS}
        for future in as_completed(futures):
            url = futures[future]
            try:
                rows_by_url[url] = future.result()
            except Exception as exc:
                rows_by_url[url] = {'requested_url': url, 'error': str(exc), 'apparent_indexability': 'unavailable'}
    rows = [rows_by_url[f'{BASE}{path}'] for path in PATHS]
    payload = {
        'retrieved_at_utc': datetime.now(timezone.utc).isoformat(),
        'base_url': BASE,
        'robots': robots,
        'sitemap_checks': sitemap_checks,
        'sitemap_url_count': len(sitemap_urls),
        'priority_urls': rows,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2) + '\n')
    eligible = sum(1 for row in rows if row.get('apparent_indexability') == 'eligible_from_live_signals')
    print(f'Wrote {OUT}; {eligible}/{len(rows)} priority URLs eligible from live signals')


if __name__ == '__main__':
    main()
