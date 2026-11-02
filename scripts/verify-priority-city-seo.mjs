import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import cityGuides from '../shared/priority-city-content.json' with { type:'json' };
import keywordRegistry from '../shared/page-meta-keywords.json' with { type:'json' };
import { loadData,buildMetaMap,buildShellHtml } from './prerender.mjs';

const scope=JSON.parse(await fs.readFile(new URL('../docs/city-seo-targets-2026-11-02.json',import.meta.url),'utf8'));
const base=(process.argv.find(arg=>arg.startsWith('--base='))?.split('=').slice(1).join('=') || 'http://localhost:3000').replace(/\/$/,'');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const context=await browser.newContext();
// The verifier creates no real leads, sessions or appointments.
await context.route('**/api/journey/**',route=>route.fulfill({status:200,contentType:'application/json',body:'{}'}));
await context.route('**/api/trpc/leads.*',route=>route.abort());
await context.route('**/*',async route=>{
  const req=route.request();
  if(req.method()!=='GET' && !req.url().includes('/api/trpc/')) return route.abort();
  if(['image','font','media'].includes(req.resourceType())) return route.abort();
  return route.continue();
});
const {cityEntries}=await loadData();const map=buildMetaMap(cityEntries,[],[],{});
const rows=[];
function inspect(html,path){
  const $=cheerio.load(html);let schemaValid=true;const schemas=[];
  $('script[type="application/ld+json"]').each((_,el)=>{try{const parsed=JSON.parse($(el).text());schemas.push(...(Array.isArray(parsed)?parsed:[parsed]));}catch{schemaValid=false;}});
  const faqs=schemas.filter(item=>item['@type']==='FAQPage');
  const keywords=$('meta[name="keywords"]').attr('content')?.split(',').map(item=>item.trim())||[];
  return {title:$('title').text(),description:$('meta[name="description"]').attr('content')||'',canonical:$('link[rel="canonical"]').map((_,el)=>$(el).attr('href')).get(),keywordTagCount:$('meta[name="keywords"]').length,keywords,h1:$('h1').map((_,el)=>$(el).text().replace(/\s+/g,' ').trim()).get(),schemaValid,faqSchemaCount:faqs.length,faq:faqs.flatMap(item=>item.mainEntity||[]).map(item=>({q:item.name,a:item.acceptedAnswer?.text})),text:$('body').text().replace(/\s+/g,' '),sourceLinks:$('#city-local-resources a[href]').map((_,el)=>$(el).attr('href')).get(),robots:$('meta[name="robots"]').attr('content')||'index, follow',hasCaseReview:$('a[href="#city-form"],#city-form').length>0};
}
for(const target of scope.targets){
  const page=await context.newPage();const url=`${base}${target.path}`;
  let initial,dom,error=null,status;
  try{
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});status=response?.status();initial=inspect(await response.text(),target.path);
    await page.waitForFunction(()=>document.querySelectorAll('meta[name="keywords"]').length===1,{timeout:10000});
    if(cityGuides[target.path]) await page.waitForSelector(`[data-priority-city-guide="${target.slug}"]`);
    await page.waitForTimeout(700);
    dom=inspect(await page.content(),target.path);
  }catch(caught){error=String(caught.message).slice(0,300);}
  const build=inspect(buildShellHtml(map[target.path],'app.js','app.css',target.path),target.path);
  const data=cityGuides[target.path];const samples=[initial,dom,build].filter(Boolean);
  const criterion=(id,passed)=>({id,passed,weight:10,earned:passed?10:0});
  const keywordPass=!error&&samples.length===3&&samples.every(s=>s.keywordTagCount===1&&s.keywords.length===5&&JSON.stringify(s.keywords)===JSON.stringify(keywordRegistry[target.path]));
  const checks=data?[
    criterion('keywords',keywordPass),
    criterion('title_length',samples.length===3&&samples.every(s=>s.title===data.title&&s.title.length<=60)),
    criterion('description_length',samples.length===3&&samples.every(s=>s.description===data.description&&s.description.length<=160)),
    criterion('canonical',samples.length===3&&samples.every(s=>s.canonical.length===1&&s.canonical[0]===`https://breakyoursolarcontract.com${target.path}`)),
    criterion('one_h1',samples.length===3&&samples.every(s=>s.h1.length===1)),
    criterion('json_ld_valid',samples.length===3&&samples.every(s=>s.schemaValid)),
    criterion('faq_visible_and_aligned',samples.length===3&&samples.every(s=>s.faqSchemaCount===1&&s.faq.length===data.faq.length&&data.faq.every((faq,i)=>s.faq[i]?.q===faq.q&&s.faq[i]?.a===faq.a&&s.text.includes(faq.q)&&s.text.includes(faq.a)))),
    criterion('official_sources',samples.length===3&&samples.every(s=>data.sources.every(source=>s.sourceLinks.includes(source.url)))),
    criterion('review_cta',samples.length===3&&samples.every(s=>s.hasCaseReview)),
    criterion('index_policy',status===200&&samples.every(s=>!s.robots.includes('noindex')))
  ]:[];
  const score=data?checks.reduce((sum,c)=>sum+c.earned,0):null;
  rows.push({...target,status,error,keywordPass,score,scoreLabel:data?'Measured technical city checklist; not rankings or an external scanner score':'Austin unchanged; keyword check only',criteria:checks,initial:initial&&{...initial,text:undefined},rendered:dom&&{...dom,text:undefined},build:{...build,text:undefined}});
  console.log(`${target.slug}: keywords ${keywordPass?'PASS':'FAIL'}, technical ${score??'not rerun'}/100`);
  await page.close();
}
await browser.close();
const result={verifiedAt:new Date().toISOString(),base,source:'initial HTTP HTML + Chromium rendered DOM + static build output',rankingVerified:false,appointmentsCreated:0,rows};
const out=new URL('../docs/city-seo-verification-2026-11-02.json',import.meta.url);
await fs.writeFile(out,JSON.stringify(result,null,2)+'\n');
if(rows.some(row=>!row.keywordPass||row.error||row.score!==null&&row.score!==100))process.exitCode=1;
