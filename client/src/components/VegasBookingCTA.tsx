import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { trackEvent } from '@/lib/analytics';
import { VEGAS_BOOKING_URL, vegasCampaignParams } from '@shared/vegasCampaign';

type Placement = 'form' | 'hero' | 'mid_page' | 'sticky';
export default function VegasBookingCTA({city,path,placement='form'}:{city:string;path:string;placement?:Placement}) {
  const [open,setOpen]=useState(false);
  const campaign=vegasCampaignParams(typeof window==='undefined'?'':window.location.search);
  const query=new URLSearchParams(campaign).toString();
  const bookingUrl=query?`${VEGAS_BOOKING_URL}?${query}`:VEGAS_BOOKING_URL;
  const showCalendar=()=>{
    trackEvent('booking_calendar_open',{page_path:path,city,cta_placement:placement,...campaign});
    setOpen(true);
  };
  const button=<button type="button" data-booking-placement={placement} onClick={showCalendar} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-3 font-bold text-black shadow-lg transition-transform duration-150 hover:bg-amber-400 active:scale-[0.98]"><CalendarDays className="h-5 w-5 shrink-0" />{placement==='form'?'Choose a call time':'Book a case-review call'}</button>;
  return <>
    {placement==='form'?<div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <p className="font-semibold text-white">Ready to talk about your {city} agreement?</p>
      <p className="mt-2 text-sm leading-6 text-zinc-400">Choose a time for a no-obligation case-review call, or complete the questions below first. Opening the calendar does not book an appointment.</p>
      <div className="mt-4">{button}</div>
    </div>:button}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="z-[10010] max-h-[92vh] max-w-3xl overflow-y-auto border-white/10 bg-[#13161D] text-white">
        <DialogHeader><DialogTitle>Choose your {city} case-review call</DialogTitle><DialogDescription className="text-zinc-400">Follow the calendar’s steps to provide details and choose an available appointment. Your booking is complete only after provider confirmation.</DialogDescription></DialogHeader>
        {open && <iframe src={bookingUrl} title={`${city} case-review booking calendar`} className="h-[580px] w-full rounded-lg border-0 bg-white" />}
        <p className="text-xs leading-6 text-zinc-500">Having trouble? <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">Open the calendar in a new tab.</a> Only provider-confirmed bookings count as appointments.</p>
      </DialogContent>
    </Dialog>
  </>;
}
