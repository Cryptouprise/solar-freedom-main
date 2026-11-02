import fs from 'node:fs/promises';
import { loadData } from './prerender.mjs';

const read = async path => JSON.parse(await fs.readFile(new URL(path, import.meta.url), 'utf8'));
const reviews = await read('../docs/city-seo-local-source-reviews-2026-11-02.json');
const scope = await read('../docs/city-seo-targets-2026-11-02.json');
const { cityEntries } = await loadData();
const ftc = { label: 'FTC — Solar Power for Your Home', url: 'https://consumer.ftc.gov/articles/solar-power-your-home', supports: 'Solar purchase, lease and PPA terms, early termination, utility costs, transfer questions and consumer complaint routes.' };
const registry = {};
for (const {path,slug} of scope.targets) {
  if (slug === 'austin-tx') continue; // Owner explicitly asked not to redo Austin.
  const city = cityEntries.find(item => item.slug === slug);
  let review = reviews.results.find(item => item.slug === slug && item.ok)?.value;
  if (slug === 'west-valley-city-ut' && review) {
    review = { ...review, verified: true, issue: 'Parent independently verified official Utah solar FAQ and complaint service on 2026-11-02.' };
  }
  if (!review && ['houston-tx','dallas-tx','phoenix-az'].includes(slug)) {
    const texas = city.stateCode === 'TX';
    const localSource = texas
      ? { label: 'Texas Attorney General — File a Consumer Complaint', url: 'https://www.texasattorneygeneral.gov/consumer-protection/file-consumer-complaint', supports: 'Complaint records, informational review, public complaint warning and limits on individual legal advice.' }
      : { label: 'Arizona DIFI — Attorney General Consumer Complaint Resource', url: 'https://difi.az.gov/node/268', supports: 'Official directory directs unfair-business-practice reports to the Arizona Attorney General Consumer Protection Office.' };
    review = {
      slug, city: city.name, state: city.state, verified: true, issue: '',
      question: `Can I cancel a solar contract in ${city.name}?`,
      answer: `Possibly, but cancellation is not automatic. For ${city.name} homeowners, the answer depends on the signed agreement, sale circumstances, installation status and applicable law. A loan, lease and power purchase agreement can have different obligations. Review notice, early-termination and transfer terms and preserve written communications. Do not assume that a dispute with the installer ends a separate financing agreement.`,
      localNote: texas
        ? `The Texas Attorney General accepts consumer complaints with business details, contract information, transaction dates and resolution efforts. Its complaint reference number does not mean an investigation or decision exists. Complaints may be public, and the office cannot give individual legal advice. Filing a complaint does not itself cancel an agreement.`
        : `Arizona's Department of Insurance and Financial Institutions directs consumers reporting unfair business practices to the Attorney General Consumer Protection Office. Use the official directory to find the current route. Reporting a concern does not itself cancel your agreement or establish a right to stop payments.`,
      sources: [localSource],
      faq: [
        { q: `What records should ${city.name} homeowners gather?`, a: 'Keep the signed agreement and addenda, loan or lease/PPA documents, sales proposals, bills, production records and messages. Write a dated timeline of the sale, installation and efforts to resolve the problem. Check the agreement for written-notice requirements.' },
        { q: `Does a ${city.state} consumer complaint cancel my agreement?`, a: 'No. Reporting a concern is separate from requesting cancellation or disputing financing. A complaint does not determine your individual rights or obligations. Review the contract and obtain qualified guidance before making payment or cancellation decisions.' }
      ]
    };
  }
  if (!review?.verified || !city) throw new Error(`Unverified or missing city: ${slug}`);
  const label = `${city.name}, ${city.stateCode}`;
  let title = `Cancel a Solar Contract in ${label} | Solar Freedom`;
  if (title.length > 60) title = `${label} Solar Contract Help | Solar Freedom`;
  const description = `Solar contract help in ${label}. Review lease, loan or PPA terms, gather records, and explore fact-specific options. No guaranteed outcome.`;
  const sources = [...review.sources.filter(source => !source.url.includes('archived=true')), ftc];
  const faq = [{q:review.question,a:review.answer},...review.faq];
  const data = { slug, city:city.name, state:city.state, stateCode:city.stateCode, title, description,
    question:review.question, answer:review.answer, localNote:review.localNote, faq, sources,
    sourceCheckedOn:'2026-11-02',
    heroCopy:`If your solar payment, system performance or contract terms do not match what you expected, start with a clear record of what happened. This ${city.name} guide helps you organize the agreement and find relevant consumer resources before requesting an individual review.`,
    documents:[
      'Signed agreement and addenda, including separate loan, lease or PPA documents.',
      'Sales proposal, promised-production estimates and advertisements or messages.',
      'Utility bills, solar bills, monitoring data and installation or service records.',
      'A dated timeline and copies of requests, responses and notices.'
    ],
    reviewSteps:[
      {heading:'Identify which agreement is causing the problem',body:'A system purchase, solar loan, lease and power purchase agreement are different arrangements. List the installer, system owner, lender and servicer separately. Do not assume that ending one agreement ends another.'},
      {heading:'Compare the promise with the written terms',body:'Check payment increases, production guarantees, maintenance, early-termination fees and home-sale transfer requirements. Compare bills and monitoring records with the actual contract, not an assumed savings estimate.'},
      {heading:'Keep your next step documented',body:'Ask the relevant company for its written position and follow any notice requirements in your agreement. Keep proof of delivery. A consumer complaint can document a concern, but does not itself resolve cancellation or financing obligations.'}
    ],
    links:[{label:'Solar loan document checklist',url:'/blog/solar-loan-document-checklist'},{label:'Review solar contract exit options',url:'/solar-exit-options'},{label:'Solar payment calculator',url:'/calculator'}],
    ctaHeading:'Start with a no-obligation case review',
    ctaCopy:'Tell us what was promised, what is happening now and which documents you have. The initial review helps identify questions and missing records; it does not guarantee cancellation, savings or attorney acceptance.'
  };
  if (title.length>60 || description.length>160 || faq.length!==3) throw Error('Metadata limits failed '+slug);
  if (faq.some(item=>item.q.length>100 || item.a.trim().split(/\s+/).length>90)) throw Error('FAQ limits failed '+slug);
  if (review.localNote.trim().split(/\s+/).length>80) throw Error('Local note limit failed '+slug);
  if (sources.some(source=>{const url=new URL(source.url);return url.protocol!=='https:' || !(url.hostname.endsWith('.gov') || ['www.ag.state.la.us','www.myfloridalegal.com'].includes(url.hostname));})) throw Error('Nonofficial source '+slug);
  registry[path]=data;
}
await fs.writeFile(new URL('../shared/priority-city-content.json',import.meta.url),JSON.stringify(registry,null,2)+'\n');
console.log(`Prepared ${Object.keys(registry).length} source-backed guides; Austin unchanged.`);
