#!/usr/bin/env python3
"""Collect read-only, worldwide Similarweb evidence for the SEO operator review."""
import json
import sys
from pathlib import Path

sys.path.append('/opt/.manus/.sandbox-runtime')
from data_api import ApiClient

DOMAIN = 'breakyoursolarcontract.com'
RANGE = {'start_date': '2026-02', 'end_date': '2026-07'}
OUTPUT = Path('/home/ubuntu/solar-freedom-main/reports/operator-review/similarweb_evidence.json')


def query(client, endpoint, query, path_params=None):
    try:
        return {'status': 'ok', 'data': client.call_api(endpoint, path_params=path_params or {'domain': DOMAIN}, query=query)}
    except Exception as exc:
        return {'status': 'unavailable', 'error': str(exc)}


def main():
    client = ApiClient()
    base = {'country': 'world', 'granularity': 'monthly', 'main_domain_only': True, **RANGE}
    payload = {
        'domain': DOMAIN,
        'measurement_range': RANGE,
        'retrieved_for': 'Solar Freedom evidence-first SEO/GEO operator review',
        'total_visits': query(client, 'SimilarWeb/get_visits_total', base),
        'bounce_rate': query(client, 'SimilarWeb/get_bounce_rate', base),
        'global_rank': query(client, 'SimilarWeb/get_global_rank', {'main_domain_only': True, **RANGE}),
        'desktop_channels': query(client, 'SimilarWeb/get_traffic_sources_desktop', base),
        'top_countries': query(client, 'SimilarWeb/get_total_traffic_by_country', {'main_domain_only': True, 'limit': '10', 'start_date': '2026-05', 'end_date': '2026-07'}),
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, indent=2, default=str) + '\n')
    print(f'Wrote {OUTPUT}')


if __name__ == '__main__':
    main()
