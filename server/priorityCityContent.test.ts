import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import * as cheerio from 'cheerio';
import pageKeywords from '../shared/page-meta-keywords.json';
import eligibility from '../shared/index-eligibility.json';
import { getPageMetaKeywords } from '../shared/pageMetaKeywords';
import { PRIORITY_CITY_PATHS,getPriorityCityContent,renderPriorityCityBody,buildPriorityCitySchemas } from '../shared/priorityCityContent';
import { applyPriorityCityGuide } from './priorityCityDelivery';
import { injectPageMetaKeywords } from './seo-meta';

const template='<!doctype html><html><head><title>Old</title><meta name="description" content="Old"><link rel="canonical" href="https://example.com"><meta name="robots" content="index, follow"></head><body><div id="root"><main class="seo-prerender"><h1>Old</h1><p>Old body</p></main></div></body></html>';
const keywordPaths=Object.keys(pageKeywords);
describe('Priority city keywords and answer delivery',()=>{
  it('limits the repair to 20 approved city keyword entries and 19 guides, leaving Austin content alone',()=>{
    expect(keywordPaths).toHaveLength(20);expect(PRIORITY_CITY_PATHS).toHaveLength(19);
    for(const path of keywordPaths) expect(eligibility.citySlugs).toContain(path.split('/').pop());
    expect(getPriorityCityContent('/cancel-solar-contract/austin-tx')).toBeUndefined();
    expect(getPageMetaKeywords('/cancel-solar-contract/austin-tx')?.split(',')).toHaveLength(5);
  });
  it.each(keywordPaths)('emits exactly five unique keywords once for %s',(path)=>{
    const result=injectPageMetaKeywords(injectPageMetaKeywords(template,path),`${path}/?preview=1`);
    const $=cheerio.load(result);expect($('meta[name="keywords"]')).toHaveLength(1);
    const keywords=$('meta[name="keywords"]').attr('content')!.split(',').map(v=>v.trim());
    expect(keywords).toHaveLength(5);expect(new Set(keywords.map(v=>v.toLowerCase())).size).toBe(5);
    expect(getPageMetaKeywords(`${path}#section`)).toBe(keywords.join(', '));
  });
  it.each(PRIORITY_CITY_PATHS)('keeps content, metadata limits and FAQ schema aligned for %s',(path)=>{
    const data=getPriorityCityContent(path)!;
    expect(data.title.length).toBeLessThanOrEqual(60);expect(data.description.length).toBeLessThanOrEqual(160);
    expect(data.faq).toHaveLength(3);
    for(const faq of data.faq){expect(faq.q.length).toBeLessThanOrEqual(100);expect(faq.a.split(/\s+/).length).toBeLessThanOrEqual(90);}
    const withStaleHeading=template.replace('<body>','<body><h1 style="position:absolute;clip:rect(0,0,0,0)">Hidden homepage heading</h1>');
    const result=applyPriorityCityGuide(applyPriorityCityGuide(withStaleHeading,path),path);const $=cheerio.load(result);
    expect($('h1')).toHaveLength(1);expect($('[data-priority-city-guide]')).toHaveLength(1);
    expect($('link[rel="canonical"]').attr('href')).toBe(`https://breakyoursolarcontract.com${path}`);
    expect($('title').text()).toBe(data.title);expect($('meta[name="robots"]').attr('content')).toBe('index, follow');
    const schema=buildPriorityCitySchemas(data,path).find((schema:any)=>schema['@type']==='FAQPage') as any;
    expect(schema.mainEntity).toHaveLength(3);
    data.faq.forEach((faq,index)=>{expect($('main').text()).toContain(faq.q);expect($('main').text()).toContain(faq.a);expect(schema.mainEntity[index].acceptedAnswer.text).toBe(faq.a);});
    expect($('main').text()).not.toMatch(/\$40-55|\$45-55|3x damages|up to 3 years|you typically have 2-4/);
    expect(data.sources.some(source=>source.url.includes('ftc.gov'))).toBe(true);
    const shared=cheerio.load(renderPriorityCityBody(data));expect(shared('#city-faq details')).toHaveLength(3);
  });
  it('does not change unselected pages, noindex cities, or a published owner recovery',()=>{
    expect(applyPriorityCityGuide(template,'/blog/example')).toBe(template);
    expect(applyPriorityCityGuide(template,'/cancel-solar-contract/austin-tx')).toBe(template);
    expect(applyPriorityCityGuide(template,'/cancel-solar-contract/boston-ma')).toBe(template);
    const recovery=template.replace('class="seo-prerender"','class="seo-prerender" data-recovery-published="true"');
    expect(applyPriorityCityGuide(recovery,'/cancel-solar-contract/phoenix-az')).toBe(recovery);
    expect(getPageMetaKeywords('/constructor')).toBeUndefined();
  });
  it('bakes keywords, answers and matching FAQ data into the static city build',async()=>{
    // @ts-expect-error Static build intentionally uses plain ESM.
    const renderer=await import('../scripts/prerender.mjs');
    const {cityEntries}=await renderer.loadData();const map=renderer.buildMetaMap(cityEntries,[],[],{});
    for(const path of PRIORITY_CITY_PATHS){
      const data=getPriorityCityContent(path)!;const $=cheerio.load(renderer.buildShellHtml(map[path],'app.js','app.css',path));
      expect($('meta[name="keywords"]').attr('content')).toBe(getPageMetaKeywords(path));
      expect($('title').text()).toBe(data.title);expect($('main').text()).toContain(data.localNote);
      const schema=JSON.parse($('script[type="application/ld+json"]').text()).find((item:any)=>item['@type']==='FAQPage');
      expect(schema.mainEntity.map((q:any)=>q.name)).toEqual(data.faq.map(item=>item.q));
    }
    const source=fs.readFileSync('client/src/pages/CityPage.tsx','utf8');expect(source).toContain('getPriorityCityContent');
  });
});
