import { describe,expect,it } from 'vitest';
import fs from 'node:fs';
import { vegasFieldTeamUrl,vegasCampaignParams,VEGAS_BOOKING_URL } from '../shared/vegasCampaign';
describe('Las Vegas appointment campaign',()=>{
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
});
