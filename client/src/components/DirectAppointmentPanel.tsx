import { Card } from "@/components/ui/card";
import { CalendarCheck, CalendarX, AlertTriangle, Loader2 } from "lucide-react";

export interface DirectAppointmentState {
  state: "ok" | "quota_exhausted" | "unavailable";
  source: string;
  totalBooked: number | null;
  windowStart: string;
  windowEnd: string;
  detail: string | null;
  checkedAt: string;
}

function formatRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  return `${start.toLocaleDateString(undefined, opts)} to ${end.toLocaleDateString(undefined, opts)}`;
}

/**
 * Direct GoHighLevel appointment pull, shown beside the lifecycle-feed state.
 *
 * Three outcomes are rendered differently on purpose. "We could not ask" must
 * never look like "the answer is none", because a false zero on the appointment
 * metric is the single most expensive lie this dashboard could tell.
 */
export default function DirectAppointmentPanel({
  data,
  loading,
}: {
  data?: DirectAppointmentState | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card className="bg-[#0d0f14] border-white/10 p-5">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking the GoHighLevel calendar directly...
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const isOk = data.state === "ok";
  const isQuota = data.state === "quota_exhausted";

  const tone = isOk
    ? "border-emerald-400/20 bg-emerald-400/[0.05]"
    : isQuota
      ? "border-amber-400/30 bg-amber-400/[0.08]"
      : "border-red-400/25 bg-red-400/[0.06]";

  const Icon = isOk ? CalendarCheck : isQuota ? AlertTriangle : CalendarX;

  const iconTone = isOk ? "text-emerald-300" : isQuota ? "text-amber-300" : "text-red-300";

  return (
    <Card className={`bg-[#0d0f14] ${tone} p-5`} data-direct-appointments={data.state}>
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconTone}`} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-sm font-semibold text-white">Booked appointments — direct calendar pull</h3>
            <span className="text-xs text-gray-400">source: {data.source}</span>
          </div>

          {isOk ? (
            <>
              <p className="mt-2 text-2xl font-semibold text-white">
                {data.totalBooked?.toLocaleString() ?? "—"}
                <span className="ml-2 text-sm font-normal text-gray-400">
                  booked in {formatRange(data.windowStart, data.windowEnd)}
                </span>
              </p>
              <p className="mt-2 text-xs leading-relaxed text-gray-400">
                Cancelled and no-show slots are excluded. Checked {new Date(data.checkedAt).toLocaleString()}. This is a
                provider-confirmed calendar count, not a count of form submissions or calendar opens.
              </p>
            </>
          ) : (
            <>
              <p className="mt-2 text-lg font-semibold text-white">
                {isQuota ? "Quota exhausted — count unknown" : "Feed unavailable — count unknown"}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-gray-300">{data.detail}</p>
              <p className="mt-2 text-xs leading-relaxed text-gray-400">
                Window requested: {formatRange(data.windowStart, data.windowEnd)}. Checked{" "}
                {new Date(data.checkedAt).toLocaleString()}.
              </p>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
