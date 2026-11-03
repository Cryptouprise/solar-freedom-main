import { chromium } from 'playwright';
import fs from 'node:fs/promises';
const out='/home/ubuntu/solar-freedom-deliverables/visual-quality-2026-11-03'; await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const results=[];
try {
 for(const {path,width,height} of [{path:'/cancel-solar-contract/houston-tx',width:390,height:844},{path:'/blog/how-to-get-out-of-a-solar-contract',width:1440,height:900}]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  await context.route('**/*',route=>{const request=route.request();if(/google-analytics|googletagmanager|\/api\/journey\/|\/api\/trpc\/leads\./.test(request.url())||request.method()!=='GET'&&!request.url().includes('/api/trpc/'))return route.abort();return route.continue();});
  const page=await context.newPage();await page.goto(`http://localhost:3000${path}`,{waitUntil:'domcontentloaded'});await page.waitForTimeout(6500);
  await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight/2,behavior:'instant'}));await page.waitForTimeout(800);
  const state=await page.evaluate(()=>{
   const shadow=document.querySelector('chat-widget')?.shadowRoot;
   const prompt=shadow?.querySelector('.lc_text-widget--prompt'),button=shadow?.querySelector('#lc_text-widget--btn');
   const b=button?.getBoundingClientRect();
   return {path:location.pathname,promptDisplay:prompt?getComputedStyle(prompt).display:null,chatLauncherBottom:b?Math.round(innerHeight-b.bottom):null,chatPresent:!!button,
    repeatHeadingCount:Array.from(document.querySelectorAll('h2')).filter(e=>e.textContent==='Start with a no-obligation case review').length,
    horizontalOverflow:document.documentElement.scrollWidth>innerWidth+4,
    hasPhoneValidation:!!document.querySelector('button[disabled]')&&document.body.innerText.includes('Enter your phone number to enable the callback request.'),
    callbackPillPresent:Array.from(document.querySelectorAll('button')).some(e=>e.textContent?.trim()==='CALL BACK'),
   };
  });
  if(state.horizontalOverflow||state.chatPresent&&state.promptDisplay!=='none'||width<768&&state.chatPresent&&state.chatLauncherBottom<120||state.callbackPillPresent)throw new Error(`Overlay verification failed ${JSON.stringify(state)}`);
  await page.screenshot({path:`${out}/${path.split('/').pop()}-${width}-after-fix.jpg`,type:'jpeg',quality:80});
  if(width===390){
   const capture=await page.evaluate(async()=>{try{const {capturePageAppearance}=await import('/src/lib/pageAppearanceCapture.ts');const input=await capturePageAppearance();return {captureMethod:input.captureMethod,regions:input.captures.map(c=>c.position),lengths:input.captures.map(c=>c.image.length),imageCount:input.evidence.imageCount,limitations:input.evidence.limitations};}catch(error){throw new Error(`Capture failure: ${error?.message||error?.type||String(error)} ${error?.target?.tagName||''} ${(error?.target?.src||'').slice(0,180)}`);}});
   if(capture.regions.length!==3||capture.lengths.some(n=>n>2800000))throw new Error('Owner capture exceeded its bounded contract');
   state.capture=capture;
  }
  results.push(state);console.log(JSON.stringify(state));await context.close();
 }
}finally{await browser.close();}
await fs.writeFile(`${out}/browser-controls-verification.json`,JSON.stringify({verifiedAt:new Date().toISOString(),source:'Chromium local preview; no forms or paid model calls',results},null,2)+'\n');
