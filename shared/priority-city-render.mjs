const escapeHtml = (value) => value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

/**
 * Published state-law pages, keyed by the state name that appears in the city
 * content files. This is the single source of truth for the priority city
 * guides; the pre-render shell, the runtime overlay and the React component all
 * read it, so they cannot drift.
 *
 * Why this exists: the priority city guides (Phoenix, Houston, Dallas, Los
 * Angeles, San Diego, San Antonio and the rest) rendered a
 * "<State> consumer resources" section listing only external source links, with
 * no route to our own state-law page. Measured 26 Nov 2026: all 21 guides
 * carried ZERO references to /solar-contract-laws/, so the city page competed
 * with the state page for state-level queries instead of routing to it — the
 * same defect found on the templated city pages the same day, where San
 * Francisco earned 46 impressions in 30 days on state-level queries at position
 * 35.1 with zero clicks while the California state page sat at position 10.4.
 *
 * Only published states are listed, so an unpublished state renders the section
 * without a link rather than pointing at a 404.
 */
const STATE_LAW_SLUG = {
  Arizona: 'arizona',
  California: 'california',
  Texas: 'texas',
};

/**
 * Returns the published state-law path for a state name, or null when that
 * state has no published page. Callers must treat null as "render no link".
 */
export function getStateLawPath(state) {
  const slug = STATE_LAW_SLUG[state];
  return slug ? `/solar-contract-laws/${slug}` : null;
}

export function renderPriorityCityBody(data) {
  const esc=escapeHtml;
  const stateLawPath = getStateLawPath(data.state);
  const stateLawLink = stateLawPath
    ? `<p>State-level rules, deadlines and citations for ${esc(data.state)} are collected on the <a href="${stateLawPath}">${esc(data.state)} solar contract law resource</a>.</p>`
    : '';
  return `<p>${esc(data.heroCopy)}</p>
<section id="city-answer"><h2>${esc(data.question)}</h2><p>${esc(data.answer)}</p></section>
<section><h2>What to gather before requesting help</h2><ul>${data.documents.map(item=>`<li>${esc(item)}</li>`).join('')}</ul></section>
${data.reviewSteps.map(section=>`<section><h2>${esc(section.heading)}</h2><p>${esc(section.body)}</p></section>`).join('')}
<section id="city-local-resources"><h2>${esc(data.state)} consumer resources</h2><p>${esc(data.localNote)}</p><p>Sources checked: ${esc(data.sourceCheckedOn)}. Official guidance can change.</p><ul>${data.sources.map(source=>`<li><a href="${esc(source.url)}" rel="noopener noreferrer">${esc(source.label)}</a></li>`).join('')}</ul>${stateLawLink}</section>
<section id="city-faq"><h2>Frequently asked questions</h2>${data.faq.map(item=>`<details open><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`).join('')}</section>
<section><h2>${esc(data.ctaHeading)}</h2><p>${esc(data.ctaCopy)}</p><a href="#city-form">Request a case review</a></section>
<p>Educational information—not legal advice. Solar Freedom provides educational resources and intake, not a finding that a contract can be cancelled.</p>`;
}
export function buildPriorityCitySchemas(data,pagePath) {
  const canonical=`https://breakyoursolarcontract.com${pagePath}`;
  return [{ '@context':'https://schema.org','@type':'WebPage','@id':`${canonical}#webpage`,name:data.title,description:data.description,url:canonical,inLanguage:'en-US',about:{'@type':'Place',name:`${data.city}, ${data.state}`},citation:data.sources.map(source=>source.url)},
    {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:'https://breakyoursolarcontract.com/'},{'@type':'ListItem',position:2,name:`${data.city} solar contract help`,item:canonical}]},
    {'@context':'https://schema.org','@type':'FAQPage',mainEntity:data.faq.map(item=>({'@type':'Question',name:item.q,acceptedAnswer:{'@type':'Answer',text:item.a}}))}];
}
