import * as cheerio from 'cheerio';
import { getPriorityCityContent, renderPriorityCityBody, buildPriorityCitySchemas } from '../shared/priorityCityContent';

/** One bounded city guide for crawler and browser; never overwrite an owner-published recovery. */
export function applyPriorityCityGuide(html:string,pagePath:string):string {
  const data=getPriorityCityContent(pagePath);
  if (!data) return html;
  const $=cheerio.load(html);
  if ($('main[data-recovery-published="true"]').length) return html;
  // The SPA template contains a hidden homepage H1 outside #root. It must not
  // coexist with the selected city guide's real heading.
  $('body > h1').remove();
  const canonical=`https://breakyoursolarcontract.com/cancel-solar-contract/${data.slug}`;
  $('title').text(data.title);
  for(const [selector, name] of [['meta[name="description"]','description']] as const) {
    if(!$(selector).length) $('head').append(`<meta name="${name}" />`);
    $(selector).attr('content',data.description);
  }
  $('meta[property="og:title"],meta[name="twitter:title"]').attr('content',data.title);
  $('meta[property="og:description"],meta[name="twitter:description"]').attr('content',data.description);
  $('meta[property="og:url"]').attr('content',canonical);
  $('link[rel="canonical"]').remove();
  $('head').append('<link rel="canonical" />');
  $('link[rel="canonical"]').attr('href',canonical);
  let main=$('main.seo-prerender');
  if(!main.length) { $('#root').empty().append('<main class="seo-prerender" data-page-type="city_page"></main>');main=$('main.seo-prerender'); }
  if(main.length) {
    main.attr('data-priority-city-guide',data.slug).empty();
    main.append('<h1></h1>');main.find('h1').text(`Solar contract help in ${data.city}, ${data.stateCode}`);
    main.append(renderPriorityCityBody(data));
    const nav=$('<nav aria-label="Related solar contract resources"><h2>Related resources</h2><ul></ul></nav>');
    for(const link of data.links){const a=$('<a></a>').attr('href',link.url).text(link.label);nav.find('ul').append($('<li></li>').append(a));}
    main.append(nav);
  }
  $('script[type="application/ld+json"]').remove();
  $('head').append(`<script type="application/ld+json">${JSON.stringify(buildPriorityCitySchemas(data,`/cancel-solar-contract/${data.slug}`)).replace(/</g,'\\u003c')}</script>`);
  return $.html();
}
