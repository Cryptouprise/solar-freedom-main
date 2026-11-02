import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { trackEvent } from '@/lib/analytics';
import { VEGAS_BOOKING_URL, vegasCampaignParams } from '@shared/vegasCampaign';

export default function VegasBookingCTA({city,path}:{city:string;path:string}) {
  const [open,setOpen]=useState(false);
  const campaign=vegasCampaignParams(typeof window==='undefined'?'':window.location.search);
  const query=new URLSearchParams(campaign).toString();
  const bookingUrl=query?`${VEGAS_BOOKING_URL}?${query}`:VEGAS_BOOKING_URL;
  const showCalendar=()=>{
    trackEvent('booking_calendar_open',{page_path:path,city,...campaign});
    setOpen(true);
  };
  return <>
    <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <p className="font-semibold text-white">Ready to talk about your {city} agreement?</p>
      <p className="mt-2 text-sm leading-6 text-zinc-400">Choose a time for a no-obligation case-review call, or complete the questions below first. Opening the calendar does not book an appointment.</p>
      <button type="button" onClick={showCalendar} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3 font-bold text-black"><CalendarDays className="h-4 w-4" />Choose a call time</button>
    </div>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="z-[9999] max-h-[92vh] max-w-3xl overflow-y-auto border-white/10 bg-[#13161D] text-white">
        <DialogHeader><DialogTitle>Choose your {city} case-review call</DialogTitle><DialogDescription className="text-zinc-400">Select an available time and complete the booking provider’s confirmation steps. Availability varies.</DialogDescription></DialogHeader>
        {open && <iframe src={bookingUrl} title={`${city} case-review booking calendar`} className="h-[580px] w-full rounded-lg border-0 bg-white" />}
        <p className="text-xs leading-6 text-zinc-500">Having trouble? <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">Open the calendar in a new tab.</a> Only provider-confirmed bookings count as appointments.</p>
      </DialogContent>
    </Dialog>
  </>;
}
