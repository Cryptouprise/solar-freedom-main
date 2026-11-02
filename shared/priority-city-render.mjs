const escapeHtml = (value) => value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export function renderPriorityCityBody(data) {
  const esc=escapeHtml;
  return `<p>${esc(data.heroCopy)}</p>
<section id="city-answer"><h2>${esc(data.question)}</h2><p>${esc(data.answer)}</p></section>
<section><h2>What to gather before requesting help</h2><ul>${data.documents.map(item=>`<li>${esc(item)}</li>`).join('')}</ul></section>
${data.reviewSteps.map(section=>`<section><h2>${esc(section.heading)}</h2><p>${esc(section.body)}</p></section>`).join('')}
<section id="city-local-resources"><h2>${esc(data.state)} consumer resources</h2><p>${esc(data.localNote)}</p><p>Sources checked: ${esc(data.sourceCheckedOn)}. Official guidance can change.</p><ul>${data.sources.map(source=>`<li><a href="${esc(source.url)}" rel="noopener noreferrer">${esc(source.label)}</a></li>`).join('')}</ul></section>
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
