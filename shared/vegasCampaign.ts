export const VEGAS_BOOKING_URL = 'https://link.myinfinite.ai/widget/booking/Glvb9OZtDFHDMiwvHpli';
export const VEGAS_CITY_SLUGS = ['las-vegas-nv','north-las-vegas-nv'] as const;
export function isVegasCityPath(path:string):boolean {
  const clean=path.split(/[?#]/)[0].replace(/\/+$/,'');
  return VEGAS_CITY_SLUGS.some(slug=>clean===`/cancel-solar-contract/${slug}`);
}
export function vegasFieldTeamUrl(slug:typeof VEGAS_CITY_SLUGS[number],representative?:string):string {
  const params=new URLSearchParams({utm_source:'door_knocking',utm_medium:'offline',utm_campaign:'las_vegas_field_team'});
  if(representative && /^[a-z0-9_-]{1,40}$/i.test(representative)) params.set('utm_content',representative);
  return `https://breakyoursolarcontract.com/cancel-solar-contract/${slug}?${params}#city-form`;
}
export function vegasCampaignParams(search:string):Record<string,string> {
  const input=new URLSearchParams(search);const values:Record<string,string>={};
  for(const key of ['utm_source','utm_medium','utm_campaign','utm_content']) {
    const value=input.get(key);
    if(value && /^[a-z0-9_-]{1,100}$/i.test(value)) values[key]=value;
  }
  return values;
}
