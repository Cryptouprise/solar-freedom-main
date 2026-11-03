/**
 * Direct GoHighLevel appointment reconciliation.
 *
 * The lifecycle webhook was the original plan, but no GHL event has ever reached
 * first-party storage, so the Outcomes screen has been showing "feed unavailable"
 * — correct, but not useful. This module pulls the calendar directly instead and
 * reports one of three honest states. It never reports a bare zero when the
 * provider could not be reached, because "we could not ask" and "the answer is
 * none" are different facts and conflating them is how dashboards lie.
 */

export type AppointmentFeedState =
  | "ok"                 // provider answered; the count is real
  | "quota_exhausted"    // provider answered but refused: daily API quota spent
  | "unavailable";       // network, auth or unexpected provider error

export interface GhlAppointmentRecord {
  id: string;
  title: string | null;
  startTime: string | null;
  endTime: string | null;
  status: string | null;
  contactId: string | null;
  calendarId: string | null;
}

export interface AppointmentReconciliation {
  state: AppointmentFeedState;
  source: "direct GHL API";
  /** Only meaningful when state === "ok". */
  appointments: GhlAppointmentRecord[];
  totalBooked: number | null;
  windowStart: string;
  windowEnd: string;
  /** Provider explanation, kept for the owner rather than swallowed. */
  detail: string | null;
  checkedAt: string;
}

const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

interface GhlResponse {
  status: number;
  ok: boolean;
  body: unknown;
  dailyRemaining: number | null;
}

async function ghlGet(path: string, token: string): Promise<GhlResponse> {
  const response = await fetch(`${GHL_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Version: GHL_VERSION },
    signal: AbortSignal.timeout(15_000),
  });
  const raw = await response.text();
  let body: unknown = raw.slice(0, 400);
  try {
    body = JSON.parse(raw);
  } catch {
    /* keep the truncated text */
  }
  const remainingHeader = response.headers.get("x-ratelimit-daily-remaining");
  return {
    status: response.status,
    ok: response.ok,
    body,
    dailyRemaining: remainingHeader === null ? null : Number(remainingHeader),
  };
}

/**
 * Classify a failed provider response without guessing.
 * GHL returns HTTP 429 with x-ratelimit-daily-remaining: 0 when the daily quota
 * is spent. That is a completely different situation from a bad token, and the
 * owner needs to see which one it is.
 */
export function classifyAppointmentFailure(
  status: number,
  dailyRemaining: number | null,
): { state: AppointmentFeedState; detail: string } {
  if (status === 429 && dailyRemaining === 0) {
    return {
      state: "quota_exhausted",
      detail:
        "GoHighLevel refused the request because the daily API quota is spent " +
        "(x-ratelimit-daily-remaining: 0). The count is unknown, not zero. " +
        "The quota resets on the provider's daily cycle.",
    };
  }
  if (status === 429) {
    return {
      state: "quota_exhausted",
      detail: "GoHighLevel rate-limited the request. The count is unknown, not zero.",
    };
  }
  if (status === 401 || status === 403) {
    return {
      state: "unavailable",
      detail: `GoHighLevel rejected the credential (HTTP ${status}). The token needs reissuing with calendar read scope.`,
    };
  }
  return {
    state: "unavailable",
    detail: `GoHighLevel returned HTTP ${status}. The count is unknown, not zero.`,
  };
}

/**
 * Pull booked appointments straight from the GHL calendar.
 *
 * Deliberately minimal on API calls: one request for the calendar list and one
 * for the events, because the daily quota is a real shared constraint and a
 * reconciliation job that burns it is worse than no job.
 */
export async function reconcileAppointments(opts: {
  locationId: string;
  token: string | undefined;
  lookbackDays?: number;
  lookaheadDays?: number;
  limit?: number;
}): Promise<AppointmentReconciliation> {
  const now = new Date();
  const lookback = opts.lookbackDays ?? 90;
  const lookahead = opts.lookaheadDays ?? 30;
  const start = new Date(now.getTime() - lookback * 86_400_000);
  const end = new Date(now.getTime() + lookahead * 86_400_000);

  const base = {
    source: "direct GHL API" as const,
    windowStart: start.toISOString(),
    windowEnd: end.toISOString(),
    checkedAt: now.toISOString(),
  };

  if (!opts.token) {
    return {
      ...base,
      state: "unavailable",
      appointments: [],
      totalBooked: null,
      detail: "No GoHighLevel token is configured, so appointments cannot be pulled.",
    };
  }

  // One request: the calendar list.
  let calendars: GhlResponse;
  try {
    calendars = await ghlGet(`/calendars/?locationId=${opts.locationId}`, opts.token);
  } catch (error) {
    return {
      ...base,
      state: "unavailable",
      appointments: [],
      totalBooked: null,
      detail: `Could not reach GoHighLevel: ${(error as Error).message}`,
    };
  }

  if (!calendars.ok) {
    const failure = classifyAppointmentFailure(calendars.status, calendars.dailyRemaining);
    return { ...base, state: failure.state, appointments: [], totalBooked: null, detail: failure.detail };
  }

  const calendarList = (calendars.body as { calendars?: Array<{ id: string }> })?.calendars ?? [];
  const calendarId = calendarList[0]?.id;
  if (!calendarId) {
    return {
      ...base,
      state: "unavailable",
      appointments: [],
      totalBooked: null,
      detail: "GoHighLevel returned no readable calendar for this location.",
    };
  }

  // Second and final request: the events in the window.
  const params = new URLSearchParams({
    locationId: opts.locationId,
    calendarId,
    startTime: String(start.getTime()),
    endTime: String(end.getTime()),
    limit: String(opts.limit ?? 100),
  });

  let events: GhlResponse;
  try {
    events = await ghlGet(`/calendars/events?${params}`, opts.token);
  } catch (error) {
    return {
      ...base,
      state: "unavailable",
      appointments: [],
      totalBooked: null,
      detail: `Could not reach GoHighLevel: ${(error as Error).message}`,
    };
  }

  if (!events.ok) {
    const failure = classifyAppointmentFailure(events.status, events.dailyRemaining);
    return { ...base, state: failure.state, appointments: [], totalBooked: null, detail: failure.detail };
  }

  const payload = events.body as {
    events?: Array<Record<string, unknown>>;
    appointments?: Array<Record<string, unknown>>;
  };
  const raw = payload?.events ?? payload?.appointments ?? [];

  const appointments: GhlAppointmentRecord[] = raw.map((item) => ({
    id: String(item.id ?? ""),
    title: (item.title as string) ?? null,
    startTime: (item.startTime as string) ?? (item.start as string) ?? null,
    endTime: (item.endTime as string) ?? (item.end as string) ?? null,
    status: (item.appointmentStatus as string) ?? (item.status as string) ?? null,
    contactId: (item.contactId as string) ?? null,
    calendarId: (item.calendarId as string) ?? calendarId,
  }));

  // A cancelled or no-show slot is not a booked appointment. Counting them as
  // booked would inflate the exact number the owner uses to judge the funnel.
  const booked = appointments.filter((appointment) => {
    const status = (appointment.status ?? "").toLowerCase();
    return status !== "cancelled" && status !== "canceled" && status !== "noshow" && status !== "no_show";
  });

  return {
    ...base,
    state: "ok",
    appointments,
    totalBooked: booked.length,
    detail: null,
  };
}
