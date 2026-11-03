import { describe,expect,it } from 'vitest';
import fs from 'node:fs';
import { vegasFieldTeamUrl,vegasCampaignParams,VEGAS_BOOKING_URL,isVegasCityPath,isVegasMetroPath,VEGAS_METRO_CITIES } from '../shared/vegasCampaign';
describe('Las Vegas appointment campaign',()=>{
  it('covers the whole metro the door team knocks without inventing routes',()=>{
    const cities=fs.readFileSync('client/src/data/cities.ts','utf8');
    for(const city of VEGAS_METRO_CITIES){
      const url=new URL(vegasFieldTeamUrl(city.slug,'rep_test'));
      expect(url.pathname).toBe(`/cancel-solar-contract/${city.slug}`);
      // Every field-kit slug must exist as a real route. A slug that is absent
      // from cities.ts renders as a 404, so a printed QR code would send a
      // homeowner to a dead end. This check is deliberately unconditional.
      expect(cities).toContain(`slug: "${city.slug}"`);
    }
    expect(isVegasMetroPath('/cancel-solar-contract/henderson-nv')).toBe(true);
    expect(isVegasMetroPath('/cancel-solar-contract/houston-tx')).toBe(false);
    expect(()=>vegasFieldTeamUrl('not-a-city' as never)).toThrow();
    // The five metro cities that returned 404 on 3 Nov 2026 stay out of the
    // field kit until their pages exist.
    for(const slug of ['spring-valley-nv','enterprise-nv','summerlin-nv','boulder-city-nv','mesquite-nv']){
      expect(VEGAS_METRO_CITIES.some(city=>city.slug===slug)).toBe(false);
      expect(isVegasMetroPath(`/cancel-solar-contract/${slug}`)).toBe(false);
    }
  });
  it('carries the representative through to durable server attribution',()=>{
    const url=new URL(vegasFieldTeamUrl('paradise-nv','rep_marcus'));
    expect(url.searchParams.get('utm_content')).toBe('rep_marcus');
    expect(url.searchParams.get('utm_source')).toBe('door_knocking');
    expect(url.searchParams.get('utm_medium')).toBe('offline');
  });
  it('uses existing city URLs and a real booking URL without new routes or redirects',()=>{
    const url=new URL(vegasFieldTeamUrl('las-vegas-nv','rep_01'));
    expect(url.pathname).toBe('/cancel-solar-contract/las-vegas-nv');expect(url.hash).toBe('#city-form');
    expect(url.searchParams.get('utm_source')).toBe('door_knocking');expect(url.searchParams.get('utm_campaign')).toBe('las_vegas_field_team');
    expect(url.searchParams.get('utm_content')).toBe('rep_01');
    expect(VEGAS_BOOKING_URL).toBe('https://link.myinfinite.ai/widget/booking/Glvb9OZtDFHDMiwvHpli');
  });
  it('forwards only clean campaign codes, never contact PII',()=>{
    expect(vegasCampaignParams('?utm_source=door_knocking&utm_campaign=las_vegas_field_team&email=person@example.com&phone=123&first_name=Person&utm_content=person@example.com')).toEqual({utm_source:'door_knocking',utm_campaign:'las_vegas_field_team'});
    expect(new URL(vegasFieldTeamUrl('north-las-vegas-nv','name@example.com')).searchParams.has('utm_content')).toBe(false);
  });
  it('tracks calendar opening rather than claiming a confirmed appointment',()=>{
    const component=fs.readFileSync('client/src/components/VegasBookingCTA.tsx','utf8');
    expect(component).toContain("trackEvent('booking_calendar_open'");
    expect(component).not.toContain('appointment_booked');
    expect(component).toContain('Opening the calendar does not book an appointment');
    const cityForm=fs.readFileSync('client/src/pages/CityPage.tsx','utf8');expect(cityForm).toContain('sessionId: journeySessionId');
  });
  it('scopes the persistent booking control and overlap prevention to the two Vegas pages',()=>{
    expect(isVegasCityPath('/cancel-solar-contract/las-vegas-nv?utm_source=door_knocking#city-form')).toBe(true);
    expect(isVegasCityPath('/cancel-solar-contract/north-las-vegas-nv/')).toBe(true);
    for(const path of ['/cancel-solar-contract/houston-tx','/blog/las-vegas-nv','/admin/outcomes','/']) expect(isVegasCityPath(path)).toBe(false);
    const guide=fs.readFileSync('client/src/components/PriorityCityGuide.tsx','utf8');
    for(const placement of ['hero','mid_page','sticky']) expect(guide).toContain(`placement="${placement}"`);
    expect(guide).toContain('order-first');
    expect(guide).toContain('lg:order-last');
    expect(guide).toContain('data-vegas-sticky-actions');
  });
  it('does not hide a metro page call button before that page has a booking CTA',()=>{
    // StickyMobileBar and DesktopCallButton hide themselves on isVegasCityPath.
    // Widening that check without first giving the page a visible booking action
    // would leave the visitor with no phone path at all.
    const bookingLayouts=JSON.parse(fs.readFileSync('shared/priority-city-content.json','utf8'));
    for(const city of VEGAS_METRO_CITIES){
      const hasBookingLayout=Object.prototype.hasOwnProperty.call(bookingLayouts,`/cancel-solar-contract/${city.slug}`);
      if(!hasBookingLayout){
        expect(isVegasCityPath(`/cancel-solar-contract/${city.slug}`)).toBe(false);
      }
    }
  });
  it('records actual CTA placement rather than claiming a new lead or booking',()=>{
    const component=fs.readFileSync('client/src/components/VegasBookingCTA.tsx','utf8');
    expect(component).toContain('cta_placement:placement');expect(component).toContain('data-booking-placement={placement}');
    expect(component).not.toContain('generate_lead');expect(component).not.toContain('appointment_booked');
    expect(component).toContain('provider confirmation');
  });
});
